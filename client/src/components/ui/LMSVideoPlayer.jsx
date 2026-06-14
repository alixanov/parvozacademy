/**
 * PARVOZ LMS — LMSVideoPlayer
 * Custom player for T3-hosted private video files.
 * Full mobile support: touch seek, tap-to-play, iOS fullscreen, no volume on iOS.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

const ACCENT = '#7C3AED';

/* ── helpers ─────────────────────────────────────────────────────────────── */
function fmt(sec) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const h  = Math.floor(sec / 3600);
  const m  = Math.floor((sec % 3600) / 60);
  const s  = Math.floor(sec % 60);
  const mm = String(m).padStart(h ? 2 : 1, '0');
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function storageKey(url) {
  try { return `lms_vp_${btoa(url).slice(0, 40)}`; } catch { return `lms_vp_${url.slice(-40)}`; }
}

async function fetchPresigned(rawUrl) {
  try {
    const { store } = await import('../../app/store.js');
    const token = store.getState().auth?.accessToken;
    const isT3  = rawUrl.includes('t3.storage.dev') || rawUrl.includes('tigris');
    if (!isT3) return rawUrl;
    const res  = await fetch(`/api/v1/uploads/presign?key=${encodeURIComponent(rawUrl)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return rawUrl;
    const json = await res.json();
    return json?.data?.url ?? rawUrl;
  } catch { return rawUrl; }
}

/* detect touch device */
const IS_TOUCH = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
/* detect iOS (volume control unavailable) */
const IS_IOS   = typeof navigator !== 'undefined' && /iP(hone|ad|od)/.test(navigator.userAgent);

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

/* ── SVG icon ─────────────────────────────────────────────────────────────── */
const Ic = ({ d, size = 22, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const icons = {
  play:    'M5 3l14 9-14 9V3z',
  pause:   'M6 4h4v16H6zM14 4h4v16h-4z',
  volHigh: 'M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07',
  volMute: 'M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6',
  expand:  'M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3',
  shrink:  'M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3',
  fwd:     'M5 4l10 8-10 8V4zM19 5v14',
  rew:     'M19 20L9 12l10-8v16zM5 19V5',
  speed:   'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
};

/* ── Btn ─────────────────────────────────────────────────────────────────── */
function Btn({ icon, onClick, size = 22, style = {} }) {
  return (
    <button onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: IS_TOUCH ? 10 : 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 8, WebkitTapHighlightColor: 'transparent',
        ...style,
      }}>
      <Ic d={icons[icon]} size={size} />
    </button>
  );
}

/* ── SeekBar — works with both mouse and touch ───────────────────────────── */
function SeekBar({ current, duration, buffered, onSeek }) {
  const ref      = useRef(null);
  const dragging = useRef(false);

  const pct = duration ? (current / duration) * 100 : 0;
  const buf = duration && buffered ? (buffered / duration) * 100 : 0;

  function getRatio(clientX) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return null;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }

  /* ── Mouse ── */
  const onMouseDown = (e) => {
    e.preventDefault();
    dragging.current = true;
    const r = getRatio(e.clientX);
    if (r != null) onSeek(r * duration);
    const onMove = (me) => { const r2 = getRatio(me.clientX); if (r2 != null) onSeek(r2 * duration); };
    const onUp   = () => { dragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  /* ── Touch ── */
  const onTouchStart = (e) => {
    e.preventDefault();
    dragging.current = true;
    const r = getRatio(e.touches[0].clientX);
    if (r != null) onSeek(r * duration);
  };
  const onTouchMove = (e) => {
    e.preventDefault();
    if (!dragging.current) return;
    const r = getRatio(e.touches[0].clientX);
    if (r != null) onSeek(r * duration);
  };
  const onTouchEnd = () => { dragging.current = false; };

  return (
    <div ref={ref}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ position: 'relative', height: IS_TOUCH ? 28 : 18, cursor: 'pointer', display: 'flex', alignItems: 'center', touchAction: 'none' }}>
      {/* Track */}
      <div style={{ width: '100%', height: IS_TOUCH ? 5 : 4, borderRadius: 3, background: 'rgba(255,255,255,0.2)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${buf}%`, background: 'rgba(255,255,255,0.3)', borderRadius: 3 }} />
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: ACCENT, borderRadius: 3 }} />
      </div>
      {/* Thumb */}
      <div style={{
        position: 'absolute',
        left: `calc(${pct}% - ${IS_TOUCH ? 9 : 7}px)`,
        width: IS_TOUCH ? 18 : 14, height: IS_TOUCH ? 18 : 14,
        borderRadius: '50%', background: '#fff',
        boxShadow: `0 0 0 2px ${ACCENT}`,
        top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none',
      }} />
    </div>
  );
}

