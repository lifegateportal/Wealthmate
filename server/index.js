import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const requiredEnv = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`Missing environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const port = Number(process.env.PORT || 8787);
const corsOrigin = process.env.CORS_ORIGIN || '*';
const bucketName = process.env.R2_BUCKET;

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const app = express();
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '2mb' }));

const hashPassword = (password) =>
  crypto.createHash('sha256').update(password).digest('hex');

const normalizeUsername = (username) => String(username || '').trim().toLowerCase();

const userObjectKey = (username) => {
  const normalized = normalizeUsername(username);
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

const readUserRecord = async (username) => {
  const key = userObjectKey(username);
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

const writeUserRecord = async (username, record) => {
  const key = userObjectKey(username);
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

const authenticate = async (username, password) => {
  const record = await readUserRecord(username);
  if (!record) return { ok: false, error: 'Account not found.' };

  const passwordHash = hashPassword(password || '');
  if (passwordHash !== record.passwordHash) {
    return { ok: false, error: 'Invalid username or password.' };
  }

  return { ok: true, record };
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const username = normalizeUsername(req.body?.username);
    const password = String(req.body?.password || '').trim();

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }

    const existing = await readUserRecord(username);
    if (existing) {
      res.status(409).json({ error: 'Username already exists.' });
      return;
    }

    const now = new Date().toISOString();
    const record = {
      username,
      passwordHash: hashPassword(password),
      state: null,
      createdAt: now,
      updatedAt: now,
    };

    await writeUserRecord(username, record);
    res.status(201).json({ ok: true, state: null });
  } catch (error) {
    console.error('Register failed', error);
    res.status(500).json({ error: 'Could not register account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const username = normalizeUsername(req.body?.username);
    const password = String(req.body?.password || '').trim();

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }

    const authResult = await authenticate(username, password);
    if (!authResult.ok) {
      res.status(401).json({ error: authResult.error });
      return;
    }

    res.json({ ok: true, state: authResult.record.state || null });
  } catch (error) {
    console.error('Login failed', error);
    res.status(500).json({ error: 'Could not sign in.' });
  }
});

app.post('/api/state/save', async (req, res) => {
  try {
    const username = normalizeUsername(req.body?.username);
    const password = String(req.body?.password || '').trim();
    const state = req.body?.state;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }

    if (!state || typeof state !== 'object') {
      res.status(400).json({ error: 'State payload is required.' });
      return;
    }

    const authResult = await authenticate(username, password);
    if (!authResult.ok) {
      res.status(401).json({ error: authResult.error });
      return;
    }

    const updatedRecord = {
      ...authResult.record,
      state,
      updatedAt: new Date().toISOString(),
    };

    await writeUserRecord(username, updatedRecord);
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
