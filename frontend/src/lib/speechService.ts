// src/lib/speechService.ts — Engine Suara & Text-To-Speech Anti-Macet untuk Google Chrome & Browser Modern
//
// Mengatasi 4 bug mendasar SpeechSynthesis di Chromium/Chrome/Edge:
// 1. Bug Instant-Cancel: Memanggil speak() di tick yang sama setelah cancel() membuat Chrome membatalkan audio baru (diatasi dengan jeda aman 120ms).
// 2. Bug Freeze 15 Detik: Chrome otomatis membeku jika teks dibaca >15 detik (diatasi dengan keepalive pause/resume ping setiap 6 detik).
// 3. Bug Garbage Collection: Objek utterance terhapus dari memori saat diputar (diatasi dengan activeUtterance global).
// 4. Bug Suara Tak Bersuara: getVoices() lambat dimuat / tidak ada suara Bahasa Indonesia di Windows (diatasi dengan fallback suara default sistem).

export type SpeechOptions = {
  text: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err?: unknown) => void;
};

// Referensi persisten global agar Garbage Collector Chrome tidak memutus audio di tengah jalan
let activeUtterance: SpeechSynthesisUtterance | null = null;
let speechTimeoutId: ReturnType<typeof setTimeout> | null = null;
let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];
let activeAudioElement: HTMLAudioElement | null = null;
let currentSpeechToken = 0;

// Inisialisasi & caching suara sistem
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  const updateVoices = () => {
    try {
      const list = window.speechSynthesis.getVoices();
      if (list && list.length > 0) {
        cachedVoices = list;
      }
    } catch {
      // Ignore
    }
  };

  updateVoices();
  window.speechSynthesis.onvoiceschanged = updateVoices;
}

/**
 * Mendapatkan daftar suara terbaik untuk Bahasa Indonesia atau fallback sistem
 */
export function getBestVoice(): { voice: SpeechSynthesisVoice | null; lang: string } {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return { voice: null, lang: "id-ID" };
  }

  const liveVoices = window.speechSynthesis.getVoices();
  const voices = liveVoices && liveVoices.length > 0 ? liveVoices : cachedVoices;
  if (!voices || voices.length === 0) {
    return { voice: null, lang: "id-ID" };
  }

  // 1. Prioritaskan suara Indonesia berkualitas tinggi / Natural
  const premiumIdVoice = voices.find(
    (v) =>
      v.lang.toLowerCase().startsWith("id") &&
      (v.name.includes("Natural") ||
        v.name.includes("Gadis") ||
        v.name.includes("Google") ||
        v.name.includes("Ardi") ||
        v.name.includes("Andika") ||
        v.name.includes("Indonesian"))
  );
  if (premiumIdVoice) return { voice: premiumIdVoice, lang: premiumIdVoice.lang || "id-ID" };

  // 2. Suara bahasa Indonesia standar
  const anyIdVoice = voices.find(
    (v) =>
      v.lang.toLowerCase().startsWith("id") ||
      v.lang.toLowerCase().includes("id-id") ||
      v.name.toLowerCase().includes("indonesia")
  );
  if (anyIdVoice) return { voice: anyIdVoice, lang: anyIdVoice.lang || "id-ID" };

  // 3. Fallback suara default sistem jika pack bahasa Indonesia belum terpasang di OS Windows
  const defaultVoice = voices.find((v) => v.default) || voices[0];
  if (defaultVoice) {
    return { voice: defaultVoice, lang: defaultVoice.lang || "id-ID" };
  }

  return { voice: null, lang: "id-ID" };
}

/**
 * Membersihkan teks dari emoji dan karakter aneh agar engine suara tidak tersedak
 */
export function sanitizeSpeechText(text: string): string {
  return text
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[\u{1F1E6}-\u{1F1FF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{FE00}-\u{FE0F}\u{200B}-\u{200D}\u{FEFF}]/gu, "")
    .replace(/["“”«»]/g, "")
    .replace(/[\*\#\@\_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Memecah teks panjang menjadi potongan kalimat alami (max ~120 karakter)
 */
export function splitIntoSentences(text: string): string[] {
  const clean = sanitizeSpeechText(text);
  if (!clean) return [];

  const rawParts = clean.split(/(?<=[.!?;\n])\s+/);
  const chunks: string[] = [];

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.length > 140) {
      const subParts = trimmed.split(/(?<=[,])\s+/);
      for (const sub of subParts) {
        const subTrim = sub.trim();
        if (subTrim) chunks.push(subTrim);
      }
    } else {
      chunks.push(trimmed);
    }
  }

  return chunks.length > 0 ? chunks : [clean];
}

/**
 * Menghentikan seluruh pemutaran suara yang sedang berjalan dan membersihkan antrean
 */
export function stopSpeaking(): void {
  // Batalkan token audio saat ini agar audio yang sedang loading tidak diputar
  currentSpeechToken++;

  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.removeAttribute("src");
      activeAudioElement.load();
    } catch {
      // Ignore
    }
    activeAudioElement = null;
  }

  if (speechTimeoutId) {
    clearTimeout(speechTimeoutId);
    speechTimeoutId = null;
  }

  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }

  activeUtterance = null;

  // Hentikan dan bersihkan antrean Web Speech agar suara robot lama tidak pernah terdengar
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch {
      // Ignore
    }
  }
}

