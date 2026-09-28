// src/utils/audioConversion.ts

export function pcmToWav(pcmData: Buffer, sampleRate: number = 24000, numChannels: number = 1): Buffer {
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const buffer = Buffer.alloc(44 + pcmData.length);
  
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + pcmData.length, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20); // AudioFormat (PCM)
  buffer.writeUInt16LE(numChannels, 22); // NumChannels
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(byteRate, 28); // ByteRate
  buffer.writeUInt16LE(blockAlign, 32); // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample
  buffer.write('data', 36);
  buffer.writeUInt32LE(pcmData.length, 40);
  
  pcmData.copy(buffer, 44);
  return buffer;
}

export function convertGeminiAudioToWavBase64(
  base64Data: string,
  mimeType: string
): { audioBase64: string; mimeType: string } {
  if (mimeType && mimeType.includes('wav')) {
    return { audioBase64: base64Data, mimeType: 'audio/wav' };
  }

  let sampleRate = 24000;
  if (mimeType && mimeType.includes('rate=')) {
    const match = mimeType.match(/rate=(\d+)/);
    if (match) {
      sampleRate = parseInt(match[1], 10);
    }
  }

  const pcmBuffer = Buffer.from(base64Data, 'base64');
  const wavBuffer = pcmToWav(pcmBuffer, sampleRate, 1);
  return { audioBase64: wavBuffer.toString('base64'), mimeType: 'audio/wav' };
}
