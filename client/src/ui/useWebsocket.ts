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
  const sendQueueRef = useRef<(string | ArrayBuffer)[]>([]);

  useEffect(() => {
    let wsUrl: string;
    if (import.meta.env.DEV) {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080';
      wsUrl = `${serverUrl.replace(/^http/, 'ws')}/ws`;
    } else {
      wsUrl = `${window.location.origin.replace(/^http/, 'ws')}/ws`;
    }

    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      setConnected(true);
      wsRef.current = ws;
      // Send any queued messages
      for (const msg of sendQueueRef.current) {
        ws.send(msg);
      }
      sendQueueRef.current = [];
    };

    ws.onclose = () => {
      setConnected(false);
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };

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

    return () => {
      ws.close();
    };
  }, []);

  const api = useMemo<WsApi>(() => {
    return {
      connected,
      lastEnhancedImage,
      sendJson: (obj: Record<string, unknown>) => {
        const msg = JSON.stringify(obj);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(msg);
        } else {
          sendQueueRef.current.push(msg);
        }
      },
      sendBinary: (data: ArrayBuffer) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(data);
        } else {
          sendQueueRef.current.push(data);
        }
      },
      get onFacialAnimation() {
        return animationCbRef.current;
      },
      set onFacialAnimation(cb) {
        animationCbRef.current = cb;
      },
    };
  }, [connected, lastEnhancedImage]);

  return api;
}
        