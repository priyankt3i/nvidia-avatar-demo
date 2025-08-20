import React, { useEffect, useMemo, useRef, useState } from 'react';
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

  return (
    <div className="h-full grid grid-rows-[auto,1fr,auto]">
      <header className="p-4 border-b flex items-center justify-between">
        <h1 className="font-semibold">NVIDIA ACE Prototype</h1>
        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-1 rounded ${micOn ? 'bg-red-600 text-white' : 'bg-primary text-white'}`}
            onClick={() => setMicOn((v) => !v)}
          >
            {micOn ? 'Stop Mic' : 'Start Mic'}
          </button>
        </div>
      </header>
      <main className="grid md:grid-cols-[1fr,380px] gap-4 p-4">
        <div className="rounded border overflow-hidden">
          <AvatarViewer ws={ws} />
        </div>
        <div className="rounded border p-3 flex flex-col gap-2">
          <textarea
            className="border rounded p-2 w-full h-40"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded bg-primary text-white"
              onClick={() => ws.sendJson({ type: 'chat', payload: { text } })}
            >
              Send Chat
            </button>
            <button
              className="px-3 py-1 rounded border"
              onClick={() => ws.sendJson({ type: 'pose', payload: { headYaw: Math.random() } })}
            >
              Send Pose
            </button>
          </div>
          <div>
            <p className="text-sm text-gray-500">WS: {ws.connected ? 'Connected' : 'Disconnected'}</p>
            <p className="text-sm text-gray-500">Mic: {isRecording ? 'Streaming' : 'Idle'}</p>
          </div>
        </div>
      </main>
      <footer className="p-3 text-xs text-gray-500 border-t">Mocked when NVIDIA keys are absent.</footer>
    </div>
  );
}