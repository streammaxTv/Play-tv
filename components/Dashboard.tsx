
import React, { useState, useEffect } from 'react';
import { XtreamCredentials, AuthResponse, ContentType, Category, StreamItem, FavoriteItem, HistoryItem, AppSettings } from '../types';
import { XtreamService } from '../services/xtreamService';
import ContentList from './ContentList';
import Player from './Player';
import SeriesDetail from './SeriesDetail';
import PinLock from './PinLock';

interface DashboardProps {
  credentials: XtreamCredentials;
  authData: AuthResponse;
  onLogout: () => void;
  canInstall?: boolean;
  onInstall?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ credentials, authData, onLogout, canInstall, onInstall }) => {
  const [view, setView] = useState<ContentType | 'home'>('home');
  const [selectedStream, setSelectedStream] = useState<{item: StreamItem, type: ContentType} | null>(null);
  const [activeSeriesId, setActiveSeriesId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ tvMode: false, pin: null, autoUpdate: true });
  const [isLocked, setIsLocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const service = new XtreamService(credentials);

  useEffect(() => {
    const favs = localStorage.getItem('streamtv_favs');
    const hist = localStorage.getItem('streamtv_hist');
    const sett = localStorage.getItem('streamtv_settings');
    if (favs) setFavorites(JSON.parse(favs));
    if (hist) setHistory(JSON.parse(hist));
    if (sett) {
      const parsedSett = JSON.parse(sett);
      setSettings(parsedSett);
      if (parsedSett.pin) setIsLocked(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('streamtv_favs', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('streamtv_hist', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('streamtv_settings', JSON.stringify(settings));
    if (settings.tvMode) document.documentElement.classList.add('tv-mode');
    else document.documentElement.classList.remove('tv-mode');
  }, [settings]);

  const toggleFavorite = (stream: StreamItem, type: ContentType) => {
    const id = stream.stream_id || stream.series_id;
    const exists = favorites.find(f => f.id === id);
    if (exists) {
      setFavorites(favorites.filter(f => f.id !== id));
    } else {
      setFavorites([...favorites, { id: id!, type, data: stream }]);
    }
  };

  const addToHistory = (stream: StreamItem, type: ContentType) => {
    const id = stream.stream_id || stream.series_id;
    const newHistory = [{ id: id!, type, data: stream, timestamp: Date.now() }, ...history.filter(h => h.id !== id)].slice(0, 50);
    setHistory(newHistory);
  };

  const fetchCategories = async (type: ContentType) => {
    if (['favorites', 'history', 'search', 'settings'].includes(type)) return;
    try {
      const cats = await service.getCategories(type as any);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const handleNavigate = (newView: ContentType | 'home') => {
    setView(newView);
    setActiveSeriesId(null);
    setSelectedStream(null);
    if (!['home', 'favorites', 'history', 'search', 'settings'].includes(newView)) {
      fetchCategories(newView as any);
    }
  };

  const handlePlay = (item: StreamItem, type: ContentType) => {
    if ((type === 'series' || item.series_id) && !item.episode_num) {
      setActiveSeriesId(item.series_id || item.stream_id);
    } else {
      addToHistory(item, type);
      setSelectedStream({ item, type });
    }
  };

  const formatDate = (timestamp: string) => {
    if (!timestamp || timestamp === '0') return 'Ilimitado';
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  if (isLocked) {
    return <PinLock correctPin={settings.pin!} onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${settings.tvMode ? 'text-lg' : ''}`}>
      <header className="h-20 bg-slate-900/90 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-8 z-40 shrink-0">
        <div className="flex items-center gap-10">
          <button onClick={() => handleNavigate('home')} className="text-3xl font-black italic tracking-tighter text-blue-500">
            STREAM<span className="text-white">TV</span>
          </button>
          
          <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
            {[
              { id: 'home', label: 'Início', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { id: 'favorites', label: 'Favoritos', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
              { id: 'history', label: 'Histórico', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
              { id: 'settings', label: 'Config', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => handleNavigate(btn.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${view === btn.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d={btn.icon} /></svg>
                {btn.label.toUpperCase()}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          {canInstall && (
            <button 
              onClick={onInstall}
              className="hidden lg:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20 border border-blue-400/20 transition-all transform active:scale-95 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:animate-bounce"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span className="text-[10px] font-black uppercase tracking-widest">Baixar App</span>
            </button>
          )}

          <div className="relative group hidden sm:block">
            <input 
              type="text" 
              placeholder="Busca Global..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setView('search'); }}
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 pl-12 text-xs font-bold w-48 focus:w-64 transition-all focus:ring-2 focus:ring-blue-500"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          <div className="hidden lg:flex flex-col items-end border-r border-white/10 pr-6">
            <span className="text-sm font-bold text-white">{authData.user_info.username}</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Expira: {formatDate(authData.user_info.exp_date)}</span>
          </div>
          
          <button onClick={onLogout} className="p-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl border border-red-500/20 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-[#020617] p-8">
        {view === 'home' && !activeSeriesId && !selectedStream && (
          <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { id: 'live', title: 'TV AO VIVO', color: 'from-red-600 to-black', img: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600' },
                { id: 'vod', title: 'FILMES', color: 'from-blue-600 to-black', img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600' },
                { id: 'series', title: 'SÉRIES', color: 'from-purple-600 to-black', img: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=600' }
              ].map(item => (
                <button key={item.id} onClick={() => handleNavigate(item.id as any)} className="group relative h-64 rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-transparent hover:border-blue-500/50 transition-all">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-70 group-hover:opacity-90 transition-opacity z-10`}></div>
                  <img src={item.img} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 z-20 p-10 flex flex-col justify-end text-left">
                    <h3 className="text-4xl font-black text-white tracking-tighter">{item.title}</h3>
                  </div>
                </button>
              ))}
            </div>
            
            {history.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-black uppercase tracking-widest text-slate-500 flex items-center gap-3">
                  <span className="w-8 h-[2px] bg-blue-500"></span> Continuar Assistindo
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  {history.slice(0, 5).map(h => (
                    <button key={h.id} onClick={() => handlePlay(h.data, h.type)} className="group relative aspect-video rounded-3xl overflow-hidden bg-slate-900 border border-white/5 shadow-xl">
                      <img src={h.data.cover || h.data.stream_icon} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                        <p className="text-[10px] font-black text-white truncate">{h.data.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {['live', 'vod', 'series'].includes(view) && !activeSeriesId && !selectedStream && (
          <ContentList 
            type={view as any} 
            categories={categories} 
            service={service} 
            onBack={() => setView('home')} 
            onPlay={(s) => handlePlay(s, view as any)}
            onToggleFavorite={(s) => toggleFavorite(s, view as any)}
            favorites={favorites}
          />
        )}

        {view === 'favorites' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
             <h2 className="text-4xl font-black tracking-tighter uppercase">Meus Favoritos</h2>
             {favorites.length === 0 ? (
               <div className="h-96 flex flex-col items-center justify-center text-slate-600 gap-4">
                 <svg className="w-20 h-20 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                 <p className="font-bold uppercase tracking-widest text-xs">Sua lista está vazia</p>
               </div>
             ) : (
               <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                 {favorites.map(f => (
                   <button key={f.id} onClick={() => handlePlay(f.data, f.type)} className="group relative aspect-[2/3] rounded-3xl overflow-hidden bg-slate-900 border border-white/5">
                     <img src={f.data.cover || f.data.stream_icon} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                     <div className="absolute top-2 right-2 z-30">
                       <button onClick={(e) => { e.stopPropagation(); toggleFavorite(f.data, f.type); }} className="p-2 bg-red-600 rounded-full text-white shadow-xl">
                         <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                       </button>
                     </div>
                     <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent p-6 flex flex-col justify-end">
                       <p className="text-xs font-black text-white">{f.data.name}</p>
                       <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest mt-1">{f.type}</span>
                     </div>
                   </button>
                 ))}
               </div>
             )}
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-4xl font-black tracking-tighter uppercase">Histórico Recente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map(h => (
                <div key={h.id + h.timestamp} className="bg-white/5 border border-white/5 p-4 rounded-3xl flex items-center gap-6 hover:bg-white/10 transition-all cursor-pointer" onClick={() => handlePlay(h.data, h.type)}>
                  <img src={h.data.cover || h.data.stream_icon} className="w-24 h-16 rounded-xl object-cover" />
                  <div className="flex-1">
                    <p className="font-black text-white">{h.data.name}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Visto em: {new Date(h.timestamp).toLocaleString()}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setHistory(history.filter(hist => hist.timestamp !== h.timestamp)); }} className="p-3 text-slate-600 hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-4xl font-black tracking-tighter uppercase">Configurações</h2>
            
            <div className="space-y-4">
              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-black text-white uppercase tracking-tight">Modo TV (UI Grande)</p>
                    <p className="text-xs font-bold text-slate-500">Otimiza a interface para telas maiores e controle remoto.</p>
                  </div>
                  <button onClick={() => setSettings({...settings, tvMode: !settings.tvMode})} className={`w-14 h-8 rounded-full transition-all relative ${settings.tvMode ? 'bg-blue-600' : 'bg-slate-700'}`}>
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings.tvMode ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>

                <div className="pt-8 border-t border-white/5 space-y-4">
                  <p className="font-black text-white uppercase tracking-tight">Bloqueio por PIN</p>
                  <div className="flex gap-2">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`w-12 h-16 rounded-2xl border-2 flex items-center justify-center text-xl font-black ${settings.pin ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/5 bg-white/5 text-slate-800'}`}>
                        {settings.pin ? '*' : ''}
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      const newPin = settings.pin ? null : prompt("Defina um PIN de 4 dígitos:");
                      if (newPin === null || (newPin && newPin.length === 4)) setSettings({...settings, pin: newPin});
                    }}
                    className="px-6 py-3 bg-white/5 hover:bg-blue-600 text-white font-bold rounded-2xl text-[10px] uppercase tracking-widest transition-all"
                  >
                    {settings.pin ? 'Remover PIN' : 'Definir PIN de Acesso'}
                  </button>
                </div>
              </div>

              <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full p-6 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-[2rem] border border-red-500/20 font-black uppercase text-xs tracking-widest transition-all">
                Limpar Todos os Dados do App
              </button>
            </div>
          </div>
        )}

        {view === 'search' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h2 className="text-4xl font-black tracking-tighter uppercase">Resultados para: {searchQuery}</h2>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
               <p className="text-slate-500 font-bold col-span-full">Digite para filtrar os resultados globais...</p>
            </div>
          </div>
        )}

        {activeSeriesId && (
          <SeriesDetail seriesId={activeSeriesId} service={service} onBack={() => setActiveSeriesId(null)} onPlayEpisode={(ep) => handlePlay({ ...ep, stream_id: parseInt(ep.id), name: ep.title, episode_num: ep.episode_num } as any, 'series')} />
        )}

        {selectedStream && (
          <div className="fixed inset-0 z-50 bg-black">
            <Player stream={selectedStream.item} type={selectedStream.type} service={service} onClose={() => setSelectedStream(null)} />
          </div>
        )}
      </main>

      {/* Botão Flutuante Mobile de Instalação */}
      {canInstall && (
        <button 
          onClick={onInstall}
          className="lg:hidden fixed bottom-8 right-8 z-[100] w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl shadow-blue-600/50 flex items-center justify-center animate-bounce border-4 border-blue-400/20 active:scale-90 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
      )}

      <style>{`
        .tv-mode { font-size: 1.25rem; }
        .tv-mode header { height: 100px; }
        .tv-mode .rounded-2xl { border-radius: 2rem; }
        .tv-mode .rounded-3xl { border-radius: 3rem; }
      `}</style>
    </div>
  );
};

export default Dashboard;
