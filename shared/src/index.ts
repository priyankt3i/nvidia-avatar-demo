export type ClientToServerMessage =
  | { type: 'audio'; payload: { data: ArrayBuffer | Buffer } }
  | { type: 'pose'; payload: unknown }
  | { type: 'chat'; payload: { text: string } };

export type BlendshapeFrame = {
  timestampMs: number;
  coefficients: Record<string, number>;
};

export type ServerToClientMessage =
  | { type: 'facialAnimation'; payload: BlendshapeFrame[] }
  | { type: 'enhancedFace'; payload: { imageBase64: string } }
  | { type: 'ttsAudio'; payload: { mime: string; dataBase64: string } }
  | { type: 'error'; error: string };