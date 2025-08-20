import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarViewer } from './AvatarViewer';
import { useWebsocket } from './useWebsocket';
import { useMicStream } from './useMicStream';

export function App() {
  const ws = useWebsocket();
  const [micOn, setMicOn] = useState(false);
  const { start, stop, isRecording } = useMicStream({
    onChunk: (chunk) => {
      ws.sendBinary(chunk);
    },
  });

  useEffect(() => {
    if (micOn) start();
    else stop();
  }, [micOn]);

  const [text, setText] = useState('Hello! How can I help you today?');
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <div className="h-full grid grid-rows-[auto,1fr,auto]">
      <header className="p-4 border-b flex items-center justify-between">
        <h1 className="font-semibold">NVIDIA ACE Prototype</h1>
        <div className="flex items-center gap-2">
          <button className="btn-outline" onClick={() => setDark((v) => !v)}>
            {dark ? 'Light' : 'Dark'}
          </button>
          <button
            className={micOn ? 'btn bg-red-600 text-white' : 'btn-primary'}
            onClick={() => setMicOn((v) => !v)}
          >
            {micOn ? 'Stop Mic' : 'Start Mic'}
          </button>
        </div>
      </header>
      <main className="grid md:grid-cols-[1fr,380px] gap-4 p-4">
        <motion.div layout className="card overflow-hidden">
          <AvatarViewer ws={ws} />
        </motion.div>
        <motion.div layout className="card p-3 flex flex-col gap-3">
          <textarea
            className="input h-40"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              className="btn-primary"
              onClick={() => ws.sendJson({ type: 'chat', payload: { text } })}
            >
              Send Chat
            </button>
            <button
              className="btn-outline"
              onClick={() => ws.sendJson({ type: 'pose', payload: { headYaw: Math.random() } })}
            >
              Send Pose
            </button>
          </div>
          <div className="text-sm text-muted">
            <p>WS: {ws.connected ? 'Connected' : 'Disconnected'}</p>
            <p>Mic: {isRecording ? 'Streaming' : 'Idle'}</p>
          </div>
        </motion.div>
      </main>
      <footer className="p-3 text-xs text-muted border-t">Mocked when NVIDIA keys are absent (or USE_MOCK_NVIDIA=true).</footer>
    </div>
  );
}