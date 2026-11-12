// src/App.tsx
//
// Padanan struktur folder app/ (file-based routing Next.js) pada Tugas 7.
// Vite tidak punya file-based router bawaan, sehingga pemetaan rute
// dideklarasikan eksplisit di sini dengan react-router-dom — satu-satunya
// perubahan STRUKTURAL dari migrasi ini; peta rute publik/privat & nested
// layout-nya sendiri dipertahankan 1:1:
//
//   Publik : /              -> LandingPage
//            /login         -> LoginPage
//   Privat : /dashboard              -> DashboardIndex (redirect by role)
//            /dashboard/pelajar      -> PelajarDashboardPage
//            /dashboard/pelajar/kuis -> KuisAdaptifPage
//            /dashboard/pengajar     -> PengajarDashboardPage
//
// Seluruh rute /dashboard/* dibungkus <ProtectedRoute> (pengganti
// middleware.ts) DAN <DashboardLayout> (nested layout, Navbar + UploadModal
// tidak remount saat berpindah sub-rute — persis app/dashboard/layout.tsx).
//
// Code Splitting: halaman dashboard di-lazy-load agar initial bundle (index.js)
// lebih kecil — pengguna anonim yang hanya ke / dan /login TIDAK perlu
// mendownload kode dashboard sama sekali. Ini setara dengan Dynamic Import
// yang dilakukan Next.js secara otomatis per segment di app/.

import ProtectedRoute from "@/router/ProtectedRoute";
import DashboardIndex from "@/views/DashboardIndex";
import DashboardLayout from "@/views/DashboardLayout";
import LandingPage from "@/views/LandingPage";
import LoginPage from "@/views/LoginPage";
import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";

const KuisAdaptifPage = lazy(() => import("@/views/KuisAdaptifPage"));
const PelajarDashboardPage = lazy(() => import("@/views/PelajarDashboardPage"));
const PengajarDashboardPage = lazy(() => import("@/views/PengajarDashboardPage"));

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-500">
          Memuat halaman...
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardIndex />} />
            <Route path="pelajar" element={<PelajarDashboardPage />} />
            <Route path="pelajar/kuis" element={<KuisAdaptifPage />} />
            <Route path="pengajar" element={<PengajarDashboardPage />} />
          </Route>
        </Route>

        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Suspense>
  );
}
