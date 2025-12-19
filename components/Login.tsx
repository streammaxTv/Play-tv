
import React, { useState } from 'react';
import { XtreamCredentials, AuthResponse } from '../types';
import { XtreamService } from '../services/xtreamService';

interface LoginProps {
  onLoginSuccess: (creds: XtreamCredentials, auth: AuthResponse) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [dns, setDns] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [useProxy, setUseProxy] = useState(false);
  const [error, setError] = useState<{message: string, type?: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  // Primary proxy manually selectable
  const PRIMARY_PROXY = 'https://corsproxy.io/?';

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    setStatus('Iniciando conexão segura...');

    const cleanDns = dns.trim().replace(/\/$/, '');
    const creds: XtreamCredentials = { 
      dns: cleanDns, 
      username: username.trim(), 
      password: password.trim(),
      proxyUrl: useProxy ? PRIMARY_PROXY : undefined
    };
    
    const service = new XtreamService(creds);

    try {
      setStatus('Tentando rotas de conexão...');
      const auth = await service.authenticate();
      setStatus('Autenticado! Carregando conteúdo...');
      onLoginSuccess(creds, auth);
    } catch (err: any) {
      console.error('Login error detail:', err.message);
      
      if (err.message === 'TIMEOUT') {
        setError({
          message: '⏳ Tempo limite esgotado. O servidor está muito lento.',
          type: 'SERVER'
        });
      } else if (err.message === 'NETWORK_OR_CORS') {
        setError({
          message: '⚠️ Bloqueio de Rede ou CORS detectado.',
          type: 'CORS'
        });
      } else if (err.message === 'AUTH_INVALID') {
        setError({
          message: '❌ Credenciais inválidas (usuário ou senha).',
          type: 'AUTH'
        });
      } else {
        setError({
          message: `❌ Falha na conexão: ${err.message}`,
          type: 'SERVER'
        });
      }
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#020617] overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      
      <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10">
          <div className="inline-block mb-4">
            <h1 className="text-5xl font-black italic tracking-tighter flex items-center justify-center gap-2">
              <span className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]">STREAM</span>
              <span className="text-white">TV</span>
            </h1>
          </div>
          <p className="text-slate-500 text-xs font-bold tracking-[0.3em] uppercase">Acesso Premium Xtream</p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 shadow-2xl">
          {error && (
            <div className={`mb-6 p-4 rounded-2xl text-center font-bold text-sm animate-shake ${
              error.type === 'CORS' ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400' : 'bg-red-500/10 border border-red-500/20 text-red-500'
            }`}>
              {error.message}
              {error.type === 'CORS' && (
                <div className="mt-4 text-[10px] font-medium text-slate-400 text-left bg-black/40 p-4 rounded-xl space-y-3 leading-relaxed border border-white/5">
                  <p className="text-white font-bold">Nota sobre erros de rede:</p>
                  <p>O navegador bloqueou a conexão direta. O StreamTV tentou rotas alternativas (proxies), mas o servidor IPTV pode estar recusando conexões externas ou o DNS está incorreto.</p>
                  <p className="text-blue-400">Verifique se o DNS inclui a porta (ex: :80 ou :8080).</p>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Servidor (DNS/URL)</label>
              <input
                type="text"
                required
                placeholder="http://dns.exemplo.xyz:80"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder:text-slate-700 font-medium"
                value={dns}
                onChange={(e) => setDns(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Usuário</label>
              <input
                type="text"
                required
                placeholder="Seu usuário"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder:text-slate-700 font-medium"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Senha</label>
              <input
                type="password"
                required
                placeholder="Sua senha"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder:text-slate-700 font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 group cursor-pointer" onClick={() => setUseProxy(!useProxy)}>
              <div className={`w-10 h-6 rounded-full transition-colors relative ${useProxy ? 'bg-blue-600' : 'bg-slate-700'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${useProxy ? 'left-5' : 'left-1'}`}></div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Preferir Proxy Inicial</span>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Recomendado para servidores HTTP</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-600/20 transition-all transform active:scale-[0.98] disabled:opacity-50 flex flex-col items-center justify-center gap-1 uppercase tracking-widest text-xs mt-4"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mb-1"></div>
                  <span className="text-[8px] opacity-70 tracking-widest font-bold">{status}</span>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  Entrar no StreamTV
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </div>
              )}
            </button>
          </form>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            Compatible with Xtream Codes API
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};

export default Login;