/**
 * Memutar suara teks dengan engine AI Microsoft Edge Neural TTS (id-ID-ArdiNeural)
 * Menggantikan suara robotik lama agar seluruh pembacaan materi di luar game (AiContentPanel,
 * pesan motivasi, penjelasan aksara, dll) memiliki suara guru yang konsisten, ramah, dan manusiawi.
 */
export function startSpeaking(options: SpeechOptions): void {
  playHumanLikeSpeech({
    ...options,
    voice: "id-ID-ArdiNeural",
    provider: "edge",
  });
}

/**
 * Mengecek apakah browser sedang memutar suara TTS
 */
export function isSpeaking(): boolean {
  if (activeAudioElement && !activeAudioElement.paused && !activeAudioElement.ended) {
    return true;
  }
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  return window.speechSynthesis.speaking && activeUtterance !== null;
}

export interface HumanLikeSpeechOptions extends SpeechOptions {
  voice?: string;
  provider?: "edge" | "elevenlabs";
}

/**
 * Pre-cache audio TTS di background agar saat murid tiba di Pos 1-5 suara langsung berbunyi 0ms
 */
export function preloadHumanLikeSpeech(texts: string[], voice = "id-ID-ArdiNeural"): void {
  if (typeof window === "undefined" || typeof fetch === "undefined") return;
  for (const text of texts) {
    const clean = sanitizeSpeechText(text);
    if (!clean) continue;
    const url = `/api/tts?text=${encodeURIComponent(clean)}&voice=${encodeURIComponent(voice)}&provider=edge`;
    try {
      // Fetch di background untuk menghangatkan cache server & peramban
      fetch(url).catch(() => {});
    } catch {
      // Ignore
    }
  }
}

/**
 * Memutar suara penjelasan materi dengan AI Neural TTS yang 100% konsisten & manusiawi
 * (Menggunakan Microsoft Edge Neural id-ID-ArdiNeural tanpa kontaminasi suara robot lama)
 */
export function playHumanLikeSpeech(options: HumanLikeSpeechOptions): void {
  stopSpeaking();

  const cleanText = sanitizeSpeechText(options.text);
  if (!cleanText) {
    options.onEnd?.();
    return;
  }

  const token = ++currentSpeechToken;
  const voice = options.voice || "id-ID-ArdiNeural";
  const provider = options.provider || "edge";
  const url = `/api/tts?text=${encodeURIComponent(cleanText)}&voice=${encodeURIComponent(voice)}&provider=${encodeURIComponent(provider)}`;

  if (typeof window !== "undefined" && typeof Audio !== "undefined") {
    try {
      const audio = new Audio();
      audio.preload = "auto";
      activeAudioElement = audio;

      audio.onplay = () => {
        if (token === currentSpeechToken) {
          options.onStart?.();
        }
      };

      audio.onended = () => {
        if (token === currentSpeechToken) {
          activeAudioElement = null;
          options.onEnd?.();
        }
      };

      audio.onerror = (e) => {
        if (token === currentSpeechToken) {
          activeAudioElement = null;
          options.onError?.(e);
          options.onEnd?.();
        }
      };

      audio.src = url;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Abaikan AbortError yang wajar terjadi saat siswa berpindah pos atau menutup dialog
          if (err?.name === "AbortError") {
            return;
          }
          if (token === currentSpeechToken) {
            activeAudioElement = null;
            options.onError?.(err);
            options.onEnd?.();
          }
        });
      }
      return;
    } catch (err) {
      if (token === currentSpeechToken) {
        options.onError?.(err);
        options.onEnd?.();
      }
      return;
    }
  }

  // Jika lingkungan non-browser (misal saat testing)
  options.onEnd?.();
}
