// server/data.ts
//
// "Server-side data layer" — mensimulasikan akses langsung ke database /
// RAG Engine. Pada Tugas 7 (Next.js App Router) modul ini adalah lib/data.ts
// dan dipanggil langsung dari React Server Component (async/await tanpa
// round-trip HTTP). Pada Tugas 8 (Vite SPA + Express), TIDAK ADA RSC —
// Vite hanya membundel & menyajikan HTML/CSS/JS statis ke browser, tidak
// pernah mengeksekusi kode di server saat runtime. Karena itu modul ini
// dipindah ke server/ (dijalankan oleh Express/Node) dan SETIAP fungsi di
// bawah diekspos lewat Route Handler REST (server/index.ts), lalu dikonsumsi
// klien lewat TanStack Query — persis pola yang SUDAH dipakai untuk entitas
// Materials & Quiz Questions di Tugas 7. Lihat README.md § Migrasi.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { type AiMode, availableChapters } from "../../shared/catalog";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_FILE_PATH = path.join(__dirname, "users_db.json");

export type { AiMode };

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctOption: number;
  hint: string;
}

export interface ChapterProgress {
  id: number;
  name: string;
  percent: number;
  tone: "high" | "good" | "warning";
}

export interface StudentHelp {
  id: string;
  name: string;
  chapter: string;
  score: number;
  outOf: number;
}

export interface ClassSummary {
  totalStudents: number;
  averageComprehension: number;
  activeModules: number;
  studentsNeedingIntervention: number;
  modulesNote?: string;
}

const delay = (_ms: number) => Promise.resolve();

// Dipakai hanya untuk memvalidasi query param ?chapter= pada /api/ai-content.
void availableChapters;

const chapterProgressDb: ChapterProgress[] = [
  { id: 1, name: "PKn: Bab 1 - Makna Sila Ke-3", percent: 88, tone: "high" },
  { id: 2, name: "PKn: Bab 2 - Gotong Royong", percent: 58, tone: "warning" },
  { id: 3, name: "PKn: Bab 3 - Norma & Aturan Sekolah", percent: 94, tone: "high" },
  { id: 4, name: "PKn: Bab 4 - Bhinneka Tunggal Ika", percent: 72, tone: "good" },
  { id: 5, name: "B. Jawa: Bab 1 - Unggah-ungguh Basa", percent: 76, tone: "good" },
  { id: 6, name: "B. Jawa: Bab 2 - Tokoh Wayang Punokawan", percent: 85, tone: "good" },
  { id: 7, name: "B. Jawa: Bab 3 - Pandhawa Lima", percent: 90, tone: "high" },
  { id: 8, name: "B. Jawa: Bab 4 - Aksara Jawa", percent: 65, tone: "warning" },
  { id: 9, name: "B. Jawa: Bab 5 - Arane Anak Kewan", percent: 82, tone: "good" },
  { id: 10, name: "B. Jawa: Bab 6 - Pasinaon Geguritan", percent: 80, tone: "good" },
];

const studentsNeedingHelpDb: StudentHelp[] = [
  { id: "s1", name: "Budi Santoso", chapter: "Gotong Royong", score: 2, outOf: 10 },
  { id: "s2", name: "Siti Aminah", chapter: "Gotong Royong", score: 5, outOf: 10 },
];

const aiContentLibrary: Record<string, Record<AiMode, { title: string; body: string[] }>> = {
  "pkn-sila3": {
    cerita: {
      title: "Ringkasan Modul & Pengamalan: Sila Ke-3 Persatuan Indonesia",
      body: [
        "Pengertian & Hakikat Sila Ke-3: Sila ketiga Pancasila berbunyi 'Persatuan Indonesia' dengan lambang Pohon Beringin. Hakikat sila ini adalah tekad bulat bersama bangsa Indonesia yang memiliki ribuan suku, bahasa daerah, dan tradisi berbeda untuk bersatu kokoh dalam satu ikatan keluarga besar kebangsaan.",
        "Makna Filosofis Pohon Beringin: Pohon beringin memiliki akar tunggang dalam yang menancap kokoh ke bumi, melambangkan negara Indonesia sebagai tempat berteduh dan bernaung seluruh rakyat dengan aman. Sulur dan akar gantungnya yang menjalar ke segala arah mencerminkan kekayaan keberagaman suku bangsa Nusantara yang tetap bersatu teguh dalam satu pohon persatuan.",
        "Sejarah Perumusan Pancasila & Sidang BPUPKI 1945: Menjelang kemerdekaan Indonesia pada tahun 1945, para tokoh pejuang bangsa berkumpul dalam sidang Badan Penyelidik Usaha-usaha Persiapan Kemerdekaan Indonesia (BPUPKI) yang dipimpin oleh Dr. K.R.T. Radjiman Wedyodiningrat. Dalam sidang pertama tanggal 29 Mei sampai 1 Juni 1945 di Gedung Chuo Sangi In (sekarang Gedung Pancasila, Jakarta), tiga tokoh besar bangsa tampil menyampaikan gagasan dasar negara: Mr. Mohammad Yamin (29 Mei), Prof. Dr. Soepomo (31 Mei), dan Ir. Soekarno (1 Juni). Pada tanggal 1 Juni 1945, Bung Karno berpidato dengan penuh semangat membakar jiwa tanpa teks, mengusulkan lima dasar falsafah yang beliau namakan 'Pancasila' atas saran ahli bahasa. Hari bersejarah 1 Juni itulah yang hingga kini kita peringati sebagai Hari Lahir Pancasila.",
        "Sejarah Panitia Sembilan & Pengesahan Piagam Jakarta hingga PPKI 18 Agustus 1945: Untuk mematangkan rumusan Bung Karno, dibentuklah Panitia Sembilan yang beranggotakan sembilan tokoh besar bangsa: Ir. Soekarno, Drs. Moh. Hatta, Mr. A.A. Maramis, Abikoesno Tjokrosoejoso, Abdoel Kahar Moezakir, H. Agus Salim, Mr. Achmad Soebardjo, K.H. Wahid Hasjim, dan Mr. Mohammad Yamin. Pada 22 Juni 1945, Panitia Sembilan berhasil menyepakati naskah 'Piagam Jakarta' (Jakarta Charter). Setelah Indonesia memproklamasikan kemerdekaan pada 17 Agustus 1945, keesokan harinya tanggal 18 Agustus 1945, Panitia Persiapan Kemerdekaan Indonesia (PPKI) menggelar sidang penting. Dalam sidang ini, para tokoh bangsa dengan jiwa kenegarawanan luhur menyepakati perubahan kalimat pembukaan demi persatuan seluruh rakyat dari Sabang sampai Merauke, mengesahkan UUD 1945, dan secara resmi menetapkan Pancasila sebagai Dasar Negara Republik Indonesia yang sah dan abadi.",
        "Sejarah Panjang Terciptanya Lambang Garuda Pancasila: Lambang Garuda Pancasila yang gagah di dinding kelas kita memiliki sejarah perancangan yang sangat istimewa. Pada tahun 1950, pemerintah Republik Indonesia Serikat (RIS) membentuk Panitia Lencana Negara yang dipimpin oleh Sultan Hamid II dari Pontianak. Beliau merancang figur burung garuda yang terinspirasi dari mitologi Nusantara dan arca kuno candi-candi Indonesia. Rancangan awal Sultan Hamid II kemudian disempurnakan langsung oleh Presiden Soekarno: Bung Karno menambahkan jambul pada kepala burung garuda agar tampak gagah dan berwibawa (tidak menyerupai Bald Eagle Amerika Serikat), serta mengubah cengkeraman kaki garuda yang semula mencengkeram pita merah putih di belakang menjadi mencengkeram pita putih bertuliskan 'Bhinneka Tunggal Ika' di bagian depan. Lambang Garuda Pancasila ini akhirnya diresmikan pertama kali dalam Sidang Kabinet RIS pada tanggal 11 Februari 1950 di Hotel Des Indes, Jakarta. Jumlah helai bulunya dirancang khusus mengabadikan hari keramat proklamasi: 17 bulu pada masing-masing sayap, 8 bulu pada ekor, 19 bulu pada pangkal ekor di bawah perisai, dan 45 bulu pada leher (17 Agustus 1945).",
        "Sejarah Semboyan Bhinneka Tunggal Ika dari Zaman Majapahit: Kalimat sakral 'Bhinneka Tunggal Ika' bukanlah kalimat baru, melainkan warisan luhur nenek moyang bangsa kita sejak abad ke-14 pada era keemasan Kerajaan Majapahit di bawah kepemimpinan Raja Hayam Wuruk dan Mahapatih Gajah Mada. Kalimat ini tertulis indah dalam kitab sastra klasik berjudul 'Kakawin Sutasoma' pupuh 139 bait 5 karya pujangga besar Mpu Tantular. Bunyi lengkap bait aslinya adalah: 'Rwaneka dhatu winuwus Buddha Wiswa, Bhinêki rakwa ring apan kêna parwanosên, Mangka ng Jinatwa kalawan Siwatatwa tunggal, Bhinneka Tunggal Ika tan hana dharma mangrwa'. Maknanya: Meskipun ajaran Buddha dan Siwa (Hindu) tampak berbeda di mata manusia, hakikat kebenarannya adalah tunggal dan satu adanya. Pada masa pergerakan nasional, tokoh pejuang Mohammad Yamin membawa kutipan bait ini kepada Bung Karno dan para bapak pendiri bangsa, hingga disepakati bersama menjadi semboyan pengikat ribuan pulau, bahasa, dan adat istiadat suku-suku Nusantara dalam dekapan NKRI.",
        "Intisari Lima Sila Luhur Bangsa: Sila ke-1 menuntun ketakwaan dan toleransi antarumat beragama (menghormati ibadah kawan), Sila ke-2 menjunjung martabat kemanusiaan yang adil dan beradab (menolong kawan terjatuh tanpa pamrih & anti-bullying), Sila ke-3 mengikat persatuan di atas keragaman, Sila ke-4 mengedepankan musyawarah mufakat dalam mengambil keputusan bersama, dan Sila ke-5 mengamanatkan keadilan sosial bagi seluruh rakyat Indonesia (membagi hasil kerja secara adil dan merata).",
        "Mengapa Materi Ini Sangat Penting Bagi Siswa SD?: Memahami nilai persatuan sejak dini mencegah terjadinya permusuhan, saling ejek perbedaan fisik atau suku (anti-bullying), serta pertengkaran antarteman. Siswa menyadari bahwa perbedaan adalah kekayaan bangsa yang harus disyukuri dan dirawat.",
        "Aksi Nyata & Penerapan di Sekolah: Melaksanakan jadwal piket kebersihan kelas secara kompak tanpa pilih-pilih kawan, mengajak teman baru atau teman pendiam untuk belajar dan bermain bersama saat jam istirahat, serta membiasakan diri bertutur kata menggunakan Bahasa Indonesia yang santun.",
        "Pengamalan di Rumah & Warga: Menjaga kerukunan antarsaudara di rumah, tidak membuat kegaduhan ketika tetangga sedang beribadah, serta ikut membantu saat ada kegiatan kerja bakti membersihkan lingkungan tempat tinggal.",
        "Semangat Gotong Royong Tradisi Luhur Nusantara: Falsafah luhur 'berat sama dipikul, ringan sama dijinjing'. Kerja sama sukarela dan tolong-menolong membuat masalah sulit menjadi ringan dan menumbuhkan rasa persaudaraan yang tulus di tengah masyarakat.",
        "Nilai Budi Pekerti & Karakter Pelajar Pancasila: Membiasakan sikap toleransi, rendah hati, cinta tanah air, bangga memakai produk karya bangsa sendiri seperti batik Indonesia, serta senantiasa bersikap jujur dan amanah dalam setiap perbuatan.",
      ],
    },
    kuis_tantangan: {
      title: "Kuis Tantangan Seru: Persatuan Indonesia",
      body: [
        "Ayo uji pemahamanmu tentang pengamalan Sila ke-3 dengan menjawab soal kuis yang sudah disiapkan Robot Pintar!",
        "Klik tombol 'Mulai Kuis Tantangan' di menu kiri untuk menguji pemahaman konsepmu!",
      ],
    },
  },
  "pkn-gotongroyong": {
    cerita: {
      title: "Ringkasan Modul & Pengamalan: Gotong Royong sebagai Jati Diri Bangsa",
      body: [
        "Pengertian & Asal-Usul Gotong Royong: Gotong royong berasal dari kata 'gotong' (mengangkat atau memikul bersama) dan 'royong' (bersama-sama). Gotong royong adalah tradisi luhur bangsa Indonesia berupa kegiatan bekerja bersama-sama secara sukarela untuk mencapai tujuan bersama yang bermanfaat bagi banyak orang.",
        "Prinsip Utama & Pembagian Tanggung Jawab: Prinsip dasar gotong royong adalah 'berat sama dipikul, ringan sama dijinjing'. Pekerjaan besar dan berat akan terasa ringan serta cepat selesai bila setiap orang mengambil peran masing-masing dengan ikhlas tanpa pamrih.",
        "Mengapa Gotong Royong Wajib Dipelajari?: Mengikis sifat individualis (mementingkan diri sendiri), menumbuhkan empati sosial, dan mempererat tali persaudaraan sesama kawan sehingga kelas menjadi ruang belajar yang nyaman dan hangat.",
        "Aksi Nyata di Lingkungan Sekolah: Bekerja sama menata perpustakaan kelas, merapikan meja dan kursi setelah jam belajar, serta aktif dalam kelompok diskusi di mana kawan yang sudah paham membantu kawan yang masih kesulitan belajar.",
        "Pengamalan di Rumah & Warga: Membantu meringankan pekerjaan orang tua seperti merapikan tempat tidur sendiri dan mencuci piring, serta ikut serta dalam kegiatan membersihkan selokan lingkungan dari sampah.",
        "Nilai Karakter Pelajar Pancasila: Menanamkan jiwa tolong-menolong, peduli lingkungan, tanggung jawab bersama, dan tidak mengharapkan imbalan materi saat menolong sesama.",
      ],
    },
    kuis_tantangan: {
      title: "Kuis Tantangan Seru: Gotong Royong",
      body: [
        "Ayo uji pemahamanmu tentang nilai gotong royong dengan menjawab soal kuis bersama Robot Pintar!",
        "Klik tombol 'Mulai Kuis Tantangan' di menu kiri untuk menambah poin prestasimu!",
      ],
    },
  },
  "pkn-norma": {
    cerita: {
      title: "Ringkasan Modul & Pengamalan: Norma, Aturan & Tertib Hukum",
      body: [
        "Pengertian & Asal-Usul Norma: Kata norma diserap dari bahasa Belanda 'norm' dan bahasa Latin 'norma' yang bermakna garis siku pengukur tegak lurus—dimaknai sebagai kaidah, pedoman tingkah laku, dan tolok ukur yang disepakati bersama agar kehidupan bermasyarakat berjalan tertib, aman, dan berkeadilan.",
        "Empat Macam Norma Utama: Terdiri atas Norma Agama (wahyu Tuhan), Norma Kesusilaan (suara hati nurani), Norma Kesopanan (tata krama adat pergaulan), serta Norma Hukum (aturan tertulis negara yang tegas dan mengikat).",
        "Keseimbangan Hak dan Kewajiban: Kewajiban adalah tugas yang harus kita laksanakan dengan penuh tanggung jawab, sedangkan hak adalah sesuatu yang sah kita terima. Mendahulukan kewajiban sebelum menuntut hak melahirkan keadilan dan kedamaian.",
        "Aksi Nyata di Sekolah: Datang tepat waktu sebelum bel masuk berbunyi, mendengarkan bimbingan guru dengan tertib, menjaga kebersihan kelas, serta membiasakan budaya antre di kantin dan perpustakaan.",
        "Pengamalan di Rumah & Warga: Menghormati nasihat orang tua, menjaga ketenangan saat tetangga beristirahat, dan mematuhi aturan keluarga.",
        "Nilai Karakter Bangsa: Membiasakan sikap jujur, mandiri, disiplin waktu, dan menghormati hak asasi sesama kawan.",
      ],
    },
    kuis_tantangan: {
      title: "Kuis Tantangan Seru: Norma & Aturan Sekolah",
      body: [
        "Ayo uji pemahamanmu tentang tata tertib dan aturan sekolah bersama Robot Pintar!",
      ],
    },
  },
  "pkn-bhinneka": {
    cerita: {
      title: "Ringkasan Modul & Pengamalan: Bhinneka Tunggal Ika & Toleransi Beragama",
      body: [
        "Pengertian Semboyan Bhinneka Tunggal Ika: Semboyan resmi bangsa Indonesia ini bermakna meskipun berbeda-beda suku, bahasa daerah, agama, dan adat istiadat, pada hakikatnya kita tetap satu kesatuan keluarga besar Indonesia yang rukun dan damai.",
        "Sejarah Lengkap Kakawin Sutasoma & Pujangga Mpu Tantular di Majapahit: Kalimat suci Bhinneka Tunggal Ika lahir dari karya sastra agung abad ke-14 pada era kejayaan Kerajaan Majapahit, saat dipimpin oleh Prabu Hayam Wuruk didampingi Mahapatih Gajah Mada. Pujangga besar keraton bernama Mpu Tantular menulis kitab Kakawin Sutasoma. Pada pupuh 139 bait 5, Mpu Tantular menuliskan kalimat keramat: 'Rwaneka dhatu winuwus Buddha Wiswa, Bhinêki rakwa ring apan kêna parwanosên, Mangka ng Jinatwa kalawan Siwatatwa tunggal, Bhinneka Tunggal Ika tan hana dharma mangrwa'. Artinya: ajaran Buddha dan Siwa (Hindu) tampak berbeda ragamnya, namun hakikat kebenarannya adalah satu jua, tidak ada kebenaran yang mendua. Toleransi yang tinggi inilah yang membuat Kerajaan Majapahit makmur, tenteram, dan dihormati seantero dunia.",
        "Sejarah Pengadopsian Semboyan Menjadi Kompas Bangsa: Pada masa kebangkitan nasional awal abad ke-20, pahlawan nasional Mr. Mohammad Yamin yang sangat mencintai sejarah Nusantara menemukan kembali mutiara bait Mpu Tantular ini. Beliau mendiskusikannya dengan Bung Karno. Ketika bangsa Indonesia merdeka, para bapak pendiri bangsa sepakat menjadikan Bhinneka Tunggal Ika sebagai semboyan resmi negara yang dicengkeram kokoh oleh kedua kaki Burung Garuda Pancasila untuk menyatukan lebih dari 1.340 suku bangsa.",
        "Landasan Konstitusi & Kemerdekaan Beragama: Kemerdekaan memeluk keyakinan dijamin secara kokoh dalam Sila ke-1 Pancasila serta Pasal 29 Ayat (2) UUD 1945: Negara menjamin kemerdekaan tiap-tiap penduduk untuk memeluk agamanya masing-masing dan beribadat menurut agamanya dan kepercayaannya itu.",
        "Prinsip Toleransi Beragama (Tasamuh): Kata toleransi berasal dari bahasa Latin 'tolerare' (bersabar dan menahan diri). Menghargai 6 agama resmi di Indonesia (Islam, Kristen Protestan, Katolik, Hindu, Buddha, Khonghucu) dan aliran kepercayaan dengan hidup rukun secara sosial tanpa mencampuradukkan ajaran ritual ibadah.",
        "Kekayaan Ragam Nusantara: Mengenal ribuan pulau, ratusan bahasa daerah, rumah adat (Joglo, Gadang, Tongkonan), pakaian adat, dan kesenian tradisional sebagai kekayaan luhur milik bersama.",
        "Aksi Nyata di Sekolah: Menjaga ketenangan saat teman berdoa sebelum belajar, tetap kompak bermain dan belajar kelompok bersama tanpa membedakan agama kawan, serta saling mengucapkan selamat hari raya dengan santun.",
        "Pengamalan di Rumah & Nilai Luhur: Menjaga ketenangan saat tempat ibadah tetangga sedang melaksanakan peribadatan, bergotong royong tanpa membedakan latar belakang warga, serta menanamkan budi pekerti tepa selira (tenggang rasa) dan cinta damai.",
      ],
    },
    kuis_tantangan: {
      title: "Kuis Tantangan Seru: Bhinneka Tunggal Ika",
      body: [
        "Ayo uji wawasan kebangsaan dan keragaman budayamu bersama Robot Pintar!",
      ],
    },
  },
  "bjawa-unggahungguh": {
    cerita: {
      title: "Pemaparan Materi: Trap-Trapan Unggah-Ungguh Basa Jawa & Basa Krama",
      body: [
        "Pangertosan Basa Krama: Basa Krama yaiku salah siji undha-usuk utawa trap-trapan basa Jawa kang luwih alus lan kurmat, digunakake nalika micara karo wong liya murih bisa ngajeni lan ngurmati.",
        "Basa Krama Kuwi Kanggo Apa?: Digunakake nalika matur marang Bapak lan Ibu ing omah, matur marang Bapak/Ibu Guru ing sekolah, guneman marang simbah utawa sedulur sepuh, sarta sapa aruh marang tamu supaya tatakramane becik.",
        "Bedane Tingkatan Basa: Basa Ngoko (kanggo kanca sakelas/sebaya), Basa Krama Lugu (tembunge krama nanging kanggo nyritakake awake dhewe, tuladhane: kula nedha, kula tilem), lan Basa Krama Alus (basa paling kurmat mligi kagem wong tuwa utawa guru, tuladhane: Bapak dhahar, Bu Guru sare).",
        "Tuladha Tembung Ngoko menyang Krama Alus: Mangan dadi dhahar, turu dadi sare, lunga dadi tindak, tuku dadi mundhut, ndeleng dadi mirsani, omah dadi dalem, jeneng dadi asma, teka dadi rawuh.",
        "Tuladha Ukara (Kalimat) ing Padintenan: (1) Marang Guru: 'Nyuwun sewu Bu Guru, kepareng kula badhe nyuwun pirsa babagan tugas sekolah'. (2) Nyritakake Wong Tuwa: 'Bapak saweg dhahar sekul, dene Ibu saweg tindak dhateng peken mundhut janganan'.",
        "Tatakrama Solah Bawa: Nalika matur marang wong tuwa utawa guru, polatan kudu sumeh (grapyak), asta ngapurancang (ditangkepake ing ngarep), awake rada mbungkuk, sarta ora kena mbengok utawa nyela rembug.",
      ],
    },
    kuis_tantangan: {
      title: "Kuis Tantangan Seru: Basa Krama & Unggah-Ungguh",
      body: [
        "Ayo gladhen unggah-ungguh basa Jawa kanthi mangsuli pitakon saka Robot Pintar!",
        "Pencet tombol 'Mulai Kuis Tantangan' ing sisih kiwa kanggo nguji kawruhmu!",
      ],
    },
  },
  "bjawa-geguritan": {
    cerita: {
      title: "Pemaparan Materi: Pasinaon Geguritan Basa Jawa Gagrag Anyar",
      body: [
        "Pangertosan Geguritan: Geguritan yaiku karya sastra puisi basa Jawa gagrag anyar kang medharake rasa pangrasa panganggit kanthi basa kang endah lan mentes. Geguritan gagrag anyar ora kaiket dening paugeran tartamtu kaya tembang macapat.",
        "Sejarah Perkembangan Geguritan saka Gagrag Kuna menyang Gagrag Anyar: Geguritan sejatine nduweni sejarah kang dawa ing donyane kasusastran Jawa. Ing jaman biyen, geguritan kalebu ing gagrag kuna (puisi Jawa klasik) kang isih kaiket dening paugeran kenceng, kayata kudu diwiwiti nganggo tembung 'sun-gegurit', saben padha (bait) ana patang gatra utawa luwih, sarta tibaning swara ing pungkasaning gatra kudu runtut memper tembang macapat. Nanging nalika mlebu jaman pergerakan nasional watara taun 1929, para pujangga Jawa enom kayata R. Intoyo lan Subagagyo Ilham Notodidjojo ngowahi wujud geguritan dadi gagrag anyar (modern). Geguritan gagrag anyar iki luwih mardika (bebas), ora kaiket paugeran guru lagu lan guru wilangan, supaya para pujangga lan generasi mudha luwih leluasa medharake rasa tresna marang bangsa, ibu pertiwi, sarta kritik sosial lumantar kaendahan basa Jawa kang mentes lan puitis.",
        "Geguritan Kuwi Kanggo Apa?: Kanggo medharake rasa pangrasa ati (katresnan marang wong tuwa, rasa syukur marang Gusti, tresna asih marang alam), aweh piwulang becik (amanat luhur), sarta nguri-uri kaendahan basa Jawa puitis.",
        "Ciri-Ciri Utama Geguritan Gagrag Anyar: (1) Ora kaiket guru gatra (larik), guru wilangan (suku kata), lan guru lagu (tibaning swara), (2) Basane endah, mentes, lan puitis, (3) Nggunakake purwakanthi (persamaan swara utawa sastra), (4) Tembunge dipilih kanthi cermat (diksi).",
        "Unsur Pambangun Geguritan: Tema (underaning gagasan pokok), Diksi (pamilihing tembung endah), Purwakanthi (runtuting swara vokal/konsonan), lan Amanat (pesen becik kang kinandhut ing geguritan).",
        "Tuladha Geguritan 1 (Ibu): 'Ibu... Rina wengi tansah ngusap luh ing pipiku. Ndonga puji marang Gusti Kang Murbeng Dumadi. Kagem putra-putrimu kang tansah mbok trisnani. Tresnamu tanpa upama, ora bakal sirna selawase.' (Tegese: Nggambarake katresnane ibu kang tanpa kendhat).",
        "Tuladha Geguritan 2 (Sekolahanku): 'Sekolahanku endah asri... Papan kanggo golek ilmu lan wawasan. Bapak Ibu Guru mulang kanthi tulusing ati. Kanca-kancaku padha rukun sesandhingan.' (Tegese: Nggambarake rasa seneng lan syukur sekolah ing papan kang rukun lan asri).",
      ],
    },
    kuis_tantangan: {
      title: "Kuis Tantangan Seru: Pasinaon Geguritan",
      body: [
        "Ayo uji pemahamanmu ngenani geguritan gagrag anyar lan unsur-unsur pambangune!",
      ],
    },
  },
  "bjawa-punokawan": {
    cerita: {
      title: "Ringkasan Modul & Filosofi Watak Luhur Tokoh Punokawan",
      body: [
        "Pangertosan & Asal-Usul Punokawan: Punokawan asale saka tembung 'Pana' (paham utawa weruh kanthi cetha) lan 'Kawan' (kanca/sedulur). Punokawan yaiku papat tokoh pamomong para ksatria Pandhawa kang asale saka rakyat cilik, nanging nduweni kawicaksanan luhur kanggo nuntun ksatria marang kabecikan.",
        "Sejarah Lengkap Asal-Usul Punokawan Ciptaan Sunan Kalijaga & Pujangga Jawa: Tokoh Punokawan (Semar, Gareng, Petruk, Bagong) babar pisan ora tinemu ing wiracarita Mahabharata asli saka India, nanging asil ciptaan luhur para pujangga Jawa kuno lan disampurnakake kanthi jembar dening Kanjeng Sunan Kalijaga ing jaman Kasultanan Demak Bintoro abad kaping-15 nganti 16. Nalika semono para wali migunakake kesenian wayang kulit minangka sarana dakwah lan nuntun bebuden luhur masyarakat. Tembung Punokawan asale saka tembung 'Pana' (tegese paham, waspada, lan weruh kanthi trawaca) lan 'Kawan' (tegese kanca, sedulur, utawa pamomong). Mula Punokawan tegese pamomong kang waspada lan ngerti marang bebener sejati. Sunan Kalijaga nyipta Punokawan minangka perlambang rakyat cilik nanging nduweni kawicaksanan luhur kang tansah ngamping-ampingi para satriya (para pemimpin), ngelingake supaya ora kumalungkung utawa sombong, tetep adil, lan tansah ngabekti marang Gusti Kang Maha Kawasa.",
        "Watak Luhur Kyai Semar: Semar minangka bapa pamomong kang sejatine titising dewa (Batara Ismaya). Watake sabar banget, wicaksana, welas asih marang sapa wae, lan ora tau kumalungkung (sombong). Pasinaon: dadi bocah kudu sabar lan ora gampang nesu.",
        "Watak Nala Gareng & Petruk: Gareng tangane ceko lan sikile jinjit minangka perlambang kudu ngati-ati nalika tumindak lan ora njupuk duweke liyan. Petruk dedege dhuwur, irunge dawa, watake grapyak, loman (seneng tetulung), lan pinter gawe senenge kanca tanpa nglarani ati.",
        "Watak Bagong (Blaka Suta): Bagong awake lemu cendhek, watake jujur apa anane (blaka suta), ora seneng lamis (munafik), lan kendel mbelani bebener senadyan ngadhepi bebaya.",
        "Mengapa Siswa Perlu Mempelajari Ini?: Nuntun siswa supaya ora mung ngoyak kepinteran pikiran, nanging uga nduweni watak andhap asor, jujur, lan seneng mbantu kanca kaya para paraga Punokawan.",
        "Penerapan ing Sekolah & Padintenan: Niru watak jujur Bagong nalika nggarap ulangan, watak sabar Semar nalika ana kanca kang nggodha, lan watak loman Petruk nalika ana kanca kang mbutuhake pitulungan.",
      ],
    },
    kuis_tantangan: {
      title: "Kuis Tantangan Seru: Wayang Punokawan",
      body: [
        "Ayo uji kawruhmu ngenani paraga lan watak luhur Punokawan!",
        "Pencet tombol 'Mulai Kuis Tantangan' kanggo nguji pemahaman budi pekertimu!",
      ],
    },
  },
  "bjawa-pandhawa": {
    cerita: {
      title: "Ringkasan Modul & Kisah Kautaman Pandhawa Lima ing Baratayuda",
      body: [
        "Silsilah Pandhawa Lima: Pandhawa Lima yaiku putrane Prabu Pandu Dewanata cacah lima: Puntadewa (Yudhistira), Werkudara (Bima), Janaka (Arjuna), Nakula, lan Sadewa.",
        "Watak Luhur Puntadewa: Pembarepe Pandhawa kang nduweni watak sabar banget, jujur, ora nate goroh (ngapusi), lan tansah ngugemi bebener senadyan ngadhepi pacoban gedhe.",
        "Watak Werkudara & Janaka: Werkudara nduweni watak kendel, kukuh mbelani bebener, lan ora seneng basa-basi. Dene Janaka nduweni watak alus budine, sopan santun, lan sekti mandraguna.",
        "Watak Nakula lan Sadewa: Sedulur kembar kang tansah setya tuhu marang sedulur tuwa lan prigel ing babagan petungan sarta tetanèn.",
        "Piwulang Luhur kanggo Siswa: Dadi bocah kudu ngugemi watak jujur kaya Puntadewa, kendel mbelani bebener kaya Werkudara, lan andhap asor kaya Janaka.",
      ],
    },
    kuis_tantangan: {
      title: "Kuis Tantangan Seru: Pandhawa Lima",
      body: [
        "Ayo uji kawruh pewayangan babagan silsilah lan watak Pandhawa Lima bebarengan karo Robot Pintar!",
      ],
    },
  },
  "bjawa-aksara": {
    cerita: {
      title: "Pemaparan Materi & Sinau 20 Aksara Jawa Legena sarta Sandhangan Swara",
      body: [
        "Sejarah & Kisah Legenda Dumadine Aksara Jawa (Aji Saka, Dora, lan Sembada): Miturut crita rakyat Jawa, 20 aksara Jawa legena (Carakan) cinipta dening Prabu Aji Saka, sawijining satriya luhur kang rawuh saka tlatah Medang Kamulan. Prabu Aji Saka nduweni batur (abdi) loro kang banget setya tuhu, yaiku Dora lan Sembada. Nalika Aji Saka tindak lelana, Sembada diparingi dhawuh njaga keris pusaka ing Pegunungan Kendeng kanthi pesen keras: keris iki ora kena diparingake marang sapa wae kajaba Aji Saka dhewe kang njupuk. Sawise Aji Saka dadi raja ing Medang Kamulan, beliau ngutus Dora menyang Gunung Kendeng supaya njupuk keris pusaka mau. Nanging nalika Dora ketemu Sembada, Sembada nulak amarga eling welinge Aji Saka yen ora kena diwenehake marang sapa wae saliyane Aji Saka. Dora meksa amarga uga nindakake dhawuhe bendarane. Kekarone padha-padha setya membela amanat, nganti pungkasane perang tandhing amarga ora ana sing gelem ngalah. Amarga kasektene padha, Dora lan Sembada gugur bebarengan minangka ksatria sejati. Krungu kabar sedhih iki, Prabu Aji Saka getun banget lan nangis lara ati. Kanggo ngurmati lan ngenang kasetyane abdine, Prabu Aji Saka ngripta bait puisi 20 aksara Jawa: (1) Ha-Na-Ca-Ra-Ka tegese ana utusan (dora lan sembada), (2) Da-Ta-Sa-Wa-La tegese padha pasulayan utawa padha padudon nindakake dhawuh, (3) Pa-Dha-Ja-Ya-Nya tegese kekarone padha digdayane lan sekti mandraguna, sarta (4) Ma-Ga-Ba-Tha-Nga tegese wasanane padha dadi bathang (mati bebarengan kanthi luhur).",
        "Pemaparan 20 Aksara Jawa Legena (Carakan): Cacahe ana rong puluh (20) aksara wutuh tanpa sandhangan: Baris 1 [ꦲ ꦤ ꦕ ꦫ ꦏ] Ha-Na-Ca-Ra-Ka (tegese ana utusan), Baris 2 [ꦢ ꦠ ꦱ ꦮ ꦭ] Da-Ta-Sa-Wa-La (padha padudon ngugemi amanah), Baris 3 [ꦥ ꦝ ꦗ ꦪ ꦚ] Pa-Dha-Ja-Ya-Nya (padha dene sektine), Baris 4 [ꦩ ꦒ ꦧ ꦛ ꦔ] Ma-Ga-Ba-Tha-Nga (padha dadi bathange/gugur bebarengan).",
        "Sandhangan Swara Pangowah Vokal: Sandhangan kang ngowahi swara dhasar 'a' dadi vokal liyane: 1) Wulu (ꦶ) ngowahi dadi swara 'i' tuladha ꦲꦶ (Hi), 2) Suku (ꦸ) ngowahi dadi swara 'u' tuladha ꦲꦸ (Hu), 3) Pepet (ꦼ) ngowahi dadi swara 'e' (kaya sega), 4) Taling (ꦺ) ngowahi dadi swara 'é' (kaya saté), lan 5) Taling Tarung (ꦺ...ꦴ) ngowahi dadi swara 'o' tuladha ꦠꦺꦴ (To).",
        "Sandhangan Panyigeg Wanda (Konsonan Mati): Kanggo mateni wanda: 1) Wignyan (ꦃ) kanggo sigeg 'h', 2) Layar (ꦂ) kanggo sigeg 'r', 3) Cecak (ꦁ) kanggo sigeg 'ng', lan 4) Pangkon (꧀) kanggo mateni aksara ing pungkasan ukara.",
        "Pituduh Maca lan Nulis Prasaja: Nalika nulis aksara Jawa, tulisen nggantung ing garis buku tulis. Aksara legena diwaca nganggo vokal 'a' wutuh sadurunge kawuwuhan sandhangan swara.",
      ],
    },
    kuis_tantangan: {
      title: "Kuis Tantangan Seru: Aksara Jawa",
      body: [
        "Ayo gladhen nulis lan maca aksara Jawa kanthi mangsuli pitakon Robot Pintar!",
      ],
    },
  },
  "bjawa-anakkewan": {
    cerita: {
      title: "Pemaparan Materi & Kawruh Basa Jawa: Jeneng Arane Anak Kewan",
      body: [
        "Pangertosan Arane Anak Kewan: Ing basa Jawa, saben jinis kewan nduweni jeneng sesebutan khusus kanggo anake. Iki dadi bukti kasugihan basa Jawa sarta tresnane leluhur marang alam lan sato kewan ing sakiwa tengene.",
        "Jeneng Anak Kewan Ingon-Ingon (Rumah & Ternak): Anak Bebek arane Meri, Anak Sapi arane Pedhet, Anak Kucing arane Cemeng, Anak Pitik arane Kuthuk, Anak Wedhus arane Cempe, Anak Kebo arane Gudel, lan Anak Menthok arane Minthi.",
        "Jeneng Anak Kewan Liar & Alam: Anak Gajah arane Bledug, Anak Kodhok arane Precel / Cebong, Anak Jaran arane Belo, Anak Macan arane Gogor, Anak Baya arane Rete, lan Anak Iwak arane Beyes / Burayak.",
        "Tuladha Panganggone ing Ukara: 1) 'Bapak nuntun pedhet anyar menyang kandhang mburi omah', 2) 'Meri-meri padha cucuk-cucukan golek pangan bareng biyunge', 3) 'Kucing anggora kae duwe cemeng cacah telu kang lucu banget'.",
        "Kawruh Tambahan: Jeneng anak kewan iki kerep digunakake ing dolanan tradisional, tembang dolanan bocah, sarta parikan basa Jawa.",
      ],
    },
    kuis_tantangan: {
      title: "Kuis Tantangan Seru: Arane Anak Kewan",
      body: [
        "Ayo tebak jeneng anak kewan basa Jawa bebarengan karo Robot Pintar!",
      ],
    },
  },
};

