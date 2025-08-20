export type BlendshapeFrame = {
  timestampMs: number;
  coefficients: Record<string, number>;
};

export type Audio2FaceClient = {
  isMock: boolean;
  processAudioToBlendshapes: (wavBytes: Buffer | Uint8Array) => Promise<BlendshapeFrame[]>;
};

function hasCredentials() {
  return Boolean(process.env.A2F_API_URL && process.env.A2F_API_KEY);
}

export function createAudio2FaceClient(): Audio2FaceClient {
  const mock = !hasCredentials();

  if (mock) {
    return {
      isMock: true,
      async processAudioToBlendshapes(_wavBytes: Buffer | Uint8Array) {
        const shapes = ['jawOpen', 'eyeBlinkLeft', 'eyeBlinkRight', 'mouthSmileLeft', 'mouthSmileRight'];
        const frames = Array.from({ length: 30 }).map((_, i) => ({
          timestampMs: i * 33,
          coefficients: Object.fromEntries(
            shapes.map((s) => [s, Number((Math.sin(i / 3 + s.length) * 0.5 + 0.5).toFixed(3))]),
          ),
        }));
        return frames;
      },
    };
  }

  const apiUrl = process.env.A2F_API_URL as string;
  const apiKey = process.env.A2F_API_KEY as string;

  return {
    isMock: false,
    async processAudioToBlendshapes(wavBytes: Buffer | Uint8Array) {
      // Force a plain Uint8Array copy so TS treats it as ArrayBufferView, not Buffer
      const u8 = wavBytes instanceof Uint8Array ? new Uint8Array(wavBytes) : new Uint8Array(wavBytes as any);
      const res = await fetch(`${apiUrl}/audio2face/blendshapes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/octet-stream',
        },
        body: u8 as unknown as BodyInit,
      });
      if (!res.ok) {
        throw new Error(`Audio2Face failed: ${res.status}`);
      }
      const data = (await res.json()) as BlendshapeFrame[];
      return data;
    },
  };
}