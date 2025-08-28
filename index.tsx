import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ErpProvider } from './contexts/ErpContext';
import { PersonnelProvider } from './contexts/PersonnelContext';
import { NotificationCenterProvider } from './contexts/NotificationCenterContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ReconciliationProvider } from './contexts/ReconciliationContext';
import { seedDatabase } from './services/dbService';
import Loader from './components/common/Loader';

const AppInitializer: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  // StrictMode'da useEffect iki kez tetiklenebilir → bir defa çalıştırmak için koruma
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const initializeApp = async () => {
      try {
        // 1) Yerel veritabanı seed – idempotent olmasına dikkat edin
        await seedDatabase();

        // 2) Service Worker kaydı (yalnızca destekleyen ve güvenli originlerde)
        const isSecureOrigin =
          window.isSecureContext ||
          location.hostname === 'localhost' ||
          location.hostname === '127.0.0.1';

        if ('serviceWorker' in navigator && isSecureOrigin) {
          // HTML'de önerdiğimiz yol ile tutarlı
          navigator.serviceWorker
            .register('/sw.js')
            .then((reg) => {
              console.log('Service Worker kaydı başarılı:', reg.scope);
            })
            .catch((err) => {
              console.warn('Service Worker kaydı başarısız:', err);
            });
        }

        // 3) Bildirim izni – API var mı, izin durumu nedir?
        const canAskNotification =
          typeof window !== 'undefined' &&
          'Notification' in window &&
          typeof Notification.requestPermission === 'function';

        if (canAskNotification && Notification.permission === 'default') {
          // Kullanıcının ilk etkileşiminden bir süre sonra sormak daha sağlıklıdır
          const timer = window.setTimeout(() => {
            Notification.requestPermission()
              .then((permission) => {
                if (permission === 'granted') {
                  console.log('Bildirim izni verildi.');
                }
              })
              .catch((e) => console.warn('Bildirim izni hatası:', e));
          }, 10000);
          // Temizlik
          return () => clearTimeout(timer);
        }
      } catch (error) {
        console.error('Uygulama başlatılırken hata:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  if (!isInitialized) {
    return <Loader fullScreen />;
  }

  return (
    <LanguageProvider>
      <NotificationProvider>
        <AuthProvider>
          <SettingsProvider>
            <NotificationCenterProvider>
              <DataProvider>
                <ErpProvider>
                  <PersonnelProvider>
                    <ReconciliationProvider>
                      <App />
                    </ReconciliationProvider>
                  </PersonnelProvider>
                </ErpProvider>
              </DataProvider>
            </NotificationCenterProvider>
          </SettingsProvider>
        </AuthProvider>
      </NotificationProvider>
    </LanguageProvider>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element bulunamadı.');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppInitializer />
  </React.StrictMode>
);