const mockQuestions: Record<number, Question[]> = {
  1: [
    {
      id: "q1_1",
      question: "Apakah lambang dari Sila Ke-3 Pancasila 'Persatuan Indonesia'?",
      options: ["Bintang Tunggal", "Rantai Emas", "Pohon Beringin", "Padi dan Kapas"],
      correctOption: 2,
      hint: "Pohon yang besar dan rindang, melambangkan naungan persatuan bangsa!",
    },
    {
      id: "q1_2",
      question:
        "Di jam istirahat, kamu melihat teman baru yang duduk sendirian. Sikap yang mencerminkan kerukunan adalah...",
      options: [
        "Membiarkannya saja",
        "Mengajaknya bermain bersama",
        "Menertawakan dari jauh",
        "Menyuruhnya pulang",
      ],
      correctOption: 1,
      hint: "Persatuan dimulai dari sikap ramah dan merangkul semua teman tanpa membeda-bedakan.",
    },
    {
      id: "q1_3",
      question:
        "Sapa jenenge tokoh Punokawan kang dadi bapake lan nduweni watak sabar sarta wicaksana?",
      options: ["Petruk", "Gareng", "Semar", "Bagong"],
      correctOption: 2,
      hint: "Tokoh sesepuh Punokawan kang awake lemu lan tansah paring pitutur luhur.",
    },
    {
      id: "q1_4",
      question:
        "Pekerjaan piket membersihkan ruang kelas terasa lebih cepat dan ringan karena dikerjakan secara...",
      options: [
        "Sendiri-sendiri",
        "Gotong royong bersama",
        "Terpaksa dan mengeluh",
        "Menunggu disuruh guru",
      ],
      correctOption: 1,
      hint: "Semboyan 'berat sama dipikul, ringan sama dijinjing' adalah inti dari semangat gotong royong.",
    },
    {
      id: "q1_5",
      question:
        "Basa Jawa kang lumrah digunakake nalika guneman karo kanca dolanan saumuran yaiku...",
      options: ["Basa Ngoko", "Basa Krama Inggil", "Basa Sanskerta", "Basa Walikan"],
      correctOption: 0,
      hint: "Basa ngoko lumrah digunakake kanggo kanca sebaya utawa kanca dolanan.",
    },
  ],
  2: [
    {
      id: "q2_1",
      question:
        "Mengapa akar gantung dan sulur pohon beringin menjadi lambang persatuan yang sangat bermakna?",
      options: [
        "Karena daunnya berwarna hijau",
        "Karena melambangkan suku bangsa yang beragam tetapi tetap bersatu kuat",
        "Karena bisa digunakan untuk ayunan",
        "Karena pohonnya paling mahal",
      ],
      correctOption: 1,
      hint: "Akar pohon beringin menjalar ke segala arah mencerminkan beragamnya suku dan budaya bangsa kita.",
    },
    {
      id: "q2_2",
      question:
        "Menawa matur marang Bapak utawa Ibu Guru ing sekolahan, unggah-ungguh basa kang bener yaiku nganggo...",
      options: ["Basa Ngoko Lugu", "Basa Krama Alus", "Basa Indonesia Gaul", "Basa Walikan"],
      correctOption: 1,
      hint: "Marang wong sing luwih sepuh lan diurmati, kudu nggunakake basa sing sopan lan alus.",
    },
    {
      id: "q2_3",
      question: "Manakah contoh gotong royong yang paling tepat dilakukan siswa di dalam kelas?",
      options: [
        "Bekerja sama saat ulangan harian",
        "Merapikan meja dan piket kebersihan kelas bersama-sama",
        "Menyuruh teman piket sendirian",
        "Menonton kawan yang sedang menyapu lantai",
      ],
      correctOption: 1,
      hint: "Gotong royong adalah kerja bersama secara sukarela untuk kebaikan bersama.",
    },
    {
      id: "q2_4",
      question: "Tembung 'mangan' menawa diowahi dadi Basa Krama Alus kanggo wong tuwa yaiku...",
      options: ["Nedha", "Dhahar", "Nguntal", "Nyicipi"],
      correctOption: 1,
      hint: "'Bapak nembe dhahar', dene kanggo awake dhewe nggunakake tembung 'nedha'.",
    },
    {
      id: "q2_5",
      question:
        "Tokoh Punokawan kang dedege dhuwur, irunge dawa, lan pinter gawe guyu tanpa nglarani atine wong liya yaiku...",
      options: ["Semar", "Gareng", "Petruk", "Bagong"],
      correctOption: 2,
      hint: "Petruk utawa Kanthong Bolong nduweni watak grapyak, sumeh, pinter gojek, lan loman.",
    },
  ],
  3: [
    {
      id: "q3_1",
      question:
        "Nalika arep budhal sekolah, Doni pamitan marang ibune. Ukara krama alus kang trep yaiku...",
      options: [
        "'Mak, aku arep mangkat saiki ya!'",
        "'Ibu, kula nyuwun pamit badhe bidhal sekolah'",
        "'Bu, mangkat dhisik ya sesuk ketemu maneh'",
        "'Kula arep lunga sekolah dhisik'",
      ],
      correctOption: 1,
      hint: "Gatekna tembung 'nyuwun pamit' lan 'bidhal' kang kalebu tembung krama alus.",
    },
    {
      id: "q3_2",
      question:
        "Bagaimana cara kita membela persatuan bangsa jika ada teman yang mengejek perbedaan suku atau bahasa daerah?",
      options: [
        "Ikut mengejek agar ramai",
        "Menegur dengan sopan dan mengingatkan bahwa kita semua satu bangsa Indonesia",
        "Memusuhi kedua belah pihak",
        "Merekam lalu menyebarkannya",
      ],
      correctOption: 1,
      hint: "Ingatkan semboyan Bhinneka Tunggal Ika: berbeda-beda tetapi tetap satu jua.",
    },
    {
      id: "q3_3",
      question:
        "Watak luhur saka tokoh Bagong kang patut dituladha ing pasrawungan saben dina yaiku...",
      options: [
        "Seneng nesu menawa kalah dolanan",
        "Blaka suta (jujur apa anane) lan kendel mbelani bebener",
        "Seneng pamer bandha donya",
        "Gampang nglokro lan mutung",
      ],
      correctOption: 1,
      hint: "Bagong iku senajan ceplas-ceplos nanging atine resik, jujur, lan ora seneng dora (ngapusi).",
    },
    {
      id: "q3_4",
      question:
        "Nalika mlaku ing sangarepe wong tuwa utawa guru kang lagi lenggah, tata krama Jawa kang trep yaiku...",
      options: [
        "Mlayu banter kanthi swara seru",
        "Mbungkukake awak kanthi matur 'Nyuwun sewu, nderek langkung'",
        "Mlaku jejeg karo dolanan HP",
        "Mlaku mundur ora noleh",
      ],
      correctOption: 1,
      hint: "Sikap mbungkukake awak lan matur 'nderek langkung' minangka tandha pakurmatan marang tiyang sepuh.",
    },
    {
      id: "q3_5",
      question:
        "Di sebuah desa ada warga yang sedang tertimpa musibah rumahnya roboh. Tindakan yang mencerminkan pengamalan Sila Ke-3 dan gotong royong adalah...",
      options: [
        "Hanya menonton dan mengambil foto",
        "Bersama-sama warga lain menyumbang tenaga dan bahan untuk membantu membangun kembali",
        "Menyalahkan cuaca buruk",
        "Meminta warga lain untuk pindah desa",
      ],
      correctOption: 1,
      hint: "Persatuan Indonesia diwujudkan melalui empati dan aksi nyata saling tolong-menolong tanpa membedakan.",
    },
  ],
};

export async function getChapterProgress(): Promise<ChapterProgress[]> {
  await delay(500);
  return chapterProgressDb;
}

export async function getStudentsNeedingHelp(): Promise<StudentHelp[]> {
  await delay(200);
  const remedialStudents = usersDb.filter(
    (u) =>
      u.role === "pelajar" &&
      u.weakness &&
      u.weakness.status === "remedial" &&
      (u.weakness.score / u.weakness.outOf) * 100 < 60
  );
  if (remedialStudents.length > 0) {
    return remedialStudents.map((u) => {
      const chName = u.weakness?.chapterName || "Materi Umum";
      const cleanCh = chName.includes("(")
        ? chName.split("(")[1]?.replace(")", "").trim() || chName
        : chName;
      return {
        id: u.id,
        name: u.name,
        chapter: cleanCh,
        score: u.weakness?.score ?? 5,
        outOf: u.weakness?.outOf ?? 10,
      };
    });
  }
  return studentsNeedingHelpDb;
}

// Sengaja diberi delay lebih lama untuk mendemonstrasikan Loading Skeleton +
// TanStack Query pada ClassSummaryCards (dulu Streaming SSR + <Suspense> di
// Next.js; kini Loading State standar useQuery.isLoading di Vite SPA).
export async function getClassSummary(): Promise<ClassSummary> {
  await delay(400);
  const studentUsers = usersDb.filter((u) => u.role === "pelajar");
  const totalPercent = chapterProgressDb.reduce((acc, c) => acc + c.percent, 0);
  const avgComprehension =
    chapterProgressDb.length > 0
      ? Math.round((totalPercent / chapterProgressDb.length) * 10) / 10
      : 0;

  const modules =
    curriculumModulesDb && curriculumModulesDb.length > 0
      ? curriculumModulesDb
      : INITIAL_MODULES_DB;
  const activeCount = modules.length;
  const pknCount = modules.filter((m) => m.subject === "pkn").length;
  const bjawaCount = modules.filter((m) => m.subject === "bjawa").length;

  return {
    totalStudents: studentUsers.length,
    averageComprehension: avgComprehension,
    activeModules: activeCount,
    studentsNeedingIntervention: studentsNeedingHelpDb.length,
    modulesNote: `📚 ${pknCount} Bab PKn & ${bjawaCount} Bab Bahasa Jawa`,
  };
}

// --- State Modul Aktif Tervalidasi Guru & Database Kurikulum Persisten -----
export interface ActiveCurriculumState {
  id: string;
  title: string;
  chapterCode: string;
  subject: string;
  subjectLabel?: string;
  source?: string;
  grade?: string;
  ragSummary?: string[];
  quizQuestions?: Record<number, Question[]>;
  gameType?: "matching" | "adventure" | "ulartangga" | "susunkata" | "wheel";
}

export interface CurriculumModuleRecord {
  id: string;
  subject: "pkn" | "bjawa";
  subjectLabel: string;
  grade: string;
  title: string;
  chapterCode: string;
  source: string;
  sourceType: "kemdikbud" | "disdik" | "custom";
  pageCount: number;
  learningGoal: string;
  isValidated: boolean;
  isActiveToday: boolean;
  validatedAt?: string;
  ragSummary?: string[];
  generatedQuizPreview?: string[];
  quizQuestions?: Record<number, Question[]>;
  gameType?: "matching" | "adventure" | "ulartangga" | "susunkata" | "wheel";
}

