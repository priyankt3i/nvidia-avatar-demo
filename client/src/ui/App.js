import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useRef } from 'react';
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
        if (micOn) start();
        else stop();
    }, [micOn]);

    const [dark, setDark] = useState(true);
    useEffect(() => {
        document.documentElement.classList.toggle('dark', dark);
    }, [dark]);

    const [chatHistory, setChatHistory] = useState([
        { from: 'ai', text: 'Hello! How can I help you today?' }
    ]);
    const [thinking, setThinking] = useState(false);
    const [inputText, setInputText] = useState('');

    ws.onChat = (msg) => {
        setThinking(false);
        setChatHistory(prev => [...prev, { from: 'ai', text: msg.text }]);
    };

    const handleSend = () => {
        if (!inputText.trim()) return;
        setChatHistory(prev => [...prev, { from: 'user', text: inputText }]);
        ws.sendJson({ type: 'chat', payload: { text: inputText } });
        setThinking(true);
        setInputText('');
    };

    const chatContainerRef = useRef(null);
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory, thinking]);

    return (_jsxs("div", { className: "h-full grid grid-rows-[auto,1fr,auto]", children: [
        _jsxs("header", { className: "p-4 border-b flex items-center justify-between", children: [
            _jsx("h1", { className: "font-semibold", children: "NVIDIA ACE Prototype" }),
            _jsxs("div", { className: "flex items-center gap-2", children: [
                _jsx("button", { className: "btn-outline", onClick: () => setDark((v) => !v), children: dark ? 'Light' : 'Dark' }),
                _jsx("button", { className: micOn ? 'btn bg-red-600 text-white' : 'btn-primary', onClick: () => setMicOn((v) => !v), children: micOn ? 'Stop Mic' : 'Start Mic' })
            ] })
        ] }),
        _jsxs("main", { className: "grid md:grid-cols-[1fr,380px] gap-4 p-4 overflow-hidden", children: [
            _jsx(motion.div, { layout: true, className: "card overflow-hidden", children: _jsx(AvatarViewer, { ws: ws }) }),
            _jsxs(motion.div, { layout: true, className: "card p-3 flex flex-col gap-3", children: [
                _jsx("div", { ref: chatContainerRef, className: "flex-1 flex flex-col gap-3 overflow-y-auto", children: 
                    chatHistory.map((msg, i) => 
                        _jsx("div", { className: `chat-bubble ${msg.from === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`, children: msg.text }, i)
                    ).concat(thinking ? _jsx("div", { className: "chat-bubble chat-bubble-ai", children: "..." }, "thinking") : [])
                }),
                _jsxs("div", { className: "flex gap-2", children: [
                    _jsx("input", { 
                        type: "text", 
                        className: "input flex-1", 
                        value: inputText, 
                        onChange: (e) => setInputText(e.target.value),
                        onKeyPress: (e) => e.key === 'Enter' && handleSend(),
                        placeholder: "Type your message..."
                    }),
                    _jsx("button", { 
                        className: "btn-primary", 
                        disabled: !ws.connected || thinking, 
                        onClick: handleSend, 
                        children: "Send" 
                    })
                ] })
            ] })
        ] }),
        _jsx("footer", { className: "p-3 text-xs text-muted border-t", children: "Mocked when NVIDIA keys are absent (or USE_MOCK_NVIDIA=true)." })
    ] }));
}