/* ── SpeedMenu ───────────────────────────────────────────────────────────── */
function SpeedMenu({ speed, onSpeed, open, onToggle }) {
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={onToggle}
        style={{ background: open ? 'rgba(255,255,255,0.18)' : 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 6, WebkitTapHighlightColor: 'transparent' }}>
        {speed}×
      </button>
      {open && (
        <div style={{ position: 'absolute', bottom: IS_TOUCH ? 44 : 36, right: 0, background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, overflow: 'hidden', minWidth: 72, zIndex: 10 }}>
          {SPEEDS.map((s) => (
            <button key={s} onClick={() => { onSpeed(s); onToggle(); }}
              style={{ display: 'block', width: '100%', background: s === speed ? ACCENT : 'transparent', color: '#fff', border: 'none', cursor: 'pointer', padding: IS_TOUCH ? '12px 14px' : '8px 14px', fontSize: 13, textAlign: 'center', fontWeight: s === speed ? 700 : 400, WebkitTapHighlightColor: 'transparent' }}>
              {s}×
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Seek flash overlay ───────────────────────────────────────────────────── */
function SeekFlash({ dir, visible }) {
  return (
    <div style={{
      position: 'absolute', top: '50%',
      [dir === 'fwd' ? 'right' : 'left']: IS_TOUCH ? 16 : 48,
      transform: 'translateY(-50%)',
      background: 'rgba(0,0,0,0.6)', borderRadius: 40, padding: '10px 18px',
      color: '#fff', fontSize: 14, fontWeight: 700,
      pointerEvents: 'none', opacity: visible ? 1 : 0, transition: 'opacity 0.25s',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <Ic d={dir === 'fwd' ? icons.fwd : icons.rew} size={18} />
      {dir === 'fwd' ? '+10s' : '−10s'}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════════════════ */
export default function LMSVideoPlayer({ url, title, onProgress }) {
  const vidRef    = useRef(null);
  const wrapRef   = useRef(null);
  const rafRef    = useRef(null);
  const hideTimer = useRef(null);
  const presignRef= useRef(null);
  const tapRef    = useRef({ timer: null, last: 0, side: null });

  const [src,       setSrc]       = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [playing,   setPlaying]   = useState(false);
  const [current,   setCurrent]   = useState(0);
  const [duration,  setDuration]  = useState(0);
  const [buffered,  setBuffered]  = useState(0);
  const [volume,    setVolume]    = useState(1);
  const [muted,     setMuted]     = useState(false);
  const [speed,     setSpeed]     = useState(1);
  const [fullscreen,setFullscreen]= useState(false);
  const [showCtrl,  setShowCtrl]  = useState(true);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [hasPip,    setHasPip]    = useState(false);
  const [fwdFlash,  setFwdFlash]  = useState(false);
  const [rewFlash,  setRewFlash]  = useState(false);
  const [waitBuf,   setWaitBuf]   = useState(false);
  const [started,   setStarted]   = useState(false);

  /* ── Presigned URL ── */
  const loadPresign = useCallback(async (rawUrl) => {
    setLoading(true); setError(null);
    try {
      const signed = await fetchPresigned(rawUrl);
      setSrc(signed);
      clearTimeout(presignRef.current);
      // refresh presign every 5.5 hours (expiry = 6h)
      presignRef.current = setTimeout(() => loadPresign(rawUrl), 5.5 * 60 * 60 * 1000);
    } catch { setError('Videoni yuklashda xatolik'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!url) return;
    loadPresign(url);
    return () => { clearTimeout(presignRef.current); };
  }, [url, loadPresign]);

  /* ── Restore progress ── */
  useEffect(() => {
    if (!src || !url) return;
    const saved = parseFloat(localStorage.getItem(storageKey(url)) || '0');
    if (saved > 5 && vidRef.current) vidRef.current.currentTime = saved;
  }, [src, url]);

  /* ── RAF progress loop ── */
  const tick = useCallback(() => {
    const v = vidRef.current;
    if (!v) return;
    setCurrent(v.currentTime);
    if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
    if (!v.paused) rafRef.current = requestAnimationFrame(tick);
  }, []);

  /* ── Video events ── */
  const onLoadedMeta = () => {
    const v = vidRef.current;
    if (!v) return;
    setDuration(v.duration);
    setLoading(false);
    setHasPip('pictureInPictureEnabled' in document && !IS_IOS);
  };
  const onPlay     = () => { setPlaying(true);  setWaitBuf(false); rafRef.current = requestAnimationFrame(tick); };
  const onPause    = () => { setPlaying(false); cancelAnimationFrame(rafRef.current); };
  const onWaiting  = () => setWaitBuf(true);
  const onCanPlay  = () => setWaitBuf(false);
  const onEnded    = () => { setPlaying(false); cancelAnimationFrame(rafRef.current); };
  const onError    = () => { setError("Video yuklanmadi. Qayta urinib ko'ring."); setLoading(false); };
  const onTimeUpdate = () => {
    if (!vidRef.current || !url) return;
    localStorage.setItem(storageKey(url), String(Math.floor(vidRef.current.currentTime)));
    onProgress?.(vidRef.current.currentTime, vidRef.current.duration);
  };

  /* ── Controls ── */
  const togglePlay = useCallback(() => {
    const v = vidRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
    if (!started) setStarted(true);
  }, [started]);

  const seekTo = useCallback((t) => {
    const v = vidRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || Infinity, t));
    setCurrent(v.currentTime);
  }, []);

  const skipFwd = useCallback(() => {
    seekTo((vidRef.current?.currentTime ?? 0) + 10);
    setFwdFlash(true); setTimeout(() => setFwdFlash(false), 600);
  }, [seekTo]);

  const skipRew = useCallback(() => {
    seekTo((vidRef.current?.currentTime ?? 0) - 10);
    setRewFlash(true); setTimeout(() => setRewFlash(false), 600);
  }, [seekTo]);

  const setVol = useCallback((v) => {
    if (IS_IOS) return; // iOS ignores JS volume
    setVolume(v); setMuted(v === 0);
    if (vidRef.current) { vidRef.current.volume = v; vidRef.current.muted = v === 0; }
  }, []);

  const toggleMute = useCallback(() => {
    if (IS_IOS) return;
    const v = vidRef.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next; setMuted(next);
    if (!next && volume === 0) { setVolume(0.5); v.volume = 0.5; }
  }, [volume]);

  const changeSpeed = useCallback((s) => {
    setSpeed(s);
    if (vidRef.current) vidRef.current.playbackRate = s;
  }, []);

  /* ── Fullscreen — works on iOS too ── */
  const toggleFullscreen = useCallback(() => {
    const v = vidRef.current;
    const w = wrapRef.current;
    if (!v || !w) return;
    // iOS Safari: fullscreen only on the video element via webkit API
    if (IS_IOS) {
      if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
      return;
    }
    if (!document.fullscreenElement) w.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  useEffect(() => {
    const h = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    document.addEventListener('webkitfullscreenchange', h);
    return () => {
      document.removeEventListener('fullscreenchange', h);
      document.removeEventListener('webkitfullscreenchange', h);
    };
  }, []);

  const togglePiP = useCallback(async () => {
    if (document.pictureInPictureElement) await document.exitPictureInPicture();
    else await vidRef.current?.requestPictureInPicture?.();
  }, []);

  /* ── Auto-hide controls ── */
  const showControls = useCallback(() => {
    setShowCtrl(true);
    clearTimeout(hideTimer.current);
    if (playing) hideTimer.current = setTimeout(() => setShowCtrl(false), 3500);
  }, [playing]);

  useEffect(() => {
    clearTimeout(hideTimer.current);
    if (!playing) { setShowCtrl(true); return; }
    hideTimer.current = setTimeout(() => setShowCtrl(false), 3500);
    return () => clearTimeout(hideTimer.current);
  }, [playing]);

  /* ── Keyboard shortcuts (desktop only) ── */
  useEffect(() => {
    if (IS_TOUCH) return;
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.code) {
        case 'Space':      e.preventDefault(); togglePlay(); showControls(); break;
        case 'KeyM':       toggleMute(); break;
        case 'KeyF':       toggleFullscreen(); break;
        case 'ArrowRight': e.preventDefault(); skipFwd(); showControls(); break;
        case 'ArrowLeft':  e.preventDefault(); skipRew(); showControls(); break;
        case 'ArrowUp':    e.preventDefault(); setVol(Math.min(1, volume + 0.1)); break;
        case 'ArrowDown':  e.preventDefault(); setVol(Math.max(0, volume - 0.1)); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlay, toggleMute, toggleFullscreen, skipFwd, skipRew, setVol, volume, showControls]);

  /* ── Cleanup ── */
  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(hideTimer.current);
    clearTimeout(presignRef.current);
    clearTimeout(tapRef.current.timer);
  }, []);

  /* ── Touch: tap handling ──────────────────────────────────────────────────
     Single tap  → show controls; if controls already visible → play/pause
     Double tap  → seek ±10s
  ─────────────────────────────────────────────────────────────────────────── */
  const onTouchZone = useCallback((e, side) => {
    e.preventDefault();
    const now  = Date.now();
    const prev = tapRef.current;

    if (now - prev.last < 300 && prev.side === side) {
      // Double tap → seek
      clearTimeout(prev.timer);
      tapRef.current = { timer: null, last: 0, side: null };
      if (side === 'right') skipFwd();
      else                  skipRew();
    } else {
      // First tap → wait to distinguish single vs double
      tapRef.current = {
        last: now,
        side,
        timer: setTimeout(() => {
          // Single tap confirmed
          showControls();
          // On mobile: single tap also toggles play if controls were already visible
          if (showCtrl) togglePlay();
          tapRef.current = { timer: null, last: 0, side: null };
        }, 280),
      };
    }
  }, [skipFwd, skipRew, showControls, togglePlay, showCtrl]);

  /* ══════════════════════ Render ══════════════════════════════════════════ */
  if (loading && !src) return (
    <div style={{ width: '100%', aspectRatio: '16/9', background: '#0a0a14', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ width: 44, height: 44, border: `3px solid ${ACCENT}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'lms-spin 0.8s linear infinite' }} />
      <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>Video yuklanmoqda…</span>
      <style>{`@keyframes lms-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ width: '100%', aspectRatio: '16/9', background: '#0a0a14', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Ic d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" size={40} color="#EF4444" />
      <span style={{ color: '#EF4444', fontSize: 14, textAlign: 'center', padding: '0 16px' }}>{error}</span>
      <button onClick={() => loadPresign(url)}
        style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
        Qayta urinish
      </button>
    </div>
  );

  const ctrlVisible = showCtrl || !playing || speedOpen;

  return (
    <div ref={wrapRef} tabIndex={0}
      onMouseMove={!IS_TOUCH ? showControls : undefined}
      onMouseLeave={!IS_TOUCH ? (() => { if (playing) setShowCtrl(false); }) : undefined}
      style={{
        position: 'relative', width: '100%', aspectRatio: '16/9',
        background: '#000', borderRadius: fullscreen ? 0 : 12,
        overflow: 'hidden', outline: 'none', userSelect: 'none',
        WebkitUserSelect: 'none',
      }}>

      {/* ── Video ── */}
      <video
        ref={vidRef}
        src={src}
        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
        onLoadedMetadata={onLoadedMeta}
        onPlay={onPlay} onPause={onPause} onEnded={onEnded}
        onWaiting={onWaiting} onCanPlay={onCanPlay}
        onError={onError} onTimeUpdate={onTimeUpdate}
        onClick={!IS_TOUCH ? togglePlay : undefined}
        playsInline
        preload="metadata"
        webkit-playsinline="true"
        x-webkit-airplay="allow"
      />

      {/* ── Touch zones (mobile only) ── */}
      {IS_TOUCH && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', zIndex: 2 }}>
          <div style={{ flex: 1 }} onTouchEnd={(e) => onTouchZone(e, 'left')} />
          <div style={{ flex: 1 }} onTouchEnd={(e) => onTouchZone(e, 'right')} />
        </div>
      )}

      {/* ── Seek feedback ── */}
      <SeekFlash dir="rew" visible={rewFlash} />
      <SeekFlash dir="fwd" visible={fwdFlash} />

      {/* ── Buffering spinner ── */}
      {waitBuf && started && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 3 }}>
          <div style={{ width: 48, height: 48, border: `3px solid ${ACCENT}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'lms-spin 0.8s linear infinite' }} />
        </div>
      )}

      {/* ── Big play button ── */}
      {!started && !loading && (
        <div
          onClick={togglePlay}
          onTouchEnd={(e) => { e.preventDefault(); togglePlay(); setStarted(true); }}
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.35)', zIndex: 4, WebkitTapHighlightColor: 'transparent' }}>
          <div style={{ width: IS_TOUCH ? 80 : 72, height: IS_TOUCH ? 80 : 72, borderRadius: '50%', background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 14px ${ACCENT}33` }}>
            <Ic d={icons.play} size={IS_TOUCH ? 34 : 30} />
          </div>
        </div>
      )}

      {/* ── Controls overlay ── */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        background: ctrlVisible ? 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, transparent 55%)' : 'transparent',
        opacity: ctrlVisible ? 1 : 0, transition: 'opacity 0.3s',
        pointerEvents: ctrlVisible ? 'all' : 'none',
        zIndex: 5,
      }}>
        {/* Title */}
        {title && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 16px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)' }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, opacity: 0.9 }}>{title}</span>
          </div>
        )}

        {/* Bottom controls */}
        <div style={{ padding: IS_TOUCH ? '0 12px 16px' : '0 14px 12px' }}>
          {/* Seek bar */}
          <SeekBar current={current} duration={duration} buffered={buffered} onSeek={seekTo} />

          {/* Button row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: IS_TOUCH ? 0 : 2, marginTop: IS_TOUCH ? 4 : 6 }}>
            <Btn icon="rew"  onClick={skipRew}   size={IS_TOUCH ? 20 : 22} />
            <Btn icon={playing ? 'pause' : 'play'} onClick={togglePlay} size={IS_TOUCH ? 26 : 24} />
            <Btn icon="fwd"  onClick={skipFwd}   size={IS_TOUCH ? 20 : 22} />

            {/* Volume — hidden on iOS */}
            {!IS_IOS && (
              <>
                <Btn icon={muted || volume === 0 ? 'volMute' : 'volHigh'} onClick={toggleMute} />
                {!IS_TOUCH && (
                  <input type="range" min={0} max={1} step={0.02} value={muted ? 0 : volume}
                    onChange={(e) => setVol(Number(e.target.value))}
                    style={{ width: 64, accentColor: ACCENT, cursor: 'pointer', height: 4 }}
                  />
                )}
              </>
            )}

            {/* Time */}
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: IS_TOUCH ? 11 : 12, marginLeft: 6, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
              {fmt(current)} <span style={{ opacity: 0.5 }}>/</span> {fmt(duration)}
            </span>

            <div style={{ flex: 1 }} />

            {/* Speed */}
            <SpeedMenu speed={speed} onSpeed={changeSpeed} open={speedOpen} onToggle={() => setSpeedOpen(o => !o)} />

            {/* PiP — not on mobile */}
            {hasPip && !IS_TOUCH && (
              <Btn icon="pip" onClick={togglePiP} />
            )}

            {/* Fullscreen */}
            <Btn icon={fullscreen ? 'shrink' : 'expand'} onClick={toggleFullscreen} size={IS_TOUCH ? 20 : 22} />
          </div>
        </div>
      </div>
      <style>{`@keyframes lms-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