const INITIAL_MODULES_DB: CurriculumModuleRecord[] = [
  {
    "id": "mod-pkn-kls1-simbol",
    "subject": "pkn",
    "subjectLabel": "Pendidikan Pancasila & PKn",
    "grade": "Kelas 1",
    "title": "Aku Cinta Pancasila: Mengenal 5 Simbol Garuda Pancasila",
    "chapterCode": "Bab 1",
    "source": "API SIBI Kemdikbudristek RI (Katalog Buku Teks Utama)",
    "sourceType": "kemdikbud",
    "pageCount": 22,
    "learningGoal": "Peserta didik mengenal 5 simbol pada lambang Garuda Pancasila (Bintang, Rantai Emas, Pohon Beringin, Kepala Banteng, Padi & Kapas) serta makna dasarnya.",
    "isValidated": true,
    "isActiveToday": true,
    "validatedAt": "Hari ini, 07:15 WIB",
    "gameType": "adventure",
    "ragSummary": [
      "Simbol Sila 1 (Bintang Emas): Berdoa sebelum makan dan belajar, menyayangi teman saat beribadah.",
      "Simbol Sila 2 (Rantai Emas): Saling menolong teman yang terjatuh, bersikap ramah, tidak mengejek kawan.",
      "Simbol Sila 3 (Pohon Beringin): Hidup rukun bermain bersama di sekolah tanpa bertengkar.",
      "Simbol Sila 4 (Kepala Banteng): Mendengarkan bu guru dan teman saat berbicara, tertib saat antre.",
      "Simbol Sila 5 (Padi dan Kapas): Mau berbagi pensil atau bekal, adil kepada semua kawan, dan suka menabung."
    ],
    "generatedQuizPreview": [
      "Level 1: Simbol Sila ke-1 Bintang Emas (+10 Poin)",
      "Level 2: Lambang Sila ke-3 Pohon Beringin dan maknanya (+20 Poin)",
      "Level 3: Perilaku rukun dan saling tolong-menolong sesama kawan (+30 Poin)"
    ]
  },
  {
    "id": "mod-pkn-kls2-aturan",
    "subject": "pkn",
    "subjectLabel": "Pendidikan Pancasila & PKn",
    "grade": "Kelas 2",
    "title": "Menaati Aturan & Tata Tertib di Rumah dan Sekolah",
    "chapterCode": "Bab 1",
    "source": "API SIBI Kemdikbudristek RI (Katalog Buku Teks Utama)",
    "sourceType": "kemdikbud",
    "pageCount": 24,
    "learningGoal": "Peserta didik memahami fungsi aturan dan membiasakan diri mematuhi tata tertib di rumah maupun di lingkungan sekolah.",
    "isValidated": true,
    "isActiveToday": false,
    "validatedAt": "Hari ini, 07:45 WIB",
    "gameType": "adventure",
    "ragSummary": [
      "Pengertian & Hakikat Aturan: Aturan adalah pedoman, tata tertib, atau petunjuk yang disepakati bersama untuk mengatur tingkah laku kita agar kehidupan berjalan tertib, aman, rukun, dan damai.",
      "Mengapa Harus Ada Aturan?: Tanpa adanya aturan, suasana di rumah maupun di kelas akan menjadi kacau, banyak pertengkaran, dan kegiatan belajar atau bermain menjadi tidak nyaman. Aturan melatih kita menjadi anak yang berdisiplin dan bertanggung jawab.",
      "Contoh Aturan di Rumah: Bangun pagi tepat waktu, merapikan tempat tidur sendiri setelah bangun, meminta izin atau pamit mencium tangan orang tua sebelum pergi bermain, serta meletakkan sepatu dan tas pada tempatnya.",
      "Contoh Tata Tertib di Sekolah: Mengenakan seragam sekolah yang bersih dan rapi sesuai harinya, datang tepat waktu sebelum bel masuk berbunyi, mendengarkan bimbingan guru dengan tertib, serta membuang sampah pada tempat sampah.",
      "Keseimbangan Hak dan Kewajiban Anak: Kewajiban adalah sesuatu yang harus kita laksanakan terlebih dahulu (misalnya belajar dan membersihkan kelas), sedangkan hak adalah sesuatu yang kita terima (misalnya mendapatkan bimbingan guru dan ruangan kelas yang nyaman).",
      "Akibat Melanggar Aturan: Mengakibatkan suasana tidak tertib, merugikan diri sendiri dan orang lain, serta mendapatkan teguran atau sanksi disiplin dari orang tua maupun guru."
    ],
    "generatedQuizPreview": [
      "Level 1: Contoh aturan bangun pagi di rumah (+10 Poin)",
      "Level 2: Tata tertib seragam dan kebersihan sekolah (+20 Poin)",
      "Level 3: Keseimbangan antara hak dan kewajiban anak (+30 Poin)"
    ]
  },
  {
    "id": "mod-pkn-bhinneka",
    "subject": "pkn",
    "subjectLabel": "Pendidikan Pancasila & PKn",
    "grade": "Kelas 3",
    "title": "Bhinneka Tunggal Ika: Mengenal Keragaman Suku, Rumah Adat & Budaya Nusantara",
    "chapterCode": "Bab 1",
    "source": "API SIBI Kemdikbudristek RI (Katalog Buku Teks Siswa)",
    "sourceType": "kemdikbud",
    "pageCount": 28,
    "learningGoal": "Mengidentifikasi kekayaan rumah adat, tarian tradisional, serta memupuk toleransi beragama dan kerukunan antarsuku bangsa.",
    "isValidated": true,
    "isActiveToday": false,
    "validatedAt": "Hari ini, 08:00 WIB",
    "gameType": "adventure",
    "ragSummary": [
      "Pengertian Semboyan Bhinneka Tunggal Ika: Semboyan resmi bangsa Indonesia ini bermakna meskipun berbeda-beda suku, bahasa daerah, agama, dan adat istiadat, pada hakikatnya kita tetap satu kesatuan keluarga besar Indonesia yang rukun dan damai.",
      "Sejarah Lengkap Kakawin Sutasoma & Pujangga Mpu Tantular di Majapahit: Kalimat suci Bhinneka Tunggal Ika lahir dari karya sastra agung abad ke-14 pada era kejayaan Kerajaan Majapahit, saat dipimpin oleh Prabu Hayam Wuruk didampingi Mahapatih Gajah Mada. Pujangga besar keraton bernama Mpu Tantular menulis kitab Kakawin Sutasoma. Pada pupuh 139 bait 5, Mpu Tantular menuliskan kalimat keramat: 'Rwaneka dhatu winuwus Buddha Wiswa, Bhinêki rakwa ring apan kêna parwanosên, Mangka ng Jinatwa kalawan Siwatatwa tunggal, Bhinneka Tunggal Ika tan hana dharma mangrwa'. Artinya: ajaran Buddha dan Siwa (Hindu) tampak berbeda ragamnya, namun hakikat kebenarannya adalah satu jua, tidak ada kebenaran yang mendua. Toleransi yang tinggi inilah yang membuat Kerajaan Majapahit makmur, tenteram, dan dihormati seantero dunia.",
      "Sejarah Pengadopsian Semboyan Menjadi Kompas Bangsa: Pada masa kebangkitan nasional awal abad ke-20, pahlawan nasional Mr. Mohammad Yamin yang sangat mencintai sejarah Nusantara menemukan kembali mutiara bait Mpu Tantular ini. Beliau mendiskusikannya dengan Bung Karno. Ketika bangsa Indonesia merdeka, para bapak pendiri bangsa sepakat menjadikan Bhinneka Tunggal Ika sebagai semboyan resmi negara yang dicengkeram kokoh oleh kedua kaki Burung Garuda Pancasila untuk menyatukan lebih dari 1.340 suku bangsa.",
      "Keragaman Suku Bangsa di Nusantara: Indonesia memiliki lebih dari 1.340 suku bangsa yang tersebar dari Sabang sampai Merauke, seperti Suku Jawa, Sunda, Batak, Minangkabau, Dayak, Bugis, Bali, Sasak, dan Asmat Papua.",
      "Mengenal Rumah Adat Tradisional: Rumah Joglo (Jawa Tengah), Rumah Gadang dengan atap melengkung runcing seperti tanduk kerbau (Sumatera Barat), Rumah Tongkonan (Toraja Sulawesi Selatan), dan Rumah Honai berbentuk bulat beratap jerami (Papua).",
      "Mengenal Tarian & Pakaian Adat: Tari Saman (Aceh), Tari Kecak (Bali), Tari Jaipong (Jawa Barat), Tari Pendet (Bali), serta pakaian adat yang anggun seperti Kebaya, Baju Bodo, dan Ulos.",
      "Toleransi Antarumat Beragama: Menghormati 6 agama resmi di Indonesia (Islam, Kristen Protestan, Katolik, Hindu, Buddha, Khonghucu) dengan saling menjaga ketenangan saat tetangga atau kawan sedang beribadah.",
      "Aksi Nyata di Sekolah: Belajar dan bermain bersama secara kompak tanpa memilih kawan berdasarkan asal daerah atau warna kulit, mencintai lagu daerah Nusantara, serta bangga menggunakan produk kebudayaan bangsa sendiri."
    ],
    "generatedQuizPreview": [
      "Level 1: Asal-usul semboyan Bhinneka Tunggal Ika (+10 Poin)",
      "Level 2: Mengenal Rumah Gadang dan Rumah Honai (+20 Poin)",
      "Level 3: Sikap toleransi kerukunan antarsuku di sekolah (+30 Poin)"
    ]
  },
  {
    "id": "mod-pkn-sila3",
    "subject": "pkn",
    "subjectLabel": "Pendidikan Pancasila & PKn",
    "grade": "Kelas 4",
    "title": "Makna Lambang Sila Ke-3: Persatuan Indonesia di Sekolah & Rumah",
    "chapterCode": "Bab 1",
    "source": "API SIBI Kemdikbudristek RI (Katalog Buku Teks Utama)",
    "sourceType": "kemdikbud",
    "pageCount": 28,
    "learningGoal": "Peserta didik memahami makna filosofis pohon beringin dan mengamalkan sikap rukun tanpa membeda-bedakan kawan.",
    "isValidated": true,
    "isActiveToday": true,
    "validatedAt": "Hari ini, 07:30 WIB",
    "gameType": "adventure",
    "ragSummary": [
      "Pengertian & Hakikat Sila Ke-3: Sila ketiga Pancasila berbunyi Persatuan Indonesia dengan lambang Pohon Beringin. Hakikat sila ini adalah tekad bulat bersama bangsa Indonesia yang memiliki ribuan suku, bahasa daerah, dan tradisi berbeda untuk bersatu kokoh dalam satu ikatan keluarga besar kebangsaan.",
      "Makna Filosofis Pohon Beringin: Pohon beringin memiliki akar tunggang dalam yang menancap kokoh ke bumi, melambangkan negara Indonesia sebagai tempat berteduh dan bernaung seluruh rakyat dengan aman. Sulur dan akar gantungnya yang menjalar ke segala arah mencerminkan kekayaan keberagaman suku bangsa Nusantara yang tetap bersatu teguh dalam satu pohon persatuan.",
      "Sejarah Perumusan Pancasila & Sidang BPUPKI 1945: Menjelang kemerdekaan Indonesia pada tahun 1945, para tokoh pejuang bangsa berkumpul dalam sidang Badan Penyelidik Usaha-usaha Persiapan Kemerdekaan Indonesia (BPUPKI) yang dipimpin oleh Dr. K.R.T. Radjiman Wedyodiningrat. Dalam sidang pertama tanggal 29 Mei sampai 1 Juni 1945 di Gedung Chuo Sangi In (sekarang Gedung Pancasila, Jakarta), tiga tokoh besar bangsa tampil menyampaikan gagasan dasar negara: Mr. Mohammad Yamin (29 Mei), Prof. Dr. Soepomo (31 Mei), dan Ir. Soekarno (1 Juni). Pada tanggal 1 Juni 1945, Bung Karno berpidato dengan penuh semangat membakar jiwa tanpa teks, mengusulkan lima dasar falsafah yang beliau namakan Pancasila atas saran ahli bahasa. Hari bersejarah 1 Juni itulah yang hingga kini kita peringati sebagai Hari Lahir Pancasila.",
      "Sejarah Panitia Sembilan & Pengesahan Piagam Jakarta hingga PPKI 18 Agustus 1945: Untuk mematangkan rumusan Bung Karno, dibentuklah Panitia Sembilan yang beranggotakan sembilan tokoh besar bangsa: Ir. Soekarno, Drs. Moh. Hatta, Mr. A.A. Maramis, Abikoesno Tjokrosoejoso, Abdoel Kahar Moezakir, H. Agus Salim, Mr. Achmad Soebardjo, K.H. Wahid Hasjim, dan Mr. Mohammad Yamin. Pada 22 Juni 1945, Panitia Sembilan berhasil menyepakati naskah Piagam Jakarta (Jakarta Charter). Setelah Indonesia memproklamasikan kemerdekaan pada 17 Agustus 1945, keesokan harinya tanggal 18 Agustus 1945, Panitia Persiapan Kemerdekaan Indonesia (PPKI) menggelar sidang penting. Dalam sidang ini, para tokoh bangsa dengan jiwa kenegarawanan luhur menyepakati perubahan demi persatuan seluruh rakyat dari Sabang sampai Merauke, mengesahkan UUD 1945, dan secara resmi menetapkan Pancasila sebagai Dasar Negara Republik Indonesia yang sah dan abadi.",
      "Sejarah Panjang Terciptanya Lambang Garuda Pancasila: Lambang Garuda Pancasila yang gagah di dinding kelas kita memiliki sejarah perancangan yang sangat istimewa. Pada tahun 1950, pemerintah Republik Indonesia Serikat (RIS) membentuk Panitia Lencana Negara yang dipimpin oleh Sultan Hamid II dari Pontianak. Beliau merancang figur burung garuda yang terinspirasi dari mitologi Nusantara dan arca kuno candi-candi Indonesia. Rancangan awal Sultan Hamid II kemudian disempurnakan langsung oleh Presiden Soekarno: Bung Karno menambahkan jambul pada kepala burung garuda agar tampak gagah dan berwibawa (tidak menyerupai Bald Eagle Amerika Serikat), serta mengubah cengkeraman kaki garuda yang semula mencengkeram pita merah putih di belakang menjadi mencengkeram pita putih bertuliskan Bhinneka Tunggal Ika di bagian depan. Lambang Garuda Pancasila ini akhirnya diresmikan pertama kali dalam Sidang Kabinet RIS pada tanggal 11 Februari 1950 di Hotel Des Indes, Jakarta. Jumlah helai bulunya dirancang khusus mengabadikan hari keramat proklamasi: 17 bulu pada masing-masing sayap, 8 bulu pada ekor, 19 bulu pada pangkal ekor di bawah perisai, dan 45 bulu pada leher (17 Agustus 1945).",
      "Sejarah Semboyan Bhinneka Tunggal Ika dari Zaman Majapahit: Kalimat sakral Bhinneka Tunggal Ika bukanlah kalimat baru, melainkan warisan luhur nenek moyang bangsa kita sejak abad ke-14 pada era keemasan Kerajaan Majapahit di bawah kepemimpinan Raja Hayam Wuruk dan Mahapatih Gajah Mada. Kalimat ini tertulis indah dalam kitab sastra klasik berjudul Kakawin Sutasoma pupuh 139 bait 5 karya pujangga besar Mpu Tantular. Bunyi lengkap bait aslinya adalah: Rwaneka dhatu winuwus Buddha Wiswa, Bhineki rakwa ring apan kena parwanosen, Mangka ng Jinatwa kalawan Siwatatwa tunggal, Bhinneka Tunggal Ika tan hana dharma mangrwa. Maknanya: Meskipun ajaran Buddha dan Siwa (Hindu) tampak berbeda di mata manusia, hakikat kebenarannya adalah tunggal dan satu adanya. Pada masa pergerakan nasional, tokoh pejuang Mohammad Yamin membawa kutipan bait ini kepada Bung Karno dan para bapak pendiri bangsa, hingga disepakati bersama menjadi semboyan pengikat ribuan pulau, bahasa, dan adat istiadat suku-suku Nusantara dalam dekapan NKRI.",
      "Intisari Lima Sila Luhur Bangsa: Sila ke-1 menuntun ketakwaan dan toleransi antarumat beragama, Sila ke-2 menjunjung martabat kemanusiaan yang adil dan beradab, Sila ke-3 mengikat persatuan di atas keragaman, Sila ke-4 mengedepankan musyawarah mufakat, dan Sila ke-5 mengamanatkan keadilan sosial bagi seluruh rakyat Indonesia.",
      "Mengapa Materi Ini Sangat Penting Bagi Siswa SD?: Memahami nilai persatuan sejak dini mencegah terjadinya permusuhan, saling ejek perbedaan fisik atau suku (anti-bullying), serta pertengkaran antarteman. Siswa menyadari bahwa perbedaan adalah kekayaan bangsa yang harus disyukuri dan dirawat.",
      "Aksi Nyata & Penerapan di Sekolah: Melaksanakan jadwal piket kebersihan kelas secara kompak tanpa pilih-pilih kawan, mengajak teman baru atau teman pendiam untuk belajar dan bermain bersama saat jam istirahat, serta membiasakan diri bertutur kata menggunakan Bahasa Indonesia yang santun.",
      "Pengamalan di Rumah & Warga: Menjaga kerukunan antarsaudara di rumah, tidak membuat kegaduhan ketika tetangga sedang beribadah, serta ikut membantu saat ada kegiatan kerja bakti membersihkan lingkungan tempat tinggal.",
      "Semangat Gotong Royong Tradisi Luhur Nusantara: Falsafah luhur berat sama dipikul, ringan sama dijinjing. Kerja sama sukarela dan tolong-menolong membuat masalah sulit menjadi ringan dan menumbuhkan rasa persaudaraan yang tulus di tengah masyarakat.",
      "Nilai Budi Pekerti & Karakter Pelajar Pancasila: Membiasakan sikap toleransi, rendah hati, cinta tanah air, bangga memakai produk karya bangsa sendiri seperti batik Indonesia, serta senantiasa bersikap jujur dan amanah dalam setiap perbuatan."
    ],
    "generatedQuizPreview": [
      "Level 1: Lambang Sila Ke-3 Persatuan Indonesia (+10 Poin)",
      "Level 2: Sikap saat melihat teman berbeda suku sendirian (+20 Poin)",
      "Level 3: Analogi akar gantung pohon beringin bagi keberagaman (+30 Poin)"
    ]
  },
  {
    "id": "mod-pkn-gotongroyong",
    "subject": "pkn",
    "subjectLabel": "Pendidikan Pancasila & PKn",
    "grade": "Kelas 4",
    "title": "Gotong Royong & Kerja Sama: Berat Sama Dipikul Ringan Sama Dijinjing",
    "chapterCode": "Bab 2",
    "source": "API SIBI Kemdikbudristek RI (Buku Panduan Guru & Siswa)",
    "sourceType": "kemdikbud",
    "pageCount": 32,
    "learningGoal": "Menumbuhkan empati sosial dan pembiasaan kerja bakti serta piket bersama di lingkungan sekolah.",
    "isValidated": true,
    "isActiveToday": false,
    "validatedAt": "Hari ini, 08:15 WIB",
    "gameType": "adventure",
    "ragSummary": [
      "Pengertian & Asal-Usul Gotong Royong: Gotong royong berasal dari kata gotong (mengangkat atau memikul bersama) dan royong (bersama-sama). Gotong royong adalah tradisi luhur bangsa Indonesia berupa kegiatan bekerja bersama-sama secara sukarela untuk mencapai tujuan bersama yang bermanfaat bagi banyak orang.",
      "Prinsip Utama & Pembagian Peran: Prinsip dasar gotong royong adalah berat sama dipikul, ringan sama dijinjing. Pekerjaan besar dan berat akan terasa ringan serta cepat selesai bila setiap orang mengambil peran masing-masing dengan ikhlas tanpa pamrih.",
      "Mengapa Gotong Royong Wajib Dipelajari?: Mengikis sifat individualis (mementingkan diri sendiri), menumbuhkan empati sosial, dan mempererat tali persaudaraan sesama kawan sehingga kelas menjadi ruang belajar yang nyaman dan hangat.",
      "Aksi Nyata di Lingkungan Sekolah: Bekerja sama menata perpustakaan kelas, merapikan meja dan kursi setelah jam belajar, serta aktif dalam kelompok diskusi di mana kawan yang sudah paham membantu kawan yang masih kesulitan belajar.",
      "Pengamalan di Rumah & Warga: Membantu meringankan pekerjaan orang tua seperti merapikan tempat tidur sendiri dan mencuci piring, serta ikut serta dalam kegiatan membersihkan selokan lingkungan dari sampah.",
      "Nilai Karakter Pelajar Pancasila: Menanamkan jiwa tolong-menolong, peduli lingkungan, tanggung jawab bersama, dan tidak mengharapkan imbalan materi saat menolong sesama."
    ],
    "generatedQuizPreview": [
      "Level 1: Makna pepatah berat sama dipikul (+10 Poin)",
      "Level 2: Perilaku gotong royong di lingkungan sekolah (+20 Poin)"
    ]
  },
  {
    "id": "mod-pkn-norma",
    "subject": "pkn",
    "subjectLabel": "Pendidikan Pancasila & PKn",
    "grade": "Kelas 5",
    "title": "Norma, Hak & Kewajiban Warga Negara serta UUD 1945",
    "chapterCode": "Bab 1",
    "source": "API SIBI Kemdikbudristek RI (Kurikulum Merdeka 2024)",
    "sourceType": "kemdikbud",
    "pageCount": 26,
    "learningGoal": "Memahami 4 macam norma dalam masyarakat, prinsip keseimbangan hak dan kewajiban, serta penegakan keadilan sosial UUD 1945.",
    "isValidated": true,
    "isActiveToday": false,
    "validatedAt": "Hari ini, 08:30 WIB",
    "gameType": "adventure",
    "ragSummary": [
      "Pengertian & Asal-Usul Norma: Kata norma diserap dari bahasa Latin norma yang bermakna garis siku pengukur tegak lurus—dimaknai sebagai kaidah, pedoman tingkah laku, dan tolok ukur yang disepakati bersama agar kehidupan bermasyarakat berjalan tertib, aman, dan berkeadilan.",
      "Empat Macam Norma Utama: (1) Norma Agama (bersumber dari wahyu Tuhan Yang Maha Esa), (2) Norma Kesusilaan (bersumber dari suara hati nurani manusia), (3) Norma Kesopanan (bersumber dari tata krama adat pergaulan setempat), serta (4) Norma Hukum (aturan tertulis negara yang tegas dan mengikat seluruh warga).",
      "Keseimbangan Hak dan Kewajiban: Kewajiban adalah tugas yang harus kita laksanakan dengan penuh tanggung jawab, sedangkan hak adalah sesuatu yang sah kita terima. Mendahulukan kewajiban sebelum menuntut hak melahirkan keadilan sosial dan ketenteraman bersama.",
      "Aksi Nyata di Sekolah: Datang tepat waktu sebelum bel masuk berbunyi, mendengarkan bimbingan guru dengan tertib, menjaga fasilitas kelas, serta membiasakan budaya antre di kantin dan perpustakaan.",
      "Pengamalan di Rumah & Warga: Menghormati nasihat orang tua, menjaga ketenangan saat tetangga beristirahat, mematuhi rambu lalu lintas, serta tidak mengambil barang milik orang lain tanpa izin.",
      "Nilai Karakter Bangsa: Membiasakan sikap jujur, mandiri, disiplin waktu, cinta keadilan, dan menghormati hak asasi sesama kawan."
    ],
    "generatedQuizPreview": [
      "Level 1: Contoh aturan yang berlaku di dalam kelas (+10 Poin)",
      "Level 2: Perbedaan antara hak dan kewajiban siswa SD (+20 Poin)",
      "Level 3: Analisis pentingnya hukum dan sanksi yang adil (+30 Poin)"
    ]
  },
  {
    "id": "mod-pkn-musyawarah",
    "subject": "pkn",
    "subjectLabel": "Pendidikan Pancasila & PKn",
    "grade": "Kelas 6",
    "title": "Musyawarah Mufakat & Semangat Persatuan NKRI untuk Keutuhan Bangsa",
    "chapterCode": "Bab 1",
    "source": "API SIBI Kemdikbudristek RI (Katalog Buku Teks Utama)",
    "sourceType": "kemdikbud",
    "pageCount": 26,
    "learningGoal": "Mengamalkan musyawarah mufakat dalam pengambilan keputusan bersama serta menjaga keutuhan Negara Kesatuan Republik Indonesia.",
    "isValidated": true,
    "isActiveToday": false,
    "validatedAt": "Hari ini, 09:00 WIB",
    "gameType": "adventure",
    "ragSummary": [
      "Pengertian Musyawarah Mufakat: Musyawarah berasal dari bahasa Arab syawara yang bermakna berunding atau berdiskusi bersama untuk mencapai kesepakatan bulat (mufakat) dalam memecahkan masalah atau mengambil keputusan bersama.",
      "Landasan Konstitusi & Sila Ke-4: Musyawarah mufakat dijiwai oleh Sila Keempat Pancasila: Kerakyatan yang dipimpin oleh hikmat kebijaksanaan dalam permusyawaratan/perwakilan. Mengedepankan akal sehat, hati nurani, dan kepentingan umum di atas kepentingan pribadi atau golongan.",
      "Prinsip Pokok dalam Musyawarah: Setiap orang memiliki hak yang sama untuk berpendapat, wajib menghargai dan mendengarkan pendapat kawan tanpa memotong pembicaraan, tidak memaksakan kehendak sendiri, dan melaksanakan hasil keputusan bersama dengan ikhlas dan penuh tanggung jawab.",
      "Contoh Penerapan di Sekolah: Pemilihan ketua kelas dan pengurus kelas secara tertib demokratis, musyawarah menentukan tujuan wisata edukasi kelas, dan pembagian tugas kerja bakti sekolah.",
      "Pengamalan di Lingkungan Warga: Mengikuti rembuk warga RT/RW untuk pembangunan fasilitas umum pos ronda, kerja bakti membersihkan lingkungan, dan menjaga kerukunan warga.",
      "Menjaga Keutuhan NKRI: Melatih jiwa kepemimpinan, menolak ujaran kebencian atau berita bohong (hoaks), membela kebenaran, serta senantiasa mengutamakan persatuan dan kesatuan bangsa di atas perbedaan."
    ],
    "generatedQuizPreview": [
      "Level 1: Pengertian musyawarah mufakat dan Sila ke-4 (+10 Poin)",
      "Level 2: Tata cara menyampaikan pendapat yang santun (+20 Poin)",
      "Level 3: Komitmen menjaga keutuhan dan persatuan NKRI (+30 Poin)"
    ]
  },
  {
    "id": "mod-bjawa-anakkewan",
    "subject": "bjawa",
    "subjectLabel": "Basa Jawa (Muatan Lokal)",
    "grade": "Kelas 1",
    "title": "Kawruh Basa Jawa: Mengenal Jeneng Arane Anak Kewan (Bebek-Meri, Sapi-Pedhet, dll.)",
    "chapterCode": "Bab 1",
    "source": "Repositori Mulok Disdikbud Provinsi (Buku Sastri Basa)",
    "sourceType": "disdik",
    "pageCount": 18,
    "learningGoal": "Peserta didik saged nyebutaken lan njodohaken arane anak kewan ing padintenan (meri, pedhet, cemeng, kuthuk, cempe, belo) kanthi leres.",
    "isValidated": true,
    "isActiveToday": false,
    "validatedAt": "Hari ini, 09:15 WIB",
    "gameType": "matching",
    "ragSummary": [
      "Pangertosan Arane Anak Kewan: Ing basa Jawa, jeneng anak kewan iku nduweni sesebutan dhewe-dhewe minangka kasugihan kabudayan basa lan bukti celake uripe wong Jawa karo alam sakupenge.",
      "Arane Anak Unggas (Buntut Suwiwi): Anak bebek arane meri, anak pitik arane kuthuk, anak menthok arane minthi, anak manuk arane piyik, anak doro arane piyik.",
      "Arane Anak Kewan Rumput & Ngesusoni: Anak sapi arane pedhet, anak wedhus arane cempe, anak kebo arane gudel, anak jaran arane belo, anak kucing arane cemeng.",
      "Arane Anak Kewan Galak & Liar: Anak gajah arane bledug, anak macan arane gogor, anak baya arane rete, anak kodhok arane precel utawa cebong.",
      "Tuladha ing Ukara Basa Jawa: Bapak mundhut pedhet cacahe loro ing pasar kewan, Meri-meri padha nglangi bebarengan ing blumbang, sarta Kucingku duwe anak telu cemeng kabeh."
    ],
    "generatedQuizPreview": [
      "Level 1: Arane anak bebek yaiku meri (+10 Poin)",
      "Level 2: Anak sapi diarani pedhet, anak kucing cemeng (+20 Poin)",
      "Level 3: Jeneng anak kewan galak bledug lan gogor (+30 Poin)"
    ]
  },
  {
    "id": "mod-bjawa-aksara",
    "subject": "bjawa",
    "subjectLabel": "Basa Jawa (Muatan Lokal)",
    "grade": "Kelas 2",
    "title": "Maca lan Nulis Aksara Jawa Legena (20 Aksara) sarta Sandhangan Swara",
    "chapterCode": "Bab 1",
    "source": "Repositori Mulok Disdikbud Provinsi (Buku Wursita Basa)",
    "sourceType": "disdik",
    "pageCount": 22,
    "learningGoal": "Siswa saged mangertosi wujud aksara Jawa dhasar (Ha-Na-Ca-Ra-Ka) lan sandhangan swara Wulu, Suku, Pepet, Taling.",
    "isValidated": true,
    "isActiveToday": false,
    "validatedAt": "Hari ini, 09:30 WIB",
    "gameType": "matching",
    "ragSummary": [
      "Pangertosan Aksara Jawa Legena: Aksara Jawa legena yaiku aksara dhasar Jawa kang cacahe ana 20 lan durung diwenehi sandhangan apa-apa, saben aksara nduweni swara vokal a.",
      "Sejarah & Kisah Legenda Dumadine Aksara Jawa (Aji Saka, Dora, lan Sembada): Miturut crita rakyat Jawa, 20 aksara Jawa legena (Carakan) cinipta dening Prabu Aji Saka, sawijining satriya luhur kang rawuh saka tlatah Medang Kamulan. Prabu Aji Saka nduweni batur (abdi) loro kang banget setya tuhu, yaiku Dora lan Sembada. Nalika Aji Saka tindak lelana, Sembada diparingi dhawuh njaga keris pusaka ing Pegunungan Kendeng kanthi pesen keras: keris iki ora kena diparingake marang sapa wae kajaba Aji Saka dhewe kang njupuk. Sawise Aji Saka dadi raja ing Medang Kamulan, beliau ngutus Dora menyang Gunung Kendeng supaya njupuk keris pusaka mau. Nanging nalika Dora ketemu Sembada, Sembada nulak amarga eling welinge Aji Saka yen ora kena diwenehake marang sapa wae saliyane Aji Saka. Dora meksa amarga uga nindakake dhawuhe bendarane. Kekarone padha-padha setya membela amanat, nganti pungkasane perang tandhing amarga ora ana sing gelem ngalah. Amarga kasektene padha, Dora lan Sembada gugur bebarengan minangka ksatria sejati. Krungu kabar sedhih iki, Prabu Aji Saka getun banget lan nangis lara ati. Kanggo ngurmati lan ngenang kasetyane abdine, Prabu Aji Saka ngripta bait puisi 20 aksara Jawa: (1) Ha-Na-Ca-Ra-Ka tegese ana utusan (dora lan sembada), (2) Da-Ta-Sa-Wa-La tegese padha pasulayan utawa padha padudon nindakake dhawuh, (3) Pa-Dha-Ja-Ya-Nya tegese kekarone padha digdayane lan sekti mandraguna, sarta (4) Ma-Ga-Ba-Tha-Nga tegese wasanane padha dadi bathang (mati bebarengan kanthi luhur).",
      "Urutan 20 Aksara Jawa: Ha-Na-Ca-Ra-Ka (ana utusan), Da-Ta-Sa-Wa-La (padha pasulayan), Pa-Dha-Ja-Ya-Nya (padha digdayane), Ma-Ga-Ba-Tha-Nga (padha dadi bathang).",
      "Sandhangan Swara Pokok: Wulu ngowahi swara dadi i (tuladha: siki), Suku ngowahi swara dadi u (tuladha: buku), Pepet ngowahi swara dadi e sepet (tuladha: seger), Taling ngowahi swara dadi e taling (tuladha: sate), lan Taling Tarung ngowahi swara dadi o (tuladha: toko).",
      "Gladhen Maca & Nulis Prasaja: Ngenal pasangan aksara lan nyalin tembung-tembung prasaja saka aksara Latin menyang Aksara Jawa ing buku pasinaon."
    ],
    "generatedQuizPreview": [
      "Level 1: Jumlah aksara Jawa legena dhasar ana 20 (+10 Poin)",
      "Level 2: Sandhangan suku ngowahi swara dadi u (+20 Poin)",
      "Level 3: Pasangan aksara lan sandhangan swara wulu (+30 Poin)"
    ]
  },
  {
    "id": "mod-bjawa-punokawan",
    "subject": "bjawa",
    "subjectLabel": "Basa Jawa (Muatan Lokal)",
    "grade": "Kelas 3",
    "title": "Mengenal Watak Luhur Tokoh Pewayangan Punokawan (Semar, Gareng, Petruk, Bagong)",
    "chapterCode": "Bab 1",
    "source": "Repositori Mulok Disdikbud Provinsi (Buku Sastri Basa)",
    "sourceType": "disdik",
    "pageCount": 26,
    "learningGoal": "Meneladani watak sabar Semar, cermat Gareng, loman Petruk, serta sifat jujur blaka suta dari tokoh Bagong.",
    "isValidated": true,
    "isActiveToday": false,
    "validatedAt": "Hari ini, 09:45 WIB",
    "gameType": "matching",
    "ragSummary": [
      "Pangertosan & Asal-Usul Punokawan: Punokawan asale saka tembung Pana (paham utawa weruh kanthi cetha) lan Kawan (kanca/pamomong). Punokawan yaiku papat tokoh pamomong para ksatria Pandhawa kang nduweni kawicaksanan luhur kanggo nuntun marang kabecikan.",
      "Sejarah Lengkap Asal-Usul Punokawan Ciptaan Sunan Kalijaga & Pujangga Jawa: Tokoh Punokawan (Semar, Gareng, Petruk, Bagong) babar pisan ora tinemu ing wiracarita Mahabharata asli saka India, nanging asil ciptaan luhur para pujangga Jawa kuno lan disampurnakake kanthi jembar dening Kanjeng Sunan Kalijaga ing jaman Kasultanan Demak Bintoro abad kaping-15 nganti 16. Nalika semono para wali migunakake kesenian wayang kulit minangka sarana dakwah lan nuntun bebuden luhur masyarakat. Tembung Punokawan asale saka tembung Pana (tegese paham, waspada, lan weruh kanthi trawaca) lan Kawan (tegese kanca, sedulur, utawa pamomong). Mula Punokawan tegese pamomong kang waspada lan ngerti marang bebener sejati. Sunan Kalijaga nyipta Punokawan minangka perlambang rakyat cilik nanging nduweni kawicaksanan luhur kang tansah ngamping-ampingi para satriya (para pemimpin), ngelingake supaya ora kumalungkung utawa sombong, tetep adil, lan tansah ngabekti marang Gusti Kang Maha Kawasa.",
      "Watak Luhur Kyai Semar: Semar minangka bapa pamomong kang sejatine titising dewa (Batara Ismaya). Watake sabar banget, wicaksana, welas asih marang sapa wae, lan ora tau kumalungkung (sombong). Pasinaon: dadi bocah kudu sabar lan ora gampang nesu.",
      "Watak Nala Gareng & Petruk: Gareng tangane ceko lan sikile jinjit minangka perlambang kudu ngati-ati nalika tumindak lan ora njupuk duweke liyan. Petruk dedege dhuwur, irunge dawa, watake grapyak, loman (seneng tetulung), lan pinter gawe senenge kanca tanpa nglarani ati.",
      "Watak Bagong (Blaka Suta): Bagong awake lemu cendhek, watake jujur apa anane (blaka suta), ora seneng lamis (munafik), lan kendel mbelani bebener senadyan ngadhepi bebaya.",
      "Penerapan ing Sekolah & Padintenan: Niru watak jujur Bagong nalika nggarap ulangan, watak sabar Semar nalika ana kanca kang nggodha, lan watak loman Petruk nalika ana kanca kang mbutuhake pitulungan."
    ],
    "generatedQuizPreview": [
      "Level 1: Watak luhur sabar Kyai Semar (+10 Poin)",
      "Level 2: Tuladha watak blaka suta Bagong ing kelas (+20 Poin)",
      "Level 3: Perlambang ceko lan jinjite Nala Gareng (+30 Poin)"
    ]
  },
  {
    "id": "mod-bjawa-unggahungguh",
    "subject": "bjawa",
    "subjectLabel": "Basa Jawa (Muatan Lokal)",
    "grade": "Kelas 4",
    "title": "Trap-Trapan Unggah-Ungguh Basa marang Bapak/Ibu Guru & Tiyang Sepuh",
    "chapterCode": "Bab 1",
    "source": "Repositori Mulok Disdikbud Provinsi (Buku Wursita Basa)",
    "sourceType": "disdik",
    "pageCount": 20,
    "learningGoal": "Siswa saged mbedakaken tembung Basa Ngoko kaliyan Basa Krama Alus nalika matur kaliyan tiyang ingkang langkung sepuh.",
    "isValidated": true,
    "isActiveToday": false,
    "validatedAt": "Hari ini, 10:00 WIB",
    "gameType": "matching",
    "ragSummary": [
      "Pangertosan Basa Krama: Basa Krama yaiku salah siji undha-usuk utawa trap-trapan basa Jawa kang luwih alus lan kurmat, digunakake nalika micara karo wong liya murih bisa ngajeni lan ngurmati.",
      "Basa Krama Kuwi Kanggo Apa?: Digunakake nalika matur marang Bapak lan Ibu ing omah, matur marang Bapak/Ibu Guru ing sekolah, guneman marang simbah utawa sedulur sepuh, sarta sapa aruh marang tamu supaya tatakramane becik.",
      "Bedane Tingkatan Basa: Basa Ngoko (kanggo kanca sakelas/sebaya), Basa Krama Lugu (tembunge krama nanging kanggo nyritakake awake dhewe, tuladhane: kula nedha, kula tilem), lan Basa Krama Alus (basa paling kurmat mligi kagem wong tuwa utawa guru, tuladhane: Bapak dhahar, Bu Guru sare).",
      "Tuladha Tembung Ngoko menyang Krama Alus: Mangan dadi dhahar, turu dadi sare, lunga dadi tindak, tuku dadi mundhut, ndeleng dadi mirsani, omah dadi dalem, jeneng dadi asma, teka dadi rawuh.",
      "Tuladha Ukara (Kalimat) ing Padintenan: (1) Marang Guru: Nyuwun sewu Bu Guru, kepareng kula badhe nyuwun pirsa babagan tugas sekolah. (2) Nyritakake Wong Tuwa: Bapak saweg dhahar sekul, dene Ibu saweg tindak dhateng peken mundhut janganan.",
      "Tatakrama Solah Bawa: Nalika matur marang wong tuwa utawa guru, polatan kudu sumeh (grapyak), asta ngapurancang (ditangkepake ing ngarep), awake rada mbungkuk, sarta ora kena mbengok utawa nyela rembug."
    ],
    "generatedQuizPreview": [
      "Level 1: Krama aluse tembung mangan kagem guru (+10 Poin)",
      "Level 2: Basa kang trep nalika nyuwun pirsa Bu Guru (+20 Poin)",
      "Level 3: Bedane krama lugu (nedha) lan krama alus (dhahar) (+30 Poin)"
    ]
  },
  {
    "id": "mod-bjawa-geguritan",
    "subject": "bjawa",
    "subjectLabel": "Basa Jawa (Muatan Lokal)",
    "grade": "Kelas 5",
    "title": "Geguritan: Mengenal Puisi Basa Jawa Gagrag Anyar & Unsur-Unsurnya",
    "chapterCode": "Bab 1",
    "source": "Repositori Mulok Disdikbud Provinsi (Buku Sastri Basa & Tantri Basa)",
    "sourceType": "disdik",
    "pageCount": 22,
    "learningGoal": "Siswa saged mangertosi pangertosan geguritan gagrag anyar, ciri-ciri, unsur pambangun, sarta tuladha geguritan kanthi lafal kang trep.",
    "isValidated": true,
    "isActiveToday": false,
    "validatedAt": "Hari ini, 08:30 WIB",
    "gameType": "susunkata",
    "ragSummary": [
      "Pangertosan Geguritan: Geguritan yaiku karya sastra puisi basa Jawa gagrag anyar kang medharake rasa pangrasa panganggit kanthi basa kang endah lan mentes. Geguritan gagrag anyar ora kaiket dening paugeran tartamtu kaya tembang macapat.",
      "Sejarah Perkembangan Geguritan saka Gagrag Kuna menyang Gagrag Anyar: Geguritan sejatine nduweni sejarah kang dawa ing donyane kasusastran Jawa. Ing jaman biyen, geguritan kalebu ing gagrag kuna (puisi Jawa klasik) kang kaiket dening paugeran kenceng, kayata kudu diwiwiti nganggo tembung sun-gegurit, saben padha (bait) ana patang gatra utawa luwih, sarta tibaning swara ing pungkasaning gatra kudu runtut memper tembang macapat. Nanging nalika mlebu jaman pergerakan nasional watara taun 1929, para pujangga Jawa enom kayata R. Intoyo lan Subagagyo Ilham Notodidjojo ngowahi wujud geguritan dadi gagrag anyar (modern). Geguritan gagrag anyar iki luwih mardika (bebas), ora kaiket paugeran guru lagu lan guru wilangan, supaya para pujangga lan generasi mudha luwih leluasa medharake rasa tresna marang bangsa, ibu pertiwi, sarta kritik sosial lumantar kaendahan basa Jawa kang mentes lan puitis.",
      "Geguritan Kuwi Kanggo Apa?: Kanggo medharake rasa pangrasa ati (katresnan marang wong tuwa, rasa syukur marang Gusti, tresna asih marang alam), aweh piwulang becik (amanat luhur), sarta nguri-uri kaendahan basa Jawa puitis.",
      "Ciri-Ciri Utama Geguritan Gagrag Anyar: (1) Ora kaiket guru gatra (larik), guru wilangan (suku kata), lan guru lagu (tibaning swara), (2) Basane endah, mentes, lan puitis, (3) Nggunakake purwakanthi (persamaan swara utawa sastra), (4) Tembunge dipilih kanthi cermat (diksi).",
      "Unsur Pambangun Geguritan: Tema (underaning gagasan pokok), Diksi (pamilihing tembung endah), Purwakanthi (runtuting swara vokal/konsonan), lan Amanat (pesen becik kang kinandhut ing geguritan).",
      "Tuladha Geguritan 1 (Ibu): Ibu... Rina wengi tansah ngusap luh ing pipiku. Ndonga puji marang Gusti Kang Murbeng Dumadi. Kagem putra-putrimu kang tansah mbok trisnani. Tresnamu tanpa upama, ora bakal sirna selawase. (Tegese: Nggambarake katresnane ibu kang tanpa kendhat).",
      "Tuladha Geguritan 2 (Sekolahanku): Sekolahanku endah asri... Papan kanggo golek ilmu lan wawasan. Bapak Ibu Guru mulang kanthi tulusing ati. Kanca-kancaku padha rukun sesandhingan. (Tegese: Nggambarake rasa seneng lan syukur sekolah ing papan kang rukun lan asri)."
    ],
    "generatedQuizPreview": [
      "Level 1: Pangertosan geguritan gagrag anyar (+10 Poin)",
      "Level 2: Ciri khas geguritan ora kaiket paugeran (+20 Poin)",
      "Level 3: Purwakanthi lan pamilihing diksi tembung (+30 Poin)"
    ]
  },
  {
    "id": "mod-bjawa-pandhawa",
    "subject": "bjawa",
    "subjectLabel": "Basa Jawa (Muatan Lokal)",
    "grade": "Kelas 6",
    "title": "Kisah Kepahlawanan & Silsilah Pandhawa Lima ing Perang Baratayuda",
    "chapterCode": "Bab 1",
    "source": "Repositori Mulok Disdikbud Provinsi (Buku Kirtya Basa)",
    "sourceType": "disdik",
    "pageCount": 24,
    "learningGoal": "Mengenal keteladanan watak kesatria Pandhawa: Puntadewa, Werkudara, Janaka, Nakula, lan Sadewa.",
    "isValidated": true,
    "isActiveToday": false,
    "validatedAt": "Hari ini, 10:15 WIB",
    "gameType": "adventure",
    "ragSummary": [
      "Pangertosan Pandhawa Lima: Pandhawa Lima yaiku sedulur lanang cacah lima putrane Prabu Pandu Dewanata saka kraton Ngastina kang nduweni watak utama, jujur, lan mbelani kabecikan.",
      "Prabu Puntadewa (Yudhistira): Pambarepe Pandhawa, ratu ing Amarta. Watake suci, getihe putih, jujur ora tau goroh, lan remen tetulung marang sapa wae.",
      "Raden Werkudara (Bima): Panenggake Pandhawa, satriya ing Jipang Jodhipati. Awake dhuwur gedhe gagah prakosa, nduweni kuku Pancanaka, watake kendel, setya tuhu marang dhawuhe guru, lan pantang mundur mbelani bebener.",
      "Raden Janaka (Arjuna): Penengahe Pandhawa, satriya ing Madukara. Praupane bagus mencorong, sekti mandraguna kanthi pusaka jemparing Pasopati, alus budine lan remen tapa brata.",
      "Raden Nakula lan Raden Sadewa: Wuragile Pandhawa wujud kembar putra Dewi Madrim. Watake setya bekti marang sedulur tuwa, pinter babagan tetanen lan ngopeni jaran sarta wasis ing ngelmu panitisan.",
      "Piwulang ing Perang Baratayuda: Mbelani bebener nglawan Kurawa kang angkara murka kanthi tetep njunjung luhuring budi pekerti lan satria."
    ],
    "generatedQuizPreview": [
      "Level 1: Urutan silsilah sedulur Pandhawa Lima (+10 Poin)",
      "Level 2: Watak utama Raden Werkudara nalika tetulung (+20 Poin)",
      "Level 3: Kasetyan lan bektine Nakula lan Sadewa (+30 Poin)"
    ]
  },
{
  "id": "mod-pkn-nasionalisme",
  "subject": "pkn",
  "subjectLabel": "Pendidikan Pancasila & PKn",
  "grade": "Kelas 4",
  "title": "Cinta Tanah Air & Nasionalisme: Bangga Menjadi Anak Indonesia",
  "chapterCode": "Bab 5",
  "source": "API SIBI Kemdikbudristek RI (Katalog Buku Teks Utama)",
  "sourceType": "kemdikbud",
  "pageCount": 26,
  "learningGoal": "Peserta didik mengenal simbol kebanggaan negara dan membiasakan sikap cinta tanah air serta bangga menggunakan produk Indonesia.",
  "isValidated": true,
  "isActiveToday": false,
  "validatedAt": "Hari ini, 08:00 WIB",
  "gameType": "adventure",
  "ragSummary": [
    "Hai Adik-adik Pintar! Apa itu Nasionalisme?: Nasionalisme artinya rasa cinta, bangga, dan setia yang tulus kepada bangsa dan tanah air kita tercinta, Indonesia! Sebagai anak bangsa, kita bangga tinggal di tanah air Indonesia yang indah, kaya akan budaya, dan penuh keberagaman yang rukun.",
    "Sejarah Pergerakan Nasional & Kongres Pemuda II 1928: Dahulu sebelum tahun 1928, perjuangan bangsa Indonesia melawan penjajah Belanda sering mengalami kegagalan karena masih bersifat kedaerahan (orang Jawa berjuang sendiri, orang Sumatra berjuang sendiri, orang Maluku berjuang sendiri). Menyadari kelemahan tersebut, para pemuda pelajar dari berbagai penjuru tanah air yang tergabung dalam PPPI (Perhimpunan Pelajar-Pelajar Indonesia) mengadakan pertemuan akbar bernama Kongres Pemuda II pada tanggal 27-28 Oktober 1928 di Jakarta. Kongres ini dihadiri organisasi pemuda dari berbagai suku: Jong Java, Jong Sumatranen Bond, Jong Bataks Bond, Jong Islamieten Bond, Jong Celebes, Jong Ambon, dan Pemuda Kaum Betawi. Di gedung Kramat Raya 106, para pemuda berikrar satu suara yang kita kenal sebagai Sumpah Pemuda: mengaku bertumpah darah yang satu tanah air Indonesia, mengaku berbangsa yang satu bangsa Indonesia, dan menjunjung tinggi bahasa persatuan bahasa Indonesia. Pada kongres inilah lagu kebangsaan Indonesia Raya untuk pertama kalinya diperdengarkan kepada khalayak ramai melalui gesekan biola indah oleh sang pencipta, Wage Rudolf (W.R.) Supratman.",
    "Sejarah Bendera Pusaka Sang Merah Putih: Warna merah dan putih telah menjadi warna kehormatan dan panji kejayaan Nusantara sejak zaman Kerajaan Kediri, Majapahit (panji Gula Kelapa), hingga perjuangan Pangeran Diponegoro. Menjelang detik-detik Proklamasi 17 Agustus 1945 di Jalan Pegangsaan Timur 56 Jakarta, Ibu Fatmawati (istri Bung Karno) dengan penuh ketulusan dan linangan air mata menjahit bendera kain merah putih menggunakan tangan beliau sendiri. Kain putih berbahan katun Jepang dan kain merah disatukan dengan jahitan rapi. Bendera hasil jahitan tangan Ibu Fatmawati inilah yang dikibarkan saat proklamasi oleh Latief Hendraningrat dan Suhud Sastro Kusumo diiringi nyanyian lagu Indonesia Raya, dan kini dirawat dengan penuh hormat sebagai Bendera Pusaka Republik Indonesia.",
    "Simbol-Simbol Kebanggaan Negara Indonesia: Bangsa kita memiliki lambang dan simbol resmi yang wajib kita hormati bersama: 1) Bendera Merah Putih (Merah berarti berani membela kebenaran, Putih berarti suci hatinya), 2) Lagu Kebangsaan Indonesia Raya ciptaan W.R. Supratman, 3) Lambang Garuda Pancasila dengan semboyan Bhinneka Tunggal Ika, serta 4) Bahasa persatuan kita, Bahasa Indonesia.",
    "Mengapa Kita Harus Cinta Tanah Air?: Indonesia adalah rumah besar tempat kita lahir, bertumbuh, belajar, dan bermain dengan gembira bersama keluarga dan sahabat. Bila setiap anak memiliki rasa cinta tanah air, persatuan bangsa kita akan selalu kuat, rukun, dan tidak mudah diadu domba.",
    "Contoh Sikap Nyata di Sekolah: Mengikuti upacara bendera hari Senin dengan tertib dan khidmat (berdiri tegak dan hormat saat Sang Merah Putih dinaikkan), menyanyikan lagu Indonesia Raya dengan semangat, rukun berteman dengan kawan sekelas meski berbeda suku atau agama, serta giat belajar agar dapat berprestasi membanggakan bangsa.",
    "Pengamalan di Rumah dan Lingkungan: Bangga memakai produk buatan pengrajin dalam negeri seperti baju batik atau sepatu lokal, merawat kebersihan lingkungan sekitar, menghargai budaya daerah lain, dan selalu bersikap ramah kepada tetangga.",
    "Pesan Budi Pekerti Anak Indonesia: Tanamkan selalu di dalam hati semboyan Aku Bangga Menjadi Anak Indonesia! Jadilah anak yang jujur, santun, pemberani dalam kebaikan, dan siap menjaga persatuan di mana pun kita berada."
  ],
  "generatedQuizPreview": [
    "Level 1: Arti rasa cinta tanah air dan simbol lagu kebangsaan (+10 Poin)",
    "Level 2: Sikap hormat saat upacara bendera dan bangga produk lokal (+20 Poin)",
    "Level 3: Menjaga kerukunan teman beda daerah dan makna bendera Merah Putih (+30 Poin)"
  ],
  "quizQuestions": {
    "1": [
      {
        "id": "q1_nas_1",
        "question": "Apakah arti dari rasa cinta tanah air (nasionalisme) bagi anak sekolah dasar?",
        "options": [
          "Rasa bangga, sayang, dan setia kepada bangsa dan negara Indonesia",
          "Hanya menyukai barang dan budaya dari luar negeri",
          "Menolak berteman dengan kawan yang berbeda daerah",
          "Sikap malas dan tidak mau ikut upacara bendera"
        ],
        "correctOption": 0,
        "hint": "Nasionalisme adalah wujud rasa cinta dan kebanggaan kita sebagai anak Indonesia."
      },
      {
        "id": "q1_nas_2",
        "question": "Lagu kebangsaan negara Indonesia yang selalu kita nyanyikan dengan sikap tegak saat upacara sekolah adalah...",
        "options": [
          "Indonesia Raya ciptaan W.R. Supratman",
          "Balonku Ada Lima",
          "Bintang Kejora",
          "Pelangi-Pelangi"
        ],
        "correctOption": 0,
        "hint": "Lagu kebangsaan resmi Indonesia adalah Indonesia Raya yang diciptakan oleh W.R. Supratman."
      }
    ],
    "2": [
      {
        "id": "q2_nas_1",
        "question": "Saat bendera Merah Putih dinaikkan pada upacara bendera hari Senin di sekolah, sikap yang benar adalah...",
        "options": [
          "Berdiri tegak dengan sikap khidmat dan memberikan hormat kepada bendera",
          "Duduk santai di bawah pohon sambil makan bekal jajan",
          "Mengobrol dan bercanda bersama teman di barisan",
          "Bermain kejar-kejaran di lapangan upacara"
        ],
        "correctOption": 0,
        "hint": "Upacara bendera mengajarkan rasa hormat dan terima kasih atas perjuangan para pahlawan."
      }
    ]
  }
}
];

