export type BlendshapeFrame = {
  timestampMs: number;
  coefficients: Record<string, number>;
};

export type Audio2FaceClient = {
  isMock: boolean;
  processAudioToBlendshapes: (wavBytes: Buffer | Uint8Array) => Promise<BlendshapeFrame[]>;
};

function hasCloudCredentials() {
  return Boolean(process.env.A2F_API_URL && process.env.A2F_API_KEY);
}

function hasLocal() {
  return Boolean(process.env.USE_LOCAL_A2F === 'true' && process.env.A2F_LOCAL_URL);
}

export function createAudio2FaceClient(): Audio2FaceClient {
  const useLocal = hasLocal();
  const useCloud = hasCloudCredentials();
  const forceMock = process.env.USE_MOCK_NVIDIA === 'true';
  const mock = forceMock || (!useLocal && !useCloud);

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

  if (useLocal) {
    const apiUrl = process.env.A2F_LOCAL_URL as string;
    const apiKey = process.env.A2F_API_KEY; // optional for local if set
    return {
      isMock: false,
      async processAudioToBlendshapes(wavBytes: Buffer | Uint8Array) {
        const u8 = wavBytes instanceof Uint8Array ? new Uint8Array(wavBytes) : new Uint8Array(wavBytes as any);
        const headers: Record<string, string> = { 'Content-Type': 'application/octet-stream' };
        if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
        const res = await fetch(`${apiUrl}/audio2face/blendshapes`, {
          method: 'POST',
          headers,
          body: u8 as unknown as BodyInit,
        });
        if (!res.ok) throw new Error(`Local Audio2Face failed: ${res.status}`);
        const data = (await res.json()) as BlendshapeFrame[];
        return data;
      },
    };
  }

  const apiUrl = process.env.A2F_API_URL as string;
  const apiKey = process.env.A2F_API_KEY as string;

  return {
    isMock: false,
    async processAudioToBlendshapes(wavBytes: Buffer | Uint8Array) {
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