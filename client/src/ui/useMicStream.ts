import { useRef, useState } from 'react';

export function useMicStream({ onChunk }: { onChunk: (chunk: ArrayBuffer) => void }) {
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  async function start() {
    if (isRecording) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const source = audioCtx.createMediaStreamSource(stream);
    const processor = audioCtx.createScriptProcessor(4096, 1, 1);

    const pcmBuffer: number[] = [];
    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      for (let i = 0; i < input.length; i++) {
        // float32 [-1,1] -> int16
        const s = Math.max(-1, Math.min(1, input[i]));
        pcmBuffer.push(s < 0 ? s * 0x8000 : s * 0x7fff);
      }
      if (pcmBuffer.length >= 16000) {
        const wav = int16PcmToWav(new Int16Array(pcmBuffer.splice(0, pcmBuffer.length)));
        onChunk(wav.buffer);
      }
    };

    source.connect(processor);
    processor.connect(audioCtx.destination);

    mediaStreamRef.current = stream;
    audioContextRef.current = audioCtx;
    processorRef.current = processor;
    setIsRecording(true);
  }

  function stop() {
    processorRef.current?.disconnect();
    audioContextRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    audioContextRef.current = null;
    processorRef.current = null;
    setIsRecording(false);
  }

  return { start, stop, isRecording };
}

function int16PcmToWav(samples: Int16Array, sampleRate = 16000, numChannels = 1) {
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * bytesPerSample, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    view.setInt16(offset, samples[i], true);
  }
  return view;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}