import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

dotenv.config({ path: '.env.local' });
dotenv.config();

const bucketName = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME;

const requiredEnv = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'OWNER_PASSWORD',
  bucketName ? null : 'R2_BUCKET',
  bucketName ? null : 'R2_BUCKET_NAME',
];

const missingEnv = requiredEnv.filter(Boolean).filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`Missing environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const port = Number(process.env.PORT || 8787);
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const sessionSecret = process.env.SESSION_SECRET || process.env.R2_SECRET_ACCESS_KEY;
const isProduction = process.env.NODE_ENV === 'production';
const sessionMaxAgeMs = 1000 * 60 * 60 * 24 * 7;
const allowedOrigins = corsOrigin.split(',').map((value) => value.trim()).filter(Boolean);
const OWNER_USERNAME = 'owner';
const OWNER_PASSWORD = String(process.env.OWNER_PASSWORD || '').trim();

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const app = express();

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (!isProduction) return true;

  return allowedOrigins.some((allowed) => {
    if (allowed === '*') return true;
    if (allowed === origin) return true;

    // Supports entries like "https://*.app.github.dev"
    if (allowed.includes('*')) {
      const escaped = allowed.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      return new RegExp(`^${escaped}$`).test(origin);
    }

    return false;
  });
};

app.use(cors({
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));

const normalizeUsername = () => OWNER_USERNAME;

const toBase64Url = (value) =>
  Buffer.from(value).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const fromBase64Url = (value) => {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf-8');
};

const signTokenPayload = (encodedPayload) =>
  crypto.createHmac('sha256', sessionSecret).update(encodedPayload).digest('base64url');

const createSessionToken = (username) => {
  const expiresAt = Date.now() + sessionMaxAgeMs;
  const payload = toBase64Url(JSON.stringify({ username, expiresAt }));
  const signature = signTokenPayload(payload);
  return `${payload}.${signature}`;
};

const verifySessionToken = (token) => {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = signTokenPayload(payload);
  if (signature !== expected) return null;

  try {
    const decoded = JSON.parse(fromBase64Url(payload));
    if (!decoded?.username || !decoded?.expiresAt || decoded.expiresAt < Date.now()) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
};

const getCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  maxAge: sessionMaxAgeMs,
  path: '/',
});

const setAuthCookie = (res, username) => {
  const token = createSessionToken(username);
  res.cookie('wm_auth', token, getCookieOptions());
};

const clearAuthCookie = (res) => {
  res.clearCookie('wm_auth', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });
};

const userObjectKey = () => {
  const normalized = normalizeUsername();
  if (!normalized) return null;
  const safe = normalized.replace(/[^a-z0-9._-]/g, '_');
  return `users/${safe}.json`;
};

const streamToString = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
};

const readUserRecord = async () => {
  const key = userObjectKey();
  if (!key) return null;

  try {
    const response = await r2Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );

    const raw = await streamToString(response.Body);
    return JSON.parse(raw);
  } catch (error) {
    if (error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw error;
  }
};

const writeUserRecord = async (record) => {
  const key = userObjectKey();
  if (!key) throw new Error('Invalid username.');

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(record),
      ContentType: 'application/json',
    })
  );
};

const requireCookieAuth = async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.wm_auth;
    const session = verifySessionToken(sessionToken);
    if (!session?.username) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }

    if (session.username !== OWNER_USERNAME) {
      clearAuthCookie(res);
      res.status(401).json({ error: 'Session is no longer valid.' });
      return;
    }

    const record = await readUserRecord();
    if (!record) {
      clearAuthCookie(res);
      res.status(401).json({ error: 'Session is no longer valid.' });
      return;
    }

    req.authUser = session.username;
    req.authRecord = record;
    next();
  } catch (error) {
    console.error('Auth middleware failed', error);
    res.status(500).json({ error: 'Authentication check failed.' });
  }
};

app.post('/api/auth/register', async (req, res) => {
  res.status(403).json({ error: 'Registration is disabled in owner-password mode.' });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const password = String(req.body?.password || '').trim();

    if (!password) {
      res.status(400).json({ error: 'Password is required.' });
      return;
    }

    if (password !== OWNER_PASSWORD) {
      res.status(401).json({ error: 'Invalid password.' });
      return;
    }

    let record = await readUserRecord();
    if (!record) {
      const now = new Date().toISOString();
      record = {
        username: OWNER_USERNAME,
        state: null,
        createdAt: now,
        updatedAt: now,
      };
      await writeUserRecord(record);
    }

    setAuthCookie(res, OWNER_USERNAME);
    res.json({ ok: true, username: OWNER_USERNAME, state: record.state || null });
  } catch (error) {
    console.error('Login failed', error);
    res.status(500).json({ error: 'Could not sign in.' });
  }
});

app.get('/api/auth/me', requireCookieAuth, async (req, res) => {
  res.json({
    ok: true,
    username: req.authUser,
    state: req.authRecord.state || null,
  });
});

app.post('/api/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

app.post('/api/state/save', requireCookieAuth, async (req, res) => {
  try {
    const state = req.body?.state;

    if (!state || typeof state !== 'object') {
      res.status(400).json({ error: 'State payload is required.' });
      return;
    }

    const updatedRecord = {
      ...req.authRecord,
      state,
      updatedAt: new Date().toISOString(),
    };

    await writeUserRecord(updatedRecord);
    res.json({ ok: true });
  } catch (error) {
    console.error('Save state failed', error);
    res.status(500).json({ error: 'Could not save state to cloud.' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`WealthMate R2 sync API listening on port ${port}`);
});
