export type TtsOptions = {
  provider?: 'google' | 'elevenlabs';
  voiceId?: string;
  text: string;
};

export async function synthesizeSpeech(opts: TtsOptions): Promise<Buffer> {
  const provider = opts.provider || inferProvider();

  if (!provider) {
    return createSilentWav(16000, 1, 0.5);
  }

  if (provider === 'elevenlabs' && process.env.ELEVENLABS_API_KEY) {
    const voiceId = opts.voiceId || '21m00Tcm4TlvDq8ikWAM';
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({ text: opts.text, model_id: 'eleven_multilingual_v2' }),
    });
    if (!res.ok) throw new Error(`ElevenLabs TTS failed: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  // Google path not implemented in this prototype; return silent wav
  return createSilentWav(16000, 1, 0.5);
}

function inferProvider(): 'google' | 'elevenlabs' | null {
  if (process.env.ELEVENLABS_API_KEY) return 'elevenlabs';
  if (process.env.GOOGLE_TTS_JSON_BASE64) return 'google';
  return null;
}

function createSilentWav(sampleRate: number, channels: number, seconds: number): Buffer {
  const numSamples = Math.floor(sampleRate * seconds);
  const headerSize = 44;
  const dataSize = numSamples * channels * 2;
  const totalSize = headerSize + dataSize;
  const buffer = Buffer.alloc(totalSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(totalSize - 8, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * 2, 28);
  buffer.writeUInt16LE(channels * 2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}