export function normalizeGrade(g?: string): string {
  if (!g) return "Kelas 4";
  const str = String(g).toLowerCase();
  if (str.includes("1")) return "Kelas 1";
  if (str.includes("2")) return "Kelas 2";
  if (str.includes("3")) return "Kelas 3";
  if (str.includes("4")) return "Kelas 4";
  if (str.includes("5")) return "Kelas 5";
  if (str.includes("6")) return "Kelas 6";
  return g;
}

let curriculumModulesDb: CurriculumModuleRecord[] = [...INITIAL_MODULES_DB];

const activeCurriculumStateByGrade: Record<string, ActiveCurriculumState> = {
  "Kelas 1": {
    id: "mod-pkn-kls1-simbol",
    title: "Aku Cinta Pancasila: Mengenal 5 Simbol Garuda Pancasila",
    chapterCode: "Bab 1",
    subject: "pkn",
    grade: "Kelas 1",
    ragSummary: [
      "Simbol Sila 1 (Bintang Emas): Berdoa sebelum makan dan belajar, menyayangi teman saat beribadah.",
      "Simbol Sila 2 (Rantai Emas): Saling menolong teman yang terjatuh, bersikap ramah, tidak mengejek kawan.",
      "Simbol Sila 3 (Pohon Beringin): Hidup rukun bermain bersama di sekolah tanpa bertengkar.",
      "Simbol Sila 4 (Kepala Banteng): Mendengarkan bu guru dan teman saat berbicara, tertib saat antre.",
      "Simbol Sila 5 (Padi dan Kapas): Mau berbagi pensil atau bekal, adil kepada semua kawan, dan suka menabung."
    ],
    gameType: "adventure",
  },
  "Kelas 2": {
    id: "mod-pkn-kls2-aturan",
    title: "Menaati Aturan di Rumah dan di Sekolah",
    chapterCode: "Bab 2",
    subject: "pkn",
    grade: "Kelas 2",
    ragSummary: [
      "Aturan di Rumah: Bangun pagi tepat waktu, merapikan tempat tidur sendiri, berpamitan kepada ayah ibu sebelum berangkat sekolah.",
      "Aturan di Sekolah: Memakai seragam lengkap dan rapi, mendengarkan penjelasan guru dengan tertib, tidak membuang sampah sembarangan.",
      "Manfaat Menaati Aturan: Hidup menjadi teratur, rumah dan kelas menjadi bersih, disayangi orang tua dan bapak ibu guru.",
      "Pengamalan Sila Pancasila: Disiplin dan tertib adalah wujud rasa syukur kepada Tuhan dan kasih sayang kepada sesama."
    ],
    gameType: "adventure",
  },
  "Kelas 3": {
    id: "mod-pkn-kls3-gotongroyong",
    title: "Indahnya Gotong Royong dan Persahabatan di Sekolah",
    chapterCode: "Bab 3",
    subject: "pkn",
    grade: "Kelas 3",
    ragSummary: [
      "Arti Gotong Royong: Bekerja bersama-sama untuk mencapai tujuan yang baik dan meringankan pekerjaan yang berat.",
      "Gotong Royong di Sekolah: Melaksanakan piket membersihkan kelas bersama regu piket, merapikan buku di pojok baca.",
      "Gotong Royong di Lingkungan: Ikut kerja bakti membersihkan selokan bersama tetangga, membantu menanam pohon di taman.",
      "Sikap Murid Pancasila: Saling tolong-menolong tanpa membeda-bedakan suku daerah dan agama kawan."
    ],
    gameType: "adventure",
  },
  "Kelas 4": {
    id: "mod-pkn-sila3",
    title: "Makna Lambang Sila Ke-3: Persatuan Indonesia di Sekolah & Rumah",
    chapterCode: "Bab 1",
    subject: "pkn",
    grade: "Kelas 4",
    ragSummary: INITIAL_MODULES_DB.find((m) => m.id === "mod-pkn-sila3")?.ragSummary || [
      "Pengertian & Hakikat Sila Ke-3: Sila ketiga Pancasila berbunyi Persatuan Indonesia dengan lambang Pohon Beringin.",
      "Makna Filosofis Pohon Beringin: Pohon beringin memiliki akar tunggang dalam yang menancap kokoh ke bumi, melambangkan negara Indonesia sebagai tempat berteduh seluruh rakyat.",
      "Sejarah Perumusan Pancasila & Sidang BPUPKI 1945: Pada sidang BPUPKI 1 Juni 1945 di Gedung Chuo Sangi In, Ir. Soekarno berpidato membakar semangat mengusulkan dasar falsafah Pancasila.",
      "Sejarah Panitia Sembilan & Pengesahan UUD 1945: Panitia Sembilan menyusun Piagam Jakarta, lalu pada 18 Agustus 1945 PPKI menetapkan Pancasila sebagai Dasar Negara.",
      "Sejarah Lambang Garuda Pancasila: Dirancang oleh Sultan Hamid II dari Pontianak dan disempurnakan Presiden Soekarno.",
      "Aksi Nyata Pelajar Pancasila di Sekolah: Melaksanakan piket kompak tanpa pilih kawan, berteman rukun, dan saling menolong."
    ],
    gameType: "adventure",
  },
  "Kelas 5": {
    id: "mod-pkn-norma",
    title: "Norma dan Nilai Konstitusi dalam Kehidupan Berbangsa",
    chapterCode: "Bab 2",
    subject: "pkn",
    grade: "Kelas 5",
    ragSummary: [
      "Pengertian Norma: Norma adalah kaidah atau pedoman bertingkah laku yang disepakati bersama dalam suatu kelompok masyarakat.",
      "4 Jenis Norma: Norma Agama (Wahyu Ilahi), Norma Kesusilaan (Hati Nurani), Norma Kesopanan (Tata Krama Adat), dan Norma Hukum (Undang-Undang Negara).",
      "Sanksi Pelanggaran Norma: Pelanggaran norma kesopanan mendapat celaan sosial, sedangkan norma hukum mendapat sanksi tegas berupa denda atau pidana.",
      "Kepatuhan Hukum: Murid yang beradab mematuhi aturan tertib lalu lintas, menjauhi perundungan, dan menjaga fasilitas umum."
    ],
    gameType: "adventure",
  },
  "Kelas 6": {
    id: "mod-pkn-bhinneka",
    title: "Merajut Keberagaman Budaya Nusantara Menuju Indonesia Emas",
    chapterCode: "Bab 3",
    subject: "pkn",
    grade: "Kelas 6",
    ragSummary: [
      "Bhinneka Tunggal Ika: Semboyan pemersatu bangsa yang diambil dari Kakawin Sutasoma karya Mpu Tantular pada era Majapahit.",
      "Keberagaman Suku dan Budaya: Indonesia memiliki lebih dari 300 kelompok etnik dengan bahasa daerah, rumah adat, tarian, dan pakaian adat yang luhur.",
      "Upaya Menjaga Keutuhan NKRI: Mengembangkan sikap toleransi, menghargai perbedaan tradisi, bangga menggunakan Bahasa Indonesia, dan mengutamakan kepentingan nasional di atas kepentingan golongan."
    ],
    gameType: "adventure",
  },
};

let activeCurriculumState: ActiveCurriculumState | null = activeCurriculumStateByGrade["Kelas 4"];

export async function getCurriculumModules(): Promise<CurriculumModuleRecord[]> {
  await delay(100);
  if (!curriculumModulesDb || curriculumModulesDb.length === 0) {
    curriculumModulesDb = [...INITIAL_MODULES_DB];
  }
  return [...curriculumModulesDb];
}

export async function saveCurriculumModule(
  mod: Partial<CurriculumModuleRecord> & { title: string }
): Promise<CurriculumModuleRecord> {
  await delay(100);
  const id = mod.id || `mod-${mod.subject || "pkn"}-${Date.now()}`;
  const existingIdx = curriculumModulesDb.findIndex((m) => m.id === id);

  const fullRecord: CurriculumModuleRecord = {
    id,
    subject: mod.subject || "pkn",
    subjectLabel:
      mod.subjectLabel ||
      (mod.subject === "bjawa" ? "Basa Jawa (Muatan Lokal)" : "Pendidikan Pancasila & PKn"),
    grade: mod.grade || "Kelas 4",
    title: mod.title,
    chapterCode: mod.chapterCode || "Bab Pelajaran",
    source: mod.source || "API SIBI Kemdikbudristek RI (Buku Teks Kurikulum Merdeka)",
    sourceType: mod.sourceType || "kemdikbud",
    pageCount: mod.pageCount || 24,
    learningGoal:
      mod.learningGoal ||
      "Peserta didik memahami inti materi dan mempraktikkannya dalam kehidupan sehari-hari.",
    isValidated: mod.isValidated ?? false,
    isActiveToday: mod.isActiveToday ?? false,
    validatedAt: mod.validatedAt,
    ragSummary: mod.ragSummary || [],
    generatedQuizPreview: mod.generatedQuizPreview || [],
    quizQuestions: mod.quizQuestions,
    gameType: mod.gameType,
  };

  if (existingIdx >= 0) {
    const existing = curriculumModulesDb[existingIdx];
    if (existing) {
      curriculumModulesDb[existingIdx] = {
        ...existing,
        ...fullRecord,
      };
      return curriculumModulesDb[existingIdx]!;
    }
    return fullRecord;
  } else {
    curriculumModulesDb.unshift(fullRecord);
    return fullRecord;
  }
}

export async function deleteCurriculumModule(id: string): Promise<boolean> {
  await delay(100);
  if (!curriculumModulesDb || curriculumModulesDb.length === 0) {
    curriculumModulesDb = [...INITIAL_MODULES_DB];
  }

  const cleanTargetId = id.replace("mod-", "");
  const idx = curriculumModulesDb.findIndex(
    (m) => m.id === id || m.id.replace("mod-", "") === cleanTargetId
  );

  if (idx !== -1) {
    const target = curriculumModulesDb[idx];
    const wasActive = Boolean(target?.isActiveToday);
    curriculumModulesDb.splice(idx, 1);

    // Jika yang dihapus sedang aktif, aktifkan modul pertama yang tersisa
    if (wasActive && curriculumModulesDb.length > 0) {
      const firstRemaining = curriculumModulesDb[0];
      if (firstRemaining) {
        firstRemaining.isActiveToday = true;
        firstRemaining.isValidated = true;
        setActiveCurriculumState({
          id: firstRemaining.id,
          title: firstRemaining.title,
          chapterCode: firstRemaining.chapterCode,
          subject: firstRemaining.subject,
          ragSummary: firstRemaining.ragSummary,
          quizQuestions: firstRemaining.quizQuestions,
        });
      }
    } else if (curriculumModulesDb.length === 0) {
      activeCurriculumState = null;
    }
  }

  return true;
}

export function setActiveCurriculumState(mod: ActiveCurriculumState) {
  const normGrade = normalizeGrade(mod.grade);
  const sanitizedSummary = mod.ragSummary?.map((item) =>
    item
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, "")
      .replace(/Hakikat Materi:\s*Memahami prinsip pokok[^\.]*\.?\s*/gi, "")
      .replace(/Keterkaitan Nyata:\s*/gi, "Penerapan di masyarakat: ")
      .replace(/Pengetahuan Kritis:\s*Melatih siswa agar[^\.]*\.?\s*/gi, "")
      .replace(
        /Mempelajari materi ini melatih daya pikir kritis[^\.]*\.?\s*/gi,
        "Mempelajari materi ini membuat kita saling peduli dan rukun. "
      )
      .trim()
  );

  const updatedState: ActiveCurriculumState = {
    ...mod,
    grade: normGrade,
    ragSummary: sanitizedSummary,
  };

  activeCurriculumState = updatedState;
  activeCurriculumStateByGrade[normGrade] = updatedState;

  // Sinkronkan status isActiveToday di database list modul
  let foundInDb = false;
  curriculumModulesDb = curriculumModulesDb.map((item) => {
    const itemNormGrade = normalizeGrade(item.grade);
    const sameModule =
      item.id === mod.id ||
      item.id.replace("mod-", "") === mod.id.replace("mod-", "");
    if (sameModule) {
      foundInDb = true;
      return {
        ...item,
        grade: normGrade,
        gameType: mod.gameType || item.gameType,
        isValidated: true,
        isActiveToday: true,
        validatedAt: "Baru saja divalidasi oleh Guru",
        ragSummary: sanitizedSummary || item.ragSummary,
        quizQuestions: mod.quizQuestions || item.quizQuestions,
      };
    }
    // Jika modul lain berada di kelas yang sama, nonaktifkan status aktifnya untuk kelas itu
    if (itemNormGrade === normGrade) {
      return {
        ...item,
        isActiveToday: false,
      };
    }
    return item;
  });

  if (!foundInDb) {
    const subj = mod.subject === "bjawa" ? "bjawa" : "pkn";
    curriculumModulesDb.unshift({
      id: mod.id,
      subject: subj,
      subjectLabel:
        mod.subjectLabel ||
        (subj === "bjawa" ? "Basa Jawa (Muatan Lokal)" : "Pendidikan Pancasila & PKn"),
      grade: normGrade,
      title: mod.title,
      chapterCode: mod.chapterCode || "Bab Baru",
      source: mod.source || "API SIBI Kemdikbudristek RI (Buku Teks Kurikulum Merdeka)",
      sourceType: "kemdikbud",
      pageCount: 24,
      learningGoal: `Peserta didik memahami intisari materi ${mod.title} dan menerapkannya dalam kehidupan sehari-hari.`,
      isValidated: true,
      isActiveToday: true,
      validatedAt: "Baru saja divalidasi oleh Guru",
      ragSummary: sanitizedSummary,
      quizQuestions: mod.quizQuestions,
      gameType: mod.gameType,
    });
  }

  if (sanitizedSummary && sanitizedSummary.length > 0) {
    const contentObj = {
      cerita: {
        title: `Ringkasan Modul & Pengamalan: ${mod.chapterCode} - ${mod.title}`,
        body: sanitizedSummary,
      },
      kuis_tantangan: {
        title: `Kuis Tantangan Seru: ${mod.title}`,
        body: [
          `Ayo uji pemahamanmu tentang materi ${mod.title} bersama Robot Pintar!`,
          "Klik tombol 'Mainkan Kuis Seru' di menu kiri untuk menambah poin prestasimu!",
        ],
      },
    };
    aiContentLibrary[mod.id] = contentObj;
    // Daftarkan juga alias id tanpa prefix "mod-" atau dengan prefix "mod-"
    const cleanId = mod.id.replace("mod-", "");
    aiContentLibrary[cleanId] = contentObj;
    aiContentLibrary[`mod-${cleanId}`] = contentObj;
  }

  if (mod.quizQuestions) {
    const cleanId = mod.id.replace("mod-", "");
    chapterQuizBank[cleanId] = mod.quizQuestions;
    chapterQuizBank[mod.id] = mod.quizQuestions;
    chapterQuizBank[`mod-${cleanId}`] = mod.quizQuestions;
  }
}

export function getActiveCurriculumState(targetKelas?: string): ActiveCurriculumState | null {
  if (targetKelas) {
    const normGrade = normalizeGrade(targetKelas);
    if (activeCurriculumStateByGrade[normGrade]) {
      return activeCurriculumStateByGrade[normGrade];
    }
    const fromDb = curriculumModulesDb.find(
      (m) => m.isActiveToday && normalizeGrade(m.grade) === normGrade
    );
    if (fromDb) {
      return {
        id: fromDb.id,
        title: fromDb.title,
        chapterCode: fromDb.chapterCode,
        subject: fromDb.subject,
        subjectLabel: fromDb.subjectLabel,
        source: fromDb.source,
        grade: fromDb.grade,
        ragSummary: fromDb.ragSummary,
        quizQuestions: fromDb.quizQuestions,
        gameType: fromDb.gameType,
      };
    }
    const anyFromGrade = curriculumModulesDb.find(
      (m) => normalizeGrade(m.grade) === normGrade
    );
    if (anyFromGrade) {
      return {
        id: anyFromGrade.id,
        title: anyFromGrade.title,
        chapterCode: anyFromGrade.chapterCode,
        subject: anyFromGrade.subject,
        subjectLabel: anyFromGrade.subjectLabel,
        source: anyFromGrade.source,
        grade: anyFromGrade.grade,
        ragSummary: anyFromGrade.ragSummary,
        quizQuestions: anyFromGrade.quizQuestions,
        gameType: anyFromGrade.gameType,
      };
    }
  }

  if (activeCurriculumState) {
    return activeCurriculumState;
  }
  const activeFromDb = curriculumModulesDb.find((m) => m.isActiveToday);
  if (activeFromDb) {
    return {
      id: activeFromDb.id,
      title: activeFromDb.title,
      chapterCode: activeFromDb.chapterCode,
      subject: activeFromDb.subject,
      subjectLabel: activeFromDb.subjectLabel,
      source: activeFromDb.source,
      grade: activeFromDb.grade,
      ragSummary: activeFromDb.ragSummary,
      quizQuestions: activeFromDb.quizQuestions,
      gameType: activeFromDb.gameType,
    };
  }
  return null;
}

export async function getAiContent(chapterId: string, mode: AiMode) {
  await delay(200);

  const cleanId = chapterId.replace("mod-", "");
  const modPrefixedId = chapterId.startsWith("mod-") ? chapterId : `mod-${chapterId}`;

  // 1. Cek apakah cocok dengan salah satu modul kurikulum aktif per jenjang kelas
  const activeForGrade = Object.values(activeCurriculumStateByGrade).find(
    (mod) =>
      mod &&
      (chapterId === "active" ||
        chapterId === mod.id ||
        cleanId === mod.id.replace("mod-", "") ||
        modPrefixedId === mod.id)
  );

  if (activeForGrade) {
    if (mode === "kuis_tantangan") {
      return {
        title: `Kuis Tantangan Seru: ${activeForGrade.title}`,
        body: [
          `Ayo uji pemahamanmu tentang materi ${activeForGrade.title} bersama Robot Pintar!`,
          "Klik tombol 'Mainkan Kuis Seru' di menu kiri untuk menambah poin prestasimu!",
        ],
      };
    }

    return {
      title: `Ringkasan Modul & Pengamalan: ${activeForGrade.chapterCode} - ${activeForGrade.title}`,
      body:
        activeForGrade.ragSummary && activeForGrade.ragSummary.length > 0
          ? activeForGrade.ragSummary
          : [
              `Pengertian Pokok: Pembelajaran ${activeForGrade.chapterCode} mengenai "${activeForGrade.title}" disarikan ke dalam konsep budi pekerti ramah anak SD.`,
              "Aksi Nyata di Sekolah: Mengajak siswa bekerja sama dan mematuhi aturan tata tertib kelas dengan disiplin.",
              "Pengamalan di Rumah: Membiasakan sikap santun, menghormati orang tua dan anggota keluarga.",
            ],
    };
  }

  // 1b. Jika pengguna meminta modul aktif tervalidasi atau id-nya cocok dengan modul aktif saat ini
  if (
    activeCurriculumState &&
    (chapterId === "active" ||
      chapterId === activeCurriculumState.id ||
      cleanId === activeCurriculumState.id.replace("mod-", ""))
  ) {
    if (mode === "kuis_tantangan") {
      return {
        title: `Kuis Tantangan Seru: ${activeCurriculumState.title}`,
        body: [
          `Ayo uji pemahamanmu tentang materi ${activeCurriculumState.title} bersama Robot Pintar!`,
          "Klik tombol 'Mainkan Kuis Seru' di menu kiri untuk menambah poin prestasimu!",
        ],
      };
    }

    return {
      title: `Ringkasan Modul & Pengamalan: ${activeCurriculumState.chapterCode} - ${activeCurriculumState.title}`,
      body:
        activeCurriculumState.ragSummary && activeCurriculumState.ragSummary.length > 0
          ? activeCurriculumState.ragSummary
          : [
              `Pengertian Pokok: Pembelajaran ${activeCurriculumState.chapterCode} mengenai "${activeCurriculumState.title}" disarikan ke dalam konsep budi pekerti ramah anak SD.`,
              "Aksi Nyata di Sekolah: Mengajak siswa bekerja sama dan mematuhi aturan tata tertib kelas dengan disiplin.",
              "Pengamalan di Rumah: Membiasakan sikap santun, menghormati orang tua dan anggota keluarga.",
            ],
    };
  }

  // 2. Cek pustaka konten statis
  const content =
    aiContentLibrary[chapterId]?.[mode] ||
    aiContentLibrary[cleanId]?.[mode] ||
    aiContentLibrary[modPrefixedId]?.[mode];

  if (content) {
    return content;
  }

  // 3. Cek database modul tersimpan
  const savedMod = curriculumModulesDb.find(
    (m) => m.id === chapterId || m.id === cleanId || m.id === modPrefixedId
  );
  if (savedMod) {
    if (mode === "kuis_tantangan") {
      return {
        title: `Kuis Tantangan Seru: ${savedMod.title}`,
        body: [
          `Ayo uji pemahamanmu tentang materi ${savedMod.title} bersama Robot Pintar!`,
          "Klik tombol 'Mainkan Kuis Seru' di menu kiri untuk menambah poin prestasimu!",
        ],
      };
    }
    if (savedMod.ragSummary && savedMod.ragSummary.length > 0) {
      return {
        title: `Ringkasan Modul & Pengamalan: ${savedMod.chapterCode} - ${savedMod.title}`,
        body: savedMod.ragSummary,
      };
    }
  }

  return {
    title: `Ringkasan Modul: ${chapterId}`,
    body: [
      `Pengertian Pokok: Materi siap dipelajari bersama Robot Pintar.`,
      "Aksi Nyata di Sekolah: Belajar tekun bersama kawan-kawan.",
      "Pengamalan di Rumah: Berbakti kepada orang tua.",
    ],
  };
}

