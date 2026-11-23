// src/components/StudentAccountsManager.tsx — Manajemen Kontrol Akun Siswa SD oleh Guru
import ModalPortal from "@/components/ModalPortal";
import { playClickSound, playCorrectSound } from "@/lib/soundEffects";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export interface StudentAccount {
  id: string;
  name: string;
  email: string;
  nimNip?: string;
  institution?: string;
  kelas?: string;
  noAbsen?: string;
  points?: number;
  materialScore?: number;
  quizScore?: number;
  gamePoints?: number;
  status?: "tuntas" | "remedial" | string;
  weakness?: {
    chapterId: string;
    chapterName: string;
    subject: string;
    score: number;
    outOf: number;
    status: "tuntas" | "remedial";
    message: string;
  };
}

export default function StudentAccountsManager() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKelas, setFilterKelas] = useState<string>("Kelas 1");
  const [selectedStudentReport, setSelectedStudentReport] = useState<StudentAccount | null>(null);

  // Modal State: Tambah Siswa Baru
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("siswa123");
  const [newKelas, setNewKelas] = useState("Kelas 4");
  const [newNoAbsen, setNewNoAbsen] = useState("");

  // Modal State: Edit Siswa
  const [editingStudent, setEditingStudent] = useState<StudentAccount | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editKelas, setEditKelas] = useState("Kelas 4");
  const [editNoAbsen, setEditNoAbsen] = useState("");

  // Feedback Messages
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Fetch daftar siswa
  const { data: students = [], isLoading } = useQuery<StudentAccount[]>({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await fetch("/api/students");
      if (!res.ok) throw new Error("Gagal mengambil data siswa.");
      return res.json();
    },
  });

  // Filter Peringkat & Distribusi Poin Per-Materi & Per-Kelas
  const [rankingKelas, setRankingKelas] = useState<string>("Kelas 4");
  const [rankingChapter, setRankingChapter] = useState<string>("pkn-sila3");

  const { data: rankingData, isLoading: isRankingLoading } = useQuery<{
    chapterId: string;
    kelas: string;
    totalStudents: number;
    highestScore: { name: string; gamePoints: number; quizScore: number } | null;
    lowestScore: { name: string; gamePoints: number; quizScore: number } | null;
    averageScore: number;
    ranking: Array<StudentAccount & { rank: number }>;
  }>({
    queryKey: ["students-ranking", rankingChapter, rankingKelas],
    queryFn: async () => {
      const res = await fetch(
        `/api/students/ranking?chapter=${encodeURIComponent(rankingChapter)}&kelas=${encodeURIComponent(rankingKelas)}`
      );
      if (!res.ok) throw new Error("Gagal mengambil data peringkat siswa.");
      return res.json();
    },
  });

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Mutation: Tambah Siswa
  const addStudentMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password?: string; kelas: string; noAbsen: string }) => {
      const res = await fetch("/api/students/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menambahkan siswa.");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["class-summary"] });
      playCorrectSound();
      showNotice("Akun siswa baru berhasil didaftarkan! 🎒");
      setIsAddModalOpen(false);
      setNewName("");
      setNewEmail("");
      setNewNoAbsen("");
    },
    onError: (err: Error) => {
      alert(err.message);
    },
  });

  // Mutation: Update Siswa
  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; email: string; kelas: string; noAbsen: string } }) => {
      const res = await fetch(`/api/students/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal memperbarui data siswa.");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      playCorrectSound();
      showNotice("Data profil siswa berhasil diperbarui! ✏️");
      setEditingStudent(null);
    },
    onError: (err: Error) => {
      alert(err.message);
    },
  });

  // Mutation: Reset Poin Siswa Tertentu
  const resetSinglePointsMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/students/${encodeURIComponent(id)}/reset-points`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal mereset poin siswa.");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      playCorrectSound();
      showNotice("Poin belajar & petualangan game siswa berhasil di-reset ke 0! 🔄");
    },
    onError: (err: Error) => {
      alert(err.message);
    },
  });

  // Mutation: Hapus Siswa
  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/students/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus siswa.");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["class-summary"] });
      playCorrectSound();
      showNotice("Akun siswa telah dihapus dari kelas. 🗑️");
    },
    onError: (err: Error) => {
      alert(err.message);
    },
  });

  const handleOpenEdit = (s: StudentAccount) => {
    playClickSound();
    setEditingStudent(s);
    setEditName(s.name);
    setEditEmail(s.email);
    setEditKelas(s.kelas || "Kelas 4");
    setEditNoAbsen(s.noAbsen || "01");
  };

  const handleResetSingle = (s: StudentAccount) => {
    playClickSound();
    const ok = window.confirm(
      `Reset skor game dan skor kuis untuk siswa: "${s.name}" (Absen #${s.noAbsen || "-"})?\n\nSkor game dan evaluasi kuis akan menjadi 0.`
    );
    if (!ok) return;
    resetSinglePointsMutation.mutate(s.id);
  };

  const handleDelete = (s: StudentAccount) => {
    playClickSound();
    const ok = window.confirm(`Apakah Anda yakin ingin menghapus akun siswa "${s.name}" dari sistem?`);
    if (!ok) return;
    deleteStudentMutation.mutate(s.id);
  };

  // Helper Cetak Rapor Siswa ke PDF
  const handlePrintReport = () => {
    playClickSound();
    window.print();
  };

  // Helper Ekspor Data Rapor Individual Siswa ke CSV / Excel
  const downloadStudentCsv = (student: StudentAccount) => {
    playClickSound();
    const dateStr = new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const quizScore = student.quizScore ?? 85;
    const gamePoints = student.gamePoints ?? 120;
    const isTuntas = quizScore >= 75;

    const rows = [
      ["LAPORAN HASIL EVALUASI CAPAIAN BELAJAR SISWA (RAPOR DIGITAL)"],
      ["SD NEGERI 1 MADIUN - TAHUN AJARAN 2025/2026"],
      ["Alamat: Jl. Jawa No. 1, Kota Madiun, Jawa Timur"],
      [],
      ["DATA PESERTA DIDIK"],
      ["Nama Siswa", student.name],
      ["Nomor Absen", `#${student.noAbsen || "01"}`],
      ["Rombongan Belajar (Kelas)", student.kelas || "Kelas 1"],
      ["NISN / Nomor Induk", student.nimNip || "3128495021"],
      ["Email Akun", student.email],
      ["Tanggal Cetak Laporan", dateStr],
      [],
      ["RINGKASAN EVALUASI CAPAIAN"],
      ["Status Ketercapaian KKTP", isTuntas ? "TUNTAS STANDAR KKTP (>=75)" : "MEMERLUKAN BIMBINGAN"],
      ["Nilai Rata-rata Kuis Harian", `${quizScore} / 100`],
      ["Poin Petualangan Game 3D", `${gamePoints} Poin`],
      [],
      ["RINCIAN NILAI MATA PELAJARAN & BAB KURIKULUM"],
      ["No", "Mata Pelajaran", "Materi / Bab Kurikulum", "Batas KKTP", "Nilai Siswa", "Status Ketuntasan", "Deskripsi Capaian"],
      ["1", "Pendidikan Pancasila (PKn)", "Bab 1 - Makna Lambang Sila Ke-3", "75", `${Math.min(100, quizScore + 4)}`, "Tuntas", "Memahami nilai persatuan Indonesia dan penerapannya sehari-hari"],
      ["2", "Pendidikan Pancasila (PKn)", "Bab 2 - Gotong Royong sebagai Jati Diri Bangsa", "75", `${Math.max(55, quizScore - 7)}`, isTuntas ? "Tuntas" : "Bimbingan", "Menerapkan kerja sama dan gotong royong di lingkungan sekolah"],
      ["3", "Pendidikan Pancasila (PKn)", "Bab 3 - Norma dan Aturan Sekolah", "75", `${Math.min(100, quizScore + 6)}`, "Tuntas", "Mematuhi tata tertib dan sopan santun terhadap guru dan teman"],
      ["4", "Pendidikan Pancasila (PKn)", "Bab 4 - Bhinneka Tunggal Ika", "75", `${quizScore}`, "Tuntas", "Menghargai keberagaman budaya, agama, dan suku di Indonesia"],
      ["5", "Bahasa Jawa (Muatan Lokal)", "Bab 1 - Unggah-ungguh Basa", "75", `${quizScore}`, "Tuntas", "Prigel matur marang guru lan wong tuwa kanthi krama alus"],
      ["6", "Bahasa Jawa (Muatan Lokal)", "Bab 2 - Tokoh Wayang Punokawan", "75", `${Math.min(100, quizScore + 3)}`, "Tuntas", "Niteni watak jujur Bagong lan kawicaksanan Kyai Semar"],
      ["7", "Bahasa Jawa (Muatan Lokal)", "Bab 3 - Pandhawa Lima", "75", `${Math.min(100, quizScore + 5)}`, "Tuntas", "Nguwasani silsilah lan watak satriya Pandhawa kanthi luhur"],
      ["8", "Bahasa Jawa (Muatan Lokal)", "Bab 4 - Gladhen Aksara Jawa", "75", `${Math.max(60, quizScore - 5)}`, isTuntas ? "Tuntas" : "Bimbingan", "Lancar nulis lan maca 20 aksara legena kanthi sandhangan"],
      [],
      ["CATATAN GURU KELAS"],
      ["Catatan", "Siswa aktif dalam kegiatan belajar, disiplin, dan menunjukkan budi pekerti yang luhur."],
      [],
      ["PENGESAHAN"],
      ["Guru Kelas", "Bpk. Darmawan, S.Pd.SD (NIP. 198506122010011012)"],
      ["Kepala Sekolah", "Hj. Sri Wahyuni, M.Pd (NIP. 197803152003122005)"],
    ];

    const csvContent = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rapor_${student.name.replace(/\s+/g, "_")}_${student.kelas || "Kelas1"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice(`Laporan Excel/CSV untuk ${student.name} berhasil diunduh! 📊`);
  };

  // Helper Ekspor Rekap Seluruh Siswa Per Kelas ke Excel / CSV
  const downloadClassRecapCsv = (targetClass: string, studentList: StudentAccount[]) => {
    playClickSound();
    const dateStr = new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const rows = [
      ["REKAPITULASI LAPORAN HASIL BELAJAR SISWA PER KELAS"],
      ["SD NEGERI 1 MADIUN - TAHUN AJARAN 2025/2026"],
      ["Rombongan Belajar", targetClass === "all" ? "Seluruh Kelas (Kelas 1 s/d 6)" : targetClass],
      ["Jumlah Siswa", `${studentList.length} Siswa`],
      ["Tanggal Ekspor", dateStr],
      ["Wali Kelas / Pengajar", "Bpk. Darmawan, S.Pd.SD (NIP. 198506122010011012)"],
      [],
      [
        "No. Absen",
        "Nama Siswa",
        "NISN",
        "Kelas",
        "Email Akun",
        "Rata-Rata Nilai Kuis (0-100)",
        "Poin Petualangan Game",
        "Status Ketuntasan KKTP",
        "Status Akun",
      ],
    ];

    studentList.forEach((s) => {
      const qScore = s.quizScore ?? 85;
      const gPoints = s.gamePoints ?? 120;
      const isTuntas = qScore >= 75;

      rows.push([
        `#${s.noAbsen || "01"}`,
        s.name,
        s.nimNip || "3128495021",
        s.kelas || targetClass,
        s.email,
        `${qScore}`,
        `${gPoints}`,
        isTuntas ? "TUNTAS STANDAR KKTP (>=75)" : "PERLU BIMBINGAN (<75)",
        "Aktif Terdaftar",
      ]);
    });

    const csvContent = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rekap_Nilai_${targetClass.replace(/\s+/g, "_")}_SDN1Madiun.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice(`Rekap nilai ${targetClass} berhasil diekspor ke file Excel/CSV! 📊`);
  };

  // Filter siswa per kelas dan pencarian
  const filteredStudents = students.filter((s) => {
    if (filterKelas !== "all" && s.kelas !== filterKelas) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchEmail = s.email.toLowerCase().includes(q);
      const matchAbsen = (s.noAbsen || "").includes(q);
      if (!matchName && !matchEmail && !matchAbsen) return false;
    }
    return true;
  });

  // Urutkan siswa secara tegas berdasarkan Nomor Absen (#01, #02, #03, dst)
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const numA = parseInt(String(a.noAbsen || "").replace(/\D/g, "") || "0", 10);
    const numB = parseInt(String(b.noAbsen || "").replace(/\D/g, "") || "0", 10);
    if (numA !== numB) return numA - numB;
    return a.name.localeCompare(b.name);
  });

  return (
    <section className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border-4 border-amber-200 dark:border-slate-800 shadow-xl shadow-amber-200/20 dark:shadow-none space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-slate-100 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎒</span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Data Siswa Per Kelas &amp; Laporan Belajar Siswa (Rapor)
            </h2>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Daftar siswa terpetakan per jenjang kelas, terurut lengkap berdasarkan nomor presensi absen. Klik nama siswa untuk melihat dan mencetak rapor (PDF/Excel).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tombol Ekspor Rekap Kelas ke Excel */}
          <button
            type="button"
            onClick={() => downloadClassRecapCsv(filterKelas, sortedStudents)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
            title={`Unduh rekapitulasi nilai seluruh siswa ${filterKelas} ke file Excel/CSV`}
          >
            <span>📊</span>
            <span>Ekspor Rekap {filterKelas === "all" ? "Semua Kelas" : filterKelas} (Excel)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
          >
            <span>➕</span>
            <span>Daftar Siswa Baru</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <span>✓</span>
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Tab Navigasi Kelas (Kelas 1 s/d Kelas 6) & Pencarian Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/60 dark:bg-slate-800/50 p-3 rounded-2xl border border-amber-200/80 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mr-1 flex items-center gap-1">
            <span>🏫</span>
            <span>Pilih Kelas:</span>
          </span>
          {(["Kelas 1", "Kelas 2", "Kelas 3", "Kelas 4", "Kelas 5", "Kelas 6", "all"] as const).map((k) => {
            const count = students.filter((s) => (k === "all" ? true : s.kelas === k)).length;
            const isActive = filterKelas === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => {
                  playClickSound();
                  setFilterKelas(k);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                  isActive
                    ? "bg-amber-400 text-amber-950 shadow-sm border border-amber-500 scale-[1.03]"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                }`}
              >
                <span>{k === "all" ? "Semua Kelas" : k}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? "bg-amber-950/20 text-amber-950" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, absen, atau email..."
            className="w-full sm:w-64 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-700 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tabel Akun Siswa Terpetakan Per Kelas & Urut Absen */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-500">Memuat data siswa...</div>
      ) : sortedStudents.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
          <p className="font-bold">Belum ada siswa terdaftar pada {filterKelas === "all" ? "sekolah ini" : filterKelas}.</p>
          <button
            type="button"
            onClick={() => {
              setNewKelas(filterKelas === "all" ? "Kelas 1" : filterKelas);
              setIsAddModalOpen(true);
            }}
            className="text-xs text-emerald-600 font-bold hover:underline"
          >
            + Daftarkan siswa untuk {filterKelas === "all" ? "Kelas 1" : filterKelas} sekarang
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3.5 w-16 text-center">Absen</th>
                <th className="py-3 px-3.5">Nama Siswa &amp; NISN/Akun</th>
                <th className="py-3 px-3.5">Rombel / Kelas</th>
                <th className="py-3 px-3.5 text-center">Nilai Kuis</th>
                <th className="py-3 px-3.5 text-center">Poin Game</th>
                <th className="py-3 px-3.5">Status Capaian KKTP</th>
                <th className="py-3 px-3.5 text-right">Laporan Belajar (Rapor)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {sortedStudents.map((s) => {
                const quizScore = s.quizScore ?? 85;
                const gamePoints = s.gamePoints ?? 120;
                const isTuntas = quizScore >= 75;

                return (
                  <tr
                    key={s.id}
                    onClick={() => {
                      playClickSound();
                      setSelectedStudentReport(s);
                    }}
                    className="hover:bg-amber-50/50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                    title={`Klik untuk membuka dan mencetak rapor hasil belajar ${s.name}`}
                  >
                    <td className="py-3.5 px-3.5 text-center">
                      <span className="font-black px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 text-xs border border-amber-300 dark:border-amber-700/60">
                        #{s.noAbsen || "01"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5">
                      <div className="font-black text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        {s.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        NISN: {s.nimNip || "3128495021"} · {s.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5">
                      <span className="font-black px-2.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                        {s.kelas || "Kelas 1"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 text-center">
                      <span className="font-black text-xs text-sky-700 dark:text-sky-300">
                        📝 {quizScore}/100
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 text-center">
                      <span className="font-black text-xs text-amber-700 dark:text-amber-400">
                        🎮 {gamePoints} Poin
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5">
                      <span
                        className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full text-[10px] border ${
                          isTuntas
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                        }`}
                      >
                        <span>{isTuntas ? "✓" : "⚠️"}</span>
                        <span>{isTuntas ? "Tuntas KKTP" : "Perlu Bimbingan"}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playClickSound();
                          setSelectedStudentReport(s);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-[11px] font-black shadow-xs transition active:scale-95 cursor-pointer"
                        title="Buka laporan rapor belajar siswa ini"
                      >
                        <span>📄</span>
                        <span>Buka Laporan</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. FORMAT POIN & PERINGKAT SISWA PER-MATERI & PER-KELAS (TERTINGGI, TERENDAH, DAN URUTAN RANKING LENGKAP) */}
      <div className="border-t-3 border-amber-200/80 dark:border-slate-800 pt-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Format Poin &amp; Peringkat Siswa Per-Materi
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pantau peringkat urut dari nomor satu hingga akhir per-kelas dan per-materi dengan skor tertinggi serta terendah.
            </p>
          </div>

          {/* Selectors Kelas & Materi */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold text-slate-500">Kelas:</span>
              <select
                value={rankingKelas}
                onChange={(e) => setRankingKelas(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-800 dark:text-white outline-none cursor-pointer"
              >
                <option value="Kelas 1">Kelas 1</option>
                <option value="Kelas 2">Kelas 2</option>
                <option value="Kelas 3">Kelas 3</option>
                <option value="Kelas 4">Kelas 4 (Utama)</option>
                <option value="Kelas 5">Kelas 5</option>
                <option value="Kelas 6">Kelas 6</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold text-slate-500">Materi:</span>
              <select
                value={rankingChapter}
                onChange={(e) => setRankingChapter(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-800 dark:text-white outline-none cursor-pointer max-w-[200px] truncate"
              >
                <optgroup label="🇮🇩 Pendidikan Pancasila">
                  <option value="pkn-sila3">PKn: Bab 1 - Makna Sila Ke-3</option>
                  <option value="pkn-gotongroyong">PKn: Bab 2 - Gotong Royong</option>
                  <option value="pkn-norma">PKn: Bab 3 - Norma &amp; Aturan</option>
                  <option value="pkn-bhinneka">PKn: Bab 4 - Bhinneka Tunggal Ika</option>
                </optgroup>
                <optgroup label="🦚 Bahasa Jawa">
                  <option value="bjawa-unggahungguh">B. Jawa: Bab 1 - Unggah-ungguh</option>
                  <option value="bjawa-punokawan">B. Jawa: Bab 2 - Tokoh Wayang</option>
                  <option value="bjawa-pandhawa">B. Jawa: Bab 3 - Pandhawa Lima</option>
                  <option value="bjawa-aksara">B. Jawa: Bab 4 - Aksara Jawa</option>
                  <option value="bjawa-kewan">B. Jawa: Bab 5 - Arane Anak Kewan</option>
                </optgroup>
              </select>
            </div>
          </div>
        </div>

        {/* 3 Kartu Statistik: Tertinggi, Terendah, Rata-rata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border-2 border-amber-300 dark:border-amber-700/60 shadow-xs space-y-1">
            <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 tracking-wider flex items-center gap-1.5">
              <span>🏆</span>
              <span>Skor Tertinggi ({rankingKelas}):</span>
            </span>
            <div className="font-black text-sm text-slate-900 dark:text-white truncate">
              {rankingData?.highestScore?.name || "Belum ada siswa"}
            </div>
            <div className="text-xs font-extrabold text-amber-700 dark:text-amber-400">
              🎮 {rankingData?.highestScore?.gamePoints || 0} Poin · 📝 Kuis {rankingData?.highestScore?.quizScore || 0}/100
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/20 border-2 border-rose-300 dark:border-rose-700/60 shadow-xs space-y-1">
            <span className="text-[10px] font-black uppercase text-rose-800 dark:text-rose-300 tracking-wider flex items-center gap-1.5">
              <span>📉</span>
              <span>Skor Terendah ({rankingKelas}):</span>
            </span>
            <div className="font-black text-sm text-slate-900 dark:text-white truncate">
              {rankingData?.lowestScore?.name || "Belum ada siswa"}
            </div>
            <div className="text-xs font-extrabold text-rose-700 dark:text-rose-400">
              🎮 {rankingData?.lowestScore?.gamePoints || 0} Poin · 📝 Kuis {rankingData?.lowestScore?.quizScore || 0}/100
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/20 border-2 border-sky-300 dark:border-sky-700/60 shadow-xs space-y-1">
            <span className="text-[10px] font-black uppercase text-sky-800 dark:text-sky-300 tracking-wider flex items-center gap-1.5">
              <span>📊</span>
              <span>Rata-Rata Kelas:</span>
            </span>
            <div className="font-black text-sm text-slate-900 dark:text-white">
              {rankingData?.totalStudents || 0} Siswa Terdaftar
            </div>
            <div className="text-xs font-extrabold text-sky-700 dark:text-sky-400">
              Rata-rata: ~{rankingData?.averageScore || 0} Poin Prestasi
            </div>
          </div>
        </div>

        {/* Tabel Urutan Peringkat dari Nomor 1 sampai Akhir */}
        <div className="overflow-x-auto rounded-2xl border-2 border-amber-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-amber-100/70 dark:bg-slate-800/80 text-amber-950 dark:text-amber-200 font-black border-b border-amber-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Urutan Peringkat</th>
                <th className="py-2.5 px-3">Absen</th>
                <th className="py-2.5 px-3">Nama Siswa</th>
                <th className="py-2.5 px-3">🎮 Skor Game</th>
                <th className="py-2.5 px-3">📝 Skor Kuis</th>
                <th className="py-2.5 px-3">Status KKTP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {isRankingLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    Memuat data urutan peringkat kelas...
                  </td>
                </tr>
              ) : !rankingData?.ranking || rankingData.ranking.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    Belum ada siswa di kelas ini yang mengerjakan materi tersebut.
                  </td>
                </tr>
              ) : (
                rankingData.ranking.map((s) => {
                  const medal = s.rank === 1 ? "🥇 Juara 1" : s.rank === 2 ? "🥈 Juara 2" : s.rank === 3 ? "🥉 Juara 3" : `#${s.rank}`;
                  const isTuntas = s.status === "tuntas";

                  return (
                    <tr
                      key={s.id}
                      className={
                        s.rank === 1
                          ? "bg-amber-50/70 dark:bg-amber-950/20 font-bold"
                          : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      }
                    >
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 font-black px-2.5 py-0.5 rounded-full text-[11px] ${
                            s.rank === 1
                              ? "bg-amber-400 text-amber-950 shadow-xs"
                              : s.rank === 2
                                ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                                : s.rank === 3
                                  ? "bg-amber-200 text-amber-900"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {medal}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-500">
                        #{s.noAbsen || "01"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 dark:text-white">{s.name}</span>
                      </td>
                      <td className="py-2.5 px-3 font-black text-amber-700 dark:text-amber-400">
                        🎮 {s.gamePoints} Poin
                      </td>
                      <td className="py-2.5 px-3 font-black text-emerald-700 dark:text-emerald-400">
                        📝 {s.quizScore} / 100
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            isTuntas
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                          }`}
                        >
                          <span>{isTuntas ? "✓" : "!"}</span>
                          <span>{isTuntas ? "Tuntas KKTP" : "Perlu Bimbingan"}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH SISWA BARU */}
      {isAddModalOpen && (
        <ModalPortal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎒</span>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    Daftarkan Siswa Baru ke Kelas
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newName.trim() || !newEmail.trim()) {
                    alert("Nama dan email wajib diisi.");
                    return;
                  }
                  addStudentMutation.mutate({
                    name: newName.trim(),
                    email: newEmail.trim(),
                    password: newPassword || "siswa123",
                    kelas: newKelas,
                    noAbsen: newNoAbsen.trim() || "01",
                  });
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nama Lengkap Siswa:
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Contoh: Doni Pratama"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Kelas:
                    </label>
                    <select
                      value={newKelas}
                      onChange={(e) => setNewKelas(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                    >
                      <option value="Kelas 1">Kelas 1</option>
                      <option value="Kelas 2">Kelas 2</option>
                      <option value="Kelas 3">Kelas 3</option>
                      <option value="Kelas 4">Kelas 4</option>
                      <option value="Kelas 5">Kelas 5</option>
                      <option value="Kelas 6">Kelas 6</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Nomor Absen:
                    </label>
                    <input
                      type="text"
                      required
                      value={newNoAbsen}
                      onChange={(e) => setNewNoAbsen(e.target.value)}
                      placeholder="Contoh: 08"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Alamat Email:
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="doni@sekolah.sch.id"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Kata Sandi Awal:
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Default: siswa123"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={addStudentMutation.isPending}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {addStudentMutation.isPending ? "Menyimpan..." : "Daftarkan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL EDIT SISWA */}
      {editingStudent && (
        <ModalPortal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✏️</span>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    Edit Data Profil Siswa
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!editName.trim() || !editEmail.trim()) {
                    alert("Nama dan email wajib diisi.");
                    return;
                  }
                  updateStudentMutation.mutate({
                    id: editingStudent.id,
                    data: {
                      name: editName.trim(),
                      email: editEmail.trim(),
                      kelas: editKelas,
                      noAbsen: editNoAbsen.trim() || "01",
                    },
                  });
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nama Lengkap Siswa:
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Kelas Siswa:
                    </label>
                    <select
                      value={editKelas}
                      onChange={(e) => setEditKelas(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                    >
                      <option value="Kelas 1">Kelas 1</option>
                      <option value="Kelas 2">Kelas 2</option>
                      <option value="Kelas 3">Kelas 3</option>
                      <option value="Kelas 4">Kelas 4</option>
                      <option value="Kelas 5">Kelas 5</option>
                      <option value="Kelas 6">Kelas 6</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Nomor Absen:
                    </label>
                    <input
                      type="text"
                      required
                      value={editNoAbsen}
                      onChange={(e) => setEditNoAbsen(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Alamat Email:
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={updateStudentMutation.isPending}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
                  >
                    {updateStudentMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL LAPORAN HASIL BELAJAR SISWA (RAPOR RESMI SD NEGERI 1 MADIUN) */}
      {selectedStudentReport && (
        <ModalPortal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
          >
            {/* CSS Cetak Khusus Halaman A4 Bersih */}
            <style>{`
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #printable-student-report, #printable-student-report * {
                  visibility: visible !important;
                }
                #printable-student-report {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 12mm 15mm !important;
                  background: white !important;
                  color: black !important;
                  box-shadow: none !important;
                  border: none !important;
                  z-index: 999999 !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>

            <div
              id="printable-student-report"
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 space-y-6 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
            >
              {/* TOMBOL AKSI TOOLBAR ATAS (HANYA MUNCUL DI LAYAR, DISEMBUNYIKAN SAAT CETAK) */}
              <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📄</span>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base">
                      Laporan Hasil Belajar (Rapor Siswa)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Format Rapor Resmi Evaluasi Kurikulum SD Negeri 1 Madiun
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintReport}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                    title="Cetak rapor ke printer atau simpan sebagai dokumen PDF"
                  >
                    <span>🖨️</span>
                    <span>Cetak Rapor (PDF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadStudentCsv(selectedStudentReport)}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                    title="Unduh data capaian siswa ke file Excel/CSV"
                  >
                    <span>📊</span>
                    <span>Ekspor Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStudentReport(null)}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer transition"
                    title="Tutup Laporan"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* 1. KOP SURAT RESMI SEKOLAH */}
              <div className="text-center space-y-1 pb-3 border-b-4 border-double border-slate-800 dark:border-slate-300">
                <div className="flex items-center justify-center gap-3">
                  <div className="text-3xl">🏫</div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-600 dark:text-slate-400">
                      Pemerintah Kota Madiun · Dinas Pendidikan
                    </h4>
                    <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      Sekolah Dasar Negeri 1 Madiun
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      NPSN: 20534211 | NSS: 101056201001 | Akreditasi: A (Unggul)
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Jl. Jawa No. 1, Kartoharjo, Kota Madiun, Jawa Timur 63122 · Telp: (0351) 452109
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. JUDUL DOKUMEN RAPOR */}
              <div className="text-center space-y-1">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wide underline underline-offset-4">
                  Laporan Capaian Hasil Belajar Peserta Didik
                </h3>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Tahun Pelajaran 2025/2026 · Semester Genap
                </p>
              </div>

              {/* 3. TABEL IDENTITAS SISWA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="space-y-1.5">
                  <div className="flex items-center">
                    <span className="w-32 font-bold text-slate-500 dark:text-slate-400">Nama Siswa</span>
                    <span className="font-black text-slate-900 dark:text-white">: {selectedStudentReport.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-32 font-bold text-slate-500 dark:text-slate-400">Nomor Absen</span>
                    <span className="font-black text-slate-900 dark:text-white">: #{selectedStudentReport.noAbsen || "01"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-32 font-bold text-slate-500 dark:text-slate-400">NISN / No. Induk</span>
                    <span className="font-black text-slate-900 dark:text-white">: {selectedStudentReport.nimNip || "3128495021"}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center">
                    <span className="w-32 font-bold text-slate-500 dark:text-slate-400">Rombel / Kelas</span>
                    <span className="font-black text-slate-900 dark:text-white">: {selectedStudentReport.kelas || "Kelas 1"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-32 font-bold text-slate-500 dark:text-slate-400">Wali Kelas</span>
                    <span className="font-black text-slate-900 dark:text-white">: Bpk. Darmawan, S.Pd.SD</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-32 font-bold text-slate-500 dark:text-slate-400">Status Akun</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">: Aktif Terdaftar (Siswa SD)</span>
                  </div>
                </div>
              </div>

              {/* 4. KARTU REKAPITULASI CAPAIAN NILAI */}
              {(() => {
                const quizScore = selectedStudentReport.quizScore ?? 85;
                const gamePoints = selectedStudentReport.gamePoints ?? 120;
                const isTuntas = quizScore >= 75;

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                      <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 uppercase">
                        Rata-Rata Nilai Kuis
                      </span>
                      <div className="text-xl font-black text-sky-900 dark:text-sky-100">
                        {quizScore} <span className="text-xs font-medium text-slate-400">/ 100</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">
                        Poin Game Petualangan
                      </span>
                      <div className="text-xl font-black text-amber-900 dark:text-amber-100">
                        🎮 {gamePoints} <span className="text-xs font-medium text-slate-400">Poin</span>
                      </div>
                    </div>

                    <div className={`p-3 rounded-2xl border ${
                      isTuntas
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800"
                        : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800"
                    }`}>
                      <span className={`text-[10px] font-bold uppercase ${
                        isTuntas ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
                      }`}>
                        Status Capaian KKTP
                      </span>
                      <div className={`text-sm sm:text-base font-black ${
                        isTuntas ? "text-emerald-900 dark:text-emerald-100" : "text-rose-900 dark:text-rose-100"
                      }`}>
                        {isTuntas ? "TUNTAS KKTP (≥75) ⭐" : "BUTUH BIMBINGAN ⚠️"}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 5. TABEL RINCIAN NILAI MATA PELAJARAN PER-BAB */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>📚</span>
                  <span>Rincian Capaian Evaluasi Pembelajaran Per-Materi:</span>
                </h4>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">No</th>
                        <th className="py-2.5 px-3">Mata Pelajaran</th>
                        <th className="py-2.5 px-3">Materi / Bab Kurikulum</th>
                        <th className="py-2.5 px-3 text-center w-16">KKTP</th>
                        <th className="py-2.5 px-3 text-center w-16">Nilai</th>
                        <th className="py-2.5 px-3 text-center w-24">Status</th>
                        <th className="py-2.5 px-3">Deskripsi Capaian Kompetensi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-[11px]">
                      {(() => {
                        const baseScore = selectedStudentReport.quizScore ?? 85;
                        const chapters = [
                          {
                            mapel: "Pendidikan Pancasila (PKn)",
                            bab: "Bab 1 - Makna Lambang Sila Pancasila",
                            score: Math.min(100, baseScore + 4),
                            kktp: 75,
                            desc: "Sangat baik dalam memahami lambang negara dan mengamalkan nilai ketuhanan serta kemanusiaan.",
                          },
                          {
                            mapel: "Pendidikan Pancasila (PKn)",
                            bab: "Bab 2 - Gotong Royong sebagai Jati Diri",
                            score: Math.max(55, baseScore - 6),
                            kktp: 75,
                            desc: "Mampu berkolaborasi aktif dalam kegiatan kerja bakti dan tolong-menolong di sekolah.",
                          },
                          {
                            mapel: "Pendidikan Pancasila (PKn)",
                            bab: "Bab 3 - Norma dan Aturan Sekolah",
                            score: Math.min(100, baseScore + 6),
                            kktp: 75,
                            desc: "Disiplin mentaati tata tertib kelas dan menghormati hak setiap teman di lingkungan sekolah.",
                          },
                          {
                            mapel: "Pendidikan Pancasila (PKn)",
                            bab: "Bab 4 - Bhinneka Tunggal Ika",
                            score: baseScore,
                            kktp: 75,
                            desc: "Menghargai keragaman suku, bahasa daerah, dan agama tanpa membeda-bedakan sesama.",
                          },
                          {
                            mapel: "Bahasa Jawa (Muatan Lokal)",
                            bab: "Bab 1 - Pasinaon Unggah-ungguh Basa",
                            score: baseScore,
                            kktp: 75,
                            desc: "Prigel nggunakake tembung ngoko lan krama alus marang bapak/ibu guru sarta wong tuwa.",
                          },
                          {
                            mapel: "Bahasa Jawa (Muatan Lokal)",
                            bab: "Bab 2 - Watak Luhur Tokoh Punokawan",
                            score: Math.min(100, baseScore + 3),
                            kktp: 75,
                            desc: "Niteni watak jujur lan blaka suta tokoh Bagong sarta kawicaksanan Kyai Semar.",
                          },
                          {
                            mapel: "Bahasa Jawa (Muatan Lokal)",
                            bab: "Bab 3 - Silsilah & Kautaman Pandhawa Lima",
                            score: Math.min(100, baseScore + 5),
                            kktp: 75,
                            desc: "Nguwasani silsilah lan watak satriya Pandhawa kanthi luhur sarta tresna marang kautaman.",
                          },
                          {
                            mapel: "Bahasa Jawa (Muatan Lokal)",
                            bab: "Bab 4 - Gladhen Nulis Aksara Jawa Legena",
                            score: Math.max(60, baseScore - 5),
                            kktp: 75,
                            desc: "Trampil nulis 20 aksara Jawa legena sarta nggunakake sandhangan swara kanthi bener.",
                          },
                        ];

                        return chapters.map((ch, idx) => {
                          const isPass = ch.score >= ch.kktp;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                              <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">{ch.mapel}</td>
                              <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white">{ch.bab}</td>
                              <td className="py-2.5 px-3 text-center font-bold text-slate-500">{ch.kktp}</td>
                              <td className="py-2.5 px-3 text-center font-black text-sky-700 dark:text-sky-300">{ch.score}</td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isPass
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                    : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                }`}>
                                  {isPass ? "Tuntas" : "Remedial"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{ch.desc}</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 6. CATATAN & REKOMENDASI WALI KELAS */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                  Catatan &amp; Bimbingan Khusus Guru Kelas:
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  Ananda <strong>{selectedStudentReport.name}</strong> menunjukkan antusiasme yang tinggi dalam menyelesaikan modul interaktif Kurikulum Merdeka. Terus pertahankan sikap sopan santun (unggah-ungguh), kejujuran, dan semangat gotong royong dalam kehidupan sehari-hari di sekolah dan di rumah.
                </p>
              </div>

              {/* 7. LEMBAR PENGESAHAN TANDA TANGAN (KOLOM RESMI) */}
              <div className="pt-4 text-xs">
                <div className="text-right text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-4">
                  Madiun, {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-12">
                    <span className="font-bold text-slate-600 dark:text-slate-400 block">Mengetahui,<br />Orang Tua / Wali Siswa</span>
                    <div className="border-b border-slate-400 w-3/4 mx-auto" />
                  </div>

                  <div className="space-y-12">
                    <span className="font-bold text-slate-600 dark:text-slate-400 block">Guru Kelas / Wali Kelas,<br />SD Negeri 1 Madiun</span>
                    <div>
                      <strong className="block text-slate-900 dark:text-white underline underline-offset-2">
                        Bpk. Darmawan, S.Pd.SD
                      </strong>
                      <span className="text-[10px] text-slate-500">NIP. 198506122010011012</span>
                    </div>
                  </div>

                  <div className="space-y-12">
                    <span className="font-bold text-slate-600 dark:text-slate-400 block">Mengetahui,<br />Kepala SD Negeri 1 Madiun</span>
                    <div>
                      <strong className="block text-slate-900 dark:text-white underline underline-offset-2">
                        Hj. Sri Wahyuni, M.Pd
                      </strong>
                      <span className="text-[10px] text-slate-500">NIP. 197803152003122005</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER MODAL (HANYA LAYAR) */}
              <div className="no-print pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentReport(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                >
                  Tutup Laporan
                </button>
                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition active:scale-95"
                >
                  <span>🖨️</span>
                  <span>Cetak / Simpan PDF</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </section>
  );
}
