type AceClient = {
  isMock: boolean;
  authenticate: () => Promise<void>;
  sendPoseEnhancement: (poseData: unknown) => Promise<{ imageBase64: string }>;
  sendInference: (payload: unknown) => Promise<unknown>;
};

function hasCredentials() {
  return Boolean(process.env.ACE_API_URL && process.env.ACE_API_KEY);
}

export function createNvidiaAceClient(): AceClient {
  const mock = !hasCredentials();

  if (mock) {
    return {
      isMock: true,
      async authenticate() {
        return;
      },
      async sendPoseEnhancement(_poseData: unknown) {
        const transparentPngBase64 =
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AApMBfQ7mGswAAAAASUVORK5CYII=';
        return { imageBase64: `data:image/png;base64,${transparentPngBase64}` };
      },
      async sendInference(payload: unknown) {
        return { mocked: true, payload };
      },
    };
  }

  const apiUrl = process.env.ACE_API_URL as string;
  const apiKey = process.env.ACE_API_KEY as string;

  return {
    isMock: false,
    async authenticate() {
      return;
    },
    async sendPoseEnhancement(poseData: unknown) {
      const res = await fetch(`${apiUrl}/pose/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ pose: poseData }),
      });
      if (!res.ok) {
        throw new Error(`ACE pose enhance failed: ${res.status}`);
      }
      const data = (await res.json()) as { imageBase64: string };
      return data;
    },
    async sendInference(payload: unknown) {
      const res = await fetch(`${apiUrl}/inference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`ACE inference failed: ${res.status}`);
      }
      return (await res.json()) as unknown;
    },
  };
}