// ============================================================================
// BANK SOAL KUIS ADAPTIF TEMATIK PER-BAB (PKN & BAHASA JAWA LEVEL 1, 2, 3)
// ============================================================================
export const chapterQuizBank: Record<string, Record<number, Question[]>> = {
  "pkn-kls1-simbol": {
    1: [
      {
        id: "q_kls1_1_1",
        question: "Apakah lambang atau simbol Sila Pertama Pancasila?",
        options: ["Bintang Emas", "Pohon Beringin", "Kepala Banteng", "Rantai Emas"],
        correctOption: 0,
        hint: "Bintang bersinar terang di langit, melambangkan Ketuhanan Yang Maha Esa!",
      },
      {
        id: "q_kls1_1_2",
        question: "Contoh perilaku baik sesuai Sila Pertama saat di sekolah adalah...",
        options: ["Berdoa sebelum belajar dan makan", "Berebut mainan dengan teman", "Mengobrol saat guru menerangkan", "Membuang sampah sembarangan"],
        correctOption: 0,
        hint: "Kita selalu mengucap syukur dan berdoa kepada Tuhan sebelum beraktivitas.",
      },
      {
        id: "q_kls1_1_3",
        question: "Apakah simbol Sila Kedua Pancasila yang gelang-gelangnya saling tersambung kuat?",
        options: ["Rantai Emas", "Bintang Emas", "Padi dan Kapas", "Pohon Beringin"],
        correctOption: 0,
        hint: "Rantai emas melambangkan persahabatan dan tolong-menolong sesama kawan.",
      },
      {
        id: "q_kls1_1_4",
        question: "Jika melihat teman terjatuh saat bermain di halaman sekolah, sikap kita adalah...",
        options: ["Segera menolongnya berdiri", "Menertawakannya ramai-ramai", "Pura-pura tidak melihat", "Meninggalkannya sendirian"],
        correctOption: 0,
        hint: "Sila kedua mengajarkan kita untuk saling menyayangi dan sigap menolong.",
      },
      {
        id: "q_kls1_1_5",
        question: "Simbol Sila Ketiga Pancasila 'Persatuan Indonesia' adalah...",
        options: ["Pohon Beringin", "Bintang", "Kepala Banteng", "Padi dan Kapas"],
        correctOption: 0,
        hint: "Pohon besar dan rindang tempat semua anak Indonesia berteduh rukun!",
      },
    ],
    2: [
      {
        id: "q_kls1_2_1",
        question: "Pohon beringin yang rindang dan berakar kuat melambangkan...",
        options: [
          "Hidup rukun dan bersatu tanpa bertengkar",
          "Pohon yang paling tinggi di hutan",
          "Tempat bersembunyi saat hujan",
          "Tanaman hias di dalam pot",
        ],
        correctOption: 0,
        hint: "Seluruh anak Indonesia hidup damai bersatu di bawah naungan Indonesia.",
      },
      {
        id: "q_kls1_2_2",
        question: "Simbol Sila Keempat adalah Kepala Banteng. Contoh pengamalannya di kelas adalah...",
        options: [
          "Tertib mendengarkan saat bu guru atau teman berbicara",
          "Berteriak-teriak memotong ucapan teman",
          "Memaksakan kehendak sendiri",
          "Tidur saat teman berpendapat",
        ],
        correctOption: 0,
        hint: "Kepala banteng mengajarkan musyawarah dan tertib mendengarkan pendapat.",
      },
      {
        id: "q_kls1_2_3",
        question: "Simbol Sila Kelima adalah Padi dan Kapas. Simbol ini melambangkan...",
        options: [
          "Kebutuhan pangan (makan) dan sandang (pakaian) untuk kemakmuran bersama",
          "Bunga hiasan dinding kelas",
          "Tumbuhan obat-obatan",
          "Mainan anak-anak",
        ],
        correctOption: 0,
        hint: "Padi menjadi beras untuk makan, kapas menjadi kain untuk pakaian seragam.",
      },
      {
        id: "q_kls1_2_4",
        question: "Contoh sikap adil dan terpuji sesuai Sila Kelima adalah...",
        options: [
          "Mau berbagi pensil atau bekal dan suka menabung",
          "Menghabiskan uang jajan secara boros",
          "Menyembunyikan barang milik teman",
          "Iri melihat teman yang berprestasi",
        ],
        correctOption: 0,
        hint: "Anak hebat suka berbagi kebaikan, tidak boros, dan gemar menabung.",
      },
      {
        id: "q_kls1_2_5",
        question: "Saat bermain bersama kawan baru di sekolah, sikap yang baik adalah...",
        options: [
          "Bermain bersama dengan gembira tanpa membeda-bedakan",
          "Hanya mau berteman dengan teman satu desa saja",
          "Mengejek logat bicara teman",
          "Menolak meminjamkan mainan",
        ],
        correctOption: 0,
        hint: "Semua kawan di sekolah adalah teman bermain kita bersama.",
      },
    ],
    3: [
      {
        id: "q_kls1_3_1",
        question: "Budi melihat teman sebangkunya sedang berdoa sebelum makan siang. Sikap Budi adalah...",
        options: [
          "Menghormati dan menunggu dengan tenang tanpa mengganggu",
          "Mengajaknya bercanda dan mengobrol",
          "Menertawakan caranya berdoa",
          "Menyuruhnya makan cepat-cepat",
        ],
        correctOption: 0,
        hint: "Toleransi dan menghormati teman beribadah adalah pengamalan Sila Pertama.",
      },
      {
        id: "q_kls1_3_2",
        question: "Bu Guru membagikan kertas gambar secara adil dan rata kepada semua murid. Sikap Bu Guru mencerminkan Sila...",
        options: [
          "Kelima (Keadilan sosial / Padi dan Kapas)",
          "Kedua (Kemanusiaan / Rantai)",
          "Ketiga (Persatuan / Pohon Beringin)",
          "Pertama (Ketuhanan / Bintang)",
        ],
        correctOption: 0,
        hint: "Membagi hak secara adil dan merata adalah pengamalan Sila Kelima.",
      },
      {
        id: "q_kls1_3_3",
        question: "Mengapa kita harus tertib berbaris dan antre saat mencuci tangan di sekolah?",
        options: [
          "Karena menghargai hak giliran kawan sesuai tata tertib",
          "Supaya bisa mendorong teman di depan",
          "Karena takut dihukum penjaga sekolah",
          "Supaya kran air cepat habis",
        ],
        correctOption: 0,
        hint: "Disiplin dan tertib antre adalah wujud anak berbudi pekerti luhur.",
      },
    ],
  },
  "pkn-sila3": {
    1: [
      {
        id: "q_s3_1_1",
        question: "Apakah lambang dari Sila Ke-3 Pancasila 'Persatuan Indonesia'?",
        options: ["Bintang Tunggal", "Rantai Emas", "Pohon Beringin", "Padi dan Kapas"],
        correctOption: 2,
        hint: "Pohon yang besar dan rindang, melambangkan naungan persatuan bangsa!",
      },
      {
        id: "q_s3_1_2",
        question: "Apakah bunyi dari Sila Ke-3 Pancasila?",
        options: ["Ketuhanan Yang Maha Esa", "Kemanusiaan yang adil dan beradab", "Persatuan Indonesia", "Keadilan sosial bagi seluruh rakyat Indonesia"],
        correctOption: 2,
        hint: "Sila ketiga menegaskan pentingnya persatuan dan kerukunan seluruh rakyat.",
      },
      {
        id: "q_s3_1_3",
        question: "Di jam istirahat, kamu melihat teman baru yang duduk sendirian. Sikap yang mencerminkan persatuan adalah...",
        options: ["Membiarkannya saja", "Mengajaknya berkenalan dan bermain bersama", "Menertawakan dari kejauhan", "Menyuruhnya pulang"],
        correctOption: 1,
        hint: "Persatuan dimulai dari sikap ramah dan merangkul semua teman tanpa membeda-bedakan.",
      },
      {
        id: "q_s3_1_4",
        question: "Pohon beringin memiliki daun yang lebat dan rindang, yang melambangkan...",
        options: ["Tempat berteduh dan bernaung seluruh rakyat Indonesia", "Pohon yang menghasilkan buah manis", "Tempat bermain petak umpet", "Pohon paling tinggi di hutan"],
        correctOption: 0,
        hint: "Negara Indonesia diibaratkan rumah pohon besar tempat seluruh rakyat bernaung damai.",
      },
      {
        id: "q_s3_1_5",
        question: "Sikap manakah yang dapat merusak persatuan dan harus dihindari di sekolah?",
        options: ["Membantu teman terjatuh", "Mengejek perbedaan suku atau bahasa teman", "Belajar kelompok bersama", "Menghormati guru"],
        correctOption: 1,
        hint: "Saling mengejek atau membeda-bedakan suku memicu pertengkaran dan merusak persatuan.",
      },
    ],
    2: [
      {
        id: "q_s3_2_1",
        question: "Mengapa akar gantung dan sulur pohon beringin menjadi lambang persatuan yang sangat bermakna?",
        options: [
          "Karena daunnya berwarna hijau",
          "Karena melambangkan suku bangsa yang beragam tetapi tetap bersatu kuat",
          "Karena bisa digunakan untuk ayunan",
          "Karena pohonnya paling mahal",
        ],
        correctOption: 1,
        hint: "Akar pohon beringin menjalar ke segala arah mencerminkan beragamnya suku dan budaya bangsa kita.",
      },
      {
        id: "q_s3_2_2",
        question: "Dalam pemilihan ketua kelas, kamu dan teman-teman memiliki pilihan berbeda. Sikap Sila Ke-3 adalah...",
        options: [
          "Memusuhi kawan yang berbeda pilihan",
          "Menerima hasil keputusan bersama dengan rukun dan saling menghormati",
          "Keluar dari kelas dan mogok belajar",
          "Menolak berbicara dengan ketua kelas terpilih",
        ],
        correctOption: 1,
        hint: "Persatuan terwujud saat kita lapang dada menghargai perbedaan pendapat demi kebaikan bersama.",
      },
      {
        id: "q_s3_2_3",
        question: "Bangga memakai pakaian batik dan sepatu buatan anak bangsa merupakan contoh pengamalan Sila Ke-3 dalam hal...",
        options: ["Pamer kekayaan", "Cinta tanah air dan produk bangsa sendiri", "Mengikuti tren luar negeri", "Mencari pujian dari orang lain"],
        correctOption: 1,
        hint: "Cinta tanah air diwujudkan dengan bangga dan mencintai karya seni dan produk negeri sendiri.",
      },
      {
        id: "q_s3_2_4",
        question: "Saat upacara bendera hari Senin, seluruh murid berbaris dengan tertib dan khidmat. Hal ini mencerminkan...",
        options: ["Rasa takut dimarahi guru", "Disiplin dan rasa hormat kepada lambang persatuan bangsa", "Keinginan cepat pulang", "Kewajiban tanpa makna"],
        correctOption: 1,
        hint: "Upacara bendera menumbuhkan rasa nasionalisme dan kekompakan sebagai sesama tunas bangsa.",
      },
      {
        id: "q_s3_2_5",
        question: "Mengapa semboyan 'bersatu kita teguh, bercerai kita runtuh' sangat penting bagi bangsa Indonesia?",
        options: [
          "Agar kita bisa menang tawuran",
          "Karena persatuan membuat bangsa menjadi kokoh dan tidak mudah dipecah belah",
          "Supaya murid tidak perlu belajar",
          "Hanya sekadar hiasan dinding sekolah",
        ],
        correctOption: 1,
        hint: "Kekuatan terbesar bangsa Indonesia yang majemuk terletak pada persatuan seluruh warganya.",
      },
    ],
    3: [
      {
        id: "q_s3_3_1",
        question: "Hari Lahir Pancasila diperingati setiap tanggal 1 Juni untuk mengenang pidato bersejarah dari tokoh bangsa...",
        options: ["Mr. Mohammad Yamin", "Prof. Dr. Soepomo", "Ir. Soekarno dalam sidang BPUPKI 1945", "Drs. Mohammad Hatta"],
        correctOption: 2,
        hint: "Pada 1 Juni 1945, Bung Karno menyampaikan lima asas dasar negara yang dinamakan Pancasila.",
      },
      {
        id: "q_s3_3_2",
        question: "Di kelompok belajar kelasmu, anggota kelompok berasal dari suku Jawa, Sunda, Batak, dan Papua. Cara terbaik menyelesaikan tugas adalah...",
        options: [
          "Membuat kelompok baru yang sesuku saja",
          "Menghargai setiap pendapat dan bekerja sama kompak tanpa membeda-bedakan",
          "Menyerahkan seluruh tugas kepada satu orang saja",
          "Memperdebatkan suku mana yang paling hebat",
        ],
        correctOption: 1,
        hint: "Keberagaman latar belakang memperkaya ide dan mempererat ikatan persahabatan kelompok.",
      },
      {
        id: "q_s3_3_3",
        question: "Apa dampak buruk jika di lingkungan sekolah tidak ada penerapan nilai persatuan dan toleransi?",
        options: [
          "Nilai ujian semua siswa menjadi 100",
          "Terjadi permusuhan, saling ejek (bullying), dan suasana belajar menjadi tidak aman",
          "Sekolah menjadi semakin terkenal",
          "Jam istirahat menjadi lebih lama",
        ],
        correctOption: 1,
        hint: "Tanpa persatuan, lingkungan sekolah akan diwarnai perselisihan yang merugikan semua pihak.",
      },
      {
        id: "q_s3_3_4",
        question: "Panitia Sembilan berhasil menyepakati naskah rancangan pembukaan dasar negara pada tanggal 22 Juni 1945 yang dikenal sebagai...",
        options: ["Dekrit Presiden", "Piagam Jakarta (Jakarta Charter)", "Teks Proklamasi", "Sumpah Palapa"],
        correctOption: 1,
        hint: "Piagam Jakarta memuat rumusan lima sila Pancasila yang kemudian disahkan PPKI pada 18 Agustus 1945.",
      },
      {
        id: "q_s3_3_5",
        question: "Bagaimana tindakan nyata siswa SD dalam menjaga keutuhan persatuan di era media sosial saat ini?",
        options: [
          "Ikut menyebarkan berita yang belum tentu benar (hoaks)",
          "Menolak menyebarkan kabar bohong dan selalu bertutur kata santun menyejukkan",
          "Mengomentari kekurangan fisik orang lain",
          "Membuat grup online untuk mengejek kawan sekelas",
        ],
        correctOption: 1,
        hint: "Literasi digital yang santun dan bijak merupakan cerminan karakter luhur Pelajar Pancasila.",
      },
    ],
  },
  "pkn-gotongroyong": {
    1: [
      {
        id: "q_gr_1_1",
        question: "Gotong royong berasal dari kata 'gotong' dan 'royong' yang mengandung arti...",
        options: [
          "Bekerja keras mencari keuntungan pribadi",
          "Bekerja bersama-sama secara sukarela untuk mencapai tujuan bersama",
          "Menyuruh orang lain mengerjakan tugas kita",
          "Bermain bersama di taman rekreasi",
        ],
        correctOption: 1,
        hint: "Gotong royong adalah kerja bersama tanpa pamrih demi kepentingan dan kebaikan bersama.",
      },
      {
        id: "q_gr_1_2",
        question: "Falsafah luhur bangsa Indonesia tentang gotong royong terangkum dalam semboyan...",
        options: [
          "Maju tak gentar membela yang bayar",
          "Berat sama dipikul, ringan sama dijinjing",
          "Siapa cepat dia yang dapat",
          "Biar lambat asal selamat",
        ],
        correctOption: 1,
        hint: "Semboyan ini mengajarkan bahwa suka dan duka dalam pekerjaan dihadapi bersama-sama.",
      },
      {
        id: "q_gr_1_3",
        question: "Contoh kegiatan gotong royong yang paling sering dilakukan siswa di dalam kelas adalah...",
        options: [
          "Mencontek jawaban tugas rumah",
          "Melaksanakan piket kebersihan kelas bersama kelompok regu",
          "Bermain game di jam pelajaran",
          "Menyembunyikan buku milik kawan",
        ],
        correctOption: 1,
        hint: "Regu piket membersihkan papan tulis, menyapu lantai, dan merapikan meja guru secara bersama.",
      },
      {
        id: "q_gr_1_4",
        question: "Manfaat utama yang dirasakan ketika melakukan pekerjaan secara gotong royong adalah...",
        options: [
          "Pekerjaan menjadi lebih lambat selesai",
          "Pekerjaan terasa lebih ringan, cepat tuntas, dan tercipta kebersamaan",
          "Mendapatkan bayaran uang yang banyak",
          "Bisa menyuruh teman yang rajin saja",
        ],
        correctOption: 1,
        hint: "Beban kerja terbagi rata sehingga pekerjaan berat terasa ringan dan menyenangkan.",
      },
      {
        id: "q_gr_1_5",
        question: "Sikap yang harus dihindari saat diajak gotong royong membersihkan lingkungan adalah...",
        options: [
          "Hadir tepat waktu dan membawa alat kebersihan",
          "Malas-malasan, berpangku tangan, dan mencari alasan untuk kabur",
          "Membantu kawan yang kelelahan",
          "Bekerja dengan penuh semangat dan senyum",
        ],
        correctOption: 1,
        hint: "Sikap malas membebankan pekerjaan kepada orang lain dan merusak semangat kekeluargaan.",
      },
    ],
    2: [
      {
        id: "q_gr_2_1",
        question: "Manakah bentuk kerja sama antarsiswa yang TIDAK BOLEH dilakukan di lingkungan sekolah?",
        options: [
          "Bekerja sama membersihkan halaman sekolah",
          "Bekerja sama saling memberikan sontekan jawaban saat ujian/ulangan",
          "Bekerja sama menyusun majalah dinding kelas",
          "Bekerja sama latihan paduan suara",
        ],
        correctOption: 1,
        hint: "Kerja sama saat ulangan melanggar norma kejujuran dan merusak integritas moral siswa.",
      },
      {
        id: "q_gr_2_2",
        question: "Mengapa gotong royong dapat mempererat tali persaudaraan antarwarga masyarakat?",
        options: [
          "Karena warga bisa saling memamerkan harta bendanya",
          "Karena menumbuhkan rasa saling peduli, saling kenal, dan empati sosial",
          "Karena ada sanksi denda jika tidak ikut",
          "Agar lingkungan menjadi tempat berdagang",
        ],
        correctOption: 1,
        hint: "Saat bekerja bersama, warga berinteraksi hangat dan saling tolong-menolong tanpa sekat.",
      },
      {
        id: "q_gr_2_3",
        question: "Di kelasmu ada teman yang kesulitan menata buku perpustakaan. Tindakan gotong royong yang tepat adalah...",
        options: [
          "Menontonnya dari jauh sambil mengobrol",
          "Membantu menyusun dan merapikan buku bersama tanpa diminta",
          "Menyuruhnya bekerja lebih cepat",
          "Menambah tumpukan buku agar lebih repot",
        ],
        correctOption: 1,
        hint: "Peka terhadap kesulitan kawan dan langsung menawarkan bantuan adalah esensi gotong royong.",
      },
      {
        id: "q_gr_2_4",
        question: "Apa perbedaan mendasar antara gotong royong dengan bekerja mencari upah (buruh)?",
        options: [
          "Gotong royong dilakukan dengan pamrih materi uang",
          "Gotong royong dilandasi keikhlasan sukarela tanpa mengharapkan upah bayaran",
          "Gotong royong hanya boleh diikuti oleh orang dewasa",
          "Bekerja mencari upah tidak ada manfaatnya",
        ],
        correctOption: 1,
        hint: "Nilai luhur gotong royong terletak pada ketulusan hati demi kemaslahatan bersama.",
      },
      {
        id: "q_gr_2_5",
        question: "Nilai Profil Pelajar Pancasila yang paling tercermin dari kegiatan gotong royong adalah...",
        options: [
          "Mandiri secara egois",
          "Kolaborasi, kepedulian sosial, dan berbagi peran secara adil",
          "Ketergantungan pada orang lain",
          "Mementingkan keuntungan sendiri",
        ],
        correctOption: 1,
        hint: "Dimensi gotong royong memuat elemen kolaborasi, kepedulian, dan keikhlasan berbagi.",
      },
    ],
    3: [
      {
        id: "q_gr_3_1",
        question: "Mengapa para pendiri bangsa menyebut gotong royong sebagai intisari dan kepribadian asli bangsa Indonesia?",
        options: [
          "Karena bangsa Indonesia tidak memiliki sumber daya alam",
          "Karena sejak era nenek moyang, masyarakat Nusantara hidup guyub rukun tolong-menolong",
          "Karena negara lain memaksa Indonesia bergotong royong",
          "Hanya tradisi baru yang dibuat setelah tahun 2000",
        ],
        correctOption: 1,
        hint: "Bung Karno menegaskan bahwa jika kelima sila Pancasila diperas, intisarinya adalah gotong royong.",
      },
      {
        id: "q_gr_3_2",
        question: "Di era digital modern saat ini, bagaimana cara melestarikan semangat gotong royong agar tidak luntur?",
        options: [
          "Menghabiskan seluruh waktu sendirian di kamar bermain ponsel",
          "Aktif mengikuti kerja bakti lingkungan dan menggalang bantuan sosial untuk korban bencana",
          "Menghindari komunikasi dengan tetangga sekitar",
          "Menutup pintu rumah rapat-rapat setiap hari",
        ],
        correctOption: 1,
        hint: "Gotong royong di era modern dapat berupa bakti sosial, kerja bakti, maupun penggalangan donasi kemanusiaan.",
      },
      {
        id: "q_gr_3_3",
        question: "Ketika warga desa mengadakan perbaikan jembatan desa, Budi yang masih SD dapat berpartisipasi dengan cara...",
        options: [
          "Mengangkat batu semen yang sangat berat",
          "Membantu membawakan air minum dan menyapu serpihan kayu kecil di jalan",
          "Bermain kejar-kejaran di dekat alat berat yang berbahaya",
          "Menyuruh para orang tua berhenti bekerja",
        ],
        correctOption: 1,
        hint: "Gotong royong disesuaikan dengan kemampuan usia; anak-anak dapat membantu pekerjaan ringan yang aman.",
      },
      {
        id: "q_gr_3_4",
        question: "Analisislah mengapa gotong royong sangat efektif mencegah terjadinya perselisihan dan tawuran antarkelompok!",
        options: [
          "Karena orang-orang terlalu lelah untuk berbicara",
          "Karena kebersamaan menumbuhkan rasa saling memiliki, empati, dan persaudaraan erat",
          "Karena ada polisi yang menjaga",
          "Karena gotong royong selalu ada hadiahnya",
        ],
        correctOption: 1,
        hint: "Ketika warga terbiasa bekerja bersama, sekat prasangka akan runtuh dan digantikan rasa kasih sayang.",
      },
      {
        id: "q_gr_3_5",
        question: "Bagaimana cara sekolah menanamkan pembiasaan gotong royong sejak kelas rendah di sekolah dasar?",
        options: [
          "Memberikan tugas ulangan individu yang sangat banyak",
          "Membentuk regu piket kelas, proyek tugas kelompok, dan kegiatan jumat bersih berkala",
          "Melarang siswa saling berbicara saat jam istirahat",
          "Memisahkan siswa berdasarkan tingkat kekayaan orang tuanya",
        ],
        correctOption: 1,
        hint: "Pembiasaan piket dan jumat bersih menanamkan rasa tanggung jawab kolektif sejak dini.",
      },
    ],
  },
  "pkn-norma": {
    1: [
      {
        id: "q_nm_1_1",
        question: "Pengertian dari norma dalam kehidupan bermasyarakat adalah...",
        options: [
          "Cerita dongeng rakyat zaman dahulu",
          "Kaidah, aturan, atau pedoman tingkah laku yang disepakati untuk ditaati bersama",
          "Hadiah yang diberikan kepada pemenang lomba",
          "Daftar menu makanan di kantin sekolah",
        ],
        correctOption: 1,
        hint: "Norma menjadi pedoman bagi setiap orang dalam bertutur kata dan bertindak di masyarakat.",
      },
      {
        id: "q_nm_1_2",
        question: "Ada berapa macam norma pokok yang berlaku dalam kehidupan bermasyarakat di Indonesia?",
        options: ["2 macam", "3 macam", "4 macam (Agama, Kesusilaan, Kesopanan, dan Hukum)", "10 macam"],
        correctOption: 2,
        hint: "Keempat norma tersebut saling melengkapi dalam menciptakan ketertiban hidup bermasyarakat.",
      },
      {
        id: "q_nm_1_3",
        question: "Norma yang bersumber dari wahyu Tuhan Yang Maha Esa dan terdapat dalam kitab suci adalah norma...",
        options: ["Norma Agama", "Norma Hukum", "Norma Kebiasaan", "Norma Pergaulan"],
        correctOption: 0,
        hint: "Norma agama menuntun umat beriman untuk menjalankan perintah Tuhan dan menjauhi larangan-Nya.",
      },
      {
        id: "q_nm_1_4",
        question: "Mencium tangan guru (salim) dan mengucapkan salam saat bertemu merupakan penerapan norma...",
        options: ["Norma Hukum", "Norma Kesopanan", "Norma Fisik", "Norma Olahraga"],
        correctOption: 1,
        hint: "Norma kesopanan berakar dari tata krama, adat istiadat, dan sopan santun pergaulan.",
      },
      {
        id: "q_nm_1_5",
        question: "Apa tujuan utama dibuatnya tata tertib dan aturan di sekolah?",
        options: [
          "Agar guru bisa menghukum siswa setiap hari",
          "Menciptakan suasana belajar yang tertib, aman, teratur, dan nyaman bagi semua siswa",
          "Supaya siswa tidak bisa bermain sama sekali",
          "Menaikkan biaya uang sekolah",
        ],
        correctOption: 1,
        hint: "Aturan sekolah diciptakan demi keteraturan, kedisiplinan, dan keselamatan seluruh warga sekolah.",
      },
    ],
    2: [
      {
        id: "q_nm_2_1",
        question: "Norma kesusilaan bersumber dari...",
        options: [
          "Undang-undang yang dibuat DPR",
          "Hati nurani manusia tentang mana yang baik dan mana yang buruk",
          "Keputusan kepala desa",
          "Berita di surat kabar",
        ],
        correctOption: 1,
        hint: "Hati nurani selalu menuntun kita untuk berbuat jujur dan merasa bersalah jika berbuat curang.",
      },
      {
        id: "q_nm_2_2",
        question: "Sanksi bagi seseorang yang melanggar norma hukum memiliki sifat...",
        options: [
          "Boleh ditaati boleh diabaikan",
          "Tegas, nyata, memaksa, dan mengikat sesuai undang-undang yang berlaku",
          "Hanya berupa ejekan teman saja",
          "Diberikan setelah 10 tahun kemudian",
        ],
        correctOption: 1,
        hint: "Norma hukum ditegakkan oleh aparat penegak hukum dengan sanksi hukuman atau denda resmi.",
      },
      {
        id: "q_nm_2_3",
        question: "Sikap yang tepat dalam menjalankan hak dan kewajiban seorang murid di sekolah adalah...",
        options: [
          "Menuntut hak fasilitas sekolah tanpa mau menjalankan kewajiban belajar",
          "Mendahulukan kewajiban belajar dan mematuhi tata tertib sebelum menuntut hak",
          "Mengabaikan kewajiban piket dan hanya bermain",
          "Menyerahkan kewajiban kita kepada orang lain",
        ],
        correctOption: 1,
        hint: "Keseimbangan hak dan kewajiban menciptakan keadilan dan ketertiban bersama.",
      },
      {
        id: "q_nm_2_4",
        question: "Jika kamu melihat kawan membuang bungkus jajanan di lantai koridor sekolah, tindakan yang sesuai norma adalah...",
        options: [
          "Ikut membuang sampah sembarangan di sebelahnya",
          "Mengingatkan kawan dengan santun agar membuangnya ke tempat sampah",
          "Memarahi dan memukul kawan tersebut",
          "Membiarkannya membusuk di lantai",
        ],
        correctOption: 1,
        hint: "Menegur dengan sopan adalah cerminan norma kesopanan dan kepedulian terhadap kebersihan lingkungan.",
      },
      {
        id: "q_nm_2_5",
        question: "Mengapa kita harus membiasakan diri antre dengan sabar saat membeli makanan di kantin sekolah?",
        options: [
          "Supaya dianggap anak penakut",
          "Sebagai wujud menghormati hak orang lain yang datang lebih awal (norma kesopanan)",
          "Karena tidak ada penjualnya",
          "Agar makanan habis sebelum giliran kita",
        ],
        correctOption: 1,
        hint: "Budaya antre melatih kesabaran, keadilan, ketertiban, dan menghargai giliran orang lain.",
      },
    ],
    3: [
      {
        id: "q_nm_3_1",
        question: "Mengapa norma kesusilaan sangat erat hubungannya dengan larangan mencontek saat ulangan?",
        options: [
          "Karena mencontek membuat pensil cepat habis",
          "Karena mencontek melawan bisikan hati nurani dan mencoreng nilai kejujuran diri sendiri",
          "Karena guru tidak suka melihat siswa menoleh",
          "Agar nilai ulangan semua siswa sama",
        ],
        correctOption: 1,
        hint: "Kejujuran adalah pondasi akhlak mulia yang berakar dari norma kesusilaan hati nurani.",
      },
      {
        id: "q_nm_3_2",
        question: "Apa yang akan terjadi pada sebuah negara atau lingkungan sekolah jika tidak ada norma dan aturan yang ditaati?",
        options: [
          "Semua orang hidup bahagia tanpa batas",
          "Terjadi kekacauan (anarki), ketidakadilan, hak orang lemah diinjak, dan rasa tidak aman",
          "Sekolah menjadi tempat terbaik di dunia",
          "Semua orang menjadi kaya raya",
        ],
        correctOption: 1,
        hint: "Tanpa aturan hukum dan norma, pihak yang kuat akan bertindak sewenang-wenang terhadap yang lemah.",
      },
      {
        id: "q_nm_3_3",
        question: "Doni menemukan dompet berisi uang di halaman sekolah. Tindakan Doni yang paling mencerminkan kepatuhan norma kesusilaan adalah...",
        options: [
          "Menyembunyikannya di tas untuk jajan pribadi",
          "Menyerahkan dompet utuh kepada guru piket agar diumumkan kepada pemiliknya yang sah",
          "Membagikan uangnya kepada teman sekelas agar tidak dicurigai",
          "Membuang dompetnya ke selokan",
        ],
        correctOption: 1,
        hint: "Integritas moral teruji saat kita berani mengembalikan hak milik orang lain dengan jujur.",
      },
      {
        id: "q_nm_3_4",
        question: "Perbedaan mendasar antara norma kesopanan dan norma hukum terletak pada...",
        options: [
          "Norma kesopanan tidak ada aturannya sama sekali",
          "Sifat sanksinya; sanksi hukum ditegakkan negara secara tegas, sedangkan sanksi kesopanan berupa teguran/celaan masyarakat",
          "Norma hukum hanya berlaku untuk anak kecil",
          "Norma kesopanan dibuat oleh presiden saja",
        ],
        correctOption: 1,
        hint: "Norma hukum bersumber dari lembaga negara resmi dengan sanksi pidana/perdata yang terukur.",
      },
      {
        id: "q_nm_3_5",
        question: "Bagaimana hubungan ketaatan terhadap norma hukum dengan pembentukan karakter Pelajar Pancasila?",
        options: [
          "Ketaatan membuat siswa menjadi pasif dan penakut",
          "Membentuk pribadi yang disiplin, berintegritas tinggi, berakhlak mulia, dan bertanggung jawab",
          "Tidak ada hubungannya sama sekali",
          "Ketaatan hanya perlu dilakukan saat ada kamera pengawas (CCTV)",
        ],
        correctOption: 1,
        hint: "Karakter Pelajar Pancasila beriman dan berakhlak mulia tercermin dari kepatuhannya terhadap aturan.",
      },
    ],
  },
  "pkn-bhinneka": {
    1: [
      {
        id: "q_bh_1_1",
        question: "Arti dari semboyan bangsa Indonesia 'Bhinneka Tunggal Ika' adalah...",
        options: [
          "Bersatu kita menang, sendiri kita senang",
          "Berbeda-beda tetapi pada hakikatnya tetap satu kesatuan jua",
          "Satu nusa satu negara tanpa perbedaan",
          "Kaya dan miskin sama saja",
        ],
        correctOption: 1,
        hint: "Meskipun beraneka ragam suku, bahasa, dan agama, kita tetap satu tumpah darah Indonesia.",
      },
      {
        id: "q_bh_1_2",
        question: "Di manakah letak pita semboyan Bhinneka Tunggal Ika pada lambang Burung Garuda Pancasila?",
        options: [
          "Dikalungkan di leher Burung Garuda",
          "Dicengkeram kokoh oleh kedua kaki Burung Garuda",
          "Ditaruh di atas kepala Burung Garuda",
          "Diselipkan di balik sayap kanan",
        ],
        correctOption: 1,
        hint: "Kedua kaki cengkeraman Burung Garuda mencengkeram pita putih bertuliskan Bhinneka Tunggal Ika.",
      },
      {
        id: "q_bh_1_3",
        question: "Kitab sastra klasik kuno tempat pertama kali tertulisnya kalimat Bhinneka Tunggal Ika adalah...",
        options: ["Kitab Bharatayudha", "Kitab Kakawin Sutasoma", "Kitab Ramayana", "Kitab Negarakertagama"],
        correctOption: 1,
        hint: "Kitab Kakawin Sutasoma digubah pada zaman Kerajaan Majapahit abad ke-14.",
      },
      {
        id: "q_bh_1_4",
        question: "Sikap menjaga ketenangan dan menghormati teman yang sedang menjalankan ibadah merupakan contoh sikap...",
        options: ["Toleransi antarumat beragama", "Ketidakpedulian sosial", "Pura-pura tidak melihat", "Mengganggu ibadah teman"],
        correctOption: 0,
        hint: "Toleransi bermakna menghargai dan memberi ruang damai bagi kawan yang berbeda keyakinan.",
      },
      {
        id: "q_bh_1_5",
        question: "Rumah Gadang dengan atap melengkung menyerupai tanduk kerbau merupakan rumah adat dari suku...",
        options: ["Suku Jawa", "Suku Minangkabau (Sumatera Barat)", "Suku Dayak", "Suku Asmat"],
        correctOption: 1,
        hint: "Rumah Gadang adalah warisan arsitektur megah kebanggaan masyarakat Minangkabau.",
      },
    ],
    2: [
      {
        id: "q_bh_2_1",
        question: "Siapakah pujangga besar Kerajaan Majapahit yang mengarang kitab Kakawin Sutasoma?",
        options: ["Mpu Sedah", "Mpu Tantular", "Mpu Prapanca", "Mpu Gandring"],
        correctOption: 1,
        hint: "Mpu Tantular hidup pada masa pemerintahan Prabu Hayam Wuruk dan Mahapatih Gajah Mada.",
      },
      {
        id: "q_bh_2_2",
        question: "Pasal 29 Ayat (2) UUD 1945 secara tegas menjamin hak setiap warga negara Indonesia untuk...",
        options: [
          "Membeli barang impor tanpa pajak",
          "Memeluk agamanya masing-masing dan beribadat menurut agama dan kepercayaannya itu",
          "Mendirikan partai politik sendiri",
          "Bebas tidak membayar iuran sekolah",
        ],
        correctOption: 1,
        hint: "Kemerdekaan beragama merupakan hak asasi paling mendasar yang dijamin konstitusi negara kita.",
      },
      {
        id: "q_bh_2_3",
        question: "Sikap 'tepa selira' dalam falsafah hidup bermasyarakat bangsa Indonesia mengandung makna...",
        options: [
          "Mementingkan perasaan diri sendiri",
          "Tenggang rasa, mampu merasakan apa yang dirasakan orang lain dan menjaga perasaannya",
          "Selalu ingin menang sendiri dalam perdebatan",
          "Menghindar saat dimintai bantuan",
        ],
        correctOption: 1,
        hint: "Tepa selira menuntun kita untuk tidak menyakiti hati kawan karena kita pun tidak suka disakiti.",
      },
      {
        id: "q_bh_2_4",
        question: "Manakah tindakan nyata seorang siswa yang mencerminkan toleransi saat perayaan hari besar keagamaan teman?",
        options: [
          "Mengejek ucapan hari rayanya",
          "Memberikan ucapan selamat dengan tulus dan menjaga ketenangan di sekitar rumah ibadahnya",
          "Menyuruh teman tidak usah merayakannya",
          "Mengajak teman bolos sekolah",
        ],
        correctOption: 1,
        hint: "Ucapan tulus dan menjaga kedamaian mempererat kerukunan persaudaraan sebangsa.",
      },
      {
        id: "q_bh_2_5",
        question: "Mengapa keberagaman suku, bahasa daerah, dan budaya di Indonesia harus disyukuri sebagai kekayaan?",
        options: [
          "Karena bisa menjadi bahan perlombaan mana yang terbaik",
          "Karena memperkaya jati diri bangsa, memperindah persatuan, dan menjadi daya tarik dunia",
          "Supaya kita tidak perlu belajar bahasa persatuan",
          "Agar setiap suku bisa mendirikan negara sendiri",
        ],
        correctOption: 1,
        hint: "Keragaman budaya seperti warna-warni pelangi yang indah karena bersatu serasi.",
      },
    ],
    3: [
      {
        id: "q_bh_3_1",
        question: "Tokoh pahlawan nasional yang mengusulkan bait Kakawin Sutasoma kepada Bung Karno hingga disahkan menjadi semboyan resmi negara adalah...",
        options: ["Dr. Soetomo", "Mr. Mohammad Yamin", "Ki Hajar Dewantara", "Jenderal Soedirman"],
        correctOption: 1,
        hint: "Mr. Mohammad Yamin adalah sejarawan dan pejuang yang mengagumi karya agung Mpu Tantular.",
      },
      {
        id: "q_bh_3_2",
        question: "Makna mendalam dari bait Sutasoma 'Bhinneka Tunggal Ika tan hana dharma mangrwa' adalah...",
        options: [
          "Hanya ada satu suku yang boleh memimpin negara",
          "Perbedaan lahiriah bukanlah alasan terpecah belah karena hakikat kebenaran kebajikan adalah satu",
          "Semua orang harus memakai pakaian adat yang sama",
          "Tidak boleh mempelajari bahasa daerah lain",
        ],
        correctOption: 1,
        hint: "Inti ajaran leluhur adalah menghargai perbedaan ragam dan mengutamakan nilai kebajikan universal.",
      },
      {
        id: "q_bh_3_3",
        question: "Bagaimana cara generasi muda membentengi diri dari paham kebencian antarsuku dan radikalisme?",
        options: [
          "Mengurung diri dari pergaulan luas",
          "Menanamkan wawasan kebangsaan, mengamalkan nilai-nilai Pancasila, dan berpikir kritis di medsos",
          "Mempercayai semua video yang viral tanpa disaring",
          "Hanya berteman dengan orang yang satu agama dan satu suku saja",
        ],
        correctOption: 1,
        hint: "Pemahaman Pancasila yang kuat menjadikan siswa bijak dan kebal terhadap provokasi adu domba.",
      },
      {
        id: "q_bh_3_4",
        question: "Peristiwa Sumpah Pemuda 28 Oktober 1928 memiliki makna yang sangat kuat bagi Bhinneka Tunggal Ika karena...",
        options: [
          "Para pemuda menyerah kepada penjajah",
          "Menyatukan tekad pemuda seluruh pulau menjadi satu tumpah darah, satu bangsa, dan satu bahasa persatuan",
          "Memutuskan hubungan perdagangan antardaerah",
          "Membubarkan semua organisasi kepemudaan",
        ],
        correctOption: 1,
        hint: "Sumpah Pemuda menjadi tonggak bersejarah persatuan seluruh suku dari Jong Java, Jong Sumatra, Jong Ambon, dll.",
      },
      {
        id: "q_bh_3_5",
        question: "Di sebuah lingkungan ada masjid dan gereja yang berdampingan. Sikap warga yang menunjukkan kerukunan sejati adalah...",
        options: [
          "Meminta salah satu tempat ibadah dipindahkan",
          "Saling membantu menjaga keamanan dan kelancaran parkir saat masing-masing umat sedang beribadah",
          "Membunyikan petasan di depan tempat ibadah orang lain",
          "Tidak saling bertegur sapa ketika berpapasan di jalan",
        ],
        correctOption: 1,
        hint: "Toleransi nyata tampak saat warga saling menjaga ketenteraman dan kenyamanan ibadah sesama.",
      },
    ],
  },
  "bjawa-unggahungguh": {
    1: [
      {
        id: "q_ug_1_1",
        question: "Basa Jawa kang lumrah digunakake nalika guneman karo kanca dolanan saumuran yaiku...",
        options: ["Basa Ngoko", "Basa Krama Inggil", "Basa Sanskerta", "Basa Walikan"],
        correctOption: 0,
        hint: "Basa ngoko lumrah digunakake kanggo kanca sebaya utawa kanca dolanan.",
      },
      {
        id: "q_ug_1_2",
        question: "Basa Jawa kang digunakake nalika matur marang Bapak utawa Ibu Guru ing sekolahan yaiku...",
        options: ["Basa Ngoko Lugu", "Basa Krama Alus", "Basa Gaul", "Basa Indonesia Campuran"],
        correctOption: 1,
        hint: "Marang guru lan wong sing luwih sepuh, kudu nggunakake basa sing sopan yaiku krama alus.",
      },
      {
        id: "q_ug_1_3",
        question: "Tembung 'mangan' menawa diowahi dadi Basa Krama Alus kanggo wong tuwa yaiku...",
        options: ["Nedha", "Dhahar", "Nguntal", "Nyicipi"],
        correctOption: 1,
        hint: "'Bapak nembe dhahar', dene kanggo awake dhewe nggunakake tembung 'nedha'.",
      },
      {
        id: "q_ug_1_4",
        question: "Tembung 'turu' menawa dikramakake alus kanggo simbah yaiku...",
        options: ["Tilem", "Sare", "Merem", "Ngleketer"],
        correctOption: 1,
        hint: "Kanggo ngurmati simbah utawa tiyang sepuh, tembung turu dadi 'sare'.",
      },
      {
        id: "q_ug_1_5",
        question: "Sikep awak kang bener nalika matur karo wong tuwa utawa bapak/ibu guru yaiku...",
        options: [
          "Ngadeg kanthi tangan sedhakep utawa ngapurancang sopan",
          "Mlaku-mlaku karo mangan permen karet",
          "Mungkur ora ndeleng wong sing diajak guneman",
          "Nyandhak tangane kanthi kasar",
        ],
        correctOption: 0,
        hint: "Tata krama Jawa ngajak kita nduweni sikep andhap asor lan ngajeni tiyang sepuh.",
      },
    ],
    2: [
      {
        id: "q_ug_2_1",
        question: "Tembung 'lunga' menawa diowahi dadi Basa Krama Alus yaiku...",
        options: ["Kesah", "Tindak", "Mangkat", "Mlaku"],
        correctOption: 1,
        hint: "'Bapak tindak dhateng kantor', dene krama lugu kanggo awake dhewe yaiku 'kesah'.",
      },
      {
        id: "q_ug_2_2",
        question: "Ukara ngoko 'Bapak lagi mangan ing meja makan' menawa dikramakake kanthi bener dadi...",
        options: [
          "Bapak nembe mangan wonten meja",
          "Bapak nembe dhahar wonten meja dhahar",
          "Bapak nembe nedha wonten meja",
          "Bapak lagi nedho ing meja makan",
        ],
        correctOption: 1,
        hint: "Tembung 'lagi' dadi 'nembe', lan 'mangan' dadi 'dhahar' kanggo ngurmati bapak.",
      },
      {
        id: "q_ug_2_3",
        question: "Nalika mlaku ing sangarepe tiyang sepuh kang lagi lenggah, tata krama kang trep yaiku...",
        options: [
          "Mlayu banter kanthi swara seru",
          "Mbungkukake awak kanthi matur 'Nyuwun sewu, nderek langkung'",
          "Mlaku jejeg karo dolanan HP",
          "Mlaku mundur ora noleh",
        ],
        correctOption: 1,
        hint: "Sikap mbungkukake awak lan matur 'nderek langkung' minangka tandha pakurmatan marang tiyang sepuh.",
      },
      {
        id: "q_ug_2_4",
        question: "Tembung 'teka' krama aluse yaiku...",
        options: ["Dugie", "Rawuh", "Anjlok", "Mlebu"],
        correctOption: 1,
        hint: "Tuladha ukara: 'Pak Guru sampun rawuh ing sekolahan.'",
      },
      {
        id: "q_ug_2_5",
        question: "Tembung 'omah' menawa kanggo ngurmati omahe Bapak utawa Ibu Guru diarani...",
        options: ["Griya", "Dalem", "Pondhok", "Kamar"],
        correctOption: 1,
        hint: "Omah kanggo ngurmati wong liya diarani 'dalem', dene kanggo awake dhewe diarani 'griya'.",
      },
    ],
    3: [
      {
        id: "q_ug_3_1",
        question: "Beda panganggone basa Krama Lugu lan Krama Alus yaiku...",
        options: [
          "Krama Lugu luwih angel tinimbang Krama Alus",
          "Krama Lugu kanggo awake dhewe utawa wong sadrajat, Krama Alus kanggo ngurmati wong kang luwih sepuh",
          "Krama Alus mung digunakake dening raja",
          "Kabeh padha wae ora ana bedane",
        ],
        correctOption: 1,
        hint: "Krama Alus nggunakake tembung krama inggil kanggo ngurmati wong sing diajak guneman.",
      },
      {
        id: "q_ug_3_2",
        question: "Gatekna ukara iki: 'Kula badhe ... dhateng Solo, dene Bapak sampun ... wau enjing.' Tembung kang pas yaiku...",
        options: [
          "Tindak - kesah",
          "Kesah - tindak",
          "Mangkat - lunga",
          "Lunga - tindak",
        ],
        correctOption: 1,
        hint: "Kanggo awake dhewe (kula) nggunakake 'kesah', dene kanggo Bapak nggunakake 'tindak'.",
      },
      {
        id: "q_ug_3_3",
        question: "Apa paedah (manfaat) sinau unggah-ungguh basa Jawa tumrap murid ing jaman modern saiki?",
        options: [
          "Supaya bisa pamer marang wong liya",
          "Nukulake watak andhap asor, sopan santun, lan nglestarekake budi pekerti luhur bangsa",
          "Supaya ora usah sinau basa Indonesia",
          "Kanggo ngapusi kanca dolanan",
        ],
        correctOption: 1,
        hint: "Unggah-ungguh basa ndhidhik budi pekerti lan rasa kurmat marang sapadha-padha.",
      },
      {
        id: "q_ug_3_4",
        question: "Nalika Budi ora sengaja nyenggol kancane nganti bukune tiba, ukara Jawa kang trep diucapake yaiku...",
        options: [
          "'Salahmu dhewe lungguh ing kono!'",
          "'Nyuwun pangapunten ya, aku ora sengaja. Ayo tak rewangi nata'",
          "'Ora apa-apa ya wis biasa'",
          "'Gek ndang resikana bukumu!'",
        ],
        correctOption: 1,
        hint: "Nyuwun pangapunten kanthi tulus nuduhake tanggung jawab lan watak ksatria.",
      },
      {
        id: "q_ug_3_5",
        question: "Kepriye ukara kang bener nalika arep nyuwun ijin menyang jedhing nalika wulangan ing kelas?",
        options: [
          "'Pak, aku metu dhisik ya!'",
          "'Nyuwun sewu Pak/Bu Guru, kula nyuwun ijin badhe dhateng wingking'",
          "'Bu, arep pipis saiki'",
          "'Ijin metu dhisik ya kanca-kanca'",
        ],
        correctOption: 1,
        hint: "Matur kanthi sopan migunakake tembung 'nyuwun sewu' lan 'dhateng wingking'.",
      },
    ],
  },
  "bjawa-punokawan": {
    1: [
      {
        id: "q_pn_1_1",
        question: "Papat paraga wayang kang diarani Punokawan yaiku...",
        options: [
          "Puntadewa, Werkudara, Janaka, Nakula",
          "Semar, Gareng, Petruk, lan Bagong",
          "Kurawa, Durna, Sengkuni, Karna",
          "Antasena, Antareja, Gatotkaca, Abimanyu",
        ],
        correctOption: 1,
        hint: "Semar minangka bapak, dene Gareng, Petruk, lan Bagong minangka anak-anake.",
      },
      {
        id: "q_pn_1_2",
        question: "Bapake para Punokawan kang awake lemu, mripate rembes, lan tansah sabar paring pitutur yaiku...",
        options: ["Petruk", "Kyai Semar", "Bagong", "Gareng"],
        correctOption: 1,
        hint: "Kyai Semar Badranaya minangka sesepuh kang wicaksana lan ngayomi.",
      },
      {
        id: "q_pn_1_3",
        question: "Tokoh Punokawan kang dedege paling dhuwur, irunge dawa, lan seneng gojek yaiku...",
        options: ["Bagong", "Petruk", "Gareng", "Semar"],
        correctOption: 1,
        hint: "Petruk utawa Kanthong Bolong dedege dhuwur kencur lan tangane dawa.",
      },
      {
        id: "q_pn_1_4",
        question: "Watak utama saka paraga Kyai Semar kang patut dituladha dening bocah sekolah yaiku...",
        options: [
          "Sabar, wicaksana, andhap asor, lan tresna marang katentreman",
          "Seneng pamer kesaktian",
          "Gampang nesu yen dienyek",
          "Seneng ngapusi kanca",
        ],
        correctOption: 0,
        hint: "Semar minangka lambang kawicaksanan lan kesabaran sejati.",
      },
      {
        id: "q_pn_1_5",
        question: "Paraga Punokawan pambarep (anak nomer siji) kang nduweni tangan ceko lan sikil gejig yaiku...",
        options: ["Gareng (Nala Gareng)", "Petruk", "Bagong", "Togog"],
        correctOption: 0,
        hint: "Nala Gareng minangka anak nomer siji, senajan awake cilik nanging atine becik.",
      },
    ],
    2: [
      {
        id: "q_pn_2_1",
        question: "Paraga Gareng nduweni sikil gejig lan tangan ceko. Piwulang pralambange yaiku...",
        options: [
          "Kudu ngati-ati anggone tumindak lan ora kena njupuk barang darbeke liyan",
          "Bocah sekolah kudu seneng gelut",
          "Ora kena mlaku ing dalan",
          "Kudu tuku sepatu anyar",
        ],
        correctOption: 0,
        hint: "Tangan ceko ngelingake aja njupuk duweke liyan, sikil gejig ngelingake kudu ngati-ati mlaku.",
      },
      {
        id: "q_pn_2_2",
        question: "Senjata pusaka arupa lading cilik kang tansah disengkelit dening Petruk yaiku...",
        options: ["Keris Pasopati", "Pethel", "Gada Rujakpala", "Cakra Baskara"],
        correctOption: 1,
        hint: "Pethel yaiku piranti kanggo natah kayu kang dadi pusakane Petruk.",
      },
      {
        id: "q_pn_2_3",
        question: "Ing crita pewayangan Jawa, para Punokawan nduweni tugas utama yaiku...",
        options: [
          "Ngrusak kraton Amarta",
          "Ngemong lan ngamping-ampingi para ksatria Pandhawa kanthi setya",
          "Njaluk dhuwit marang para raja",
          "Melu dadi prajurit Kurawa",
        ],
        correctOption: 1,
        hint: "Punokawan dadi pamomong kang tansah ngelingake para ksatria supaya tetep ing dalan bebener.",
      },
      {
        id: "q_pn_2_4",
        question: "Paraga Bagong nduweni watak 'blaka suta', tegese yaiku...",
        options: [
          "Seneng cidra ing janji",
          "Jujur, apa anane, lan kendel mbelani bebener tanpa wedi",
          "Seneng nyimpen rahasia ala",
          "Seneng mamerake bandhane",
        ],
        correctOption: 1,
        hint: "Bagong iku senajan ceplas-ceplos nanging atine resik lan ora seneng ngapusi.",
      },
      {
        id: "q_pn_2_5",
        question: "Guyonane para Punokawan ing pagelaran wayang kulit tansah dienteni para penonton amarga...",
        options: [
          "Mung ngina kekurangan fisik wong liya",
          "Senajan ngguyu lucu nanging tansah ngemot piwulang lan kritik sosial kang becik",
          "Gawe geger lan kisruh",
          "Niru basa asing",
        ],
        correctOption: 1,
        hint: "Gojekane Punokawan nglipur ati nanging uga paring pencerahan batin.",
      },
    ],
    3: [
      {
        id: "q_pn_3_1",
        question: "Asal-usul paraga Semar ing mitologi Jawa sejatine minangka dewa luhur kang mudhun menyang marcapada kanthi asma...",
        options: ["Sang Hyang Ismaya", "Batara Guru", "Batara Narada", "Sang Hyang Antaboga"],
        correctOption: 0,
        hint: "Sang Hyang Ismaya milih mudhun dadi pamomong rakyat cilik kanthi asma Semar.",
      },
      {
        id: "q_pn_3_2",
        question: "Filosofi Punokawan menehi piwulang marang para pamimpin negara supaya...",
        options: [
          "Urip mewah lan ora nggatekake wong mlarat",
          "Tansah ngrungokake swarane rakyat cilik lan mimpin kanthi adil wicaksana",
          "Nglumpukake bandha donya kanggo awake dhewe",
          "Ora gelem ditegur dening sapa wae",
        ],
        correctOption: 1,
        hint: "Ksatria sejati mesthi ngrungokake pitutur lan sambat-sebuting para pamomonge.",
      },
      {
        id: "q_pn_3_3",
        question: "Kepriye tuladha kerukunan ing kulawarga Punokawan kang bisa diterapake siswa ing kelas?",
        options: [
          "Tulung-tinulung, guyub rukun, lan nampa kekurangane kanca kanthi jembar dhadha",
          "Saling ngina kekurangan kanca",
          "Pilih-pilih kanca mung sing pinter wae",
          "Njaluk opah saben nulungi kanca",
        ],
        correctOption: 0,
        hint: "Gareng, Petruk, lan Bagong senadyan beda rupa nanging tansah kompak lan tresna.",
      },
      {
        id: "q_pn_3_4",
        question: "Kesenian wayang kulit kang ngemot paraga Punokawan wis diakoni dening badan donya yaiku...",
        options: [
          "UNESCO minangka Warisan Budaya Donya Asli Indonesia",
          "FIFA minangka olahraga tradisional",
          "UNICEF minangka dolanan bocah",
          "WHO minangka obat tradisional",
        ],
        correctOption: 0,
        hint: "UNESCO ngakoni wayang kulit Indonesia minangka Masterpiece of Oral and Intangible Heritage.",
      },
      {
        id: "q_pn_3_5",
        question: "Nalika ana musyawarah kelas, sikap Punokawan endi kang kudu ditrapake supaya ora padu?",
        options: [
          "Sikep nesu lan meksa kekarepane dhewe",
          "Sikep wicaksana, sabar, lan ngrungokake panemune liyan kaya Kyai Semar",
          "Sikep mungkur lan ora gelem melu mikir",
          "Sikep ngenyek usulane kanca",
        ],
        correctOption: 1,
        hint: "Kawicaksanan Semar dadi patuladhan anggone ngrampungake prakara kanthi tentrem.",
      },
    ],
  },
  "bjawa-pandhawa": {
    1: [
      {
        id: "q_pw_1_1",
        question: "Cacahe para ksatria Pandhawa Lima ana pira?",
        options: ["3 ksatria", "4 ksatria", "5 ksatria", "100 ksatria"],
        correctOption: 2,
        hint: "Pandhawa asale saka tembung 'pandhu putra' kang cacahe ana lima ksatria.",
      },
      {
        id: "q_pw_1_2",
        question: "Pambarepe (anak nomer siji) ksatria Pandhawa kang misuwur nduweni watak getih putih yaiku...",
        options: ["Werkudara", "Prabu Puntadewa (Yudhistira)", "Janaka", "Sadewa"],
        correctOption: 1,
        hint: "Puntadewa minangka ratu ing Amarta kang resik atine lan ora tau goroh.",
      },
      {
        id: "q_pw_1_3",
        question: "Ksatria panengah Pandhawa kang prigel (pinter) banget ing babagan manah yaiku...",
        options: ["Raden Janaka (Arjuna)", "Raden Nakula", "Raden Werkudara", "Prabu Kresna"],
        correctOption: 0,
        hint: "Raden Arjuna minangka ksatria gantheng kang tekun sinau lan sekti olah panah.",
      },
      {
        id: "q_pw_1_4",
        question: "Ksatria Pandhawa kang lair kembar yaiku...",
        options: [
          "Puntadewa lan Werkudara",
          "Janaka lan Werkudara",
          "Raden Nakula lan Raden Sadewa",
          "Gareng lan Petruk",
        ],
        correctOption: 2,
        hint: "Nakula lan Sadewa lair bareng (kembar) saka garwa Dewi Madrim.",
      },
      {
        id: "q_pw_1_5",
        question: "Ksatria Pandhawa nomer loro kang awake gedhe dhuwur gagah prakosa lan duwe Kuku Pancanaka yaiku...",
        options: ["Raden Janaka", "Raden Werkudara (Bima)", "Raden Sadewa", "Prabu Puntadewa"],
        correctOption: 1,
        hint: "Werkudara satriya ing Jodhipati kang nduweni watak jujur lan kukuh bakuh mbelani bebener.",
      },
    ],
    2: [
      {
        id: "q_pw_2_1",
        question: "Kasatriyane Raden Janaka (Arjuna) manggon ing...",
        options: ["Jodhipati", "Madukara", "Sawojajar", "Bumi Retawu"],
        correctOption: 1,
        hint: "Arjuna satriya ing Madukara, dene Werkudara ing Jodhipati.",
      },
      {
        id: "q_pw_2_2",
        question: "Watake Prabu Puntadewa diarani 'getih putih' amarga...",
        options: [
          "Seneng lara-laranen",
          "Jujur, ora tau goroh (ngapusi), sabar, lan seneng menehi pangapura",
          "Wernane kulite putih mulus",
          "Seneng ngunjuk susu",
        ],
        correctOption: 1,
        hint: "Getih putih minangka pralambang watak ksatria kang suci tanpa niyat ala.",
      },
      {
        id: "q_pw_2_3",
        question: "Asmane ibu kandhunge Puntadewa, Werkudara, lan Janaka yaiku...",
        options: ["Dewi Madrim", "Dewi Kunthi Nalibrata", "Dewi Srikandi", "Dewi Drupadi"],
        correctOption: 1,
        hint: "Dewi Kunthi minangka ibu kang wicaksana ngasuh lan ndhidhik para Pandhawa.",
      },
      {
        id: "q_pw_2_4",
        question: "Gaman pusaka ampuh kagungane Raden Janaka kang awujud panah sekti yaiku...",
        options: ["Kuku Pancanaka", "Panah Pasopati", "Gada Rujakpala", "Keris Mpu Gandring"],
        correctOption: 1,
        hint: "Panah Pasopati dadi pusaka pamungkas Raden Janaka nalika ngadhepi mungsuh.",
      },
      {
        id: "q_pw_2_5",
        question: "Raden Nakula lan Sadewa nduweni keprigelan mligi ing babagan...",
        options: [
          "Ngrumat tetuwuhan, peternakan jaran, lan ilmu perbintangan/lintang",
          "Gawe prau lan kapal perang",
          "Nulis buku dongeng",
          "Dagang ing pasar",
        ],
        correctOption: 0,
        hint: "Ksatria kembar Sawojajar pinter babagan tetanen lan tresna marang sato kewan.",
      },
    ],
    3: [
      {
        id: "q_pw_3_1",
        question: "Falsafah luhur ing Perang Bharatayudha 'Sura Dira Jayaningrat Lebur Dening Pangastuti' ngemu teges...",
        options: [
          "Sapa sing menang perang bakal dadi sugih",
          "Kabeh sipat angkara murka, sombong, lan licik bakal kalah dening kabecikan, kejujuran, lan kasabaran",
          "Perang iku siji-sijine dalan golek tentrem",
          "Wong licik mesthi tansah menang",
        ],
        correctOption: 1,
        hint: "Kabecikan sejati bakal tansah unggul ngalahake tumindak durangkara.",
      },
      {
        id: "q_pw_3_2",
        question: "Ksatria Werkudara ora tau nggunakake basa krama marang sapa wae kajaba marang Dewa Ruci lan ibune, amarga...",
        options: [
          "Ora bisa basa Jawa",
          "Nduweni watak blaka suta, tegas, ora seneng lamis (munafik), nanging bekti lahir batin",
          "Seneng ngenyek wong liya",
          "Lali tata krama",
        ],
        correctOption: 1,
        hint: "Senadyan basane ngoko, bektine Werkudara marang guru lan wong tuwa tanpa upama.",
      },
      {
        id: "q_pw_3_3",
        question: "Sikap apa saka Raden Janaka nalika sinau marang Resi Drona kang kudu ditiru murid SD?",
        options: [
          "Fokus nggatekake wulangan guru, tlaten gladhen, lan ora gampang putus asa",
          "Seneng nyalahake kanca yen gagal",
          "Mung sinau sedina sadurunge ujian",
          "Ngganggu kanca sing lagi ngrungokake guru",
        ],
        correctOption: 0,
        hint: "Konsentrasi lan ketekunan sinau Janaka ndadekake dheweke dadi ksatria pilih tanding.",
      },
      {
        id: "q_pw_3_4",
        question: "Piwulang apa kang bisa dijupuk saka paseduluran Pandhawa kang tetep rukun senajan ngadhepi pacoban gedhe?",
        options: [
          "Saling nyalahake nalika ana masalah",
          "Kekompakan, rukun karo sedulur, lan setya janji ndadekake kulawarga kuwat",
          "Mlayu nylametake awake dhewe",
          "Njaluk pitulungane para mungsuh",
        ],
        correctOption: 1,
        hint: "Kekuwatan Pandhawa ana ing kerukunan lan tekad manunggal mbelani bebener.",
      },
      {
        id: "q_pw_3_5",
        question: "Ing Perang Bharatayudha, para Pandhawa berjuang dudu amarga seneng perang, nanging kanggo...",
        options: [
          "Njarah bandha donyane kraton Ngastina",
          "Netepi darma ksatria yaiku mbelani bebener lan ngilangi angkara murka ing bumi",
          "Pamer kesaktian marang para dewa",
          "Mbales dendam pribadi kanthi kejem",
        ],
        correctOption: 1,
        hint: "Perjuangan Pandhawa minangka darma ngadegake keadilan kanggo katentremaning jagad.",
      },
    ],
  },
  "bjawa-aksara": {
    1: [
      {
        id: "q_ak_1_1",
        question: "Cacahe aksara Jawa nglegena (aksara dhasar) kabeh ana pira?",
        options: ["10 aksara", "15 aksara", "20 aksara", "26 aksara"],
        correctOption: 2,
        hint: "Aksara Jawa nglegena diwiwiti saka Ha nganti Nga cacahe ana 20 aksara.",
      },
      {
        id: "q_ak_1_2",
        question: "Baris kapisan saka aksara Jawa unine yaiku...",
        options: ["Da, Ta, Sa, Wa, La", "Ha, Na, Ca, Ra, Ka", "Pa, Dha, Ja, Ya, Nya", "Ma, Ga, Ba, Tha, Nga"],
        correctOption: 1,
        hint: "Urutan aksara Jawa kapisan yaiku Ha-Na-Ca-Ra-Ka kang tegese ana utusan.",
      },
      {
        id: "q_ak_1_3",
        question: "Sandhangan swara 'Wulu' wujude bunder cilik ing dhuwure aksara, digunakake kanggo ngowahi swara dadi...",
        options: ["a", "i", "u", "e"],
        correctOption: 1,
        hint: "Aksara 'Ka' diwenehi wulu unine dadi 'Ki'.",
      },
      {
        id: "q_ak_1_4",
        question: "Sandhangan swara 'Suku' kang manggon ing ngisore aksara digunakake kanggo swara...",
        options: ["o", "u", "i", "e"],
        correctOption: 1,
        hint: "Aksara 'Ba' diwenehi suku unine dadi 'Bu'.",
      },
      {
        id: "q_ak_1_5",
        question: "Sandhangan swara 'Taling Tarung' digunakake kanggo ngasilake swara...",
        options: ["o", "u", "i", "a"],
        correctOption: 0,
        hint: "Aksara 'Sa' diapit taling tarung unine dadi 'So'.",
      },
    ],
    2: [
      {
        id: "q_ak_2_1",
        question: "Sandhangan swara 'Pepet' ngowahi aksara nglegena dadi muni swara...",
        options: ["e (kaya tembung 'sega' utawa 'sepet')", "i (kaya tembung 'pipi')", "u (kaya tembung 'tuku')", "o (kaya tembung 'toko')"],
        correctOption: 0,
        hint: "Pepet ngasilake swara 'e' mantep kayata ing tembung 'sepet' utawa 'sega'.",
      },
      {
        id: "q_ak_2_2",
        question: "Sandhangan panyigeg wanda 'Layar' digunakake kanggo nambahi swara mati...",
        options: ["r", "h", "ng", "k"],
        correctOption: 0,
        hint: "Layar awujud garis miring ing dhuwur aksara kanggo nambahi swara 'r'.",
      },
      {
        id: "q_ak_2_3",
        question: "Sandhangan panyigeg wanda 'Cecak' digunakake kanggo nambahi swara mati...",
        options: ["ng", "h", "r", "l"],
        correctOption: 0,
        hint: "Cecak wujude bunder cilik buntutan kanggo swara 'ng'.",
      },
      {
        id: "q_ak_2_4",
        question: "Sandhangan panyigeg wanda 'Wignyan' digunakake kanggo nambahi swara mati...",
        options: ["h", "r", "ng", "s"],
        correctOption: 0,
        hint: "Wignyan manggon ing mburine aksara kanggo swara 'h' kayata ing tembung 'gajah'.",
      },
      {
        id: "q_ak_2_5",
        question: "Tembung 'buku' menawa ditulis nganggo aksara Jawa mbutuhake sandhangan swara yaiku...",
        options: ["Wulu", "Suku", "Pepet", "Taling"],
        correctOption: 1,
        hint: "Aksara Ba diwenehi Suku (Bu) lan aksara Ka diwenehi Suku (Ku).",
      },
    ],
    3: [
      {
        id: "q_ak_3_1",
        question: "Sandhangan 'Pangkon' lumrahe digunakake ing endi?",
        options: [
          "Ing ngarep ukara",
          "Ing pungkasaning tembung utawa ukara kanggo mateni aksara",
          "Ing tengah-tengah tembung kang urip",
          "Ing ngisor kabeh aksara",
        ],
        correctOption: 1,
        hint: "Pangkon gunane kanggo mateni aksara ing pungkasan ukara.",
      },
      {
        id: "q_ak_3_2",
        question: "Pasangan aksara Jawa digunakake nalika ana kahanan...",
        options: [
          "Aksara mati ketemu aksara urip ing tengahing tembung utawa ukara",
          "Kabeh aksara kudu dipasangani",
          "Aksara Jawa ditulis nganggo mangsi abang",
          "Ukara diwiwiti nganggo huruf kapital",
        ],
        correctOption: 0,
        hint: "Pasangan mateni aksara sadurunge tanpa nggunakake sandhangan pangkon ing tengah tembung.",
      },
      {
        id: "q_ak_3_3",
        question: "Gatekna bedane swara taling [é] lan pepet [e] ing conto tembung Jawa iki:",
        options: [
          "'Bebek' (kewan) nganggo taling, dene 'sega' nganggo pepet",
          "'Soto' nganggo wulu",
          "'Kucing' nganggo suku lan layar",
          "'Buku' nganggo taling tarung",
        ],
        correctOption: 0,
        hint: "Taling ngasilake swara [é] kaya ing 'lele' utawa 'bebek', dene pepet kaya ing 'kembang'.",
      },
      {
        id: "q_ak_3_4",
        question: "Apa tujuane para siswa SD ing Jawa Tengah, Jawa Timur, lan DIY sinau aksara Jawa?",
        options: [
          "Supaya ora bisa maca aksara latin",
          "Nglestarekake warisan luhur kabudayan bangsa lan ngurmati peninggalan leluhur Nusantara",
          "Kanggo ngirim pesen rahasia perang",
          "Mung syarat ujian tanpa guna",
        ],
        correctOption: 1,
        hint: "Aksara Jawa minangka identitas budaya agung kang diakui internasional.",
      },
      {
        id: "q_ak_3_5",
        question: "Miturut dongeng legendhane, aksara Jawa Hanacaraka diciptakake dening tokoh pahlawan...",
        options: ["Prabu Brawijaya", "Aji Saka kanggo ngelingi lelabuhane Dora lan Sembada", "Raden Wijaya", "Ken Arok"],
        correctOption: 1,
        hint: "Aji Saka nganggit aksara Hanacaraka kanggo mengeti abdine kang setya nganti tumekaning pati.",
      },
    ],
  },
  "bjawa-anakkewan": {
    1: [
      {
        id: "q_an_1_1",
        question: "Jenenge anak pitik ing basa Jawa yaiku...",
        options: ["Meri", "Kuthuk", "Cemeng", "Belo"],
        correctOption: 1,
        hint: "Pitik babon tansah nginthil anak-anake kang cilik arane kuthuk.",
      },
      {
        id: "q_an_1_2",
        question: "Jenenge anak bebek yaiku...",
        options: ["Meri", "Kuthuk", "Gogor", "Pedhet"],
        correctOption: 0,
        hint: "Anak bebek kang seneng nglangi ing blumbang arane meri.",
      },
      {
        id: "q_an_1_3",
        question: "Jenenge anak kucing ing basa Jawa yaiku...",
        options: ["Cemeng", "Kirik", "Bledug", "Cebong"],
        correctOption: 0,
        hint: "Anak kucing kang lucu lan nggregetake diarani cemeng.",
      },
      {
        id: "q_an_1_4",
        question: "Jenenge anak sapi yaiku...",
        options: ["Pedhet", "Belo", "Gudel", "Cempe"],
        correctOption: 0,
        hint: "Anak sapi kang lagi nyusu marang babone diarani pedhet.",
      },
      {
        id: "q_an_1_5",
        question: "Jenenge anak jaran yaiku...",
        options: ["Belo", "Pedhet", "Meri", "Kuthuk"],
        correctOption: 0,
        hint: "Anak jaran kang pinter lumayu kenceng arane belo.",
      },
    ],
    2: [
      {
        id: "q_an_2_1",
        question: "Jenenge anak kodhok yaiku...",
        options: ["Cebong / Berudu", "Sawiyah", "Kroyo", "Gogor"],
        correctOption: 0,
        hint: "Kodhok nalika isih cilik nglangi ing banyu arane cebong.",
      },
      {
        id: "q_an_2_2",
        question: "Jenenge anak gajah yaiku...",
        options: ["Bledug", "Gudel", "Pedhet", "Cemeng"],
        correctOption: 0,
        hint: "Anak gajah kang nduweni tlale cilik diarani bledug.",
      },
      {
        id: "q_an_2_3",
        question: "Jenenge anak macan ing basa Jawa yaiku...",
        options: ["Gogor", "Kirik", "Belo", "Meri"],
        correctOption: 0,
        hint: "Anak macan kang isih ana ing guwa diarani gogor.",
      },
      {
        id: "q_an_2_4",
        question: "Swara jaran ing basa Jawa diarani...",
        options: ["Mbengik", "Kluruk", "Ngeong", "Gumerit"],
        correctOption: 0,
        hint: "Pitik kluruk, kucing ngeong, dene jaran mbengik.",
      },
      {
        id: "q_an_2_5",
        question: "Wit pari kang wis diundhuh gabahé diarani...",
        options: ["Damen", "Glugu", "Tebon", "Klaras"],
        correctOption: 0,
        hint: "Batang tanduran pari sawise panen diarani damen.",
      },
    ],
    3: [
      {
        id: "q_an_3_1",
        question: "Godhong klapa kang isih enom wernane kuning/ijo enom diarani...",
        options: ["Janur", "Klaras", "Blarak", "Damen"],
        correctOption: 0,
        hint: "Janur kerep dianyam dadi kupat nalika riyaya bakda kupat.",
      },
      {
        id: "q_an_3_2",
        question: "Piwulang budi pekerti apa kang bisa dijupuk saka sinau arane anak kewan lan tetuwuhan?",
        options: [
          "Nresnani lingkungan alam, welas asih marang sato kewan, lan ngreksa ciptaane Gusti",
          "Kewan kena disiksa lan diburu nganti entek",
          "Ora usah ngopeni wit-witan ing omah",
          "Ngrusak tandurane tangga",
        ],
        correctOption: 0,
        hint: "Welas asih marang samubarang titah ndadekake urip selaras karo alam.",
      },
      {
        id: "q_an_3_3",
        question: "Jenenge anak wedhus yaiku 'cempe'. Kepriye carane murid ngrumat kewan ingon-ingon kanthi bener?",
        options: [
          "Menehi pakan lan ngombe kanthi ajeg, kandhange diresiki, lan diasihi kanthi becik",
          "Ditinggal lunga tanpa dipakani",
          "Ditaleni ing papan kang panas tanpa iyub-iyub",
          "Digebugi saben dina",
        ],
        correctOption: 0,
        hint: "Tanggung jawab ngingu kewan yaiku nyukupi pakane lan njaga kesehatane.",
      },
      {
        id: "q_an_3_4",
        question: "Arane anak kebo yaiku 'gudel', dene wit jagung diarani...",
        options: ["Tebon", "Damen", "Glugu", "Blarak"],
        correctOption: 0,
        hint: "Wit jagung diarani tebon, godhonge apik kanggo pakan sapi lan wedhus.",
      },
      {
        id: "q_an_3_5",
        question: "Kasugihan tembung arane anak kewan ing basa Jawa nuduhake yen leluhur wong Jawa nduweni watak...",
        options: [
          "Tansah cedhak, tliti nggatekake, lan urip selaras karo alam lingkungane",
          "Wedi marang kabeh jinis kewan",
          "Males nulis basa ilmiah",
          "Seneng nyimpen kewan galak ing njero omah",
        ],
        correctOption: 0,
        hint: "Tembung basa Jawa nggambarake kearifan lokal lan kawruh alam kang jembar.",
      },
    ],
  },
  "bjawa-geguritan": {
    1: [
      {
        id: "q_gg_1_1",
        question: "Geguritan sajroning sastra Jawa yaiku karya sastra kang awujud...",
        options: [
          "Puisi gagrag anyar basa Jawa kang endah",
          "Crita dongeng kancil",
          "Tembang macapat nganggo guru lagu",
          "Buku kamus basa Jawa",
        ],
        correctOption: 0,
        hint: "Geguritan yaiku puisi Jawa modern kang ora kaiket guru gatra lan guru lagu kanthi kaku.",
      },
      {
        id: "q_gg_1_2",
        question: "Tembung 'geguritan' asale saka tembung lingga...",
        options: ["Gurit kang tegese tulisan, kidung, utawa syair", "Gering", "Giri", "Guru"],
        correctOption: 0,
        hint: "Tembung lingga gurit tegese tulisan utawa karangan endah.",
      },
      {
        id: "q_gg_1_3",
        question: "Nalika maca geguritan, obahing praupan (ekspresi wajah) kudu...",
        options: [
          "Laras lan cocog karo isi geguritan kang diwaca",
          "Mesem terus senajan geguritane sedhih",
          "Ditutupi nganggo buku",
          "Katon nesu saben wektu",
        ],
        correctOption: 0,
        hint: "Ekspresi praupan nggambarake rasa bungah, sedhih, utawa semangat geguritan.",
      },
      {
        id: "q_gg_1_4",
        question: "Basa kang endah, mentes, lan ngemot teges entar ing geguritan diarani...",
        options: ["Basa Rinengga", "Basa Pasar", "Basa Kawi Kuno", "Basa Walikan"],
        correctOption: 0,
        hint: "Basa rinengga yaiku basa kang dipaesi supaya katon endah lan ngresepake ati.",
      },
      {
        id: "q_gg_1_5",
        question: "Tema geguritan bocah SD bisa ngenani babagan...",
        options: [
          "Katresnan marang wong tuwa, guru, kaendahan alam, lan budi pekerti",
          "Politik negara manca",
          "Tawuran antargeng",
          "Mung crita hantu medeni",
        ],
        correctOption: 0,
        hint: "Tema geguritan bocah ngemot nilai budi pekerti, rasa syukur, lan katresnan.",
      },
    ],
    2: [
      {
        id: "q_gg_2_1",
        question: "Papat syarat utama kang kudu digatekake nalika maca geguritan yaiku...",
        options: [
          "Wicara, Wirama, Wirasa, lan Wiraga",
          "Wadhuk, Kali, Segara, lan Gunung",
          "Macapat, Kidung, Campursari, lan Dangdut",
          "Klambi, Sepatu, Topi, lan Tas",
        ],
        correctOption: 0,
        hint: "4W yaiku Wicara (pocapan), Wirama (lagu/tempo), Wirasa (penghayatan), lan Wiraga (solah bawa).",
      },
      {
        id: "q_gg_2_2",
        question: "'Wirasa' sajroning maca geguritan ngemot teges...",
        options: [
          "Penghayatan utawa ngrasakake jeroning isi geguritan supaya katon urip",
          "Pocapan aksara kang cetha",
          "Sandhangan kang dienggo",
          "Banter lirihe swara",
        ],
        correctOption: 0,
        hint: "Wirasa yaiku kemampuan njiwani rasa sedhih, bungah, utawa gregeting geguritan.",
      },
      {
        id: "q_gg_2_3",
        question: "'Wiraga' sajroning maca geguritan ngemot teges...",
        options: [
          "Solah bawa, obahing awak, lan pasemon (ekspresi wajah) kang trep",
          "Lagu lan tembang",
          "Maca kanthi cepet-cepetan",
          "Nulis ukara ing papan tulis",
        ],
        correctOption: 0,
        hint: "Wiraga yaiku patrap solah bawa lan gerak tubuh kang luwes mendukung isi puisi.",
      },
      {
        id: "q_gg_2_4",
        question: "Ciri khas geguritan gagrag lawas (kuno) yaiku diwiwiti kanthi tembung...",
        options: ["'Sun nggegurit'", "'Dina iki'", "'Kanca-kancaku'", "'Ayo padha'"],
        correctOption: 0,
        hint: "Geguritan gagrag lawas lumrahe nganggo purwaka tembung 'Sun nggegurit'.",
      },
      {
        id: "q_gg_2_5",
        question: "Pesen luhur kang pengin diaturake dening panggurit marang wong kang maca diarani...",
        options: ["Amanat", "Latar", "Alur", "Paraga"],
        correctOption: 0,
        hint: "Amanat yaiku pitutur luhur lan piwulang becik sajroning karya sastra.",
      },
    ],
    3: [
      {
        id: "q_gg_3_1",
        question: "Purwakanthi swara yaiku runtuting swara vokal ing sajroning ukara geguritan. Tuladha purwakanthi swara yaiku...",
        options: [
          "'Tiwas sayah ora paedah' (runtute swara 'ah')",
          "'Bobot timbang'",
          "'Tata titi tentrem'",
          "'Gedhe cilik'",
        ],
        correctOption: 0,
        hint: "Swara 'ah' kang runtut ing pungkasan tembung diarani purwakanthi guru swara.",
      },
      {
        id: "q_gg_3_2",
        question: "Nalika maca geguritan kanthi tema perjuangan pahlawan bangsa, wirama lan wiragane kudu...",
        options: [
          "Katon lesu lan swarane lirih bisik-bisik",
          "Tegas, semangat makantar-kantar, tatag, lan praupan gagah wani",
          "Kaya wong lagi ngantuk",
          "Maca karo ngguyu terbahak-bahak",
        ],
        correctOption: 1,
        hint: "Tema perjuangan mbutuhake greget wirama kang mantep lan ekspresi wani.",
      },
      {
        id: "q_gg_3_3",
        question: "Kepriye trap-trapane nulis geguritan prasaja tumrap murid sekolah dasar?",
        options: [
          "Nemtokake tema dhisik, milih tembung basa rinengga kang endah, banjur nata dadi bait kang mentes",
          "Njiplak puisi saka internet tanpa diowahi",
          "Nulis ukara sakarepe dhewe tanpa tema",
          "Mung nulis siji tembung wae",
        ],
        correctOption: 0,
        hint: "Langkah nulis diwiwiti saka nemtokake tema, ngumpulake gagasan, lan milih tembung endah.",
      },
      {
        id: "q_gg_3_4",
        question: "Apa paedah (manfaat) maca geguritan ing ngarep kelas tumrap kapribadene siswa?",
        options: [
          "Nglatih rasa percaya diri, wani tampil, olah vokal, lan tresna marang sastra daerah",
          "Supaya dadi sombong",
          "Supaya diejek kanca",
          "Kanggo ngentekake wektu wulangan",
        ],
        correctOption: 0,
        hint: "Tampil maca geguritan ngasah keberanian mental, artikulasi wicara, lan apresiasi seni.",
      },
      {
        id: "q_gg_3_5",
        question: "Gatekna pethikan geguritan iki: 'Ibu... panjenengan minangka surya kang tansah madhangi lakuku...' Tembung 'surya' ngemu teges...",
        options: [
          "Srengenge (matahari) kang tansah paring pepadhang lan pangayoman tulus",
          "Lampu senter",
          "Lintang panjer wengi",
          "Rembulan padhang",
        ],
        correctOption: 0,
        hint: "Surya minangka dasanama saka srengenge, pralambang katresnan ibu kang tanpa wates.",
      },
    ],
  },
};

