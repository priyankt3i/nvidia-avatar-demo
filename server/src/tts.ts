export type TtsOptions = {
  provider?: 'elevenlabs';
  voiceId?: string;
  text: string;
};

export async function synthesizeSpeech(opts: TtsOptions): Promise<Buffer> {
  const provider: 'elevenlabs' | null = 'elevenlabs';

  if (provider === 'elevenlabs' && process.env.ELEVENLABS_API_KEY) {
    const voiceId = opts.voiceId || '21m00Tcm4TlvDq8ikWAM';
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/wav',
      },
      body: JSON.stringify({
        text: opts.text,
        model_id: 'eleven_multilingual_v2',
        output_format: 'pcm_16000',
      }),
    });
    if (!res.ok) throw new Error(`ElevenLabs TTS failed: ${res.status}`);
    const arr = await res.arrayBuffer();
    const pcm = Buffer.from(arr);
    // If the endpoint returns raw PCM without WAV header, wrap it
    if (!isWav(pcm)) {
      return wrapPcmAsWav(pcm, 16000, 1);
    }
    return pcm;
  }

  return createSilentWav(16000, 1, 0.5);
}

function isWav(buf: Buffer): boolean {
  return buf.length > 12 && buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WAVE';
}

function wrapPcmAsWav(pcm: Buffer, sampleRate: number, channels: number): Buffer {
  const header = Buffer.alloc(44);
  const dataSize = pcm.length;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM fmt chunk size
  header.writeUInt16LE(1, 20); // audio format = PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * 2, 28); // byte rate
  header.writeUInt16LE(channels * 2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm]);
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