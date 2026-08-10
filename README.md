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

## Run

```bash
npm install
npm run dev
```