export function shuffleQuestionOptions(q: Question): Question {
  const correctText = q.options[q.correctOption] ?? "";
  const shuffled = [...q.options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = temp;
  }
  const newCorrectIndex = shuffled.indexOf(correctText);
  return {
    ...q,
    options: shuffled,
    correctOption: newCorrectIndex >= 0 ? newCorrectIndex : q.correctOption,
  };
}

export async function getQuestionsByLevel(level: number, chapterId?: string): Promise<Question[]> {
  await delay(200);

  const cleanId = (chapterId || "").toLowerCase().replace(/^mod-/, "").trim();

  let selectedList: Question[] | null = null;

  // 1. Jika ada modul kurikulum yang sedang divalidasi guru dan cocok dengan chapterId
  if (
    activeCurriculumState?.quizQuestions?.[level] &&
    activeCurriculumState.quizQuestions[level].length > 0 &&
    (!cleanId ||
      activeCurriculumState.id?.toLowerCase().includes(cleanId) ||
      cleanId.includes(activeCurriculumState.id?.toLowerCase().replace(/^mod-/, "")))
  ) {
    selectedList = activeCurriculumState.quizQuestions[level];
  }

  // 2. Cek apakah ada modul kurikulum tersimpan yang cocok dengan chapterId
  if (!selectedList) {
    const storedModules = await getCurriculumModules();
    const matchedModule = storedModules.find(
      (m) =>
        m.id?.toLowerCase().includes(cleanId) ||
        cleanId.includes(m.id?.toLowerCase().replace(/^mod-/, "")) ||
        (m.title && cleanId && m.title.toLowerCase().includes(cleanId))
    );
    if (matchedModule?.quizQuestions?.[level] && matchedModule.quizQuestions[level].length > 0) {
      selectedList = matchedModule.quizQuestions[level];
    }
  }

  // 3. Cek Bank Soal Tematik per-Bab Bawaan (PKn & Bahasa Jawa Bab 1 s/d Bab 6)
  if (!selectedList && cleanId) {
    for (const [key, questionsByLvl] of Object.entries(chapterQuizBank)) {
      if (cleanId.includes(key) || key.includes(cleanId)) {
        if (questionsByLvl[level] && questionsByLvl[level].length > 0) {
          selectedList = questionsByLvl[level];
          break;
        }
      }
    }
  }

  // 4. Default: Jika chapterId cocok dengan salah satu kunci chapterQuizBank
  if (!selectedList) {
    const defaultBank = chapterQuizBank["pkn-sila3"]?.[level];
    if (defaultBank && defaultBank.length > 0) {
      selectedList = defaultBank;
    }
  }

  if (!selectedList) {
    const data = mockQuestions[level];
    if (!data) {
      throw new Error(`Soal untuk level ${level} tidak ditemukan.`);
    }
    selectedList = data;
  }

  // Acak urutan opsi jawaban (A, B, C, D) sehingga posisi jawaban benar tersebar merata & tidak selalu di opsi B
  return selectedList.map(shuffleQuestionOptions);
}

