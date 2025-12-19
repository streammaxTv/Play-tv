
import React, { useState, useEffect } from 'react';
import { XtreamCredentials, AuthResponse } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SplashScreen from './components/SplashScreen';

const App: React.FC = () => {
  const [credentials, setCredentials] = useState<XtreamCredentials | null>(null);
  const [authData, setAuthData] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [workingCheck, setWorkingCheck] = useState(true);

  useEffect(() => {
    // Remove a mensagem de check após 3 segundos
    const timer = setTimeout(() => setWorkingCheck(false), 3000);
    
    const savedCreds = localStorage.getItem('streamtv_creds');
    const savedAuth = localStorage.getItem('streamtv_auth');
    
    if (savedCreds && savedAuth) {
      try {
        setCredentials(JSON.parse(savedCreds));
        setAuthData(JSON.parse(savedAuth));
      } catch (e) {
        localStorage.clear();
      }
    }
    setLoading(false);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    return () => clearTimeout(timer);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const handleLogin = (creds: XtreamCredentials, auth: AuthResponse) => {
    setCredentials(creds);
    setAuthData(auth);
    localStorage.setItem('streamtv_creds', JSON.stringify(creds));
    localStorage.setItem('streamtv_auth', JSON.stringify(auth));
  };

  const handleLogout = () => {
    setCredentials(null);
    setAuthData(null);
    localStorage.clear(); 
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased relative">
      {/* Mensagem de Verificação Solicitada */}
      {workingCheck && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-blue-600 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl animate-bounce">
          StreamTV funcionando 🚀
        </div>
      )}

      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      
      <div className={showSplash ? 'hidden' : 'block'}>
        {!credentials || !authData ? (
          <Login onLoginSuccess={handleLogin} />
        ) : (
          <Dashboard 
            credentials={credentials} 
            authData={authData} 
            onLogout={handleLogout}
            canInstall={!!deferredPrompt}
            onInstall={handleInstallApp}
          />
        )}
      </div>
    </div>
  );
};

export default App;
