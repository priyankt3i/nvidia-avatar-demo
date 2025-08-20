## NVIDIA ACE + Audio2Face Prototype (Node.js + React + Vite)

A full‑stack prototype integrating NVIDIA ACE (RTX Neural Faces) and Audio2Face concepts with a React Three.js avatar. Runs in two modes:
- Mock mode (no NVIDIA keys required) for local development
- Production mode using real ACE/Audio2Face endpoints (requires keys)

### Highlights
- **Backend**: Express.js, WebSocket, dotenv, Helmet, CORS, TypeScript
- **NVIDIA Clients**: `ACE` pose enhancement and `Audio2Face` audio→blendshapes with mock fallbacks
- **Real‑time**: WebSocket streaming of microphone audio and avatar animation frames
- **Frontend**: React + Vite + TailwindCSS + framer‑motion + Three.js viewer
- **Shared**: TypeScript types shared across client and server
- **TTS/LLM**: ElevenLabs (TTS) + OpenAI (LLM) with mock fallbacks
- **Docker**: Dockerfiles per app + docker‑compose for one‑command run
- **Deploy**: Vercel (frontend) + Render/AWS (backend)

---

### Repository Structure
```text
/shared
  package.json
  tsconfig.json
  src/index.ts         # Shared TS types (WS messages, blendshapes)

/server
  src/index.ts         # Express app + WS server
  src/ws.ts            # WS handlers (audio/pose/chat)
  src/tts.ts           # TTS (ElevenLabs supported, Google stub)
  src/llm.ts           # LLM (OpenAI or mock)
  src/nvidia/aceClient.ts        # ACE client with mock fallback
  src/nvidia/audio2faceClient.ts # Audio2Face client with mock fallback
  .env.example
  Dockerfile
  tsconfig.json

/client
  src/ui/App.tsx       # Main UI (mic, chat, viewer)
  src/ui/AvatarViewer.tsx   # Three.js GLB loader + morph targets + textures
  src/ui/useWebsocket.ts    # WS client (facialAnimation, enhancedFace, ttsAudio)
  src/ui/useMicStream.ts    # Microphone capture → WAV chunks
  public/head.glb      # Place your GLB head model here
  index.html
  vite.config.ts
  tailwind.config.js
  postcss.config.js
  Dockerfile
  vercel.json

package.json            # npm workspaces (server, client, shared)
tsconfig.base.json      # base TS config with paths
.eslintrc.cjs, .prettierrc
Docker-compose.yml
README.md
```

---

### Prerequisites
- Node.js 20+
- npm 10+
- Optional: Docker 24+

---

### Environment Configuration
Create `server/.env` based on `server/.env.example`.

```bash
# server/.env
PORT=8080
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
WS_ALLOWED_ORIGINS=http://localhost:5173

# Toggle NVIDIA mock mode (true = mock without real SDK keys)
USE_MOCK_NVIDIA=true

# NVIDIA ACE / Audio2Face (set for production use)
ACE_API_URL=
ACE_API_KEY=
A2F_API_URL=
A2F_API_KEY=

# TTS Providers (ElevenLabs recommended in this prototype)
ELEVENLABS_API_KEY=
# GOOGLE_TTS_JSON_BASE64=   # Not implemented in this prototype

# LLM Provider (optional, uses mock if unset)
OPENAI_API_KEY=
```

Frontend can optionally use `VITE_SERVER_URL` to point at a deployed backend:
- Local dev: not required
- Vercel: set `VITE_SERVER_URL` to your public backend (Render/AWS) URL

---

### Install
```bash
npm install --workspaces
```

### Run (Local Development)
- Concurrent dev for server and client:
```bash
npm run dev
```
- Open the app at `http://localhost:5173`
- Health check: `http://localhost:8080/health`

By default, `USE_MOCK_NVIDIA=true` returns mocked animations/images so you can develop without GPU/keys.

---

### 3D Avatar Model
- Add a GLB head model at `client/public/head.glb`
- The viewer supports morph targets (blendshapes). Common names (e.g., ARKit‑style):
  - `jawOpen`, `eyeBlinkLeft`, `eyeBlinkRight`, `mouthSmileLeft`, `mouthSmileRight`, etc.
- The backend sends frames with `coefficients: Record<string, number>`; matching names will be applied to `morphTargetInfluences`.

