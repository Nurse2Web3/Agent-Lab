function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function computeScores(text: string, provider: string): { quality: number; clarity: number; tone: number; overall: number } {
  const wordCount = text.split(/\s+/).length;
  const sentenceCount = text.split(/[.!?]+/).filter(Boolean).length;
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : wordCount;

  const baseQuality = provider === "gemini" ? 4.2 : provider === "groq" ? 3.8 : 3.5;
  const baseClarity = provider === "gemini" ? 4.5 : provider === "groq" ? 4.0 : 3.6;
  const baseTone = provider === "gemini" ? 4.0 : provider === "groq" ? 3.7 : 3.9;

  const lengthBonus = Math.min(0.5, wordCount / 500);
  const clarityBonus = avgWordsPerSentence < 20 ? 0.2 : -0.1;

  const quality = Math.min(5, Math.max(1, baseQuality + lengthBonus + randomBetween(-0.2, 0.2)));
  const clarity = Math.min(5, Math.max(1, baseClarity + clarityBonus + randomBetween(-0.2, 0.2)));
  const tone = Math.min(5, Math.max(1, baseTone + randomBetween(-0.2, 0.2)));
  const overall = (quality + clarity + tone) / 3;

  return {
    quality: Math.round(quality * 10) / 10,
    clarity: Math.round(clarity * 10) / 10,
    tone: Math.round(tone * 10) / 10,
    overall: Math.round(overall * 10) / 10,
  };
}
