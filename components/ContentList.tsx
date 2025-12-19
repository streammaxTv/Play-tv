
import React, { useState, useEffect } from 'react';
import { Category, StreamItem, ContentType, FavoriteItem } from '../types';
import { XtreamService } from '../services/xtreamService';

interface ContentListProps {
  type: ContentType;
  categories: Category[];
  service: XtreamService;
  onBack: () => void;
  onPlay: (stream: StreamItem) => void;
  onToggleFavorite: (stream: StreamItem) => void;
  favorites: FavoriteItem[];
}

const ContentList: React.FC<ContentListProps> = ({ type, categories, service, onBack, onPlay, onToggleFavorite, favorites }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('0');
  const [streams, setStreams] = useState<StreamItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadStreams = async () => {
      setLoading(true);
      try {
        const data = await service.getStreams(type as any, selectedCategory === '0' ? undefined : selectedCategory);
        const sortedData = Array.isArray(data) ? data.sort((a, b) => a.name.localeCompare(b.name)) : [];
        setStreams(sortedData);
      } catch (err) {
        setStreams([]);
      } finally {
        setLoading(false);
      }
    };
    loadStreams();
  }, [type, selectedCategory, service]);

  const isFavorite = (streamId: number) => favorites.some(f => f.id === streamId);

  const filteredStreams = streams.filter(s => 
    s.name && s.name.toLowerCase().includes(search.toLowerCase())
  );

  const safeCategories = Array.isArray(categories) ? categories : [];

  return (
    <div className="flex flex-col h-full gap-6 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2 shrink-0">
        <div className="flex items-center gap-6 w-full md:w-auto">
          <button onClick={onBack} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight">{type === 'live' ? 'Canais Ao Vivo' : type === 'vod' ? 'Filmes' : 'Séries'}</h2>
            <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase mt-1">Sincronizado via Xtream Codes</p>
          </div>
        </div>

        <div className="w-full md:w-96 relative">
          <input
            type="text"
            placeholder="Filtrar nesta categoria..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pl-12 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
      </div>

      <div className="flex gap-6 overflow-hidden flex-1">
        <aside className="w-64 shrink-0 overflow-y-auto pr-2 flex flex-col gap-2 scrollbar-hide">
          <button onClick={() => setSelectedCategory('0')} className={`text-left px-5 py-4 rounded-2xl transition-all font-black text-[10px] tracking-[0.2em] ${selectedCategory === '0' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:text-white'}`}>
            TODAS AS CATEGORIAS
          </button>
          {safeCategories.map((cat) => (
            <button key={cat.category_id} onClick={() => setSelectedCategory(cat.category_id)} className={`text-left px-5 py-4 rounded-2xl transition-all font-bold text-xs truncate ${selectedCategory === cat.category_id ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
              {cat.category_name.toUpperCase()}
            </button>
          ))}
        </aside>

        <div className="flex-1 overflow-y-auto pb-10 scroll-smooth">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className={type === 'live' ? "flex flex-col gap-3" : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"}>
              {filteredStreams.map((stream) => (
                <div key={stream.stream_id || stream.series_id} className="relative group">
                  <button
                    onClick={() => onPlay(stream)}
                    className={`relative w-full flex transition-all text-left focus:ring-4 focus:ring-blue-600 rounded-3xl overflow-hidden ${
                      type === 'live' 
                      ? "bg-white/5 hover:bg-blue-600/10 border border-white/5 p-4 items-center gap-6" 
                      : "flex-col bg-slate-900/40 hover:bg-slate-800 transition-colors"
                    }`}
                  >
                    <div className={`relative overflow-hidden transition-all shrink-0 ${type === 'live' ? 'w-24 h-16 rounded-xl' : 'aspect-[2/3] w-full'}`}>
                      <img 
                        src={stream.cover || stream.stream_icon || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=400'} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        loading="lazy" 
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                    </div>
                    <div className={type === 'live' ? "flex-1 min-w-0" : "p-4"}>
                      <h3 className={`font-black tracking-tight leading-tight truncate ${type === 'live' ? 'text-lg text-white' : 'text-sm text-slate-100'}`}>{stream.name}</h3>
                      {stream.rating && <p className="text-yellow-500 text-[10px] font-black mt-1">⭐ {stream.rating}</p>}
                    </div>
                  </button>

                  <button 
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(stream); }}
                    className={`absolute top-2 right-2 p-3 rounded-full backdrop-blur-md transition-all z-20 ${isFavorite(stream.stream_id || stream.series_id!) ? 'bg-red-600 text-white' : 'bg-black/40 text-white/50 hover:text-white opacity-0 group-hover:opacity-100'}`}
                  >
                    <svg className="w-4 h-4" fill={isFavorite(stream.stream_id || stream.series_id!) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentList;
