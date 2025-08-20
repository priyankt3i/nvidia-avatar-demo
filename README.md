## NVIDIA ACE + Audio2Face Prototype (Node.js + React + Vite)

A full‑stack prototype with a React Three.js avatar, real‑time microphone streaming, and local/on‑device NVIDIA Audio2Face integration focus. The app now defaults to:
- Local/on‑device Audio2Face (A2F) via `A2F_LOCAL_URL`
- ACE functionality disabled by default (no cloud ACE API keys needed)
- Gemini as primary LLM (fallback to OpenAI if set, then mock)
- ElevenLabs for TTS (PCM/WAV compatible with A2F), fallback silent WAV

You can still run mock mode if local A2F isn’t available.

### Highlights
- **Backend**: Express.js, WebSocket, dotenv, Helmet, CORS, TypeScript
- **Local A2F**: Prefer `A2F_LOCAL_URL` for on-device Audio2Face microservice
- **Real‑time**: WebSocket audio streaming → A2F blendshapes → avatar morphs
- **Frontend**: React + Vite + TailwindCSS + framer‑motion + Three.js viewer
- **LLM/TTS**: Gemini (primary), OpenAI (fallback), ElevenLabs TTS with PCM/WAV
- **Mocking**: Safe fallbacks for A2F/ACE/LLM/TTS for rapid dev
- **Docker**: Dockerfiles per app + docker‑compose for one‑command run

---

### Environment Configuration
Create `server/.env` based on `server/.env.example`.

```bash
PORT=8080
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
WS_ALLOWED_ORIGINS=http://localhost:5173

# Local/on-device A2F
USE_LOCAL_A2F=true
A2F_LOCAL_URL=http://localhost:5000   # your local A2F microservice base URL

# Disable ACE cloud by default (no on-device ACE path in this prototype)
DISABLE_ACE=true

# (Optional) Cloud endpoints (not required for local dev)
ACE_API_URL=
ACE_API_KEY=
A2F_API_URL=
A2F_API_KEY=

# LLM/TTS
GEMINI_API_KEY=          # primary LLM
ELEVENLABS_API_KEY=      # TTS (PCM/WAV)
# GOOGLE_TTS_JSON_BASE64=   # Not implemented here

# Fallback LLM (optional)
OPENAI_API_KEY=
```

Frontend (if deployed) can specify `VITE_SERVER_URL` to point at the backend URL.

---

### Local NVIDIA Audio2Face (On‑Device)
- Run A2F locally as an app/microservice. See:
  - Omniverse Audio2Face: https://docs.omniverse.nvidia.com/audio2face/latest/
- Expose a compatible endpoint such as `/audio2face/blendshapes` that accepts 16kHz mono WAV/PCM bytes and returns a JSON array of blendshape frames.
- Update `A2F_LOCAL_URL` and set `USE_LOCAL_A2F=true`.
- If your local A2F requires a token, put it in `A2F_API_KEY` (optional).

If local A2F isn’t available, the app will generate mock blendshapes.

---

### LLM / TTS
- **LLM**: Gemini (primary). Set `GEMINI_API_KEY`. If unset, OpenAI used if `OPENAI_API_KEY` present. Otherwise, a mock reply is sent.
- **TTS**: ElevenLabs. Set `ELEVENLABS_API_KEY`. We request PCM at 16kHz and wrap as WAV when needed for A2F.

---

### Install & Run
```bash
npm install --workspaces
npm run dev
```
- Client: http://localhost:5173
- Server: http://localhost:8080 (health: `/health`)

Add a GLB head model at `client/public/head.glb` for the viewer to render.

---

### WebSocket Flow
- Client streams mic audio (WAV chunks) → server → A2F → blendshapes → client morph targets
- Chat: client sends text → LLM reply → TTS (WAV) → client plays audio; A2F also attempts to generate blendshapes from this audio
- Pose: if ACE is disabled (default), server returns a placeholder image for enhanced face

---

### Placeholders and Simulation
- If `USE_LOCAL_A2F` is false and cloud keys aren’t set, A2F is mocked (sinusoidal blendshapes)
- If `DISABLE_ACE=true`, ACE calls are mocked (transparent image)
- If TTS/LLM keys are missing, TTS returns a silent WAV and LLM returns a mock reply
- `client/public/head.glb` is a placeholder path; provide a real GLB model

---

### Docker
```bash
docker-compose up --build
```
- Client: http://localhost:5173
- Server: http://localhost:8080

For local A2F, ensure your A2F service is reachable from the server container (e.g., host network or expose port).

---

### Deployment
- Frontend (Vercel): set `VITE_SERVER_URL` to your backend URL
- Backend (Render or AWS): deploy container and set env vars. In this local‑first setup, you might keep A2F on an internal LAN or host.

---

### Tips & Known Limitations
- ElevenLabs default MP3 is replaced with PCM for A2F; ensure your A2F expects/accepts 16kHz mono WAV/PCM
- WebSocket origin restrictions: set `WS_ALLOWED_ORIGINS`
- CSP may need adjustments if you lock down Helmet further
- Mic capture uses ScriptProcessorNode; consider AudioWorklet for lower latency later

---

### Scripts
Root:
```bash
npm run dev      # dev server + client
npm run build    # build all workspaces
npm run lint     # ESLint
npm run format   # Prettier
```
Server:
```bash
npm -w server run dev  # uses tsx watch
npm -w server run build
npm -w server run start
```
Client:
```bash
npm -w client run dev
npm -w client run build
npm -w client run preview
```