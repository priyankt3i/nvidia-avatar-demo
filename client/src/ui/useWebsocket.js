import { useEffect, useRef, useState } from 'react';
export function useWebsocket() {
    const [connected, setConnected] = useState(false);
    const [lastEnhancedImage, setLastEnhancedImage] = useState();
    const wsRef = useRef(null);
    const animationCbRef = useRef();
    useEffect(() => {
        let base;
        if (import.meta.env.VITE_SERVER_URL) {
            base = import.meta.env.VITE_SERVER_URL;
        }
        else if (import.meta.env.DEV) {
            base = `${window.location.protocol}//${window.location.hostname}:8080`;
        }
        else {
            base = window.location.origin;
        }
        const wsBase = base.replace('http', 'ws');
        const wsUrl = `${wsBase}/ws`;
        const ws = new WebSocket(wsUrl);
        ws.binaryType = 'arraybuffer';
        ws.onopen = () => setConnected(true);
        ws.onclose = () => setConnected(false);
        ws.onmessage = (evt) => {
            if (typeof evt.data === 'string') {
                try {
                    const msg = JSON.parse(evt.data);
                    if (msg.type === 'facialAnimation') {
                        animationCbRef.current?.(msg.payload);
                    }
                    else if (msg.type === 'enhancedFace') {
                        setLastEnhancedImage(msg.payload.imageBase64);
                    }
                    else if (msg.type === 'ttsAudio') {
                        const { dataBase64, mime } = msg.payload;
                        const audio = new Audio(`data:${mime};base64,${dataBase64}`);
                        void audio.play();
                    }
                }
                catch { }
            }
        };
        wsRef.current = ws;
        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, []);
    return {
        connected,
        lastEnhancedImage,
        sendJson: (obj) => wsRef.current?.send(JSON.stringify(obj)),
        sendBinary: (data) => wsRef.current?.send(data),
        get onFacialAnimation() {
            return animationCbRef.current;
        },
        set onFacialAnimation(cb) {
            animationCbRef.current = cb;
        },
    };
}
