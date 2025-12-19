
import React, { useEffect, useRef, useState } from 'react';
import { StreamItem, ContentType, VodInfoResponse } from '../types';
import { XtreamService } from '../services/xtreamService';

declare global {
  interface Window {
    Hls: any;
  }
}

interface PlayerProps {
  stream: StreamItem;
  type: ContentType;
  service: XtreamService;
  onClose: () => void;
  onNext?: () => void;
}

const Player: React.FC<PlayerProps> = ({ stream, type, service, onClose, onNext }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [metadata, setMetadata] = useState<VodInfoResponse | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [retryCount, setRetryCount] = useState(0);
  const hlsRef = useRef<any>(null);
  const controlsTimeout = useRef<number | null>(null);
  const progressInterval = useRef<number | null>(null);

  const effectiveType = stream.episode_num ? 'series' : type;
  
  // Try direct URL first (or configured proxy), then fallback proxy on retryCount > 0
  const streamUrl = service.getStreamUrl(
    effectiveType, 
    stream.stream_id, 
    stream.container_extension || (effectiveType === 'live' ? 'ts' : 'mp4'),
    retryCount > 0
  );

  useEffect(() => {
    if (effectiveType === 'vod' || effectiveType === 'series') {
      service.getVodInfo(stream.stream_id).then(setMetadata);
    }

    const initPlayer = async () => {
      if (!videoRef.current) return;
      const video = videoRef.current;
      setLoading(true);
      setError(null);

      if (!window.Hls) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      const startPlayback = () => {
        const saved = localStorage.getItem(`progress_${stream.stream_id}`);
        if (saved && effectiveType !== 'live') {
          const { time } = JSON.parse(saved);
          if (time < video.duration - 10) video.currentTime = time;
        }
        video.play().catch(e => {
          console.warn("Playback prevented:", e);
        });
        setLoading(false);
      };

      // IPTV streams work better through HLS.js if they are MPEG-TS (.ts)
      const isTs = streamUrl.toLowerCase().includes('.ts') || 
                   (stream.container_extension && stream.container_extension.toLowerCase() === 'ts');
      const isM3u8 = streamUrl.toLowerCase().includes('.m3u8');
      
      const useHls = window.Hls.isSupported() && (isTs || isM3u8 || effectiveType === 'live');

      if (useHls) {
        if (hlsRef.current) hlsRef.current.destroy();
        const hls = new window.Hls({ 
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30
        });
        hlsRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, startPlayback);
        hls.on(window.Hls.Events.ERROR, (_: any, data: any) => {
          if (data.fatal) {
            console.error("HLS Fatal Error:", data.type, data.details);
            handleError();
          }
        });
      } else {
        video.src = streamUrl;
        video.onloadedmetadata = startPlayback;
        video.onerror = () => handleError();
      }
    };

    const handleError = () => {
      const video = videoRef.current;
      const mediaError = video?.error;
      
      // Detailed logging to avoid [object Object] in consoles that stringify
      if (mediaError) {
        console.error("Video Error Details:", {
          code: mediaError.code,
          message: mediaError.message
        });
      }

      if (retryCount === 0) {
        console.warn("StreamTV: Direct playback failed. Attempting with fallback proxy...");
        setRetryCount(1);
        return;
      }

      let errorMsg = "Erro desconhecido ao carregar o vídeo.";
      if (mediaError) {
        switch (mediaError.code) {
          case 1: errorMsg = "A reprodução foi cancelada."; break;
          case 2: errorMsg = "Erro de rede: O servidor parou de responder ou o link expirou."; break;
          case 3: errorMsg = "Erro de decodificação: Formato de vídeo ou codec não suportado."; break;
          case 4: errorMsg = "O navegador bloqueou este vídeo (CORS/Mixed Content) ou o formato (.mkv/.ts) não é suportado nativamente."; break;
        }
        if (mediaError.message) errorMsg += ` (${mediaError.message})`;
      }

      setError(errorMsg);
      setLoading(false);
    };

    initPlayer();

    progressInterval.current = window.setInterval(() => {
      if (videoRef.current && videoRef.current.duration > 0 && !videoRef.current.paused && effectiveType !== 'live') {
        const time = videoRef.current.currentTime;
        const duration = videoRef.current.duration;
        const percent = (time / duration) * 100;
        if (percent < 98) {
          localStorage.setItem(`progress_${stream.stream_id}`, JSON.stringify({ time, percent }));
        } else {
          localStorage.removeItem(`progress_${stream.stream_id}`);
        }
      }
    }, 5000);

    return () => { 
      if (hlsRef.current) hlsRef.current.destroy(); 
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [streamUrl, effectiveType, stream.stream_id, retryCount]);

  const toggleControls = () => {
    setShowControls(true);
    if (controlsTimeout.current) window.clearTimeout(controlsTimeout.current);
    controlsTimeout.current = window.setTimeout(() => setShowControls(false), 5000);
  };

  const seek = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
      toggleControls();
    }
  };

  const cycleAspectRatio = () => {
    const modes: ('contain' | 'cover' | 'fill')[] = ['contain', 'cover', 'fill'];
    const nextIndex = (modes.indexOf(aspectRatio) + 1) % modes.length;
    setAspectRatio(modes[nextIndex]);
    toggleControls();
  };

  return (
    <div 
      className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center group"
      onMouseMove={toggleControls}
      onClick={toggleControls}
    >
      <video 
        ref={videoRef}
        className={`w-full h-full transition-all duration-300 ${
          aspectRatio === 'contain' ? 'object-contain' : aspectRatio === 'cover' ? 'object-cover' : 'object-fill'
        }`}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
        onEnded={onNext || onClose}
        poster={stream.cover || stream.stream_icon}
        playsInline
      />

      <div className={`absolute inset-0 z-50 transition-opacity duration-500 bg-gradient-to-t from-black/90 via-transparent to-black/80 flex flex-col justify-between p-6 md:p-10 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        <div className="flex items-start justify-between">
          <div className="flex gap-4 md:gap-6 items-center">
            <button onClick={onClose} className="p-3 md:p-4 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-xl border border-white/10 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div className="flex flex-col">
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter truncate max-w-xs md:max-w-xl">{stream.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                {(stream.rating || metadata?.info?.rating) && (
                  <span className="text-yellow-500 font-black text-xs flex items-center gap-1">⭐ {stream.rating || metadata?.info?.rating}</span>
                )}
                <span className="text-blue-500 font-black text-[9px] uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded">AUTO</span>
                {retryCount > 0 && <span className="text-orange-500 font-black text-[9px] uppercase tracking-widest bg-orange-500/10 px-2 py-0.5 rounded">Proxy</span>}
              </div>
            </div>
          </div>
          
          <button 
            onClick={cycleAspectRatio}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-xl border border-white/10 text-[9px] font-black uppercase tracking-widest transition-all"
          >
            {aspectRatio.toUpperCase()}
          </button>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-8 md:gap-16">
          <button onClick={(e) => { e.stopPropagation(); seek(-10); }} className="p-4 rounded-full bg-white/5 hover:bg-white/15 border border-white/5 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/></svg>
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause(); }}
            className="w-16 h-16 md:w-20 md:h-20 bg-white text-black rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90"
          >
            {videoRef.current?.paused ? (
               <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            ) : (
               <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            )}
          </button>

          <button onClick={(e) => { e.stopPropagation(); seek(10); }} className="p-4 rounded-full bg-white/5 hover:bg-white/15 border border-white/5 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg>
          </button>
        </div>

        <div className="w-full space-y-4">
          <div className="flex items-center gap-4 text-[10px] font-black text-slate-400">
            {videoRef.current && (
               <span>{Math.floor(videoRef.current.currentTime / 60)}:{Math.floor(videoRef.current.currentTime % 60).toString().padStart(2, '0')}</span>
            )}
            <div className="flex-1 h-1 bg-white/10 rounded-full relative overflow-hidden cursor-pointer" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              if (videoRef.current && videoRef.current.duration) videoRef.current.currentTime = pos * videoRef.current.duration;
            }}>
              <div 
                className="absolute inset-y-0 left-0 bg-blue-600 transition-all" 
                style={{ width: `${videoRef.current && videoRef.current.duration ? (videoRef.current.currentTime / videoRef.current.duration) * 100 : 0}%` }}
              ></div>
            </div>
            {videoRef.current && (
               <span>{Math.floor(videoRef.current.duration / 60)}:{Math.floor(videoRef.current.duration % 60).toString().padStart(2, '0')}</span>
            )}
          </div>
          
          <div className="flex justify-between items-end">
            <div className="max-w-xl hidden md:block">
               {metadata?.info?.plot && <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{metadata.info.plot}</p>}
            </div>
            {onNext && (
              <button onClick={onNext} className="px-6 py-3 bg-white text-black font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2">
                Próximo
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {(loading && !error) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[60] bg-black/40 backdrop-blur-sm">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-slate-950 p-6 text-center">
          <div className="max-w-md space-y-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Falha na Reprodução</h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">{error}</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => setRetryCount(retryCount + 1)} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-xl">Tentar com Rota Alternativa</button>
              <button onClick={onClose} className="w-full py-4 bg-white/5 text-slate-400 font-black rounded-2xl uppercase text-xs tracking-widest">Sair</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Player;
