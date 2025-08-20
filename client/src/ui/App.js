import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
    const [dark, setDark] = useState(true);
    useEffect(() => {
        document.documentElement.classList.toggle('dark', dark);
    }, [dark]);
    return (_jsxs("div", { className: "h-full grid grid-rows-[auto,1fr,auto]", children: [_jsxs("header", { className: "p-4 border-b flex items-center justify-between", children: [_jsx("h1", { className: "font-semibold", children: "NVIDIA ACE Prototype" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { className: "btn-outline", onClick: () => setDark((v) => !v), children: dark ? 'Light' : 'Dark' }), _jsx("button", { className: micOn ? 'btn bg-red-600 text-white' : 'btn-primary', onClick: () => setMicOn((v) => !v), children: micOn ? 'Stop Mic' : 'Start Mic' })] })] }), _jsxs("main", { className: "grid md:grid-cols-[1fr,380px] gap-4 p-4", children: [_jsx(motion.div, { layout: true, className: "card overflow-hidden", children: _jsx(AvatarViewer, { ws: ws }) }), _jsxs(motion.div, { layout: true, className: "card p-3 flex flex-col gap-3", children: [_jsx("textarea", { className: "input h-40", value: text, onChange: (e) => setText(e.target.value) }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "btn-primary", onClick: () => ws.sendJson({ type: 'chat', payload: { text } }), children: "Send Chat" }), _jsx("button", { className: "btn-outline", onClick: () => ws.sendJson({ type: 'pose', payload: { headYaw: Math.random() } }), children: "Send Pose" })] }), _jsxs("div", { className: "text-sm text-muted", children: [_jsxs("p", { children: ["WS: ", ws.connected ? 'Connected' : 'Disconnected'] }), _jsxs("p", { children: ["Mic: ", isRecording ? 'Streaming' : 'Idle'] })] })] })] }), _jsx("footer", { className: "p-3 text-xs text-muted border-t", children: "Mocked when NVIDIA keys are absent (or USE_MOCK_NVIDIA=true)." })] }));
}
