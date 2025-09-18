import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import { EnvanterProvider } from './contexts/EnvanterContext';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import './index.css';

// Lazy loading ile sayfaları yükle
const Anasayfa = lazy(() => import('./pages/Anasayfa'));
const UrunEkle = lazy(() => import('./pages/UrunEkle'));
const UrunDetay = lazy(() => import('./pages/UrunDetay'));
const Hareketler = lazy(() => import('./pages/Hareketler'));
const HareketEkle = lazy(() => import('./pages/HareketEkle'));
const Raporlar = lazy(() => import('./pages/Raporlar'));
const Ayarlar = lazy(() => import('./pages/Ayarlar'));
const Depo = lazy(() => import('./pages/Depo'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <EnvanterProvider>
        <Router>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/app" element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }>
                <Route index element={<Anasayfa />} />
                <Route path="depo" element={<Depo />} />
                <Route path="urunler/ekle" element={
                  <PrivateRoute requireAdmin>
                    <UrunEkle />
                  </PrivateRoute>
                } />
                <Route path="urunler/:id" element={<UrunDetay />} />
                <Route path="hareketler" element={<Hareketler />} />
                <Route path="hareketler/ekle" element={<HareketEkle />} />
                <Route path="raporlar" element={<Raporlar />} />
                <Route path="ayarlar" element={
                  <PrivateRoute>
                    <Ayarlar />
                  </PrivateRoute>
                } />
              </Route>
              <Route path="*" element={<Navigate to="/app" />} />
            </Routes>
          </Suspense>
        </Router>
      </EnvanterProvider>
    </AuthProvider>
  );
}

export default App;