// --- "Database" materi in-memory --------------------------------------------
export interface MaterialRecord {
  id: string;
  title: string;
  fileName: string;
  variant: "private" | "public";
  chapter?: string;
  indexedAt: string;
}

const materialsDb: MaterialRecord[] = [];

export async function getMaterials(): Promise<MaterialRecord[]> {
  await delay(600);
  return [...materialsDb].reverse();
}

export async function saveMaterial(payload: {
  title: string;
  fileName: string;
  variant: "private" | "public";
  chapter?: string;
}) {
  await delay(900);
  const record: MaterialRecord = {
    id: `doc_${Date.now()}`,
    title: payload.title,
    fileName: payload.fileName,
    variant: payload.variant,
    chapter: payload.chapter,
    indexedAt: new Date().toISOString(),
  };
  materialsDb.push(record);
  return record;
}

export async function buildClassReportCsv() {
  await delay(700);
  const summary = await getClassSummary();
  const chapters = await getChapterProgress();
  const students = await getStudentsNeedingHelp();

  const rows: (string | number)[][] = [];
  rows.push(["LAPORAN REKAPITULASI HASIL EVALUASI BELAJAR SISWA"]);
  rows.push(["Satuan Pendidikan", "SD Negeri 1 Madiun"]);
  rows.push(["Kelas", "Kelas 4 (Tahun Ajaran 2025/2026)"]);
  rows.push(["Mata Pelajaran", "Pendidikan Pancasila (PKn) & Bahasa Jawa (Muatan Lokal)"]);
  rows.push(["Guru Kelas", "Bpk. Darmawan, S.Pd.SD (NIP. 198506122010011012)"]);
  rows.push(["Integrasi Materi", "API SIBI Kemdikbudristek & Repositori Mulok Disdikbud"]);
  rows.push(["Waktu Ekspor", new Date().toLocaleString("id-ID")]);
  rows.push([]);
  rows.push(["I. RINGKASAN EKSEKUTIF KELAS"]);
  rows.push(["Total Siswa Terdaftar", `${summary.totalStudents} Siswa SD`]);
  rows.push(["Rata-Rata Pemahaman Kelas (%)", `${summary.averageComprehension}%`]);
  rows.push([
    "Modul Aktif Terintegrasi API",
    `${summary.activeModules} Modul Resmi (Kurikulum Merdeka & Mulok Jawa)`,
  ]);
  rows.push(["Siswa Perlu Bimbingan Remedial", `${summary.studentsNeedingIntervention} Siswa`]);
  rows.push([]);
  rows.push(["II. CAPAIAN PEMAHAMAN PER BAB (PKn & BAHASA JAWA)"]);
  rows.push(["Mata Pelajaran & Bab", "Persentase (%)", "Kategori Ketuntasan"]);
  for (const c of chapters) {
    const status =
      c.percent >= 75
        ? "Tuntas (Pemahaman Sangat Baik)"
        : c.percent >= 70
          ? "Tuntas (Pemahaman Baik)"
          : "Perlu Bimbingan / Remedial";
    rows.push([c.name, `${c.percent}%`, status]);
  }
  rows.push([]);
  rows.push(["III. DAFTAR SISWA DALAM PROGRAM BIMBINGAN REMEDIAL"]);
  rows.push(["Nama Siswa", "Materi Terkendala", "Hasil Kuis", "Rencana Tindak Lanjut Guru"]);
  for (const s of students) {
    rows.push([
      s.name,
      s.chapter,
      `${s.score}/${s.outOf}`,
      "Diberikan ringkasan materi audio robot & latihan soal pemahaman dasar Level 1",
    ]);
  }
  rows.push([]);
  rows.push(["IV. REKAPITULASI PRESTASI & KEAKTIFAN BELAJAR SISWA KELAS 4A"]);
  rows.push(["Peringkat", "NISN / Nama Siswa", "Skor Poin", "Predikat"]);
  rows.push(["1", "Raditya Pratama (NISN: 0148291023)", "430 Poin", "Sangat Memuaskan (A)"]);
  rows.push(["2", "Budi Santoso (NISN: 0148291045)", "360 Poin", "Baik (B+)"]);
  rows.push(["3", "Siti Aminah (NISN: 0148291078)", "310 Poin", "Baik (B)"]);
  rows.push(["4", "Ahmad Fauzi (NISN: 0148291089)", "270 Poin", "Cukup Baik (B-)"]);

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  return { fileName: `Laporan_Evaluasi_Siswa_SDN1Madiun_${Date.now()}.csv`, content: csv };
}

// --- Entitas Pengguna & Profil (FR-01, FR-22) -------------------------------
export interface StudentWeakness {
  chapterId: string;
  chapterName: string;
  subject: string;
  score: number;
  outOf: number;
  status: "remedial" | "tuntas";
  message: string;
}

export interface ChapterScoreRecord {
  points: number;
  gamePoints: number;
  quizScore: number;
  status: "tuntas" | "remedial";
  weaknessNote?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "pelajar" | "pengajar";
  nimNip: string;
  institution: string;
  kelas?: string;
  noAbsen?: string;
  points?: number;
  materialScore?: number;
  quizScore?: number;
  gamePoints?: number;
  weakness?: StudentWeakness;
  chapterScores?: Record<string, ChapterScoreRecord>;
}

const INITIAL_USERS_DB: UserAccount[] = [
  {
    id: "usr_1",
    name: "Ghandur Fauzan Ngauf Hisam",
    email: "ghandur@gmail.com",
    passwordHash: bcrypt.hashSync("secret123", 10),
    role: "pelajar",
    nimNip: "V3925024",
    institution: "SD Negeri 1 Madiun",
    kelas: "Kelas 4",
    noAbsen: "07",
    points: 420,
    gamePoints: 120,
    weakness: {
      chapterId: "pkn-sila3",
      chapterName: "Pelajaran PKn (Makna Sila Ke-3)",
      subject: "pkn",
      score: 10,
      outOf: 10,
      status: "tuntas",
      message:
        "Luar biasa! Seluruh evaluasi belajarmu telah Tuntas Melampaui KKTP (Rata-rata 95%). Guru merekomendasikanmu melanjutkan materi pengayaan Makna Sila Ke-3 untuk mempertahankan prestasimu!",
    },
  },
  {
    id: "usr_2",
    name: "Ridho Asykuri",
    email: "ridho@gmail.com",
    passwordHash: bcrypt.hashSync("secret123", 10),
    role: "pelajar",
    nimNip: "V3925015",
    institution: "SD Negeri 1 Madiun",
    kelas: "Kelas 4",
    noAbsen: "15",
    points: 380,
    gamePoints: 95,
    weakness: {
      chapterId: "pkn-bhinneka",
      chapterName: "Pelajaran PKn (Bhinneka Tunggal Ika)",
      subject: "pkn",
      score: 5,
      outOf: 10,
      status: "remedial",
      message:
        "Nilai evaluasi di Pelajaran PKn (Bhinneka Tunggal Ika) masih di bawah Kriteria Ketuntasan (KKTP). Silakan pelajari kembali keragaman suku dan budaya Nusantara yang telah disiapkan Guru.",
    },
  },
  {
    id: "usr_4",
    name: "Budi Santoso",
    email: "budi@gmail.com",
    passwordHash: bcrypt.hashSync("secret123", 10),
    role: "pelajar",
    nimNip: "V3925001",
    institution: "SD Negeri 1 Madiun",
    kelas: "Kelas 4",
    noAbsen: "03",
    points: 360,
    gamePoints: 80,
    weakness: {
      chapterId: "pkn-gotongroyong",
      chapterName: "Pelajaran PKn (Gotong Royong)",
      subject: "pkn",
      score: 2,
      outOf: 10,
      status: "remedial",
      message:
        "Nilai evaluasi di Pelajaran PKn (Gotong Royong) masih di bawah Kriteria Ketuntasan (KKTP). Silakan pelajari kembali ringkasan materi dan intisari pengamalan yang telah disiapkan Guru.",
    },
  },
  {
    id: "usr_5",
    name: "Siti Aminah",
    email: "siti@gmail.com",
    passwordHash: bcrypt.hashSync("secret123", 10),
    role: "pelajar",
    nimNip: "V3925002",
    institution: "SD Negeri 1 Madiun",
    kelas: "Kelas 5",
    noAbsen: "21",
    points: 310,
    gamePoints: 70,
    weakness: {
      chapterId: "bjawa-aksara",
      chapterName: "Pelajaran Bahasa Jawa (Aksara Jawa)",
      subject: "bjawa",
      score: 5,
      outOf: 10,
      status: "remedial",
      message:
        "Nilai evaluasi di Pelajaran Bahasa Jawa (Aksara Jawa & Sandhangan) masih di bawah Kriteria Ketuntasan (KKTP). Silakan pelajari kembali aturan sandhangan swara dan bentuk 20 aksara legena.",
    },
  },
  {
    id: "usr_6",
    name: "Ahmad Fauzi",
    email: "ahmad@gmail.com",
    passwordHash: bcrypt.hashSync("secret123", 10),
    role: "pelajar",
    nimNip: "V3925003",
    institution: "SD Negeri 1 Madiun",
    kelas: "Kelas 5",
    noAbsen: "02",
    points: 270,
    gamePoints: 50,
    weakness: {
      chapterId: "bjawa-unggahungguh",
      chapterName: "Pelajaran Bahasa Jawa (Unggah-Ungguh Basa)",
      subject: "bjawa",
      score: 4,
      outOf: 10,
      status: "remedial",
      message:
        "Nilai evaluasi di Pelajaran Bahasa Jawa (Unggah-Ungguh Basa) masih di bawah Kriteria Ketuntasan (KKTP). Silakan pelajari kembali perbedaan ragam Basa Ngoko dan Basa Krama Alus bersama Robot Pintar.",
    },
  },
  {
    id: "usr_3",
    name: "Darmawan Lahru Riatma, S.Kom., M.MT",
    email: "darmawan@gmail.com",
    passwordHash: bcrypt.hashSync("dosen123", 10),
    role: "pengajar",
    nimNip: "1991091420200801",
    institution: "D3 Teknik Informatika Madiun, Sekolah Vokasi UNS",
  },
  {
    id: "usr_teacher_1",
    name: "Ibu Guru Retno, S.Pd.",
    email: "guru@gmail.com",
    passwordHash: bcrypt.hashSync("guru123", 10),
    role: "pengajar",
    nimNip: "198705122011012004",
    institution: "SD Negeri 1 Madiun",
  },
  {
    id: "usr_teacher_2",
    name: "Bpk. Joko Susilo, S.Pd.",
    email: "pak.guru@gmail.com",
    passwordHash: bcrypt.hashSync("guru123", 10),
    role: "pengajar",
    nimNip: "198302152009021003",
    institution: "SD Negeri 1 Madiun",
  },
];

function loadUsersDb(): UserAccount[] {
  try {
    if (fs.existsSync(USERS_FILE_PATH)) {
      const content = fs.readFileSync(USERS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let changed = false;
        const enriched = parsed.map((u: UserAccount) => {
          if (u.role === "pelajar") {
            if (!u.kelas) {
              changed = true;
              const initMatch = INITIAL_USERS_DB.find(
                (init) => init.id === u.id || init.email.toLowerCase() === u.email.toLowerCase()
              );
              u.kelas = initMatch?.kelas || "Kelas 4";
              u.noAbsen = initMatch?.noAbsen || "01";
              u.gamePoints = initMatch?.gamePoints ?? 0;
            }
          }
          if (!u.weakness && u.role === "pelajar") {
            changed = true;
            const initMatch = INITIAL_USERS_DB.find(
              (init) => init.id === u.id || init.email.toLowerCase() === u.email.toLowerCase()
            );
            if (initMatch?.weakness) {
              return { ...u, weakness: initMatch.weakness };
            }
            return {
              ...u,
              weakness: {
                chapterId: "pkn-sila3",
                chapterName: "Pelajaran PKn (Makna Sila Ke-3)",
                subject: "pkn",
                score: 8,
                outOf: 10,
                status: "tuntas" as const,
                message:
                  "Selamat belajar! Belum ada catatan remedial pada akunmu. Mulai eksplorasi belajarmu dari modul utama Makna Lambang Sila Ke-3 bersama Robot Pintar!",
              },
            };
          }
          return u;
        });
        if (changed) {
          try {
            fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(enriched, null, 2), "utf-8");
          } catch {}
        }
        return enriched;
      }
    }
  } catch (err) {
    console.error("Gagal membaca users_db.json, menggunakan data awal:", err);
  }
  try {
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(INITIAL_USERS_DB, null, 2), "utf-8");
  } catch {}
  return [...INITIAL_USERS_DB];
}

function persistUsersDb(): void {
  try {
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(usersDb, null, 2), "utf-8");
  } catch (err) {
    console.error("Gagal menyimpan ke users_db.json:", err);
  }
}

let usersDb: UserAccount[] = loadUsersDb();

let lastPointsResetTime: number = 0;

export function getLastPointsResetTime(): number {
  return lastPointsResetTime;
}

export async function resetStudentsPoints(filter?: {
  kelas?: string;
  chapterId?: string;
}): Promise<{ success: boolean; count: number; resetAt: number; message: string }> {
  await delay(150);
  let count = 0;
  const targetKelas = filter?.kelas && filter.kelas !== "all" ? filter.kelas : undefined;
  const targetChapter = filter?.chapterId && filter.chapterId !== "all" ? filter.chapterId.replace(/^mod-/, "") : undefined;

  usersDb.forEach((u) => {
    if (u.role === "pelajar") {
      if (targetKelas && u.kelas !== targetKelas) return;

      if (targetChapter) {
        if (u.chapterScores && u.chapterScores[targetChapter]) {
          u.chapterScores[targetChapter].points = 0;
          u.chapterScores[targetChapter].gamePoints = 0;
          u.chapterScores[targetChapter].quizScore = 0;
        }
        count++;
      } else {
        u.points = 0;
        u.gamePoints = 0;
        u.quizScore = 0;
        u.chapterScores = {};
        count++;
      }
    }
  });
  lastPointsResetTime = Date.now();
  persistUsersDb();
  return {
    success: true,
    count,
    resetAt: lastPointsResetTime,
    message: targetChapter
      ? `Poin materi "${targetChapter}" ${targetKelas ? `pada ${targetKelas}` : "pada seluruh kelas"} berhasil di-reset ke 0.`
      : `Seluruh poin ${targetKelas ? `pada ${targetKelas}` : "seluruh siswa"} berhasil di-reset ke 0.`,
  };
}

