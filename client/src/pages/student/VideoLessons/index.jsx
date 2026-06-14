import {
  Box, Typography, Card, CardContent, Chip, Stack,
  Button, CircularProgress, Divider, IconButton, Tooltip,
  LinearProgress, Collapse, useTheme, useMediaQuery, Drawer, Slider,
} from '@mui/material';
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation }    from 'react-i18next';

import PlayCircleIcon        from '@mui/icons-material/PlayCircle';
import PlayArrowIcon         from '@mui/icons-material/PlayArrow';
import PauseIcon             from '@mui/icons-material/Pause';
import FullscreenIcon        from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon    from '@mui/icons-material/FullscreenExit';
import InventoryIcon         from '@mui/icons-material/Inventory';
import MenuBookIcon          from '@mui/icons-material/MenuBook';
import DownloadIcon          from '@mui/icons-material/Download';
import QuizIcon              from '@mui/icons-material/Quiz';
import CheckCircleIcon          from '@mui/icons-material/CheckCircle';
import CancelIcon               from '@mui/icons-material/Cancel';
import ReplayIcon               from '@mui/icons-material/Replay';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import OpenInNewIcon            from '@mui/icons-material/OpenInNew';
import ChevronRightIcon         from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon          from '@mui/icons-material/ChevronLeft';
import MenuIcon                 from '@mui/icons-material/Menu';
import CloseIcon                from '@mui/icons-material/Close';
import ArticleIcon              from '@mui/icons-material/Article';
import EmojiEventsIcon          from '@mui/icons-material/EmojiEvents';
import CelebrationIcon          from '@mui/icons-material/Celebration';
import VolumeUpIcon            from '@mui/icons-material/VolumeUp';
import VolumeDownIcon          from '@mui/icons-material/VolumeDown';
import VolumeOffIcon           from '@mui/icons-material/VolumeOff';
import SettingsIcon            from '@mui/icons-material/Settings';
import CheckIcon               from '@mui/icons-material/Check';
import HighQualityIcon         from '@mui/icons-material/HighQuality';
import SpeedIcon               from '@mui/icons-material/Speed';
import Forward10Icon           from '@mui/icons-material/Forward10';
import Replay10Icon            from '@mui/icons-material/Replay10';

import { useGetMyAccessPackagesQuery } from '../../../features/packages/packagesApi.js';
import i18n from '../../../utils/i18n.js';
import { openPrivateFile } from '../../../utils/openPrivateFile.js';
import LMSVideoPlayer from '../../../components/ui/LMSVideoPlayer.jsx';

/* ─── helpers ──────────────────────────────────────────────────────────────── */

const ACCENT = '#7C3AED';

function gT(v, lang) {
  if (!v) return '—';
  if (typeof v === 'object') return v[lang] ?? v.ru ?? v.uz ?? '—';
  return String(v);
}

/** Extract YouTube video ID from any youtube URL */
function ytId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/** Check if URL is a direct video file or T3 private storage */
function isVideoFile(url) {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)
    || url.includes('t3.storage.dev')
    || url.includes('tigris');
}

/**
 * Надёжная загрузка YouTube IFrame API.
 * Один промис на всю страницу — переживает множественные mount/unmount плееров
 * и случай, когда onYouTubeIframeAPIReady уже был вызван ранее.
 */
let _ytApiPromise = null;
function loadYouTubeAPI() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (_ytApiPromise) return _ytApiPromise;

  _ytApiPromise = new Promise((resolve) => {
    const finish = () => { if (window.YT && window.YT.Player) resolve(window.YT); };

    /* Цепляем наш колбэк поверх любого существующего */
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') { try { prev(); } catch { /* */ } }
      finish();
    };

    /* Скрипт грузим один раз */
    if (!document.querySelector('script[data-yt-api]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.setAttribute('data-yt-api', '1');
      tag.onerror = () => { _ytApiPromise = null; };
      document.head.appendChild(tag);
    }

    /* Подстраховка: если API подгрузился иным путём — поллим коротко */
    const poll = setInterval(() => {
      if (window.YT && window.YT.Player) { clearInterval(poll); finish(); }
    }, 120);
    setTimeout(() => clearInterval(poll), 15000);
  });

  return _ytApiPromise;
}

/* PrivateVideoPlayer → replaced by LMSVideoPlayer */

/* ─── VideoPlayer ──────────────────────────────────────────────────────────── */
/*
 * PARVOZ LMS — полностью кастомный плеер, ноль YouTube-брендинга.
 * Официальный YT IFrame API (callbacks, не postMessage).
 *
 * 4 состояния:
 *  1. !ytReady           → превью + spinner
 *  2. ytReady, !played   → превью + брендированная кнопка ▶
 *  3. played, !playing   → тёмный оверлей + ▶  (перекрывает нативный UI YouTube)
 *  4. playing            → прозрачный перехватчик кликов
 *
 * Controls overlay (снизу, gradient, auto-hide 3 с при воспроизведении):
 *   progress bar · ▶/⏸ · время · [spacer] · 🔊 slider · quality · ⛶
 */
