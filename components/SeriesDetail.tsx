
import React, { useState, useEffect } from 'react';
import { SeriesDetails, Episode, Season } from '../types';
import { XtreamService } from '../services/xtreamService';

interface SeriesDetailProps {
  seriesId: number;
  service: XtreamService;
  onBack: () => void;
  onPlayEpisode: (episode: Episode, playlist: Episode[]) => void;
}

const SeriesDetail: React.FC<SeriesDetailProps> = ({ seriesId, service, onBack, onPlayEpisode }) => {
  const [details, setDetails] = useState<SeriesDetails | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      const data = await service.getSeriesInfo(seriesId);
      if (data) {
        setDetails(data);
        if (data.seasons && data.seasons.length > 0) {
          setSelectedSeason(data.seasons[0].season_number);
        }
      }
      setLoading(false);
    };
    fetchDetails();
  }, [seriesId, service]);

  const getProgress = (episodeId: string) => {
    const saved = localStorage.getItem(`progress_${episodeId}`);
    return saved ? JSON.parse(saved).percent : 0;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 bg-[#020617]">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Carregando Temporadas</p>
      </div>
    );
  }

  if (!details) return null;

  const currentEpisodes = details.episodes[selectedSeason.toString()] || [];

  return (
    <div className="min-h-full bg-[#020617] animate-in fade-in duration-500 overflow-y-auto pb-20">
      {/* Hero Header */}
      <div className="relative h-[60vh] w-full">
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-transparent to-transparent z-10"></div>
        <img 
          src={details.info.cover || details.info.movie_image} 
          className="w-full h-full object-cover" 
          alt={details.info.name} 
        />
        
        <div className="absolute bottom-0 left-0 z-20 p-10 md:p-20 max-w-4xl space-y-6">
          <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-black text-xs uppercase tracking-widest">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg>
            Voltar
          </button>
          
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 bg-green-500/20 text-green-500 text-[10px] font-black rounded border border-green-500/20 uppercase">Série</span>
            <span className="text-yellow-500 font-black flex items-center gap-1">⭐ {details.info.rating}</span>
            <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">{details.info.genre}</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-tight">
            {details.info.name}
          </h1>
          
          <p className="text-slate-300 text-lg leading-relaxed line-clamp-3 font-medium max-w-2xl">
            {details.info.plot}
          </p>

          <div className="flex items-center gap-8 pt-4">
             <button 
               onClick={() => currentEpisodes[0] && onPlayEpisode(currentEpisodes[0], currentEpisodes)}
               className="px-10 py-4 bg-white text-black font-black rounded-2xl hover:bg-slate-200 transition-all flex items-center gap-3 uppercase text-xs tracking-widest shadow-xl"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
               Assistir T{selectedSeason}:E1
             </button>
          </div>
        </div>
      </div>

      {/* Season Selector */}
      <div className="px-10 md:px-20 mt-10">
        <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-4 scrollbar-hide">
          {details.seasons.map((season) => (
            <button
              key={season.season_number}
              onClick={() => setSelectedSeason(season.season_number)}
              className={`whitespace-nowrap px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all border-2 ${selectedSeason === season.season_number ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}
            >
              Temporada {season.season_number}
            </button>
          ))}
        </div>

        {/* Episode Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {currentEpisodes.map((ep) => {
            const progressPercent = getProgress(ep.id);
            return (
              <button
                key={ep.id}
                onClick={() => onPlayEpisode(ep, currentEpisodes)}
                className="group relative flex flex-col gap-4 text-left focus:ring-4 focus:ring-blue-600 rounded-2xl overflow-hidden p-2 bg-slate-900/40 hover:bg-slate-800 transition-all"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-800">
                  <img 
                    src={ep.info.movie_image || details.info.cover} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    alt={ep.title} 
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  {progressPercent > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700">
                      <div className="h-full bg-blue-500" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                  )}
                  
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[9px] font-black text-white border border-white/10 uppercase tracking-tighter">
                    EP {ep.episode_num}
                  </div>
                </div>
                
                <div className="px-2 pb-2">
                  <h3 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors truncate">{ep.title}</h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-bold line-clamp-2 leading-relaxed">
                    {ep.info.plot || "Nenhuma sinopse disponível para este episódio."}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SeriesDetail;