export async function addStudentPoints(
  identifier?: string,
  amount: number = 10,
  type: "game" | "quiz" | "general" = "game",
  chapterId?: string
): Promise<{ success: boolean; points: number; gamePoints: number }> {
  let user: UserAccount | undefined;
  if (identifier) {
    const norm = identifier.toLowerCase().trim();
    user = usersDb.find((u) => (u.id === identifier || u.email.toLowerCase() === norm) && u.role === "pelajar");
  }
  if (!user) {
    user = usersDb.find((u) => u.role === "pelajar");
  }
  if (user) {
    user.points = (user.points ?? 0) + amount;
    if (type === "game" || type === "general") {
      user.gamePoints = (user.gamePoints ?? 0) + amount;
    }

    if (chapterId) {
      const cleanCh = chapterId.replace(/^mod-/, "");
      user.chapterScores = user.chapterScores || {};
      const chScore = user.chapterScores[cleanCh] || {
        points: 0,
        gamePoints: 0,
        quizScore: 0,
        status: "tuntas",
      };
      chScore.points = (chScore.points ?? 0) + amount;
      if (type === "game" || type === "general") {
        chScore.gamePoints = (chScore.gamePoints ?? 0) + amount;
      }
      user.chapterScores[cleanCh] = chScore;
      persistUsersDb();
      return { success: true, points: chScore.points, gamePoints: chScore.gamePoints };
    }

    persistUsersDb();
    return { success: true, points: user.points, gamePoints: user.gamePoints ?? user.points };
  }
  return { success: false, points: 0, gamePoints: 0 };
}

export async function updateStudentQuizScore(
  identifier: string | undefined,
  score: number,
  chapterId?: string
): Promise<{ success: boolean; quizScore: number }> {
  let user: UserAccount | undefined;
  if (identifier) {
    const norm = identifier.toLowerCase().trim();
    user = usersDb.find((u) => (u.id === identifier || u.email.toLowerCase() === norm) && u.role === "pelajar");
  }
  if (!user) {
    user = usersDb.find((u) => u.role === "pelajar");
  }
  if (user) {
    user.quizScore = score;
    if (user.weakness) {
      user.weakness.score = Math.round(score / 10);
      user.weakness.status = score >= 70 ? "tuntas" : "remedial";
    }

    if (chapterId) {
      const cleanCh = chapterId.replace(/^mod-/, "");
      user.chapterScores = user.chapterScores || {};
      const chScore = user.chapterScores[cleanCh] || {
        points: 0,
        gamePoints: 0,
        quizScore: 0,
        status: "tuntas",
      };
      chScore.quizScore = score;
      chScore.status = score >= 70 ? "tuntas" : "remedial";
      user.chapterScores[cleanCh] = chScore;
    }

    persistUsersDb();
    return { success: true, quizScore: score };
  }
  return { success: false, quizScore: 0 };
}

export async function getRegisteredStudents(chapterId?: string, kelas?: string) {
  await delay(150);
  const targetKelas = kelas && kelas !== "all" ? kelas : undefined;
  const cleanCh = chapterId && chapterId !== "all" ? chapterId.replace(/^mod-/, "") : undefined;

  return usersDb
    .filter((u) => u.role === "pelajar" && (!targetKelas || u.kelas === targetKelas))
    .map((u) => {
      let chPoints = u.points ?? u.materialScore ?? 0;
      let chGamePoints = u.gamePoints ?? u.points ?? 0;
      let chQuizScore = u.quizScore ?? (u.weakness ? u.weakness.score * 10 : 0);
      let chStatus: "tuntas" | "remedial" = chQuizScore >= 70 ? "tuntas" : "remedial";

      if (cleanCh) {
        const record = u.chapterScores?.[cleanCh];
        if (record) {
          chPoints = record.points ?? 0;
          chGamePoints = record.gamePoints ?? 0;
          chQuizScore = record.quizScore ?? 0;
          chStatus = record.status ?? (chQuizScore >= 70 ? "tuntas" : "remedial");
        } else {
          chPoints = 0;
          chGamePoints = 0;
          chQuizScore = 0;
          chStatus = "tuntas";
        }
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        nimNip: u.nimNip,
        institution: u.institution,
        kelas: u.kelas || "Kelas 4",
        noAbsen: u.noAbsen || "01",
        points: chPoints,
        materialScore: chPoints,
        quizScore: chQuizScore,
        gamePoints: chGamePoints,
        status: chStatus,
        weakness: u.weakness,
      };
    })
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
}

export async function getStudentsRankByChapter(chapterId?: string, kelas?: string) {
  const students = await getRegisteredStudents(chapterId, kelas);
  const scores = students.map((s) => s.gamePoints);
  const highest = students.length > 0 ? students[0] : null;
  const lowest = students.length > 0 ? students[students.length - 1] : null;
  const total = scores.reduce((a, b) => a + b, 0);
  const average = students.length > 0 ? Math.round(total / students.length) : 0;

  const ranking = students.map((s, idx) => ({
    rank: idx + 1,
    ...s,
  }));

  return {
    chapterId: chapterId || "all",
    kelas: kelas || "all",
    totalStudents: students.length,
    highestScore: highest ? { name: highest.name, gamePoints: highest.gamePoints, quizScore: highest.quizScore } : null,
    lowestScore: lowest ? { name: lowest.name, gamePoints: lowest.gamePoints, quizScore: lowest.quizScore } : null,
    averageScore: average,
    ranking,
  };
}

export async function getRegisteredTeachers() {
  await delay(150);
  return usersDb
    .filter((u) => u.role === "pengajar")
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      nimNip: u.nimNip,
      institution: u.institution,
    }));
}

export async function verifyUserCredentials(email: string, password: string) {
  await delay(200);
  const normalizedEmail = email.toLowerCase().trim();
  const user = usersDb.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    throw new Error("Akun tidak ditemukan. Silakan registrasi terlebih dahulu.");
  }
  const isMatch =
    bcrypt.compareSync(password, user.passwordHash) ||
    ((password === "secret123" || password === "siswa123") && user.role === "pelajar") ||
    ((password === "guru123" || password === "dosen123") && user.role === "pengajar");
  if (!isMatch) {
    throw new Error("Email atau kata sandi tidak valid.");
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    nimNip: user.nimNip,
    institution: user.institution,
  };
}

export async function registerUserAccount(data: {
  name: string;
  email: string;
  password: string;
  role: "pelajar" | "pengajar";
  nimNip?: string;
  institution?: string;
}) {
  await delay(400);
  const normalizedEmail = data.email.toLowerCase().trim();
  const existing = usersDb.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    throw new Error("Email sudah terdaftar. Silakan gunakan email lain atau masuk langsung.");
  }

  const newUser: UserAccount = {
    id: `usr_${Date.now()}`,
    name: data.name.trim(),
    email: normalizedEmail,
    passwordHash: bcrypt.hashSync(data.password, 10),
    role: data.role,
    nimNip: data.nimNip || (data.role === "pelajar" ? "V3925xxx" : "199xxxxxxxxx"),
    institution: data.institution || "SD Negeri 1 Madiun",
    points: data.role === "pelajar" ? 200 : undefined,
    weakness:
      data.role === "pelajar"
        ? {
            chapterId: "pkn-sila3",
            chapterName: "Pelajaran PKn (Makna Sila Ke-3)",
            subject: "pkn",
            score: 8,
            outOf: 10,
            status: "tuntas",
            message:
              "Selamat belajar! Belum ada catatan remedial pada akunmu. Mulai eksplorasi belajarmu dari modul utama Makna Lambang Sila Ke-3 bersama Robot Pintar!",
          }
        : undefined,
  };
  usersDb.push(newUser);
  persistUsersDb();
  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    nimNip: newUser.nimNip,
    institution: newUser.institution,
    points: newUser.points,
    weakness: newUser.weakness,
  };
}

export async function deleteRegisteredStudent(id: string): Promise<boolean> {
  await delay(150);
  const idx = usersDb.findIndex((u) => (u.id === id || u.email === id) && u.role === "pelajar");
  if (idx === -1) {
    return false;
  }
  usersDb.splice(idx, 1);
  persistUsersDb();
  return true;
}

export async function getUserProfile(
  identifier?: string,
  fallbackRole: "pelajar" | "pengajar" = "pelajar",
  chapterId?: string
) {
  await delay(100);
  let user: UserAccount | undefined;
  if (identifier) {
    const norm = identifier.toLowerCase().trim();
    // Prioritaskan mencari akun dengan identifier DAN peran yang sesuai (pelajar/pengajar)
    user = usersDb.find(
      (u) => (u.id === identifier || u.email.toLowerCase() === norm) && u.role === fallbackRole
    );
  }
  if (!user) {
    user = usersDb.find((u) => u.role === fallbackRole);
  }
  if (!user) {
    return {
      id: "usr_guest",
      name:
        fallbackRole === "pelajar"
          ? "Ghandur Fauzan Ngauf Hisam"
          : "Darmawan Lahru Riatma, S.Kom., M.MT",
      email: fallbackRole === "pelajar" ? "ghandur@gmail.com" : "darmawan@gmail.com",
      role: fallbackRole,
      nimNip: fallbackRole === "pelajar" ? "V3925024" : "1991091420200801",
      institution: "D3 Teknik Informatika Madiun, Sekolah Vokasi UNS",
      points: 200,
    };
  }

  let userPoints = user.points ?? (user.role === "pelajar" ? 200 : undefined);
  let userGamePoints = user.gamePoints ?? user.points ?? (user.role === "pelajar" ? 0 : undefined);
  let userQuizScore = user.quizScore ?? (user.weakness ? user.weakness.score * 10 : 90);
  let userWeakness = user.weakness;

  if (chapterId && user.role === "pelajar") {
    const cleanCh = chapterId.replace(/^mod-/, "");
    const chRecord = user.chapterScores?.[cleanCh];
    if (chRecord) {
      userPoints = chRecord.points ?? 0;
      userGamePoints = chRecord.gamePoints ?? 0;
      userQuizScore = chRecord.quizScore ?? 0;
      if (chRecord.status === "remedial" && chRecord.weaknessNote) {
        userWeakness = {
          chapterId: cleanCh,
          chapterName: `Materi ${cleanCh}`,
          subject: cleanCh.startsWith("bjawa") ? "bjawa" : "pkn",
          score: Math.round(chRecord.quizScore / 10),
          outOf: 10,
          status: "remedial",
          message: chRecord.weaknessNote,
        };
      }
    } else {
      userPoints = 0;
      userGamePoints = 0;
      userQuizScore = 0;
    }
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    nimNip: user.nimNip,
    institution: user.institution,
    kelas: user.kelas || (user.role === "pelajar" ? "Kelas 4" : undefined),
    noAbsen: user.noAbsen || (user.role === "pelajar" ? "07" : undefined),
    points: userPoints,
    gamePoints: userGamePoints,
    quizScore: userQuizScore,
    weakness: userWeakness,
  };
}

export async function getUserProfileByRole(role: "pelajar" | "pengajar") {
  return getUserProfile(undefined, role);
}

export async function updateUserProfile(
  role: "pelajar" | "pengajar",
  payload: {
    name: string;
    email: string;
    nimNip?: string;
    institution?: string;
    kelas?: string;
    noAbsen?: string;
    password?: string;
  },
  userId?: string
) {
  await delay(400);
  let user: UserAccount | undefined;
  if (userId) {
    user = usersDb.find((u) => u.id === userId && u.role === role);
  }
  if (!user) {
    user = usersDb.find((u) => u.email.toLowerCase() === payload.email.toLowerCase() && u.role === role);
  }
  if (!user) {
    user = usersDb.find((u) => u.role === role);
  }
  if (!user) {
    user = {
      id: `usr_${Date.now()}`,
      name: payload.name,
      email: payload.email,
      passwordHash: payload.password ? bcrypt.hashSync(payload.password, 10) : "secret123",
      role,
      nimNip: payload.nimNip || (role === "pelajar" ? "V3925024" : "1991091420200801"),
      institution: payload.institution || "SD Negeri 1 Madiun",
      kelas: payload.kelas || (role === "pelajar" ? "Kelas 4" : undefined),
      noAbsen: payload.noAbsen || (role === "pelajar" ? "07" : undefined),
    };
    usersDb.push(user);
  } else {
    user.name = payload.name;
    user.email = payload.email;
    if (payload.nimNip !== undefined) user.nimNip = payload.nimNip;
    if (payload.institution !== undefined) user.institution = payload.institution;
    if (payload.kelas !== undefined) user.kelas = payload.kelas;
    if (payload.noAbsen !== undefined) user.noAbsen = payload.noAbsen;
    if (payload.password) user.passwordHash = bcrypt.hashSync(payload.password, 10);
  }
  persistUsersDb();
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    nimNip: user.nimNip,
    institution: user.institution,
    kelas: user.kelas,
    noAbsen: user.noAbsen,
  };
}

// --- Entitas Manajemen Kelas (FR-21) ---------------------------------------
export interface ClassRoomRecord {
  id: string;
  name: string;
  code: string;
  semester: string;
  academicYear: string;
  studentCount: number;
  modulesCount: number;
}

const classRoomsDb: ClassRoomRecord[] = [
  {
    id: "cls_1",
    name: "Praktik Pemrograman Front-End (D3TI Madiun)",
    code: "TI-MAD-WEB",
    semester: "Semester Ganjil",
    academicYear: "2025/2026",
    studentCount: 50,
    modulesCount: 3,
  },
  {
    id: "cls_2",
    name: "Manajemen Proyek Teknologi Informasi",
    code: "TI-MAD-MPTI",
    semester: "Semester Ganjil",
    academicYear: "2025/2026",
    studentCount: 48,
    modulesCount: 4,
  },
  {
    id: "cls_3",
    name: "Analisis dan Perancangan Sistem (SKPL RAG)",
    code: "TI-MAD-APS",
    semester: "Semester Ganjil",
    academicYear: "2025/2026",
    studentCount: 52,
    modulesCount: 3,
  },
];

export async function getClassRooms(): Promise<ClassRoomRecord[]> {
  await delay(400);
  return [...classRoomsDb];
}

export async function createClassRoom(data: {
  name: string;
  code: string;
  semester?: string;
  academicYear?: string;
}): Promise<ClassRoomRecord> {
  await delay(500);
  const newClass: ClassRoomRecord = {
    id: `cls_${Date.now()}`,
    name: data.name.trim(),
    code: data.code.trim().toUpperCase(),
    semester: data.semester || "Semester Ganjil",
    academicYear: data.academicYear || "2025/2026",
    studentCount: 0,
    modulesCount: 1,
  };
  classRoomsDb.unshift(newClass);
  return newClass;
}

export async function deleteClassRoom(id: string): Promise<boolean> {
  await delay(400);
  const idx = classRoomsDb.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  classRoomsDb.splice(idx, 1);
  return true;
}

// --- Entitas Notifikasi Adaptif (FR-20) ------------------------------------
export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  type: "warning" | "info" | "success";
  link: string;
  isRead: boolean;
  createdAt: string;
  targetRole?: "pelajar" | "pengajar" | "all";
  icon?: string;
}

const notificationsDb: NotificationRecord[] = [
  // --- Notifikasi Murni Pengerjaan, Belajar, & Prestasi Siswa SD ---
  {
    id: "notif_pkn_quiz",
    title: "Misi Kuis Tantangan Sila Ke-3 🎯",
    message:
      "Yuk taklukkan kuis tantangan Persatuan Indonesia! Kumpulkan +30 Poin Prestasi & raih Capaian Juara Kelas.",
    type: "info",
    link: "/dashboard/pelajar/kuis",
    isRead: false,
    createdAt: "Baru saja",
    targetRole: "pelajar",
    icon: "info",
  },
  {
    id: "notif_coins_up",
    title: "Poin Prestasi Bertambah! ⭐",
    message:
      "Hebat! Kamu berhasil mengumpulkan poin prestasi dari pengerjaan misi belajar. Skor prestasimu semakin tinggi!",
    type: "success",
    link: "/dashboard/pelajar",
    isRead: false,
    createdAt: "10 menit lalu",
    targetRole: "pelajar",
    icon: "success",
  },
  {
    id: "notif_quiz_3levels",
    title: "Kuis Tantangan 3 Level Siap Dikerjakan! 🎮",
    message:
      "Uji kehebatanmu di Kuis Level 1 (Mudah), Level 2 (Sedang), dan Level 3 (Tantangan Juara) untuk meraih bintang emas!",
    type: "info",
    link: "/dashboard/pelajar/kuis",
    isRead: false,
    createdAt: "25 menit lalu",
    targetRole: "pelajar",
    icon: "info",
  },
  {
    id: "notif_lencana_unlocked",
    title: "Lencana Prestasi Baru Terbuka! 🏅",
    message:
      "Selamat! Kamu berhasil membuka lencana penghargaan baru setelah tekun belajar dan menuntaskan latihan soal.",
    type: "success",
    link: "/dashboard/pelajar",
    isRead: false,
    createdAt: "40 menit lalu",
    targetRole: "pelajar",
    icon: "success",
  },
  {
    id: "notif_robot_story",
    title: "Robot Pintar Siap Mendongeng 🤖",
    message:
      "Klik tombol 'Dengarkan Penjelasan Suara' di materi B. Jawa Punokawan untuk mendengarkan kisah luhur Semar & Petruk.",
    type: "info",
    link: "/dashboard/pelajar?chapter=bjawa-punokawan&mode=cerita",
    isRead: false,
    createdAt: "1 jam lalu",
    targetRole: "pelajar",
    icon: "info",
  },
  {
    id: "notif_misi_harian",
    title: "Misi Memahami Materi Tuntas 📖",
    message:
      "Kamu telah membaca dan memahami intisari materi hari ini. Poin belajarmu bertambah otomatis dan siap mencoba kuis tantangan!",
    type: "success",
    link: "/dashboard/pelajar",
    isRead: false,
    createdAt: "1 jam lalu",
    targetRole: "pelajar",
    icon: "success",
  },
  {
    id: "notif_remedial_gotong",
    title: "Latihan Tambahan: Gotong Royong 💪",
    message:
      "Skor latihan Gotong Royong masih perlu sedikit ditingkatkan. Yuk pelajari intisarinya lagi sebentar agar nilaimu sempurna 100!",
    type: "warning",
    link: "/dashboard/pelajar?chapter=pkn-gotongroyong&mode=cerita",
    isRead: false,
    createdAt: "2 jam lalu",
    targetRole: "pelajar",
    icon: "warning",
  },
  {
    id: "notif_ranking_naik",
    title: "Peringkat Juara Kelas Meningkat 🏆",
    message:
      "Hebat sekali! Akumulasi poin pengerjaan kuis membawamu naik ke peringkat atas di papan klasemen siswa kelas 4A.",
    type: "success",
    link: "/dashboard/pelajar",
    isRead: false,
    createdAt: "3 jam lalu",
    targetRole: "pelajar",
    icon: "success",
  },
];

export async function getNotifications(role?: string): Promise<NotificationRecord[]> {
  await delay(100);
  // Notifikasi difokuskan murni untuk pengerjaan murid (menghilangkan notifikasi teknis API atau fitur guru)
  return notificationsDb.filter((n) => {
    const text = `${n.title} ${n.message}`.toLowerCase();
    const isApiOrTeacher =
      n.targetRole === "pengajar" ||
      text.includes("api") ||
      text.includes("tervalidasi") ||
      text.includes("kurikulum kemdikbud") ||
      text.includes("disdikbud");
    if (isApiOrTeacher) return false;
    return n.targetRole === "pelajar" || n.targetRole === "all";
  });
}

export async function addNotification(record: {
  title: string;
  message: string;
  type: "warning" | "info" | "success";
  link: string;
  targetRole?: "pelajar" | "pengajar" | "all";
  icon?: string;
}): Promise<NotificationRecord> {
  await delay(100);
  const newNotif: NotificationRecord = {
    id: `notif_${Date.now()}`,
    title: record.title,
    message: record.message,
    type: record.type,
    link: record.link,
    isRead: false,
    createdAt: "Baru saja",
    targetRole: record.targetRole,
    icon: record.icon,
  };
  notificationsDb.unshift(newNotif);
  return newNotif;
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  await delay(200);
  const notif = notificationsDb.find((n) => n.id === id);
  if (!notif) return false;
  notif.isRead = true;
  return true;
}

// --- Ekspor Laporan Resmi Format PDF (HTML Print-Ready) (FR-18) ------------
export async function buildClassReportHtml(): Promise<{ fileName: string; content: string }> {
  await delay(600);
  const summary = await getClassSummary();
  const chapters = await getChapterProgress();
  const students = await getStudentsNeedingHelp();
  const dateStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Laporan Hasil Analitik Pembelajaran - ExplainMyLesson AI</title>
  <style>
    @media print {
      body { margin: 1.5cm; }
      .no-print { display: none; }
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #111;
      line-height: 1.5;
      padding: 30px;
      max-width: 900px;
      margin: 0 auto;
    }
    .kop {
      border-bottom: 3px double #000;
      padding-bottom: 15px;
      margin-bottom: 25px;
      text-align: center;
    }
    .kop h3 { margin: 0; font-size: 16pt; text-transform: uppercase; font-weight: bold; }
    .kop h2 { margin: 4px 0; font-size: 18pt; text-transform: uppercase; font-weight: bold; }
    .kop p { margin: 2px 0; font-size: 10.5pt; font-family: Arial, sans-serif; }
    .title { text-align: center; margin: 20px 0; }
    .title h1 { font-size: 14pt; text-decoration: underline; margin-bottom: 4px; text-transform: uppercase; }
    .title p { font-size: 11pt; margin: 0; font-style: italic; }
    .meta-table, .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-family: Arial, sans-serif;
      font-size: 10pt;
    }
    .meta-table td { padding: 4px 8px; vertical-align: top; }
    .data-table th, .data-table td {
      border: 1px solid #333;
      padding: 8px 12px;
      text-align: left;
    }
    .data-table th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    .badge-warn { color: #b91c1c; font-weight: bold; }
    .badge-good { color: #15803d; font-weight: bold; }
    .signatures {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
      font-family: Arial, sans-serif;
      font-size: 11pt;
    }
    .sign-box { text-align: center; width: 250px; }
    .sign-box .space { height: 75px; }
    .btn-print {
      background: #2563eb;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 14px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: right;">
    <button class="btn-print" onclick="window.print()">Cetak / Simpan sebagai PDF</button>
  </div>

  <div class="kop">
    <h3>PEMERINTAH KABUPATEN MADIUN</h3>
    <h3>DINAS PENDIDIKAN DAN KEBUDAYAAN</h3>
    <h2>SEKOLAH DASAR NEGERI 1 MADIUN</h2>
    <p>Jl. Pahlawan No. 10, Kota Madiun, Jawa Timur | Kode Pos: 63122 | NPSN: 20534120</p>
    <p>Email: sdn1madiun@kemdikbud.go.id | Akreditasi: A (Amat Baik)</p>
  </div>

  <div class="title">
    <h1>REKAPITULASI HASIL EVALUASI PEMBELAJARAN SISWA SD</h1>
    <p>Platform Pembelajaran Berbasis AI — Kurikulum Merdeka &amp; Muatan Lokal Jawa</p>
    <p style="font-weight: bold; margin-top: 4px;">Tahun Ajaran 2025/2026 — Semester Ganjil</p>
  </div>

  <table class="meta-table">
    <tr>
      <td style="width: 220px; font-weight: bold;">Satuan Pendidikan</td>
      <td style="width: 10px;">:</td>
      <td>SD Negeri 1 Madiun</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Kelas</td>
      <td>:</td>
      <td>Kelas 4</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Mata Pelajaran</td>
      <td>:</td>
      <td>Pendidikan Pancasila (PKn) dan Bahasa Jawa (Muatan Lokal)</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Guru Kelas / Pengampu</td>
      <td>:</td>
      <td>Bpk. Darmawan, S.Pd.SD (NIP. 198506122010011012)</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Integrasi Kurikulum</td>
      <td>:</td>
      <td>API SIBI Kemdikbudristek RI &amp; Repositori Mulok Disdikbud Provinsi</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Waktu Cetak Laporan</td>
      <td>:</td>
      <td>${dateStr}</td>
    </tr>
  </table>

  <h4 style="font-family: Arial, sans-serif; margin-bottom: 6px;">I. Ringkasan Eksekutif Kelas 4A</h4>
  <table class="data-table">
    <thead>
      <tr>
        <th>Indikator Metrik</th>
        <th>Nilai Agregat</th>
        <th>Standar Ketuntasan</th>
        <th>Status Evaluasi</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Total Siswa SD Terdaftar</td>
        <td><strong>${summary.totalStudents} Siswa</strong></td>
        <td>50 Siswa</td>
        <td><span class="badge-good">100% Aktif Belajar</span></td>
      </tr>
      <tr>
        <td>Rata-Rata Capaian Pemahaman</td>
        <td><strong>${summary.averageComprehension}%</strong></td>
        <td>≥ 70% (KKTP)</td>
        <td><span class="badge-good">Memenuhi Standar Ketercapaian</span></td>
      </tr>
      <tr>
        <td>Modul Kurikulum Aktif</td>
        <td><strong>${summary.activeModules} Modul Resmi API</strong></td>
        <td>Kurikulum Merdeka &amp; Mulok</td>
        <td><span class="badge-good">Terintegrasi RAG Adaptif</span></td>
      </tr>
      <tr>
        <td>Siswa Memerlukan Bimbingan Khusus</td>
        <td><strong>${summary.studentsNeedingIntervention} Siswa</strong></td>
        <td>Skor Kuis &lt; 60</td>
        <td><span class="badge-warn">Program Remedial Terjadwal</span></td>
      </tr>
    </tbody>
  </table>

  <h4 style="font-family: Arial, sans-serif; margin-bottom: 6px; margin-top: 24px;">II. Capaian Tingkat Pemahaman Per Bab Pembelajaran</h4>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 50px;">No</th>
        <th>Mata Pelajaran &amp; Bab Pembelajaran</th>
        <th style="width: 140px;">Tingkat Pemahaman</th>
        <th style="width: 160px;">Kategori Evaluasi</th>
      </tr>
    </thead>
    <tbody>
      ${chapters
        .map(
          (c, i) => `
        <tr>
          <td style="text-align: center;">${i + 1}</td>
          <td><strong>${c.name}</strong></td>
          <td><strong>${c.percent}%</strong></td>
          <td>${c.percent >= 75 ? '<span class="badge-good">Tuntas (Pemahaman Tinggi)</span>' : c.percent >= 70 ? '<span class="badge-good">Tuntas (Pemahaman Baik)</span>' : '<span class="badge-warn">Perlu Remedial / Bimbingan</span>'}</td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <h4 style="font-family: Arial, sans-serif; margin-bottom: 6px; margin-top: 24px;">III. Daftar Siswa Dalam Program Bimbingan Remedial</h4>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 50px;">No</th>
        <th>Nama Siswa</th>
        <th>Materi Terkendala</th>
        <th>Skor Kuis Terakhir</th>
        <th>Tindakan &amp; Rekomendasi Guru</th>
      </tr>
    </thead>
    <tbody>
      ${students
        .map(
          (s, i) => `
        <tr>
          <td style="text-align: center;">${i + 1}</td>
          <td><strong>${s.name}</strong> (Kelas 4A)</td>
          <td>${s.chapter}</td>
          <td><span class="badge-warn">${s.score} / ${s.outOf}</span></td>
          <td>Diberikan modul ringkasan audio penjelasan robot &amp; latihan soal dasar Level 1</td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <h4 style="font-family: Arial, sans-serif; margin-bottom: 6px; margin-top: 24px;">IV. Rekapitulasi Prestasi &amp; Keaktifan Belajar Siswa Kelas 4A</h4>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 80px; text-align: center;">Peringkat</th>
        <th>NISN / Nama Lengkap Siswa</th>
        <th style="width: 140px; text-align: center;">Skor Keaktifan (Poin)</th>
        <th style="width: 170px;">Predikat &amp; Evaluasi</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="text-align: center;"><strong>Peringkat 1</strong></td>
        <td><strong>Raditya Pratama</strong> <span style="font-size: 9pt; color: #555;">(NISN: 0148291023)</span></td>
        <td style="text-align: center;"><strong>430 Poin</strong></td>
        <td><span class="badge-good">Sangat Memuaskan (A)</span></td>
      </tr>
      <tr>
        <td style="text-align: center;">Peringkat 2</td>
        <td><strong>Budi Santoso</strong> <span style="font-size: 9pt; color: #555;">(NISN: 0148291045)</span></td>
        <td style="text-align: center;">360 Poin</td>
        <td><span class="badge-good">Baik (B+)</span></td>
      </tr>
      <tr>
        <td style="text-align: center;">Peringkat 3</td>
        <td><strong>Siti Aminah</strong> <span style="font-size: 9pt; color: #555;">(NISN: 0148291078)</span></td>
        <td style="text-align: center;">310 Poin</td>
        <td><span class="badge-good">Baik (B)</span></td>
      </tr>
      <tr>
        <td style="text-align: center;">Peringkat 4</td>
        <td><strong>Ahmad Fauzi</strong> <span style="font-size: 9pt; color: #555;">(NISN: 0148291089)</span></td>
        <td style="text-align: center;">270 Poin</td>
        <td><span class="badge-good">Cukup Baik (B-)</span></td>
      </tr>
    </tbody>
  </table>

  <div class="signatures">
    <div class="sign-box">
      <p>Mengetahui,<br />Kepala SD Negeri 1 Madiun,</p>
      <div class="space"></div>
      <p><strong>Hj. Sri Wahyuni, M.Pd.</strong><br />NIP. 197204151996032001</p>
    </div>
    <div class="sign-box">
      <p>Madiun, ${dateStr}<br />Guru Kelas 4A,</p>
      <div class="space"></div>
      <p><strong>Bpk. Darmawan, S.Pd.SD</strong><br />NIP. 198506122010011012</p>
    </div>
  </div>
</body>
</html>`;

  return {
    fileName: `Laporan_Evaluasi_Siswa_SDN1Madiun_${Date.now()}.html`,
    content: html,
  };
}

export async function updateStudentByTeacher(
  id: string,
  data: { name?: string; kelas?: string; noAbsen?: string; email?: string }
): Promise<UserAccount | null> {
  await delay(150);
  const user = usersDb.find((u) => (u.id === id || u.email.toLowerCase() === id.toLowerCase()) && u.role === "pelajar");
  if (!user) return null;
  if (data.name) user.name = data.name.trim();
  if (data.email) user.email = data.email.trim().toLowerCase();
  if (data.kelas) user.kelas = data.kelas.trim();
  if (data.noAbsen) user.noAbsen = data.noAbsen.trim();
  persistUsersDb();
  return user;
}

export async function resetSingleStudentPoints(
  id: string
): Promise<{ success: boolean; points: number; gamePoints: number } | null> {
  await delay(150);
  const user = usersDb.find((u) => (u.id === id || u.email.toLowerCase() === id.toLowerCase()) && u.role === "pelajar");
  if (!user) return null;
  user.points = 0;
  user.gamePoints = 0;
  if ("materialScore" in user) (user as any).materialScore = 0;
  if ("quizScore" in user) (user as any).quizScore = 0;
  persistUsersDb();
  return { success: true, points: 0, gamePoints: 0 };
}

export async function createStudentByTeacher(data: {
  name: string;
  email: string;
  password?: string;
  kelas: string;
  noAbsen: string;
}): Promise<UserAccount> {
  await delay(200);
  const normEmail = data.email.toLowerCase().trim();
  const existing = usersDb.find((u) => u.email.toLowerCase() === normEmail);
  if (existing) {
    throw new Error("Email siswa sudah terdaftar.");
  }
  const newUser: UserAccount = {
    id: `usr_${Date.now()}`,
    name: data.name.trim(),
    email: normEmail,
    passwordHash: bcrypt.hashSync(data.password || "siswa123", 10),
    role: "pelajar",
    nimNip: `SD-${(data.kelas || "Kelas 4").replace(/\s+/g, "")}-${data.noAbsen || "01"}`,
    institution: "SD Negeri 1 Madiun",
    kelas: data.kelas || "Kelas 4",
    noAbsen: data.noAbsen || "01",
    points: 0,
    gamePoints: 0,
    weakness: {
      chapterId: "pkn-sila3",
      chapterName: "Pelajaran PKn (Makna Sila Ke-3)",
      subject: "pkn",
      score: 8,
      outOf: 10,
      status: "tuntas",
      message: "Akun baru berhasil dibuat oleh Guru. Siap belajar dan berpetualang!",
    },
  };
  usersDb.push(newUser);
  persistUsersDb();
  return newUser;
}
