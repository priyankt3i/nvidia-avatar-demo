import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { WebSocketServer } from 'ws';
import { createNvidiaAceClient } from './nvidia/aceClient';
import { createAudio2FaceClient } from './nvidia/audio2faceClient';
import { registerWsHandlers } from './ws';
const PORT = parseInt(process.env.PORT || '8080', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
async function main() {
    const app = express();
    app.use(helmet());
    app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
    app.use(express.json({ limit: '10mb' }));
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok' });
    });
    const server = http.createServer(app);
    const wsServer = new WebSocketServer({ server, path: '/ws' });
    const aceClient = createNvidiaAceClient();
    const a2fClient = createAudio2FaceClient();
    registerWsHandlers(wsServer, { aceClient, a2fClient });
    server.listen(PORT, () => {
        console.log(`Server listening on http://localhost:${PORT}`);
    });
}
main().catch((err) => {
    console.error('Fatal error starting server:', err);
    process.exit(1);
});