---

### WebSocket Protocol
WS endpoint: `ws://<server>/ws`

Client → Server messages:
```json
{ "type": "audio", "payload": { "data": "<binary ArrayBuffer sent as WS binary frame>" } }
{ "type": "pose",  "payload": { "headYaw": 0.15, "...": "pose fields" } }
{ "type": "chat",  "payload": { "text": "Hello!" } }
```

Server → Client messages:
```json
{ "type": "facialAnimation", "payload": [{
  "timestampMs": 0,
  "coefficients": { "jawOpen": 0.2, "mouthSmileLeft": 0.8 }
}]}

{ "type": "enhancedFace", "payload": { "imageBase64": "data:image/png;base64,..." } }

{ "type": "ttsAudio", "payload": { "mime": "audio/mpeg", "dataBase64": "..." } }

{ "type": "error", "error": "message" }
```

Behavior:
- `audio` binary frames: processed by Audio2Face → emits `facialAnimation`
- `pose` JSON: sent to ACE (or mock) → emits `enhancedFace`
- `chat` JSON: LLM generates reply → TTS synthesizes → emits `ttsAudio` and attempts `facialAnimation` from the TTS audio

Security:
- CORS origin set via `CORS_ORIGIN`
- WS origin allowlist via `WS_ALLOWED_ORIGINS`
- Use HTTPS/WSS in production

---

### TTS & LLM
- ElevenLabs: set `ELEVENLABS_API_KEY` to enable real TTS; otherwise a silent WAV is returned for dev
- OpenAI: set `OPENAI_API_KEY` to enable LLM replies; otherwise a mock reply is used

---

### Docker (One‑Command)
Build and run both services:
```bash
docker-compose up --build
```
- Client: `http://localhost:5173`
- Server: `http://localhost:8080`
- Client connects to server via `VITE_SERVER_URL=http://server:8080` in the compose network

Production tips:
- For production images, consider multi‑stage builds that serve the client statically (e.g., Nginx) and harden the server container

---

### Deployment

#### Frontend (Vercel)
1. Import the `client` directory as a Vercel project
2. Framework Preset: Vite
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Environment Variables:
   - `VITE_SERVER_URL` → your backend base URL (e.g., `https://your-backend.onrender.com`)

`client/vercel.json` is included to route SPA paths to `index.html`.

#### Backend (Render)
- Use `server/render.yaml` as a starting point
- Build Command: `npm install --workspaces --no-audit --no-fund && npm -w server run build`
- Start Command: `node server/dist/index.js`
- Environment Variables: set all keys needed (`ACE_*`, `A2F_*`, `ELEVENLABS_API_KEY`, `OPENAI_API_KEY`, `USE_MOCK_NVIDIA`)

#### Backend (AWS)
- Build a Docker image from `server/Dockerfile`
- Push to ECR and deploy via ECS/Fargate or run on EC2
- Expose port 8080; set env vars in task definition or SSM Parameter Store
- Terminate TLS with an ALB and forward to the service (WSS supported)

---

### Scripts
Root:
```bash
npm run dev      # Run server + client concurrently (dev)
npm run build    # Build shared, server, client
npm run lint     # ESLint
npm run format   # Prettier
```
Server:
```bash
npm -w server run dev
npm -w server run build
npm -w server run start
```
Client:
```bash
npm -w client run dev
npm -w client run build
npm -w client run preview
```

---

### Troubleshooting
- Three.js types: `@types/three` is installed; if you see type errors, `npm -w client install @types/three`
- GLB not loading: place a valid `head.glb` under `client/public/`
- CORS/WS blocked: ensure `CORS_ORIGIN` and `WS_ALLOWED_ORIGINS` include your frontend origin
- A2F expecting WAV: current mic stream sends WAV chunks; some TTS returns MP3 which A2F may not accept (we catch errors). Convert to WAV server‑side if needed
- NPM peer conflicts: use the versions pinned in `package.json` or run `npm install --legacy-peer-deps` as a last resort

---

### Roadmap
- Real Google TTS via google‑auth‑library
- Better TTS→A2F alignment with viseme timing
- Authentication and rate limiting
- Persist chat history and session management

---

### License
For internal prototyping use. Add your license of choice (e.g., MIT) before public release.