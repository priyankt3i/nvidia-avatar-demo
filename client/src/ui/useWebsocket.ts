import { useEffect, useMemo, useRef, useState } from 'react';

export type FacialFrame = { timestampMs: number; coefficients: Record<string, number> };

export type WsApi = {
  sendJson: (obj: Record<string, unknown>) => void;
  sendBinary: (data: ArrayBuffer) => void;
  connected: boolean;
  lastEnhancedImage?: string;
  onFacialAnimation?: (frames: FacialFrame[]) => void;
};

export function useWebsocket(): WsApi {
  const [connected, setConnected] = useState(false);
  const [lastEnhancedImage, setLastEnhancedImage] = useState<string | undefined>();
  const wsRef = useRef<WebSocket | null>(null);
  const animationCbRef = useRef<WsApi['onFacialAnimation']>();

  useEffect(() => {
    const base = import.meta.env.VITE_SERVER_URL || window.location.origin;
    const wsBase = base.replace('http', 'ws');
    const wsUrl = `${wsBase}/ws`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (evt: MessageEvent<string | ArrayBuffer>) => {
      if (typeof evt.data === 'string') {
        try {
          const msg = JSON.parse(evt.data) as any;
          if (msg.type === 'facialAnimation') {
            animationCbRef.current?.(msg.payload as FacialFrame[]);
          } else if (msg.type === 'enhancedFace') {
            setLastEnhancedImage((msg.payload as { imageBase64: string }).imageBase64);
          } else if (msg.type === 'ttsAudio') {
            const { dataBase64, mime } = msg.payload as { dataBase64: string; mime: string };
            const audio = new Audio(`data:${mime};base64,${dataBase64}`);
            void audio.play();
          }
        } catch {}
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
    sendJson: (obj: Record<string, unknown>) => wsRef.current?.send(JSON.stringify(obj)),
    sendBinary: (data: ArrayBuffer) => wsRef.current?.send(data),
    get onFacialAnimation() {
      return animationCbRef.current;
    },
    set onFacialAnimation(cb) {
      animationCbRef.current = cb;
    },
  } as any;
}