function VideoPlayer({ url }) {
  const yt         = ytId(url);
  const theme      = useTheme();
  const isXs       = useMediaQuery(theme.breakpoints.down('sm'));   /* < 600px */
  const isSm       = useMediaQuery(theme.breakpoints.down('md'));   /* < 900px */
  const wrapperRef = useRef(null);   /* fullscreen target */
  const hostRef    = useRef(null);   /* YT player host */
  const playerRef  = useRef(null);   /* YT.Player instance */
  const barRef     = useRef(null);   /* progress bar */
  const timerRef   = useRef(null);   /* progress poll */
  const hideRef    = useRef(null);   /* controls auto-hide */
  const aliveRef   = useRef(true);   /* mounted guard */

  const [ytReady,    setYtReady]    = useState(false);
  const [ytError,    setYtError]    = useState(false);
  const [playing,    setPlaying]    = useState(false);
  const [buffering,  setBuffering]  = useState(false);
  const [ended,      setEnded]      = useState(false);
  const [everPlayed, setEverPlayed] = useState(false);
  const [current,    setCurrent]    = useState(0);
  const [duration,   setDuration]   = useState(0);
  const [vol,        setVol]        = useState(80);
  const [muted,      setMuted]      = useState(false);
  const [isFS,       setIsFS]       = useState(false);
  const [quality,    setQuality]    = useState('auto');
  const [speed,      setSpeed]      = useState(1);
  const [ctrlsOn,    setCtrlsOn]    = useState(true);
  const [settings,   setSettings]   = useState(null);   /* null | 'menu' | 'quality' | 'speed' */
  const [reloadKey,  setReloadKey]  = useState(0);

  const pct       = duration > 0 ? (current / duration) * 100 : 0;
  const showCtrls = ctrlsOn || !everPlayed || !playing || !!settings;

  /* ── Время M:SS или H:MM:SS ── */
  const fmt = (s) => {
    if (!s || isNaN(s) || s < 0) return '0:00';
    const h   = Math.floor(s / 3600);
    const m   = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return h
      ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
      : `${m}:${String(sec).padStart(2,'0')}`;
  };

  /* ── YT IFrame API init (надёжно, через общий промис) ── */
  useEffect(() => {
    aliveRef.current = true;
    if (!yt) return undefined;

    let cancelled = false;

    loadYouTubeAPI()
      .then((YT) => {
        if (cancelled || !hostRef.current || playerRef.current) return;
        /* Создаём div — YT заменит его своим iframe.
           React не управляет этим div, поэтому замена не ломает reconciler. */
        const mount = document.createElement('div');
        mount.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none';
        hostRef.current.appendChild(mount);

        playerRef.current = new YT.Player(mount, {
          videoId: yt,
          playerVars: {
            controls: 0, rel: 0, modestbranding: 1,
            iv_load_policy: 3, cc_load_policy: 0, fs: 0,
            disablekb: 1, playsinline: 1, autoplay: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (e) => {
              if (!aliveRef.current) return;
              setYtReady(true);
              try { e.target.setVolume(80); } catch { /* */ }
              try { setDuration(e.target.getDuration() || 0); } catch { /* */ }
            },
            onStateChange: (e) => {
              if (!aliveRef.current) return;
              const S = window.YT?.PlayerState ?? {};
              const isP   = e.data === (S.PLAYING ?? 1);
              const isBuf = e.data === (S.BUFFERING ?? 3);
              const isEnd = e.data === (S.ENDED ?? 0);
              setBuffering(isBuf);
              setEnded(isEnd);
              setPlaying(isP);
              if (isP) {
                setEverPlayed(true);
                try { setDuration(e.target.getDuration() || 0); } catch { /* */ }
                clearInterval(timerRef.current);
                timerRef.current = setInterval(() => {
                  try {
                    const t = playerRef.current?.getCurrentTime?.();
                    if (t != null) setCurrent(t);
                  } catch { /* */ }
                }, 250);
                clearTimeout(hideRef.current);
                hideRef.current = setTimeout(() => { if (aliveRef.current) setCtrlsOn(false); }, 3000);
              } else {
                clearInterval(timerRef.current); timerRef.current = null;
                clearTimeout(hideRef.current);
                setCtrlsOn(true);
                if (isEnd) { try { setCurrent(e.target.getDuration() || current); } catch { /* */ } }
              }
            },
            onPlaybackQualityChange: (e) => {
              if (!aliveRef.current) return;
              const m = { hd2160:'auto', hd1440:'auto', hd1080:'1080p', hd720:'720p', large:'480p', medium:'360p', small:'240p' };
              /* Меняем индикатор только в режиме AUTO, чтобы ручной выбор не «прыгал» */
              setQuality((prev) => prev === 'auto' ? 'auto' : (m[e.data] ?? prev));
            },
            onError: () => { if (aliveRef.current) setYtError(true); },
          },
        });
      })
      .catch(() => { if (!cancelled) setYtError(true); });

    return () => {
      cancelled = true;
      aliveRef.current = false;
      clearInterval(timerRef.current);
      clearTimeout(hideRef.current);
      try { playerRef.current?.destroy(); } catch { /* */ }
      playerRef.current = null;
      try { if (hostRef.current) hostRef.current.innerHTML = ''; } catch { /* */ }
    };
  }, [yt, reloadKey]);

  /* ── Fullscreen listener ── */
  useEffect(() => {
    const h = () => setIsFS(!!(document.fullscreenElement || document.webkitFullscreenElement));
    document.addEventListener('fullscreenchange', h);
    document.addEventListener('webkitfullscreenchange', h);
    return () => {
      document.removeEventListener('fullscreenchange', h);
      document.removeEventListener('webkitfullscreenchange', h);
    };
  }, []);

  /* ── Handlers ── */
  const revealCtrls = () => {
    setCtrlsOn(true);
    clearTimeout(hideRef.current);
    if (playing && !settings) hideRef.current = setTimeout(() => setCtrlsOn(false), 3000);
  };

  const handleStart = () => { setEnded(false); playerRef.current?.playVideo?.(); };
  const togglePlay  = () => {
    if (ended) { playerRef.current?.seekTo?.(0, true); setEnded(false); playerRef.current?.playVideo?.(); return; }
    playing ? playerRef.current?.pauseVideo?.() : playerRef.current?.playVideo?.();
  };

  const seekBy = (delta) => {
    if (!playerRef.current || duration <= 0) return;
    const t = Math.max(0, Math.min(duration, (current || 0) + delta));
    playerRef.current.seekTo(t, true); setCurrent(t);
  };

  const handleSeek = (e) => {
    if (!barRef.current || !playerRef.current || duration <= 0) return;
    const r     = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    playerRef.current.seekTo(ratio * duration, true);
    setCurrent(ratio * duration);
    setEnded(false);
  };

  /* Touch seek — для мобильных устройств */
  const handleTouchSeek = (e) => {
    if (!barRef.current || !playerRef.current || duration <= 0) return;
    e.preventDefault();
    const touch = e.touches[0] || e.changedTouches[0];
    if (!touch) return;
    const r     = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (touch.clientX - r.left) / r.width));
    playerRef.current.seekTo(ratio * duration, true);
    setCurrent(ratio * duration);
    setEnded(false);
    revealCtrls();
  };

  const handleVol = (_, v) => {
    setVol(v);
    if (v === 0) { setMuted(true); playerRef.current?.mute?.(); }
    else { setMuted(false); playerRef.current?.unMute?.(); playerRef.current?.setVolume?.(v); }
  };

  const toggleMute = () => {
    if (muted || vol === 0) {
      const v = vol || 50; setMuted(false); setVol(v);
      playerRef.current?.unMute?.(); playerRef.current?.setVolume?.(v);
    } else { setMuted(true); playerRef.current?.mute?.(); }
  };

  const toggleFS = () => {
    const el = wrapperRef.current;
    if (!(document.fullscreenElement || document.webkitFullscreenElement)) {
      (el?.requestFullscreen || el?.webkitRequestFullscreen)?.call(el);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    }
  };

  const QMAP  = { auto:'default', '1080p':'hd1080', '720p':'hd720', '480p':'large', '360p':'medium' };
  const QUALS = ['auto','1080p','720p','480p','360p'];
  const applyQ = (q) => {
    setQuality(q);
    try { playerRef.current?.setPlaybackQuality?.(QMAP[q] ?? 'default'); } catch { /* */ }
    setSettings(null);
  };

  const SPEEDS = [0.5, 1, 1.25, 1.5, 2];
  const applySpeed = (r) => {
    setSpeed(r);
    try { playerRef.current?.setPlaybackRate?.(r); } catch { /* */ }
    setSettings(null);
  };

  /* ── Keyboard shortcuts (когда плеер в фокусе/наведён) ── */
  useEffect(() => {
    if (!yt) return undefined;
    const onKey = (e) => {
      if (!wrapperRef.current) return;
      const focused = wrapperRef.current.contains(document.activeElement) || isFS;
      if (!focused) return;
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); togglePlay(); break;
        case 'ArrowRight': e.preventDefault(); seekBy(5); break;
        case 'ArrowLeft':  e.preventDefault(); seekBy(-5); break;
        case 'f': e.preventDefault(); toggleFS(); break;
        case 'm': e.preventDefault(); toggleMute(); break;
        default: break;
      }
      revealCtrls();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* ═══════════════════════════════════════ Render ═════════════════════════ */
  if (yt) {
    const thumb = `https://img.youtube.com/vi/${yt}/maxresdefault.jpg`;

    /* премиальная панель настроек (качество + скорость) */
    const panelSx = {
      position: 'absolute',
      right: { xs: 6, sm: 14 },
      bottom: { xs: 52, sm: 60 },
      zIndex: 7,
      minWidth: { xs: 172, sm: 200 },
      maxWidth: { xs: 200, sm: 240 },
      borderRadius: 2, overflow: 'hidden',
      bgcolor: 'rgba(18,18,22,0.97)', backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.10)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.65)',
    };
    const rowSx = (active) => ({
      display: 'flex', alignItems: 'center', gap: 1.25,
      px: 1.75, py: 1.1, cursor: 'pointer', userSelect: 'none',
      color: active ? '#fff' : 'rgba(255,255,255,0.78)',
      fontSize: '0.8rem', fontWeight: active ? 700 : 500,
      transition: 'background 0.12s',
      '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
    });

    return (
      <Box
        ref={wrapperRef}
        tabIndex={0}
        onMouseMove={revealCtrls}
        onMouseLeave={() => { if (playing && !settings) { clearTimeout(hideRef.current); setCtrlsOn(false); } }}
        sx={{
          width: '100%', position: 'relative',
          borderRadius: isFS ? 0 : 2.5,
          overflow: 'hidden', bgcolor: '#000',
          userSelect: 'none', outline: 'none',
          cursor: showCtrls ? 'default' : 'none',
        }}
      >
        {/* Видео-контейнер: 16:9 в обычном режиме, заполняет wrapper в fullscreen */}
        <Box sx={{
          overflow: 'hidden', bgcolor: '#000',
          ...(isFS
            ? { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }
            : { position: 'relative', paddingTop: '56.25%' }
          ),
        }}>
          {/* YT host: scale-trick — iframe растянут за контейнер (overflow:hidden),
             края с надписями YouTube (название сверху, водяной знак снизу-справа)
             уходят за рамку. Масштаб равномерный → видео без искажений. */}
          <Box ref={hostRef} sx={{
            position: 'absolute',
            top: '-13%', left: '-13%',
            width: '126%', height: '126%',
          }} />

          {/* Точечная маска: подстраховка на водяной знак (низ-право) */}
          <Box sx={{
            position: 'absolute', bottom: 0, right: 0,
            width: 100, height: 36,
            zIndex: 3, pointerEvents: 'none',
            background: 'linear-gradient(to top left, rgba(0,0,0,0.98) 40%, transparent 100%)',
          }} />

          {/* ── Ошибка загрузки ── */}
          {ytError && (
            <Box sx={{
              position: 'absolute', inset: 0, zIndex: 8, bgcolor: 'rgba(0,0,0,0.9)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, px: 3,
            }}>
              <Typography sx={{ color: '#fff', fontWeight: 700, textAlign: 'center' }}>
                Видео временно недоступно
              </Typography>
              <Button variant="contained" startIcon={<ReplayIcon />}
                onClick={() => { setYtError(false); setYtReady(false); setEverPlayed(false); setReloadKey((k) => k + 1); }}
                sx={{ bgcolor: ACCENT, borderRadius: 2, fontWeight: 700, '&:hover': { bgcolor: ACCENT, filter: 'brightness(1.1)' } }}>
                Повторить
              </Button>
            </Box>
          )}

          {/* ── STATE 1: API грузится ── */}
          {!ytError && !ytReady && (
            <Box sx={{ position: 'absolute', inset: 0, zIndex: 4 }}>
              <Box component="img" src={thumb} alt=""
                onError={(e) => { e.currentTarget.src = `https://img.youtube.com/vi/${yt}/hqdefault.jpg`; }}
                sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <Box sx={{
                position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CircularProgress sx={{ color: ACCENT }} size={48} thickness={2.5} />
              </Box>
            </Box>
          )}

          {/* ── STATE 2: Готов, ещё не запущен ── */}
          {!ytError && ytReady && !everPlayed && (
            <Box sx={{ position: 'absolute', inset: 0, zIndex: 4 }}>
              <Box component="img" src={thumb} alt=""
                onError={(e) => { e.currentTarget.src = `https://img.youtube.com/vi/${yt}/hqdefault.jpg`; }}
                sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <Box onClick={handleStart} sx={{
                position: 'absolute', inset: 0, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.22)',
                '&:hover': { background: 'rgba(0,0,0,0.38)' },
                transition: 'background 0.2s',
              }}>
                <Box sx={{
                  width:  { xs: 58, sm: 76 },
                  height: { xs: 58, sm: 76 },
                  borderRadius: '50%', bgcolor: ACCENT,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 0 10px ${ACCENT}28, 0 8px 32px rgba(0,0,0,0.65)`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'scale(1.08)',
                    boxShadow: `0 0 0 16px ${ACCENT}20, 0 12px 40px rgba(0,0,0,0.75)`,
                  },
                  '&:active': { transform: 'scale(0.96)' },
                }}>
                  <PlayArrowIcon sx={{ fontSize: { xs: 32, sm: 40 }, color: '#fff', ml: '4px' }} />
                </Box>
              </Box>
            </Box>
          )}

          {/* ── Буферизация во время воспроизведения ── */}
          {!ytError && everPlayed && buffering && (
            <Box sx={{
              position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CircularProgress sx={{ color: '#fff' }} size={44} thickness={2.5} />
            </Box>
          )}

          {/* ── STATE 3: Пауза / конец — НЕПРОЗРАЧНЫЙ оверлей скрывает заголовок,
                 водяной знак, «Другие видео» и сетку похожих после конца ── */}
          {!ytError && everPlayed && !playing && !buffering && (
            <Box onClick={togglePlay} sx={{
              position: 'absolute', inset: 0, zIndex: 4, cursor: 'pointer',
              background: 'rgba(6,6,9,0.92)',
              backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Box sx={{
                width:  { xs: 52, sm: 68 },
                height: { xs: 52, sm: 68 },
                borderRadius: '50%', bgcolor: ACCENT,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 0 10px ${ACCENT}28, 0 4px 24px rgba(0,0,0,0.55)`,
                transition: 'transform 0.18s',
                '&:hover': { transform: 'scale(1.08)' },
                '&:active': { transform: 'scale(0.96)' },
              }}>
                {ended
                  ? <ReplayIcon sx={{ fontSize: { xs: 26, sm: 34 }, color: '#fff' }} />
                  : <PlayArrowIcon sx={{ fontSize: { xs: 28, sm: 36 }, color: '#fff', ml: '3px' }} />}
              </Box>
            </Box>
          )}

          {/* ── STATE 4: Воспроизведение — прозрачный перехватчик (двойной клик = fullscreen) ── */}
          {!ytError && playing && (
            <Box onClick={togglePlay} onDoubleClick={toggleFS}
              sx={{ position: 'absolute', inset: 0, zIndex: 4, cursor: 'pointer' }} />
          )}

          {/* ══════════════════ Панель настроек (качество + скорость) ══════════════════ */}
          {settings && (
            <>
              {/* клик вне панели — закрыть */}
              <Box onClick={() => setSettings(null)}
                sx={{ position: 'absolute', inset: 0, zIndex: 6 }} />
              <Box sx={panelSx}>
                {settings === 'menu' && (
                  <>
                    <Box sx={rowSx(false)} onClick={() => setSettings('speed')}>
                      <SpeedIcon sx={{ fontSize: 18 }} />
                      <Box sx={{ flex: 1 }}>Скорость</Box>
                      <Box sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                        {speed === 1 ? 'Обычная' : `${speed}x`}
                      </Box>
                      <ChevronRightIcon sx={{ fontSize: 16, opacity: 0.6 }} />
                    </Box>
                    <Box sx={rowSx(false)} onClick={() => setSettings('quality')}>
                      <HighQualityIcon sx={{ fontSize: 18 }} />
                      <Box sx={{ flex: 1 }}>Качество</Box>
                      <Box sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                        {quality === 'auto' ? 'Авто' : quality}
                      </Box>
                      <ChevronRightIcon sx={{ fontSize: 16, opacity: 0.6 }} />
                    </Box>
                  </>
                )}

                {settings === 'speed' && (
                  <>
                    <Box sx={{ ...rowSx(false), borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => setSettings('menu')}>
                      <ChevronLeftIcon sx={{ fontSize: 18 }} />
                      <Box sx={{ flex: 1 }}>Скорость</Box>
                    </Box>
                    {SPEEDS.map((r) => (
                      <Box key={r} sx={rowSx(speed === r)} onClick={() => applySpeed(r)}>
                        <Box sx={{ width: 18, display: 'flex' }}>
                          {speed === r && <CheckIcon sx={{ fontSize: 16, color: ACCENT }} />}
                        </Box>
                        <Box sx={{ flex: 1 }}>{r === 1 ? 'Обычная (1x)' : `${r}x`}</Box>
                      </Box>
                    ))}
                  </>
                )}

                {settings === 'quality' && (
                  <>
                    <Box sx={{ ...rowSx(false), borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => setSettings('menu')}>
                      <ChevronLeftIcon sx={{ fontSize: 18 }} />
                      <Box sx={{ flex: 1 }}>Качество</Box>
                    </Box>
                    {QUALS.map((q) => (
                      <Box key={q} sx={rowSx(quality === q)} onClick={() => applyQ(q)}>
                        <Box sx={{ width: 18, display: 'flex' }}>
                          {quality === q && <CheckIcon sx={{ fontSize: 16, color: ACCENT }} />}
                        </Box>
                        <Box sx={{ flex: 1 }}>{q === 'auto' ? 'Авто' : q}</Box>
                      </Box>
                    ))}
                  </>
                )}
              </Box>
            </>
          )}

          {/* ══════════════════ Controls overlay (auto-hide) ══════════════════ */}
          <Box sx={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5,
            background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)',
            px: { xs: 1.5, sm: 2.5 }, pt: '38px', pb: { xs: 1, sm: 1.5 },
            opacity:   showCtrls ? 1 : 0,
            transform: showCtrls ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            pointerEvents: showCtrls ? 'auto' : 'none',
          }}>

            {/* ── Progress bar ── */}
            <Box
              ref={barRef}
              onClick={handleSeek}
              onTouchStart={handleTouchSeek}
              onTouchMove={handleTouchSeek}
              sx={{
                width: '100%',
                height: { xs: 5, sm: 4 },
                borderRadius: 2, mb: { xs: 1, sm: 1.5 },
                bgcolor: 'rgba(255,255,255,0.18)',
                cursor: 'pointer', position: 'relative',
                transition: 'height 0.15s',
                /* увеличиваем касаемую область сверху на мобиле */
                '&::before': {
                  content: '""', position: 'absolute',
                  top: -10, left: 0, right: 0, bottom: -10,
                },
                '&:hover': { height: { xs: 5, sm: 6 } },
                '&:hover .bar-thumb': { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
              }}
            >
              {/* Прогресс */}
              <Box sx={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${pct}%`, borderRadius: 2,
                background: `linear-gradient(90deg, ${ACCENT} 0%, ${ACCENT}BB 100%)`,
                transition: 'width 0.25s linear',
              }} />
              {/* Ползунок */}
              <Box className="bar-thumb" sx={{
                position: 'absolute', top: '50%', left: `${pct}%`,
                transform: 'translate(-50%,-50%) scale(0)', opacity: 0,
                width: 14, height: 14, borderRadius: '50%',
                bgcolor: '#fff', boxShadow: `0 0 0 3px ${ACCENT}`,
                transition: 'left 0.25s linear, transform 0.15s, opacity 0.15s',
              }} />
            </Box>

            {/* ── Нижняя строка контролов ── */}
            <Stack direction="row" alignItems="center" spacing={{ xs: 0, sm: 0.5 }}>

              {/* Play / Pause */}
              <IconButton
                onClick={everPlayed ? togglePlay : handleStart}
                disabled={!ytReady}
                size="small"
                sx={{
                  color: '#fff', p: { xs: 0.6, sm: 0.75 }, borderRadius: 1.5,
                  minWidth: 36, minHeight: 36,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
                  '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' },
                }}
              >
                {playing
                  ? <PauseIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
                  : <PlayArrowIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />}
              </IconButton>

              {/* Перемотка ±10 c — только sm+ (на мобиле есть touch-seek по прогресс-бару) */}
              <IconButton onClick={() => seekBy(-10)} disabled={!everPlayed} size="small"
                sx={{ color: '#fff', p: 0.6, borderRadius: 1.5, minWidth: 34,
                  display: { xs: 'none', sm: 'inline-flex' },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
                  '&.Mui-disabled': { color: 'rgba(255,255,255,0.25)' } }}>
                <Replay10Icon sx={{ fontSize: 19 }} />
              </IconButton>
              <IconButton onClick={() => seekBy(10)} disabled={!everPlayed} size="small"
                sx={{ color: '#fff', p: 0.6, borderRadius: 1.5, minWidth: 34,
                  display: { xs: 'none', sm: 'inline-flex' },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
                  '&.Mui-disabled': { color: 'rgba(255,255,255,0.25)' } }}>
                <Forward10Icon sx={{ fontSize: 19 }} />
              </IconButton>

              {/* Время: текущее / длительность */}
              <Typography noWrap sx={{
                color: 'rgba(255,255,255,0.82)', fontWeight: 600,
                fontSize: { xs: '0.62rem', sm: '0.7rem' },
                ml: { xs: 0.25, sm: 0.5 },
                fontFamily: '"Roboto Mono", "Courier New", monospace',
                letterSpacing: '0.02em',
                flexShrink: 0,
              }}>
                {fmt(current)}
                <Box component="span" sx={{ color: 'rgba(255,255,255,0.3)', mx: '4px' }}>/</Box>
                {fmt(duration)}
              </Typography>

              {/* Распорка */}
              <Box sx={{ flex: 1 }} />

              {/* Громкость: иконка всегда + слайдер только на sm+ */}
              <Stack direction="row" alignItems="center" spacing={0}>
                <IconButton onClick={toggleMute} size="small"
                  sx={{ color: '#fff', p: { xs: 0.6, sm: 0.75 }, borderRadius: 1.5,
                    minWidth: 34, minHeight: 34,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}>
                  {muted || vol === 0
                    ? <VolumeOffIcon  sx={{ fontSize: { xs: 17, sm: 18 } }} />
                    : vol < 50
                      ? <VolumeDownIcon sx={{ fontSize: { xs: 17, sm: 18 } }} />
                      : <VolumeUpIcon   sx={{ fontSize: { xs: 17, sm: 18 } }} />
                  }
                </IconButton>
                {/* Слайдер громкости — скрыт на мобиле (место экономим) */}
                <Box sx={{ width: 68, px: 0.5, display: { xs: 'none', sm: 'block' } }}>
                  <Slider
                    size="small"
                    value={muted ? 0 : vol}
                    onChange={handleVol}
                    min={0} max={100}
                    sx={{
                      color: '#fff', p: '8px 0', display: 'block',
                      '& .MuiSlider-thumb': {
                        width: 10, height: 10, color: '#fff', boxShadow: 'none',
                        '&:hover,&.Mui-active': { boxShadow: '0 0 0 8px rgba(255,255,255,0.14)' },
                      },
                      '& .MuiSlider-track': { height: 3, border: 'none' },
                      '& .MuiSlider-rail':  { height: 3, opacity: 1, bgcolor: 'rgba(255,255,255,0.22)' },
                    }}
                  />
                </Box>
              </Stack>

              {/* Индикатор скорости (если не 1x) */}
              {speed !== 1 && (
                <Box onClick={() => setSettings('speed')} sx={{
                  px: 0.7, py: 0.2, mx: 0.25, cursor: 'pointer', borderRadius: 0.75,
                  fontSize: { xs: '0.6rem', sm: '0.62rem' }, fontWeight: 900,
                  color: '#fff', bgcolor: ACCENT, userSelect: 'none', flexShrink: 0,
                }}>
                  {speed}x
                </Box>
              )}

              {/* Настройки (качество + скорость) */}
              <IconButton
                onClick={() => setSettings((s) => s ? null : 'menu')}
                size="small"
                sx={{
                  color: settings ? ACCENT : '#fff',
                  p: { xs: 0.6, sm: 0.75 }, borderRadius: 1.5, minWidth: 34,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
                  '& svg': { transition: 'transform 0.3s', transform: settings ? 'rotate(60deg)' : 'none' },
                }}>
                <SettingsIcon sx={{ fontSize: { xs: 17, sm: 19 } }} />
              </IconButton>

              {/* Fullscreen */}
              <IconButton onClick={toggleFS} size="small"
                sx={{ color: '#fff', p: { xs: 0.6, sm: 0.75 }, borderRadius: 1.5,
                  minWidth: 34, '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}>
                {isFS
                  ? <FullscreenExitIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                  : <FullscreenIcon     sx={{ fontSize: { xs: 18, sm: 20 } }} />
                }
              </IconButton>
            </Stack>
          </Box>
        </Box>
      </Box>
    );
  }

  /* ── Нативный видеофайл (presigned если T3) ── */
  if (isVideoFile(url)) {
    return <LMSVideoPlayer url={url} />;
  }

  /* ── Внешняя ссылка ── */
  return (
    <Box sx={{
      width: '100%', paddingTop: '56.25%', position: 'relative',
      borderRadius: 2, overflow: 'hidden',
      background: 'linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243E 100%)',
    }}>
      <Stack alignItems="center" justifyContent="center" spacing={2.5}
        sx={{ position: 'absolute', inset: 0 }}>
        <Box sx={{
          width: 72, height: 72, borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid rgba(255,255,255,0.25)',
        }}>
          <PlayCircleIcon sx={{ fontSize: 40, color: '#fff' }} />
        </Box>
        <Button variant="contained" endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
          component="a" href={url} target="_blank" rel="noopener noreferrer"
          sx={{ borderRadius: 2, bgcolor: ACCENT, fontWeight: 700, px: 3,
            '&:hover': { bgcolor: ACCENT, filter: 'brightness(1.15)' } }}>
          Videoni ochish
        </Button>
      </Stack>
    </Box>
  );
}

/* ─── InteractiveQuiz — one question at a time, instant feedback ───────────── */
function InteractiveQuiz({ questions, lang }) {
  const [step,    setStep]    = useState(0);   // current question index
  const [chosen,  setChosen]  = useState(null); // selected option index (null = not yet)
  const [answers, setAnswers] = useState([]);  // array of {chosen, correct} per question
  const [done,    setDone]    = useState(false);

  if (!questions?.length) return null;

  const total   = questions.length;
  const q       = questions[step];
  const correct = q?.correct ?? 0;
  const answered = chosen !== null;
  const isRight  = chosen === correct;

  const handleChoose = (oi) => {
    if (answered) return;
    setChosen(oi);
  };

  const handleNext = () => {
    const next = [...answers, { chosen, correct }];
    setAnswers(next);
    if (step + 1 >= total) {
      setDone(true);
    } else {
      setStep((s) => s + 1);
      setChosen(null);
    }
  };

  const handleRetry = () => {
    setStep(0); setChosen(null); setAnswers([]); setDone(false);
  };

  /* ── Results screen ── */
  if (done) {
    const correctCount = answers.filter((a) => a.chosen === a.correct).length;
    const pct = Math.round((correctCount / total) * 100);
    const color = pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';
    return (
      <Box sx={{ mt: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <QuizIcon sx={{ color: ACCENT, fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={800} color={ACCENT}>
            {lang === 'ru' ? 'Результат теста' : 'Test natijasi'}
          </Typography>
        </Stack>

        <Card elevation={0} sx={{ border: `2px solid ${color}40`, borderRadius: 3, bgcolor: color + '06', mb: 2.5 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
              <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: color + '20',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <EmojiEventsIcon sx={{ fontSize: 34, color }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" fontWeight={900} color={color} lineHeight={1}>{pct}%</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {lang === 'ru'
                    ? `${correctCount} правильных из ${total}`
                    : `${total} ta savoldan ${correctCount} ta to'g'ri`}
                </Typography>
              </Box>
            </Stack>
            <LinearProgress variant="determinate" value={pct}
              sx={{ height: 8, borderRadius: 4, bgcolor: color + '20',
                '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 } }} />

            {/* Per-question summary */}
            <Stack direction="row" spacing={0.5} sx={{ mt: 2, flexWrap: 'wrap', gap: 0.5 }}>
              {answers.map((a, i) => (
                <Tooltip key={i} title={`${i + 1}. ${questions[i]?.question ?? ''}`} arrow>
                  <Box sx={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    bgcolor: a.chosen === a.correct ? '#10B98120' : '#EF444420',
                    border: `2px solid ${a.chosen === a.correct ? '#10B981' : '#EF4444'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.68rem', fontWeight: 800,
                    color: a.chosen === a.correct ? '#10B981' : '#EF4444',
                  }}>
                    {a.chosen === a.correct ? '✓' : '✕'}
                  </Box>
                </Tooltip>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Button variant="outlined" fullWidth onClick={handleRetry}
          startIcon={<ReplayIcon />}
          sx={{ borderRadius: 2.5, py: 1, fontWeight: 700, borderColor: ACCENT, color: ACCENT }}>
          {lang === 'ru' ? 'Пройти заново' : 'Qayta topshirish'}
        </Button>
      </Box>
    );
  }

  /* ── Single question ── */
  return (
    <Box sx={{ mt: 3 }}>
      {/* Header */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <QuizIcon sx={{ color: ACCENT, fontSize: 20 }} />
        <Typography variant="subtitle1" fontWeight={800} color={ACCENT}>
          {lang === 'ru' ? 'Тест по уроку' : 'Dars bo\'yicha test'}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Chip
          label={`${step + 1} / ${total}`}
          size="small"
          sx={{ bgcolor: ACCENT + '18', color: ACCENT, fontWeight: 800, fontSize: '0.72rem' }}
        />
      </Stack>

      {/* Step progress bar */}
      <LinearProgress
        variant="determinate"
        value={((step) / total) * 100}
        sx={{ mb: 2.5, height: 4, borderRadius: 2, bgcolor: ACCENT + '18',
          '& .MuiLinearProgress-bar': { bgcolor: ACCENT, borderRadius: 2 } }}
      />

      {/* Question card */}
      <Card elevation={0} sx={{
        border: answered
          ? `2px solid ${isRight ? '#10B981' : '#EF4444'}`
          : '2px solid',
        borderColor: answered ? undefined : `${ACCENT}40`,
        borderRadius: 3,
        bgcolor: answered
          ? isRight ? '#10B98106' : '#EF444406'
          : 'transparent',
        transition: 'border-color 0.2s, background-color 0.2s',
      }}>
        <CardContent sx={{ p: 2.5 }}>
          {/* Question text */}
          <Typography variant="body1" fontWeight={700} sx={{ mb: 2, lineHeight: 1.5 }}>
            {q.question}
          </Typography>

          {/* Options */}
          <Stack spacing={1}>
            {(q.options ?? []).map((opt, oi) => {
              const isChosen  = chosen === oi;
              const isCorrect = oi === correct;

              let bg        = 'action.hover';
              let border    = 'transparent';
              let textColor = 'text.primary';
              let fontW     = 500;

              if (answered) {
                if (isCorrect) {
                  bg = '#10B98118'; border = '#10B981'; textColor = '#10B981'; fontW = 700;
                } else if (isChosen && !isCorrect) {
                  bg = '#EF444418'; border = '#EF4444'; textColor = '#EF4444'; fontW = 700;
                } else {
                  bg = 'transparent'; border = 'transparent'; textColor = 'text.disabled';
                }
              }

              return (
                <Box
                  key={oi}
                  onClick={() => handleChoose(oi)}
                  sx={{
                    px: 2, py: 1.25, borderRadius: 2, cursor: answered ? 'default' : 'pointer',
                    bgcolor: bg, border: '1.5px solid', borderColor: border,
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    transition: 'all 0.18s',
                    '&:hover': answered ? {} : { bgcolor: ACCENT + '12', borderColor: ACCENT + '60' },
                  }}
                >
                  {/* Option letter circle */}
                  <Box sx={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    bgcolor: answered && isCorrect ? '#10B981' : answered && isChosen ? '#EF4444' : ACCENT + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 800,
                    color: answered && (isCorrect || isChosen) ? '#fff' : ACCENT,
                    transition: 'all 0.18s',
                  }}>
                    {answered && isCorrect ? '✓' : answered && isChosen && !isCorrect ? '✕' : String.fromCharCode(65 + oi)}
                  </Box>

                  <Typography variant="body2" fontWeight={fontW} color={textColor} sx={{ flex: 1 }}>
                    {opt}
                  </Typography>
                </Box>
              );
            })}
          </Stack>

          {/* Instant feedback banner */}
          {answered && (
            <Box sx={{
              mt: 2, px: 2, py: 1.25, borderRadius: 2,
              bgcolor: isRight ? '#10B98118' : '#EF444418',
              border: `1px solid ${isRight ? '#10B98140' : '#EF444440'}`,
              display: 'flex', alignItems: 'center', gap: 1,
            }}>
              {isRight
                ? <CelebrationIcon sx={{ color: '#10B981', fontSize: 18 }} />
                : <CancelIcon      sx={{ color: '#EF4444', fontSize: 18 }} />
              }
              <Typography variant="body2" fontWeight={700}
                color={isRight ? '#10B981' : '#EF4444'}>
                {isRight
                  ? (lang === 'ru' ? 'Правильно!' : 'To\'g\'ri!')
                  : (lang === 'ru'
                      ? `Неверно. Правильный ответ: «${q.options?.[correct]}»`
                      : `Noto'g'ri. To'g'ri javob: «${q.options?.[correct]}»`)
                }
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Next / Finish button */}
      {answered && (
        <Button
          variant="contained" fullWidth
          endIcon={step + 1 < total ? <ChevronRightIcon /> : <EmojiEventsIcon />}
          onClick={handleNext}
          sx={{
            mt: 2, borderRadius: 2.5, py: 1.25, fontWeight: 700,
            bgcolor: isRight ? '#10B981' : ACCENT,
            '&:hover': { bgcolor: isRight ? '#059669' : ACCENT, filter: 'brightness(1.1)' },
          }}
        >
          {step + 1 < total
            ? (lang === 'ru' ? `Следующий вопрос (${step + 2}/${total})` : `Keyingi savol (${step + 2}/${total})`)
            : (lang === 'ru' ? 'Завершить тест' : 'Testni yakunlash')
          }
        </Button>
      )}
    </Box>
  );
}

/* ─── Sidebar ──────────────────────────────────────────────────────────────── */
function Sidebar({ packages, activePkgIdx, activeMod, onSelectPkg, onSelectMod, lang, doneSet }) {
  const theme     = useTheme();
  const [expanded, setExpanded] = useState(activePkgIdx);

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', px: 1, pb: 2 }}>
      {packages.map((pkg, pi) => {
        const modules  = pkg.modules ?? [];
        const isActive = pi === activePkgIdx;
        const doneInPkg = modules.filter((_, mi) => doneSet.has(`${pi}-${mi}`)).length;
        const pct      = modules.length ? Math.round((doneInPkg / modules.length) * 100) : 0;
        const pkgTitle = gT(pkg.title, lang);

        return (
          <Box key={pi} sx={{ mb: 1.5 }}>
            {/* Package header */}
            <Box
              onClick={() => { setExpanded(pi === expanded ? -1 : pi); onSelectPkg(pi); }}
              sx={{
                px: 1.25, py: 1.1, cursor: 'pointer', borderRadius: 2,
                bgcolor: isActive ? ACCENT + '18' : 'action.hover',
                border: '1.5px solid',
                borderColor: isActive ? ACCENT + '50' : 'transparent',
                transition: 'all 0.15s',
                '&:hover': { bgcolor: ACCENT + '12' },
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                <Box sx={{
                  width: 26, height: 26, borderRadius: 1.5, flexShrink: 0,
                  bgcolor: ACCENT + '20', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <InventoryIcon sx={{ fontSize: 13, color: ACCENT }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700} noWrap color={isActive ? ACCENT : 'text.primary'}
                    sx={{ fontSize: '0.82rem' }}>
                    {pkgTitle}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.62rem' }}>
                    {doneInPkg}/{modules.length} {lang === 'ru' ? 'ур.' : 'dars'}
                    {' · '}{pct}%
                  </Typography>
                </Box>
                <ChevronRightIcon sx={{
                  fontSize: 15, color: 'text.disabled', flexShrink: 0, mr: '-2px',
                  transform: expanded === pi ? 'rotate(90deg)' : 'none',
                  transition: 'transform 0.2s',
                }} />
              </Stack>
              {pct > 0 && (
                <LinearProgress variant="determinate" value={pct}
                  sx={{ mt: 1, height: 3, borderRadius: 2, bgcolor: ACCENT + '20',
                    '& .MuiLinearProgress-bar': { bgcolor: ACCENT, borderRadius: 2 } }} />
              )}
            </Box>

            {/* Module list */}
            <Collapse in={expanded === pi}>
              <Box sx={{ pl: 1, mt: 0.75 }}>
                {modules.map((m, mi) => {
                  const key     = `${pi}-${mi}`;
                  const done    = doneSet.has(key);
                  const isCur   = isActive && mi === activeMod;
                  const hasVid  = !!m.videoUrl || !!m.videoFile;
                  const hasFile = !!m.file?.url;
                  const hasQuiz = Array.isArray(m.quiz) && m.quiz.length > 0;

                  return (
                    <Box
                      key={mi}
                      onClick={() => onSelectMod(pi, mi)}
                      sx={{
                        px: 1.25, py: 1.25, cursor: 'pointer', borderRadius: 1.5, mb: 0.5,
                        bgcolor: isCur ? ACCENT + '22' : 'transparent',
                        border: '1px solid',
                        borderColor: isCur ? ACCENT + '40' : 'transparent',
                        '&:hover': { bgcolor: isCur ? ACCENT + '22' : 'action.hover' },
                        transition: 'all 0.12s',
                      }}
                    >
                      <Stack direction="row" spacing={1.25} alignItems="flex-start">
                        {/* Status icon */}
                        <Box sx={{ mt: 0.2, flexShrink: 0 }}>
                          {done
                            ? <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />
                            : isCur
                              ? <PlayCircleIcon sx={{ fontSize: 16, color: ACCENT }} />
                              : <RadioButtonUncheckedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                          }
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2" noWrap fontWeight={isCur ? 700 : 500}
                            color={isCur ? ACCENT : done ? 'text.secondary' : 'text.primary'}
                            sx={{ fontSize: '0.84rem', lineHeight: 1.45 }}
                          >
                            {mi + 1}. {gT(m.title, lang)}
                          </Typography>
                          {/* Иконки контента — только если есть хотя бы одна */}
                          {(hasVid || hasFile || hasQuiz) && (
                            <Stack direction="row" spacing={0.75} sx={{ mt: 0.5 }}>
                              {hasVid  && <PlayCircleIcon  sx={{ fontSize: 12, color: '#1976D2' }} />}
                              {hasFile && <ArticleIcon      sx={{ fontSize: 12, color: '#10B981' }} />}
                              {hasQuiz && <QuizIcon         sx={{ fontSize: 12, color: ACCENT }} />}
                            </Stack>
                          )}
                        </Box>
                      </Stack>
                    </Box>
                  );
                })}
              </Box>
            </Collapse>
          </Box>
        );
      })}
    </Box>
  );
}

/* ─── LessonViewer ─────────────────────────────────────────────────────────── */
function LessonViewer({ pkg, modIdx, onDone, done, lang, totalMods, onPrev, onNext }) {
  if (!pkg) return null;
  const modules = pkg.modules ?? [];
  const m       = modules[modIdx];
  if (!m) return null;

  const hasVideo     = !!m.videoUrl;
  const hasVideoFile = !!m.videoFile;
  const hasFile  = !!m.file?.url;
  const hasQuiz  = Array.isArray(m.quiz) && m.quiz.length > 0;
  const title    = gT(m.title, lang);

  return (
    <Box>
      {/* Breadcrumb */}
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="caption" color="text.disabled">{gT(pkg.title, lang)}</Typography>
        <ChevronRightIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        <Typography variant="caption" color={ACCENT} fontWeight={600}>
          {lang === 'ru' ? 'Урок' : 'Dars'} {modIdx + 1}
        </Typography>
      </Stack>

      {/* Title + mark done */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1} sx={{ mb: 2 }}>
        <Typography
          variant="h5" fontWeight={800}
          sx={{ lineHeight: 1.3, fontSize: { xs: '1.1rem', sm: '1.35rem', md: '1.5rem' } }}
        >
          {title}
        </Typography>
        <Button
          variant={done ? 'outlined' : 'contained'}
          size="small"
          startIcon={done ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
          onClick={onDone}
          sx={{
            borderRadius: 2, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
            fontSize: { xs: '0.72rem', sm: '0.8rem' },
            ...(done
              ? { borderColor: '#10B981', color: '#10B981' }
              : { bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }
            ),
          }}
        >
          {done
            ? (lang === 'ru' ? '✓ Изучено' : '✓ O\'rganildi')
            : (lang === 'ru' ? 'Отметить изученным' : 'O\'rganildi deb belgilash')}
        </Button>
      </Stack>

      {/* ── Video (YouTube or external URL) ── */}
      {hasVideo && (
        <Box sx={{ mb: hasVideoFile ? 2 : 3 }}>
          <VideoPlayer url={m.videoUrl} />
        </Box>
      )}

      {/* ── Video file (T3 uploaded — shown via LMSVideoPlayer with presign) ── */}
      {hasVideoFile && (
        <Box sx={{ mb: 3 }}>
          <LMSVideoPlayer url={m.videoFile} />
        </Box>
      )}

      {/* ── Description ── */}
      {m.description && (
        <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
          <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <MenuBookIcon sx={{ fontSize: 18, color: ACCENT }} />
              <Typography variant="subtitle2" fontWeight={700}>
                {lang === 'ru' ? 'О уроке' : 'Dars haqida'}
              </Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
              {typeof m.description === 'object'
                ? (m.description[lang] ?? m.description.uz ?? m.description.ru ?? '')
                : m.description}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* ── File download ── */}
      {hasFile && (
        <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: '#10B98140', borderRadius: 2.5, bgcolor: '#10B98106' }}>
          <CardContent sx={{ p: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#10B98120',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ArticleIcon sx={{ fontSize: 20, color: '#10B981' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={700}>
                  {m.file?.name || (lang === 'ru' ? 'Материалы урока' : 'Dars materiallari')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {m.file?.type?.toUpperCase()} · {lang === 'ru' ? 'Нажмите для скачивания' : 'Yuklab olish uchun bosing'}
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => openPrivateFile(m.file?.url)}
                sx={{ borderRadius: 2, bgcolor: '#10B981', fontWeight: 700, flexShrink: 0,
                  '&:hover': { bgcolor: '#059669' } }}
              >
                {lang === 'ru' ? 'Yuklab olish' : 'Yuklab olish'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* ── External link ── */}
      {m.link && (
        <Card elevation={0} sx={{ mb: 3, border: '1px solid #BFDBFE', borderRadius: 2.5, bgcolor: '#EFF6FF' }}>
          <CardContent sx={{ p: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#DBEAFE',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <OpenInNewIcon sx={{ fontSize: 20, color: '#3B82F6' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={700}>
                  {lang === 'ru' ? 'Дополнительная ссылка' : 'Qo\'shimcha havola'}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 300 }}>
                  {m.link}
                </Typography>
              </Box>
              <Button variant="contained" size="small" endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                onClick={() => window.open(m.link, '_blank', 'noopener,noreferrer')}
                sx={{ borderRadius: 2, bgcolor: '#3B82F6', fontWeight: 700, flexShrink: 0,
                  '&:hover': { bgcolor: '#2563EB' } }}>
                {lang === 'ru' ? 'Открыть' : 'Ochish'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* ── Quiz ── */}
      {hasQuiz && (
        <Card elevation={0} sx={{ mb: 3, border: `1px solid ${ACCENT}30`, borderRadius: 2.5, bgcolor: ACCENT + '04' }}>
          <CardContent sx={{ p: 2.5 }}>
            <InteractiveQuiz questions={m.quiz} lang={lang} />
          </CardContent>
        </Card>
      )}

      {/* ── Prev / Next navigation ── */}
      <Divider sx={{ mb: 2.5 }} />
      <Stack direction="row" justifyContent="space-between" spacing={1.5}>
        <Button
          variant="outlined" startIcon={<ChevronLeftIcon />}
          disabled={modIdx === 0} onClick={onPrev}
          sx={{ borderRadius: 2, fontWeight: 600, minWidth: { xs: 44, sm: 'auto' } }}
        >
          {/* На xs — сокращённый текст */}
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            {lang === 'ru' ? 'Предыдущий урок' : 'Oldingi dars'}
          </Box>
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
            {lang === 'ru' ? 'Назад' : 'Orqaga'}
          </Box>
        </Button>
        <Button
          variant={modIdx === totalMods - 1 ? 'outlined' : 'contained'}
          endIcon={modIdx === totalMods - 1 ? <EmojiEventsIcon /> : <ChevronRightIcon />}
          onClick={onNext}
          sx={{
            borderRadius: 2, fontWeight: 700, minWidth: { xs: 44, sm: 'auto' },
            ...(modIdx < totalMods - 1
              ? { bgcolor: ACCENT, '&:hover': { bgcolor: ACCENT, filter: 'brightness(1.1)' } }
              : { borderColor: '#10B981', color: '#10B981' }
            ),
          }}
        >
          {modIdx === totalMods - 1
            ? (
              <>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  {lang === 'ru' ? 'Курс завершён!' : 'Kurs yakunlandi!'}
                </Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  {lang === 'ru' ? 'Готово!' : 'Tayyor!'}
                </Box>
              </>
            ) : (
              <>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  {lang === 'ru' ? 'Следующий урок' : 'Keyingi dars'}
                </Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  {lang === 'ru' ? 'Далее' : 'Keyingi'}
                </Box>
              </>
            )
          }
        </Button>
      </Stack>
    </Box>
  );
}

/* ─── MAIN ─────────────────────────────────────────────────────────────────── */
export default function VideoLessons() {
  const { t }   = useTranslation();
  const lang    = i18n.language === 'ru' ? 'ru' : 'uz';
  const theme   = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams] = useSearchParams();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePkgIdx, setActivePkgIdx] = useState(0);
  const [activeMod,    setActiveMod]    = useState(0);
  const [doneSet,      setDoneSet]      = useState(new Set());  // "pkgIdx-modIdx"

  /* ref to content scroll area — scroll to top on lesson change */
  const contentRef = useRef(null);

  const scrollTop = () => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  };

  const { data: accessRes, isLoading } = useGetMyAccessPackagesQuery();
  /* API returns [{ access, package }] — extract the package from each entry */
  const allPackages = useMemo(() => {
    const raw = Array.isArray(accessRes?.data) ? accessRes.data
              : Array.isArray(accessRes)        ? accessRes
              : [];
    return raw
      .map((item) => item?.package ?? item)
      .filter(Boolean);
  }, [accessRes]);

  /* If ?pkg= is in URL — show only that package in the sidebar */
  const packages = useMemo(() => {
    const pkgId = searchParams.get('pkg');
    if (!pkgId) return allPackages;
    const filtered = allPackages.filter((p) => String(p._id) === pkgId);
    return filtered.length > 0 ? filtered : allPackages;
  }, [allPackages, searchParams]);

  /* Auto-select package from ?pkg= query param */
  useEffect(() => {
    const pkgId = searchParams.get('pkg');
    if (!pkgId || packages.length === 0) return;
    const idx = packages.findIndex((p) => String(p._id) === pkgId);
    if (idx !== -1) setActivePkgIdx(idx);
  }, [packages, searchParams]);

  const activePkg  = packages[activePkgIdx] ?? null;
  const totalMods  = (activePkg?.modules ?? []).length;

  const doneKey    = `${activePkgIdx}-${activeMod}`;
  const isDone     = doneSet.has(doneKey);

  const toggleDone = () =>
    setDoneSet((prev) => {
      const next = new Set(prev);
      next.has(doneKey) ? next.delete(doneKey) : next.add(doneKey);
      return next;
    });

  const handleSelect = (pi, mi) => {
    setActivePkgIdx(pi); setActiveMod(mi);
    scrollTop();
    if (isMobile) setSidebarOpen(false);
  };

  const handlePrev = () => {
    if (activeMod > 0) { setActiveMod((v) => v - 1); scrollTop(); }
  };
  const handleNext = () => {
    if (activeMod < totalMods - 1) {
      setDoneSet((prev) => { const n = new Set(prev); n.add(doneKey); return n; });
      setActiveMod((v) => v + 1);
      scrollTop();
    }
  };

  /* overall progress */
  const totalAll = packages.reduce((s, p) => s + (p.modules?.length ?? 0), 0);
  const doneAll  = doneSet.size;
  const pctAll   = totalAll ? Math.round((doneAll / totalAll) * 100) : 0;

  /* sidebar content */
  const sidebarNode = (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* Top bar inside sidebar */}
      <Box sx={{ px: 2, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={800}>
            {lang === 'ru' ? 'Мои курсы' : 'Mening kurslarim'}
          </Typography>
          {isMobile && (
            <IconButton size="small" onClick={() => setSidebarOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <LinearProgress variant="determinate" value={pctAll}
            sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: ACCENT + '20',
              '& .MuiLinearProgress-bar': { bgcolor: ACCENT, borderRadius: 3 } }} />
          <Typography variant="caption" fontWeight={700} color={ACCENT} sx={{ whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
            {doneAll}/{totalAll}
          </Typography>
        </Stack>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        <Sidebar
          packages={packages}
          activePkgIdx={activePkgIdx}
          activeMod={activeMod}
          onSelectPkg={(pi) => { setActivePkgIdx(pi); setActiveMod(0); }}
          onSelectMod={handleSelect}
          lang={lang}
          doneSet={doneSet}
        />
      </Box>
    </Box>
  );

  /* ── Loading ── */
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress sx={{ color: ACCENT }} />
          <Typography color="text.secondary" variant="body2">
            {lang === 'ru' ? 'Загрузка курсов…' : 'Kurslar yuklanmoqda…'}
          </Typography>
        </Stack>
      </Box>
    );
  }

  /* ── Empty ── */
  if (!isLoading && packages.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Stack alignItems="center" spacing={2.5}>
          <Box sx={{
            width: 80, height: 80, borderRadius: 4,
            bgcolor: ACCENT + '14', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <InventoryIcon sx={{ fontSize: 40, color: ACCENT }} />
          </Box>
          <Typography variant="h6" fontWeight={700}>
            {lang === 'ru' ? 'Нет доступных курсов' : 'Mavjud kurslar yo\'q'}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={340}>
            {lang === 'ru'
              ? 'Вам ещё не предоставлен доступ к индивидуальным пакетам. Обратитесь к администратору.'
              : 'Sizga hali individual paketlarga kirish berilmagan. Administratorga murojaat qiling.'}
          </Typography>
        </Stack>
      </Box>
    );
  }

  /* ── Main layout ── */
  return (
    <Box sx={{
      display: 'flex',
      height: { xs: 'calc(100dvh - 56px)', sm: 'calc(100dvh - 64px)', md: 'calc(100vh - 80px)' },
      overflow: 'hidden',
      mx: { xs: -2, sm: -3 },
      mt: -2,
    }}>

      {/* ── SIDEBAR desktop ── */}
      {!isMobile && (
        <Box sx={{
          width: { md: 260, lg: 280 }, flexShrink: 0,
          borderRight: '1px solid', borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex', flexDirection: 'column',
        }}>
          {sidebarNode}
        </Box>
      )}

      {/* ── SIDEBAR mobile drawer ── */}
      {isMobile && (
        <Drawer
          anchor="left" open={sidebarOpen} onClose={() => setSidebarOpen(false)}
          PaperProps={{ sx: { width: { xs: 280, sm: 320 }, bgcolor: 'background.paper' } }}
        >
          {sidebarNode}
        </Drawer>
      )}

      {/* ── CONTENT AREA ── */}
      <Box ref={contentRef} sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <Box sx={{
          px: { xs: 1.5, sm: 2.5, md: 3 },
          py: { xs: 1, sm: 1.5 },
          borderBottom: '1px solid', borderColor: 'divider',
          bgcolor: 'background.paper', flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 },
          position: 'sticky', top: 0, zIndex: 10,
          minHeight: { xs: 48, sm: 56 },
        }}>
          {isMobile && (
            <IconButton
              size="small"
              onClick={() => setSidebarOpen(true)}
              sx={{ mr: { xs: 0, sm: 0.5 }, p: { xs: 0.75, sm: 1 } }}
            >
              <MenuIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
            </IconButton>
          )}

          {/* Current lesson indicator */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <Chip
              label={`${activeMod + 1} / ${totalMods}`}
              size="small"
              sx={{
                bgcolor: ACCENT + '18', color: ACCENT, fontWeight: 700,
                fontSize: { xs: '0.65rem', sm: '0.72rem' },
                height: { xs: 22, sm: 24 },
                flexShrink: 0,
              }}
            />
            <Typography
              variant="body2" fontWeight={600} noWrap color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              {gT(activePkg?.modules?.[activeMod]?.title, lang)}
            </Typography>
          </Stack>

          {/* Global progress pill — только sm+ */}
          {totalAll > 0 && (
            <Stack direction="row" spacing={0.75} alignItems="center"
              sx={{ flexShrink: 0, display: { xs: 'none', sm: 'flex' } }}>
              <Typography variant="caption" color="text.disabled" fontWeight={600}>{pctAll}%</Typography>
              <Box sx={{ width: { sm: 70, md: 90 } }}>
                <LinearProgress variant="determinate" value={pctAll}
                  sx={{ height: 5, borderRadius: 3, bgcolor: ACCENT + '20',
                    '& .MuiLinearProgress-bar': { bgcolor: ACCENT, borderRadius: 3 } }} />
              </Box>
            </Stack>
          )}
        </Box>

        {/* Lesson content */}
        <Box sx={{
          flex: 1,
          px: { xs: 1.5, sm: 3, md: 4 },
          py: { xs: 2, sm: 3 },
          maxWidth: 900, width: '100%', mx: 'auto',
        }}>
          {activePkg && (
            <LessonViewer
              key={`${activePkgIdx}-${activeMod}`}
              pkg={activePkg}
              modIdx={activeMod}
              onDone={toggleDone}
              done={isDone}
              lang={lang}
              totalMods={totalMods}
              onPrev={handlePrev}
              onNext={handleNext}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}
