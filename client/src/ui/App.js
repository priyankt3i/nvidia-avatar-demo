import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
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
        if (micOn)
            start();
        else
            stop();
    }, [micOn]);
    const [text, setText] = useState('Hello! How can I help you today?');
    return (_jsxs("div", { className: "h-full grid grid-rows-[auto,1fr,auto]", children: [_jsxs("header", { className: "p-4 border-b flex items-center justify-between", children: [_jsx("h1", { className: "font-semibold", children: "NVIDIA ACE Prototype" }), _jsx("div", { className: "flex items-center gap-2", children: _jsx("button", { className: `px-3 py-1 rounded ${micOn ? 'bg-red-600 text-white' : 'bg-primary text-white'}`, onClick: () => setMicOn((v) => !v), children: micOn ? 'Stop Mic' : 'Start Mic' }) })] }), _jsxs("main", { className: "grid md:grid-cols-[1fr,380px] gap-4 p-4", children: [_jsx("div", { className: "rounded border overflow-hidden", children: _jsx(AvatarViewer, { ws: ws }) }), _jsxs("div", { className: "rounded border p-3 flex flex-col gap-2", children: [_jsx("textarea", { className: "border rounded p-2 w-full h-40", value: text, onChange: (e) => setText(e.target.value) }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "px-3 py-1 rounded bg-primary text-white", onClick: () => ws.sendJson({ type: 'chat', payload: { text } }), children: "Send Chat" }), _jsx("button", { className: "px-3 py-1 rounded border", onClick: () => ws.sendJson({ type: 'pose', payload: { headYaw: Math.random() } }), children: "Send Pose" })] }), _jsxs("div", { children: [_jsxs("p", { className: "text-sm text-gray-500", children: ["WS: ", ws.connected ? 'Connected' : 'Disconnected'] }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Mic: ", isRecording ? 'Streaming' : 'Idle'] })] })] })] }), _jsx("footer", { className: "p-3 text-xs text-gray-500 border-t", children: "Mocked when NVIDIA keys are absent." })] }));
}
