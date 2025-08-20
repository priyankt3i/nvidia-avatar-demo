function hasCredentials() {
    return Boolean(process.env.ACE_API_URL && process.env.ACE_API_KEY);
}
export function createNvidiaAceClient() {
    const mock = !hasCredentials();
    if (mock) {
        return {
            isMock: true,
            async authenticate() {
                return;
            },
            async sendPoseEnhancement(_poseData) {
                const transparentPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AApMBfQ7mGswAAAAASUVORK5CYII=';
                return { imageBase64: `data:image/png;base64,${transparentPngBase64}` };
            },
            async sendInference(payload) {
                return { mocked: true, payload };
            },
        };
    }
    const apiUrl = process.env.ACE_API_URL;
    const apiKey = process.env.ACE_API_KEY;
    return {
        isMock: false,
        async authenticate() {
            return;
        },
        async sendPoseEnhancement(poseData) {
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
            const data = (await res.json());
            return data;
        },
        async sendInference(payload) {
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
            return (await res.json());
        },
    };
}
