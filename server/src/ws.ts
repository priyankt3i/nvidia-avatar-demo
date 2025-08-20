import { WebSocketServer, WebSocket } from 'ws';
import type { RawData } from 'ws';
import type { Audio2FaceClient } from './nvidia/audio2faceClient';
import { synthesizeSpeech } from './tts';
import { generateReply } from './llm';

const ALLOWED_ORIGINS = new Set(
  (process.env.WS_ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim()),
);

export type ServerDeps = {
  aceClient: {
    isMock: boolean;
    sendPoseEnhancement: (poseData: unknown) => Promise<{ imageBase64: string }>;
  };
  a2fClient: Audio2FaceClient;
};

export function registerWsHandlers(server: WebSocketServer, deps: ServerDeps) {
  server.on('connection', (socket: WebSocket, req) => {
    const origin = req.headers.origin;
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      socket.close(1008, 'Origin not allowed');
      return;
    }

    socket.on('message', async (raw: RawData) => {
      try {
        if (typeof raw === 'string') {
          const msg = JSON.parse(raw);
          await handleJsonMessage(socket, msg, deps);
        } else if (Buffer.isBuffer(raw)) {
          const frames = await deps.a2fClient.processAudioToBlendshapes(raw);
          socket.send(JSON.stringify({ type: 'facialAnimation', payload: frames }));
        } else if (Array.isArray(raw)) {
          const buf = Buffer.concat(raw);
          const frames = await deps.a2fClient.processAudioToBlendshapes(buf);
          socket.send(JSON.stringify({ type: 'facialAnimation', payload: frames }));
        } else if (raw instanceof ArrayBuffer) {
          const buf = Buffer.from(raw);
          const frames = await deps.a2fClient.processAudioToBlendshapes(buf);
          socket.send(JSON.stringify({ type: 'facialAnimation', payload: frames }));
        }
      } catch (err) {
        socket.send(JSON.stringify({ type: 'error', error: (err as Error).message }));
      }
    });
  });
}

async function handleJsonMessage(
  socket: WebSocket,
  msg: any,
  deps: ServerDeps,
) {
  if (!msg || typeof msg !== 'object') return;
  const { type, payload } = msg;

  switch (type) {
    case 'audio': {
      if (!payload || !(payload.data)) return;
      const audioBuffer = Buffer.from(payload.data);
      const frames = await deps.a2fClient.processAudioToBlendshapes(audioBuffer);
      socket.send(JSON.stringify({ type: 'facialAnimation', payload: frames }));
      return;
    }
    case 'pose': {
      const enhanced = await deps.aceClient.sendPoseEnhancement(payload);
      socket.send(JSON.stringify({ type: 'enhancedFace', payload: enhanced }));
      return;
    }
    case 'chat': {
      const text: string = payload?.text ?? '';
      if (!text) return;
      const reply = await generateReply(text);
      const tts = await synthesizeSpeech({ text: reply });
      socket.send(
        JSON.stringify({
          type: 'ttsAudio',
          payload: { mime: 'audio/mpeg', dataBase64: tts.toString('base64') },
        }),
      );
      try {
        const frames = await deps.a2fClient.processAudioToBlendshapes(tts);
        socket.send(JSON.stringify({ type: 'facialAnimation', payload: frames }));
      } catch (err) {}
      return;
    }
    default:
      socket.send(JSON.stringify({ type: 'error', error: 'Unknown message type' }));
  }
}