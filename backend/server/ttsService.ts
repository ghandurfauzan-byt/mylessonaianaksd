// backend/server/ttsService.ts — Human-like Text-to-Speech Engine (Edge Neural & ElevenLabs)
import { EdgeTTS } from "@andresaya/edge-tts";

export interface TtsOptions {
  text: string;
  voice?: string;
  provider?: "edge" | "elevenlabs";
  rate?: string;
  pitch?: string;
  elevenlabsApiKey?: string;
  elevenlabsVoiceId?: string;
}

// In-memory audio buffer cache agar dialog berulang tidak perlu fetch jaringan ulang
const audioCache = new Map<string, Buffer>();
const MAX_CACHE_ENTRIES = 120;

/**
 * Membersihkan teks dari emoji dan karakter aneh agar engine TTS tidak membaca karakter aneh
 */
export function cleanTtsText(rawText: string): string {
  return rawText
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[\u{1F1E6}-\u{1F1FF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{FE00}-\u{FE0F}\u{200B}-\u{200D}\u{FEFF}]/gu, "")
    .replace(/["“”«»]/g, "")
    .replace(/[\*\#\@\_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Mensintesis teks menjadi audio MP3 dengan suara manusiawi (Edge Neural atau ElevenLabs)
 */
export async function synthesizeSpeech(options: TtsOptions): Promise<{ buffer: Buffer; mimeType: string }> {
  const clean = cleanTtsText(options.text);
  if (!clean) {
    throw new Error("Teks kosong untuk disintesis.");
  }

  const provider = options.provider || "edge";
  const voice = options.voice || "id-ID-ArdiNeural";
  const rate = options.rate || "+0%";
  const pitch = options.pitch || "+0Hz";

  // Cek cache audio
  const cacheKey = `${provider}::${voice}::${rate}::${pitch}::${clean}`;
  const cached = audioCache.get(cacheKey);
  if (cached) {
    return { buffer: cached, mimeType: "audio/mpeg" };
  }

  // --- OPSI 2: ELEVENLABS (Jika diminta dan API key tersedia) ---
  const elevenKey = options.elevenlabsApiKey || process.env.ELEVENLABS_API_KEY;
  if (provider === "elevenlabs" && elevenKey) {
    try {
      // Default ElevenLabs multilingual voice (e.g. Adam / Roger / custom)
      const voiceId = options.elevenlabsVoiceId || process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB";
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": elevenKey,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg",
        },
        body: JSON.stringify({
          text: clean,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      });

      if (response.ok) {
        const arrayBuf = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        if (audioCache.size >= MAX_CACHE_ENTRIES) {
          const firstKey = audioCache.keys().next().value;
          if (firstKey) audioCache.delete(firstKey);
        }
        audioCache.set(cacheKey, buffer);
        return { buffer, mimeType: "audio/mpeg" };
      }
      console.warn(`[TTS] ElevenLabs returned ${response.status}, falling back to Edge Neural TTS.`);
    } catch (err) {
      console.warn("[TTS] ElevenLabs error, falling back to Edge Neural TTS:", err);
    }
  }

  // --- OPSI 1: MICROSOFT EDGE NEURAL TTS (Default & Gratis) ---
  const edgeTts = new EdgeTTS();
  await edgeTts.synthesize(clean, voice, {
    rate,
    pitch,
  });

  const buffer = await edgeTts.toBuffer();

  // Simpan ke cache
  if (audioCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = audioCache.keys().next().value;
    if (firstKey) audioCache.delete(firstKey);
  }
  audioCache.set(cacheKey, buffer);

  return { buffer, mimeType: "audio/mpeg" };
}
