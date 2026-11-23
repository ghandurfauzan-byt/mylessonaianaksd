import { describe, expect, it } from "vitest";
import {
  deleteCurriculumModule,
  getActiveCurriculumState,
  getAiContent,
  getCurriculumModules,
  saveCurriculumModule,
  setActiveCurriculumState,
} from "../../backend/server/data";

describe("Curriculum Modules Persistence, Deletion & Punokawan Content Verification", () => {
  it("should have initial curriculum modules persisted in memory", async () => {
    const modules = await getCurriculumModules();
    expect(modules.length).toBeGreaterThanOrEqual(4);
    expect(modules.some((m) => m.id === "mod-pkn-sila3")).toBe(true);
    expect(modules.some((m) => m.id === "mod-bjawa-punokawan")).toBe(true);
  });

  it("should save and persist a newly fetched API curriculum module", async () => {
    const newMod = {
      id: "mod-test-save-1",
      title: "Mengenal Tokoh Punokawan Petruk dan Gareng",
      chapterCode: "Bab 4",
      subject: "bjawa" as const,
      subjectLabel: "Basa Jawa (Muatan Lokal)",
      grade: "Kelas 4",
      source: "API SIBI Kemdikbudristek",
      sourceType: "kemdikbud" as const,
      pageCount: 20,
      learningGoal: "Meneladani watak luhur Petruk dan Gareng.",
      isValidated: true,
      isActiveToday: false,
      ragSummary: [
        "Pangertosan: Petruk dedege dhuwur, irunge dawa, watake grapyak lan loman.",
        "Aksi Nyata: Seneng mbantu kanca ing kelas.",
      ],
    };

    const saved = await saveCurriculumModule(newMod);
    expect(saved.id).toBe("mod-test-save-1");

    const all = await getCurriculumModules();
    const found = all.find((m) => m.id === "mod-test-save-1");
    expect(found).toBeDefined();
    expect(found?.title).toBe("Mengenal Tokoh Punokawan Petruk dan Gareng");
  });

  it("should correctly fetch Punokawan AI content without Bharatayuddha war leak", async () => {
    const content = await getAiContent("bjawa-punokawan", "cerita");
    expect(content.title).toContain("Punokawan");
    expect(content.body.some((b) => b.includes("Semar") || b.includes("Petruk"))).toBe(true);
    // Should NOT contain Bharatayuddha or Kurusetra war text
    expect(content.body.some((b) => b.includes("Perang Bharatayuddha"))).toBe(false);
    expect(content.body.some((b) => b.includes("Kurusetra"))).toBe(false);
  });

  it("should delete a curriculum module and persist the removal", async () => {
    const toDeleteId = "mod-test-save-1";
    const deleted = await deleteCurriculumModule(toDeleteId);
    expect(deleted).toBe(true);

    const all = await getCurriculumModules();
    expect(all.some((m) => m.id === toDeleteId)).toBe(false);
  });

  it("should synchronize active curriculum state to student getAiContent immediately", async () => {
    const activeMod = {
      id: "mod-bjawa-unggahungguh",
      title: "Trap-Trapan Unggah-Ungguh Basa marang Bapak/Ibu Guru",
      chapterCode: "Bab 1",
      subject: "bjawa",
      ragSummary: [
        "Pangertosan: Unggah-ungguh basa yaiku tata krama lan tata tertib guneman.",
      ],
    };

    setActiveCurriculumState(activeMod);

    const activeContent = await getAiContent("active", "cerita");
    expect(activeContent.title).toContain("Unggah-Ungguh");
    expect(activeContent.body[0]).toContain("Unggah-ungguh");
  });

  it("should have child-friendly SD language and substantive quiz questions for Nasionalisme", async () => {
    const modules = await getCurriculumModules();
    const nasMod = modules.find((m) => m.id === "mod-pkn-nasionalisme");
    expect(nasMod).toBeDefined();

    // Check friendly SD language (no stiff college academic jargon)
    const summaryText = nasMod?.ragSummary?.join(" ") || "";
    expect(summaryText).toContain("Adik-adik");
    expect(summaryText).not.toContain("Secara konseptual");
    expect(summaryText).not.toContain("character building");
    expect(summaryText).not.toContain("proses pembentukan karakter utama");

    // Check quiz tests actual content (symbols, actions), not learning goal meta-questions
    const q1 = nasMod?.quizQuestions?.[1]?.[0]?.question || "";
    const q2 = nasMod?.quizQuestions?.[1]?.[1]?.question || "";
    expect(q1).toContain("cinta tanah air");
    expect(q2).toContain("Lagu kebangsaan");
    expect(q1).not.toContain("intisari dan pemahaman pokok");
    expect(q2).not.toContain("Mengapa siswa SD perlu mempelajari");
  });

  it("should broadcast active module to all grades (Kelas 1 - 6) when applyToAll is true", async () => {
    const globalMod = {
      id: "mod-pkn-bhinneka",
      title: "Bhinneka Tunggal Ika: Mengenal Keragaman Budaya",
      chapterCode: "Bab 4",
      subject: "pkn",
      grade: "Semua Kelas",
      ragSummary: ["Semboyan Bhinneka Tunggal Ika berarti berbeda-beda tetapi tetap satu."],
    };

    setActiveCurriculumState(globalMod, true);

    const grades = ["Kelas 1", "Kelas 2", "Kelas 3", "Kelas 4", "Kelas 5", "Kelas 6"];
    for (const g of grades) {
      const activeForGrade = getActiveCurriculumState(g);
      expect(activeForGrade?.id).toBe("mod-pkn-bhinneka");
      expect(activeForGrade?.title).toContain("Bhinneka Tunggal Ika");
    }
  });

  it("should update only the targeted grade when applyToAll is false", async () => {
    // 1. Reset Kelas 4 ke modul Makna Lambang Sila Ke-3
    const kelas4Mod = {
      id: "mod-pkn-sila3",
      title: "Makna Lambang Sila Ke-3: Persatuan Indonesia di Sekolah & Rumah",
      chapterCode: "Bab 1",
      subject: "pkn",
      grade: "Kelas 4",
      ragSummary: ["Pengertian & Hakikat Sila Ke-3: Persatuan Indonesia lambang Pohon Beringin."],
    };
    setActiveCurriculumState(kelas4Mod, false);

    // 2. Guru mengganti materi untuk Kelas 6
    const kelas6Mod = {
      id: "mod-pkn-kls6-bhinneka-baru",
      title: "Merajut Keberagaman Nusantara Baru Menuju Indonesia Emas",
      chapterCode: "Bab 3",
      subject: "pkn",
      grade: "Kelas 6",
      ragSummary: ["Bhinneka Tunggal Ika: Semboyan pemersatu bangsa era Majapahit."],
    };
    setActiveCurriculumState(kelas6Mod, false);

    // 3. Verifikasi: Kelas 6 terupdate ke materi baru
    const activeKls6 = getActiveCurriculumState("Kelas 6");
    expect(activeKls6?.id).toBe("mod-pkn-kls6-bhinneka-baru");
    expect(activeKls6?.title).toContain("Merajut Keberagaman Nusantara Baru");

    // 4. Verifikasi krusial: Kelas 4 TIDAK ikut berubah menjadi materi Kelas 6
    const activeKls4 = getActiveCurriculumState("Kelas 4");
    expect(activeKls4?.id).toBe("mod-pkn-sila3");
    expect(activeKls4?.id).not.toBe("mod-pkn-kls6-bhinneka-baru");
    expect(activeKls4?.title).toContain("Sila Ke-3");
  });

  it("should adapt material length: fewer/simpler points for Kelas 1-3 and full points for Kelas 4-6 when applied to all grades", async () => {
    const multiPointMod = {
      id: "mod-pkn-gotongroyong-lengkap",
      title: "Semangat Gotong Royong dan Kerja Sama di Nusantara",
      chapterCode: "Bab 2",
      subject: "pkn",
      grade: "Semua Kelas",
      ragSummary: [
        "Pengertian Gotong Royong: Gotong royong adalah bekerja sama secara sukarela untuk kepentingan bersama.",
        "Sejarah Panjang Tradisi Sambatan di Tanah Jawa era Majapahit: Falsafah kuno gotong royong tertulis dalam naskah babad kuno nusantara yang sangat mendalam.",
        "Sidang BPUPKI & Pandangan Bung Karno: Dalam pidato 1 Juni 1945, Bung Karno menegaskan jika Pancasila diperas menjadi satu sila, maka itulah Gotong Royong.",
        "Contoh Nyata di Sekolah: Melaksanakan piket membersihkan ruang kelas bersama regu piket.",
        "Pengamalan di Rumah: Membantu ibu mencuci piring dan merapikan tempat tidur sendiri.",
        "Konstitusi dan Landasan Hukum UUD 1945: Asas kekeluargaan ditegaskan dalam Pasal 33 ayat 1 UUD 1945.",
        "Pesan Budi Pekerti Anak Hebat: Saling menyayangi sesama kawan tanpa membeda-bedakan suku dan agama.",
      ],
    };

    setActiveCurriculumState(multiPointMod, true);

    // Kelas 1, 2, 3: Materi disederhanakan dan didikitkan (maksimal 4 poin, tanpa sejarah rumit)
    const kls1 = getActiveCurriculumState("Kelas 1");
    const kls2 = getActiveCurriculumState("Kelas 2");
    const kls3 = getActiveCurriculumState("Kelas 3");

    expect(kls1?.ragSummary?.length).toBeLessThanOrEqual(4);
    expect(kls2?.ragSummary?.length).toBeLessThanOrEqual(4);
    expect(kls3?.ragSummary?.length).toBeLessThanOrEqual(4);

    // Pastikan poin sejarah/konstitusi berat tersaring dari kelas rendah
    const kls1Text = kls1?.ragSummary?.join(" ") || "";
    expect(kls1Text).not.toContain("Sejarah Panjang Tradisi");
    expect(kls1Text).not.toContain("Sidang BPUPKI");
    expect(kls1Text).toContain("Pengertian Gotong Royong");

    // Kelas 4, 5, 6: Materi lengkap dan banyak (seluruh 7 poin dipertahankan)
    const kls4 = getActiveCurriculumState("Kelas 4");
    const kls5 = getActiveCurriculumState("Kelas 5");
    const kls6 = getActiveCurriculumState("Kelas 6");

    expect(kls4?.ragSummary?.length).toBe(7);
    expect(kls5?.ragSummary?.length).toBe(7);
    expect(kls6?.ragSummary?.length).toBe(7);

    const kls6Text = kls6?.ragSummary?.join(" ") || "";
    expect(kls6Text).toContain("Sidang BPUPKI");
    expect(kls6Text).toContain("Konstitusi dan Landasan Hukum");
  });
});
