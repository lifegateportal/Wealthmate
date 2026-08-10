# Wealthmate

## Environment Setup

Add your DeepSeek key in `.env.local` using either variable name:

```env
VITE_DEEPSEEK_API_KEY=your_key_here
```

or

```env
DEEPSEEK_API_KEY=your_key_here
```

The app reads `VITE_DEEPSEEK_API_KEY` at runtime, and Vite is configured to fallback to `DEEPSEEK_API_KEY` automatically.

Optional model overrides in `.env.local`:

```env
VITE_DEEPSEEK_CHAT_MODEL=deepseek-chat
VITE_DEEPSEEK_VISION_MODEL=deepseek-vl2
VITE_DEEPSEEK_VISION_FALLBACK_MODEL=
```

## Cloud Sync Setup (Cloudflare R2)

To persist all user inputs across devices, run the included API server that stores app state in R2.

1. Copy `.env.example` to `.env.local` and fill in your values:

```env
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET=your_bucket_name
PORT=8787
CORS_ORIGIN=http://localhost:5173
```

2. Start API server:

```bash
npm run dev:server
```

3. In a second terminal, start frontend:

```bash
npm run dev
```

When running locally, Vite proxies `/api/*` to `http://localhost:8787`.

If frontend and API are deployed on different domains, set:

```env
VITE_API_BASE_URL=https://your-api-domain.com
```

## Run

```bash
npm install
npm run dev
```