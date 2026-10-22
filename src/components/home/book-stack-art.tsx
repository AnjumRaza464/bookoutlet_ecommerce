/** Decorative original illustration: a stack of textbooks with a graduation cap. */
export function BookStackArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 360" className={className} aria-hidden="true">
      <ellipse cx="210" cy="330" rx="170" ry="16" fill="#000" opacity="0.25" />
      <g>
        <rect x="70" y="262" width="280" height="56" rx="6" fill="#c08a43" />
        <rect x="70" y="262" width="22" height="56" fill="#8a5a35" />
        <rect x="110" y="280" width="190" height="6" rx="3" fill="#f8f3ec" opacity="0.8" />
        <rect x="110" y="294" width="120" height="5" rx="2.5" fill="#f8f3ec" opacity="0.5" />
      </g>
      <g transform="rotate(-4 210 230)">
        <rect x="90" y="206" width="250" height="54" rx="6" fill="#f8f3ec" />
        <rect x="90" y="206" width="20" height="54" fill="#e0b56a" />
        <rect x="128" y="222" width="160" height="6" rx="3" fill="#4a2c1a" opacity="0.8" />
        <rect x="128" y="236" width="100" height="5" rx="2.5" fill="#4a2c1a" opacity="0.4" />
      </g>
      <g transform="rotate(3 210 175)">
        <rect x="80" y="150" width="262" height="54" rx="6" fill="#6b4226" />
        <rect x="80" y="150" width="22" height="54" fill="#3b2416" />
        <rect x="120" y="166" width="170" height="6" rx="3" fill="#e0b56a" />
        <rect x="120" y="180" width="110" height="5" rx="2.5" fill="#e0b56a" opacity="0.6" />
      </g>
      <g transform="rotate(-2 210 120)">
        <rect x="104" y="98" width="226" height="50" rx="6" fill="#15100d" />
        <rect x="104" y="98" width="20" height="50" fill="#c08a43" />
        <rect x="140" y="113" width="140" height="6" rx="3" fill="#f8f3ec" opacity="0.85" />
        <rect x="140" y="126" width="90" height="5" rx="2.5" fill="#f8f3ec" opacity="0.5" />
      </g>
      <g>
        <path d="M150 74 L230 44 L310 74 L230 104 Z" fill="#15100d" />
        <path d="M185 88 L185 112 Q230 132 275 112 L275 88 L230 104 Z" fill="#2a1f19" />
        <path d="M296 80 L296 116" stroke="#e0b56a" strokeWidth="3" />
        <circle cx="296" cy="120" r="6" fill="#e0b56a" />
      </g>
      <g fill="#e0b56a">
        <circle cx="60" cy="90" r="4" />
        <circle cx="370" cy="150" r="3" />
        <circle cx="345" cy="60" r="5" opacity="0.7" />
        <circle cx="45" cy="210" r="3" opacity="0.7" />
      </g>
    </svg>
  );
}
