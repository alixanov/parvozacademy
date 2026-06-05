/**
 * Parvoz Academy logo mark — SVG recreation of the brand icon:
 * open book (bottom) + stylised wings (middle) + graduation cap (top).
 *
 * color prop: pass 'white' for dark backgrounds, 'primary' colors for light.
 */
export default function LogoMark({ size = 22, color = '#ffffff' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Open book – left page ── */}
      <path
        d="M18 23 L5 28 L5 32 L18 27 Z"
        fill={color}
        fillOpacity="0.85"
      />
      {/* ── Open book – right page ── */}
      <path
        d="M18 23 L31 28 L31 32 L18 27 Z"
        fill={color}
        fillOpacity="0.65"
      />
      {/* ── Book spine highlight ── */}
      <path
        d="M18 23 L18 27"
        stroke={color}
        strokeWidth="0.8"
        strokeOpacity="0.5"
      />

      {/* ── Left wing / leaf ── */}
      <path
        d="M18 23
           C16 19 11 17 12 12
           C13 15 17 18 18 23 Z"
        fill={color}
        fillOpacity="0.72"
      />
      {/* ── Right wing / leaf ── */}
      <path
        d="M18 23
           C20 19 25 17 24 12
           C23 15 19 18 18 23 Z"
        fill={color}
        fillOpacity="0.72"
      />

      {/* ── Graduation cap – board ── */}
      <polygon
        points="18,5 31,10.5 18,14 5,10.5"
        fill={color}
      />
      {/* ── Cap top button ── */}
      <rect
        x="16.5" y="2.5"
        width="3" height="4"
        rx="0.75"
        fill={color}
        fillOpacity="0.9"
      />
      {/* ── Tassel cord ── */}
      <path
        d="M31 10.5 L31 17"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeOpacity="0.82"
      />
      {/* ── Tassel end ── */}
      <circle
        cx="31" cy="18.5"
        r="1.6"
        fill={color}
        fillOpacity="0.82"
      />
    </svg>
  );
}
