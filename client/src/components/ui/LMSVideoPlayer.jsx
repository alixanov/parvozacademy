/**
 * PARVOZ LMS — LMSVideoPlayer
 * World-class custom player for T3-hosted private video files.
 *
 * Features: presigned URL · play/pause · seek bar + buffer · volume slider ·
 * playback speed · fullscreen · picture-in-picture · auto-hide controls ·
 * keyboard shortcuts · progress persistence · mobile touch gestures ·
 * seek feedback overlay · error + retry · buffering spinner
 */
import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';

/* ── accent colour ──────────────────────────────────────────────────────── */
const ACCENT = '#7C3AED';
const DIM    = 'rgba(0,0,0,0.55)';

/* ── helpers ─────────────────────────────────────────────────────────────── */
function fmt(sec) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const mm = String(m).padStart(h ? 2 : 1, '0');
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function storageKey(url) {
  return `lms_video_progress_${btoa(url).slice(0, 40)}`;
}

async function fetchPresigned(rawUrl) {
  try {
    const { store } = await import('../../app/store.js');
    const token = store.getState().auth?.accessToken;
    const isT3 = rawUrl.includes('t3.storage.dev') || rawUrl.includes('tigris');
    if (!isT3) return rawUrl;
    const res = await fetch(`/api/v1/uploads/presign?key=${encodeURIComponent(rawUrl)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return rawUrl;
    const json = await res.json();
    return json?.data?.url ?? rawUrl;
  } catch {
    return rawUrl;
  }
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

/* ── icon components ─────────────────────────────────────────────────────── */
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
  pip:     'M21 9V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2h4m7 3v-8a1 1 0 011-1h6a1 1 0 011 1v8a1 1 0 01-1 1h-6a1 1 0 01-1-1z',
  speed:   'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  fwd:     'M5 4l10 8-10 8V4zM19 5v14',
  rew:     'M19 20L9 12l10-8v16zM5 19V5',
  replay:  'M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15',
};

/* ── SeekBar ─────────────────────────────────────────────────────────────── */
function SeekBar({ current, duration, buffered, onSeek }) {
  const ref   = useRef(null);
  const [hover, setHover] = useState(null); // { x, time }

  const pct = duration ? (current / duration) * 100 : 0;
  const buf = duration && buffered ? (buffered / duration) * 100 : 0;

  const pick = useCallback((e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    return ratio;
  }, []);

  const onDown = (e) => {
    e.preventDefault();
    const r = pick(e);
    if (r != null) onSeek(r * duration);
    const onMove = (me) => { const r2 = pick(me); if (r2 != null) onSeek(r2 * duration); };
    const onUp   = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const onHover = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || !duration) return;
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHover({ x: e.clientX - rect.left, time: ratio * duration });
  };

  return (
    <div ref={ref} onMouseDown={onDown} onMouseMove={onHover} onMouseLeave={() => setHover(null)}
      style={{ position: 'relative', height: 18, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
      {/* Track */}
      <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)', position: 'relative', overflow: 'hidden' }}>
        {/* Buffer */}
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${buf}%`, background: 'rgba(255,255,255,0.28)', borderRadius: 2, transition: 'width 0.3s' }} />
        {/* Progress */}
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: ACCENT, borderRadius: 2 }} />
      </div>
      {/* Thumb */}
      <div style={{ position: 'absolute', left: `calc(${pct}% - 7px)`, width: 14, height: 14, borderRadius: '50%', background: '#fff', boxShadow: '0 0 0 2px ' + ACCENT, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      {/* Hover tooltip */}
      {hover && (
        <div style={{ position: 'absolute', bottom: 22, left: Math.max(20, Math.min((ref.current?.offsetWidth ?? 300) - 30, hover.x - 20)), background: 'rgba(0,0,0,0.82)', color: '#fff', fontSize: 11, padding: '3px 7px', borderRadius: 4, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          {fmt(hover.time)}
        </div>
      )}
    </div>
  );
}

/* ── VolumeSlider ────────────────────────────────────────────────────────── */
function VolumeSlider({ volume, onVolume }) {
  return (
    <input type="range" min={0} max={1} step={0.02} value={volume}
      onChange={(e) => onVolume(Number(e.target.value))}
      style={{ width: 64, accentColor: ACCENT, cursor: 'pointer', height: 4 }}
    />
  );
}

/* ── SpeedMenu ───────────────────────────────────────────────────────────── */
function SpeedMenu({ speed, onSpeed, open, onToggle }) {
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={onToggle} title="Tezlik"
        style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: '4px 6px', borderRadius: 6, background: open ? 'rgba(255,255,255,0.15)' : 'transparent', letterSpacing: 0.5 }}>
        {speed}×
      </button>
      {open && (
        <div style={{ position: 'absolute', bottom: 36, right: 0, background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, overflow: 'hidden', minWidth: 72 }}>
          {SPEEDS.map((s) => (
            <button key={s} onClick={() => { onSpeed(s); onToggle(); }}
              style={{ display: 'block', width: '100%', background: s === speed ? ACCENT : 'transparent', color: '#fff', border: 'none', cursor: 'pointer', padding: '8px 14px', fontSize: 13, textAlign: 'center', fontWeight: s === speed ? 700 : 400 }}>
              {s}×
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── IconBtn ─────────────────────────────────────────────────────────────── */
function Btn({ icon, title, onClick, size = 22 }) {
  return (
    <button onClick={onClick} title={title}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, transition: 'background 0.15s' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
      <Ic d={icons[icon]} size={size} />
    </button>
  );
}

/* ── SeekFeedback ────────────────────────────────────────────────────────── */
function SeekFeedback({ dir, visible }) {
  const side = dir === 'fwd' ? 'right' : 'left';
  return (
    <div style={{
      position: 'absolute', top: '50%', [side]: 48, transform: 'translateY(-50%)',
      background: 'rgba(0,0,0,0.55)', borderRadius: 40, padding: '10px 18px',
      color: '#fff', fontSize: 14, fontWeight: 700, pointerEvents: 'none',
      opacity: visible ? 1 : 0, transition: 'opacity 0.25s', display: 'flex', alignItems: 'center', gap: 6,
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
  const vidRef     = useRef(null);
  const wrapRef    = useRef(null);
  const rafRef     = useRef(null);
  const hideTimer  = useRef(null);
  const presignRef = useRef(null); // setTimeout for presign refresh

  const [src,        setSrc]        = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [playing,    setPlaying]    = useState(false);
  const [current,    setCurrent]    = useState(0);
  const [duration,   setDuration]   = useState(0);
  const [buffered,   setBuffered]   = useState(0);
  const [volume,     setVolume]     = useState(1);
  const [muted,      setMuted]      = useState(false);
  const [speed,      setSpeed]      = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [showCtrl,   setShowCtrl]   = useState(true);
  const [speedOpen,  setSpeedOpen]  = useState(false);
  const [seeking,    setSeeking]    = useState(false);
  const [hasPip,     setHasPip]     = useState(false);
  const [fwdFlash,   setFwdFlash]   = useState(false);
  const [rewFlash,   setRewFlash]   = useState(false);
  const [waitBuf,    setWaitBuf]    = useState(false);
  const [started,    setStarted]    = useState(false);

  /* ── Presigned URL ── */
  const loadPresign = useCallback(async (rawUrl) => {
    setLoading(true);
    setError(null);
    try {
      const signed = await fetchPresigned(rawUrl);
      setSrc(signed);
      // Refresh presign 5 min before 1-hour expiry
      clearTimeout(presignRef.current);
      presignRef.current = setTimeout(() => loadPresign(rawUrl), 55 * 60 * 1000);
    } catch (e) {
      setError('Videoni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!url) return;
    loadPresign(url);
    return () => {
      clearTimeout(presignRef.current);
    };
  }, [url, loadPresign]);

  /* ── Resume saved progress ── */
  useEffect(() => {
    if (!src || !url) return;
    const saved = parseFloat(localStorage.getItem(storageKey(url)) || '0');
    if (saved > 5 && vidRef.current) {
      vidRef.current.currentTime = saved;
    }
  }, [src, url]);

  /* ── RAF loop for smooth progress ── */
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
    setHasPip('pictureInPictureEnabled' in document);
  };

  const onPlay = () => {
    setPlaying(true);
    setWaitBuf(false);
    rafRef.current = requestAnimationFrame(tick);
  };
  const onPause = () => {
    setPlaying(false);
    cancelAnimationFrame(rafRef.current);
  };
  const onWaiting = () => setWaitBuf(true);
  const onCanPlay = () => setWaitBuf(false);
  const onEnded   = () => { setPlaying(false); cancelAnimationFrame(rafRef.current); };
  const onError   = () => { setError('Video yuklanmadi. Qayta urinib ko\'ring.'); setLoading(false); };

  const onTimeUpdate = () => {
    if (!vidRef.current || !url) return;
    localStorage.setItem(storageKey(url), String(Math.floor(vidRef.current.currentTime)));
    onProgress?.(vidRef.current.currentTime, vidRef.current.duration);
  };

  /* ── Controls ── */
  const togglePlay = useCallback(() => {
    const v = vidRef.current;
    if (!v) return;
    if (v.paused) v.play();
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
    setVolume(v);
    setMuted(v === 0);
    if (vidRef.current) { vidRef.current.volume = v; vidRef.current.muted = v === 0; }
  }, []);

  const toggleMute = useCallback(() => {
    const v = vidRef.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    setMuted(next);
    if (!next && volume === 0) { setVolume(0.5); v.volume = 0.5; }
  }, [volume]);

  const changeSpeed = useCallback((s) => {
    setSpeed(s);
    if (vidRef.current) vidRef.current.playbackRate = s;
  }, []);

  const toggleFullscreen = useCallback(() => {
    const w = wrapRef.current;
    if (!w) return;
    if (!document.fullscreenElement) w.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  const togglePiP = useCallback(async () => {
    if (document.pictureInPictureElement) await document.exitPictureInPicture();
    else await vidRef.current?.requestPictureInPicture?.();
  }, []);

  /* ── Fullscreen change ── */
  useEffect(() => {
    const h = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  /* ── Auto-hide controls ── */
  const showControls = useCallback(() => {
    setShowCtrl(true);
    clearTimeout(hideTimer.current);
    if (playing) hideTimer.current = setTimeout(() => setShowCtrl(false), 3000);
  }, [playing]);

  useEffect(() => {
    clearTimeout(hideTimer.current);
    if (!playing) { setShowCtrl(true); return; }
    hideTimer.current = setTimeout(() => setShowCtrl(false), 3000);
    return () => clearTimeout(hideTimer.current);
  }, [playing]);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e) => {
      if (!wrapRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.code) {
        case 'Space': e.preventDefault(); togglePlay(); showControls(); break;
        case 'KeyM':  toggleMute(); showControls(); break;
        case 'KeyF':  toggleFullscreen(); break;
        case 'ArrowRight': e.preventDefault(); skipFwd(); showControls(); break;
        case 'ArrowLeft':  e.preventDefault(); skipRew(); showControls(); break;
        case 'ArrowUp':    e.preventDefault(); setVol(Math.min(1, volume + 0.1)); showControls(); break;
        case 'ArrowDown':  e.preventDefault(); setVol(Math.max(0, volume - 0.1)); showControls(); break;
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
  }, []);

  /* ── Touch: double-tap seek ── */
  const tapRef = useRef({ last: 0, side: null });
  const onTap = (e, side) => {
    const now = Date.now();
    if (now - tapRef.current.last < 300 && tapRef.current.side === side) {
      if (side === 'right') skipFwd();
      else skipRew();
    } else {
      showControls();
    }
    tapRef.current = { last: now, side };
  };

  /* ═══════════════════ Render ══════════════════════════════════════════ */

  /* Loading state */
  if (loading && !src) return (
    <div style={{ width: '100%', aspectRatio: '16/9', background: '#0a0a14', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ width: 44, height: 44, border: `3px solid ${ACCENT}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'lms-spin 0.8s linear infinite' }} />
      <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>Video yuklanmoqda…</span>
      <style>{`@keyframes lms-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* Error state */
  if (error) return (
    <div style={{ width: '100%', aspectRatio: '16/9', background: '#0a0a14', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Ic d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" size={40} color="#EF4444" />
      <span style={{ color: '#EF4444', fontSize: 14 }}>{error}</span>
      <button onClick={() => loadPresign(url)}
        style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
        Qayta urinish
      </button>
    </div>
  );

  const ctrlVisible = showCtrl || !playing || speedOpen;

  return (
    <div ref={wrapRef} tabIndex={0}
      onMouseMove={showControls}
      onMouseLeave={() => { if (playing) setShowCtrl(false); }}
      style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: fullscreen ? 0 : 14, overflow: 'hidden', outline: 'none', userSelect: 'none' }}>

      {/* ── Video element ── */}
      <video
        ref={vidRef}
        src={src}
        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
        onLoadedMetadata={onLoadedMeta}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onWaiting={onWaiting}
        onCanPlay={onCanPlay}
        onError={onError}
        onTimeUpdate={onTimeUpdate}
        onClick={togglePlay}
        playsInline
        preload="metadata"
      />

      {/* ── Touch zones ── */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
        <div style={{ flex: 1, pointerEvents: 'all' }} onTouchEnd={(e) => onTap(e, 'left')} />
        <div style={{ flex: 1, pointerEvents: 'all' }} onTouchEnd={(e) => onTap(e, 'right')} />
      </div>

      {/* ── Seek feedback ── */}
      <SeekFeedback dir="rew" visible={rewFlash} />
      <SeekFeedback dir="fwd" visible={fwdFlash} />

      {/* ── Buffering spinner ── */}
      {(waitBuf && started) && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: 48, height: 48, border: `3px solid ${ACCENT}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'lms-spin 0.8s linear infinite' }} />
          <style>{`@keyframes lms-spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* ── Big play button (before first play) ── */}
      {!started && !loading && (
        <div onClick={togglePlay}
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.35)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 12px ${ACCENT}33` }}>
            <Ic d={icons.play} size={30} />
          </div>
        </div>
      )}

      {/* ── Controls overlay ── */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        background: ctrlVisible ? 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 50%)' : 'transparent',
        opacity: ctrlVisible ? 1 : 0, transition: 'opacity 0.3s, background 0.3s',
        pointerEvents: ctrlVisible ? 'all' : 'none',
      }}>
        {/* Title bar */}
        {title && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 18px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)' }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, opacity: 0.9 }}>{title}</span>
          </div>
        )}

        {/* Bottom controls */}
        <div style={{ padding: '0 14px 12px' }}>
          {/* Seek bar */}
          <SeekBar current={current} duration={duration} buffered={buffered} onSeek={seekTo} />

          {/* Buttons row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 6 }}>
            {/* Rew */}
            <Btn icon="rew" title="−10s (←)" onClick={skipRew} />
            {/* Play/Pause */}
            <Btn icon={playing ? 'pause' : 'play'} title={playing ? 'Pause (Space)' : 'Play (Space)'} onClick={togglePlay} size={24} />
            {/* Fwd */}
            <Btn icon="fwd" title="+10s (→)" onClick={skipFwd} />

            {/* Volume */}
            <Btn icon={muted || volume === 0 ? 'volMute' : 'volHigh'} title="Ovoz (M)" onClick={toggleMute} />
            <VolumeSlider volume={muted ? 0 : volume} onVolume={setVol} />

            {/* Time */}
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginLeft: 6, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
              {fmt(current)} <span style={{ opacity: 0.5 }}>/</span> {fmt(duration)}
            </span>

            <div style={{ flex: 1 }} />

            {/* Speed */}
            <SpeedMenu speed={speed} onSpeed={changeSpeed} open={speedOpen} onToggle={() => setSpeedOpen(o => !o)} />

            {/* PiP */}
            {hasPip && <Btn icon="pip" title="Picture-in-Picture" onClick={togglePiP} />}

            {/* Fullscreen */}
            <Btn icon={fullscreen ? 'shrink' : 'expand'} title={`Toʻliq ekran (F) ${fullscreen ? '— chiqish' : ''}`} onClick={toggleFullscreen} />
          </div>
        </div>
      </div>

      {/* ── Keyboard hint (shown once on focus) ── */}
      <div
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${ACCENT}, transparent)`, opacity: 0.6 }}
      />
    </div>
  );
}
