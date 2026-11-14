import { describe, expect, it } from "vitest";
import {
  sanitizeSpeechText,
  splitIntoSentences,
  startSpeaking,
  stopSpeaking,
  playHumanLikeSpeech,
  preloadHumanLikeSpeech,
} from "../../frontend/src/lib/speechService";
import { cleanTtsText } from "../../backend/server/ttsService";
import {
  playClickSound,
  playCoinSound,
  playCorrectSound,
  playWrongSound,
} from "../../frontend/src/lib/soundEffects";

describe("Audio & Speech System Resilience Tests", () => {
  it("sanitizeSpeechText strips emojis, special symbols, and extra whitespace", () => {
    const raw = "Halo adik-adik! 👧🤖 Bab 1: Mengenal Lambang Negara ⭐🇮🇩 *Pancasila* #1";
    const cleaned = sanitizeSpeechText(raw);
    expect(cleaned).not.toContain("👧");
    expect(cleaned).not.toContain("🤖");
    expect(cleaned).not.toContain("⭐");
    expect(cleaned).not.toContain("🇮🇩");
    expect(cleaned).not.toContain("*");
    expect(cleaned).toContain("Halo adik-adik! Bab 1: Mengenal Lambang Negara Pancasila 1");
  });

  it("splitIntoSentences chunks long text into natural, digestible sentences to prevent 15s freeze", () => {
    const longText =
      "Halo adik-adik! Bab ini tentang Garuda Pancasila. Garuda Pancasila adalah lambang negara Republik Indonesia yang memiliki perisai dengan lima sila. Setiap sila mengajarkan kita untuk berbuat baik kepada sesama manusia dan menyayangi teman di sekolah.";
    const chunks = splitIntoSentences(longText);

    expect(chunks.length).toBeGreaterThanOrEqual(3);
    chunks.forEach((chunk) => {
      // Pastikan setiap potongan kalimat tidak terlalu panjang
      expect(chunk.length).toBeLessThanOrEqual(160);
      expect(chunk.trim().length).toBeGreaterThan(0);
    });
  });

  it("stopSpeaking executes without throwing in non-browser or test environments", () => {
    expect(() => stopSpeaking()).not.toThrow();
  });

  it("sound effects (click, coin, correct, wrong) execute safely without unhandled exceptions", () => {
    expect(() => playClickSound()).not.toThrow();
    expect(() => playCoinSound()).not.toThrow();
    expect(() => playCorrectSound()).not.toThrow();
    expect(() => playWrongSound()).not.toThrow();
  });

  it("startSpeaking executes gracefully and invokes onEnd if text is empty or unsupported", () => {
    let ended = false;
    startSpeaking({
      text: "",
      onEnd: () => {
        ended = true;
      },
    });
    expect(ended).toBe(true);
  });

  it("playHumanLikeSpeech executes safely in non-browser or test environments with onEnd callback", () => {
    let ended = false;
    playHumanLikeSpeech({
      text: "",
      onEnd: () => {
        ended = true;
      },
    });
    expect(ended).toBe(true);
  });

  it("cleanTtsText properly sanitizes text for neural TTS generation", () => {
    const raw = "Halo anak-anak hebat! 👨‍🏫 Mari belajar *Sila Ke-3* 🇮🇩 dengan gembira!";
    const cleaned = cleanTtsText(raw);
    expect(cleaned).not.toContain("👨‍🏫");
    expect(cleaned).not.toContain("🇮🇩");
    expect(cleaned).not.toContain("*");
    expect(cleaned).toContain("Halo anak-anak hebat! Mari belajar Sila Ke-3 dengan gembira!");
  });

  it("preloadHumanLikeSpeech runs safely without throwing exceptions in non-browser environments", () => {
    expect(() => preloadHumanLikeSpeech(["Halo", "Selamat datang"])).not.toThrow();
  });
});
