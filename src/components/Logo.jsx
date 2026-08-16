/** FitTrack mark — mirrored-gradient Möbius loop (spec/page-layout.json app.logo) */

export default function Logo({ size = 40, rounded = false, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      style={rounded ? { borderRadius: "22%", background: "#2a2a38" } : undefined}
    >
      <defs>
        <linearGradient id="fitTrackGradA" x1="0" y1="1" x2="0.5" y2="0">
          <stop offset="0" stopColor="#e5484d" />
          <stop offset="0.5" stopColor="#f2a341" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="fitTrackGradB" x1="0.5" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="0.5" stopColor="#3fb950" />
          <stop offset="1" stopColor="#e5484d" />
        </linearGradient>
      </defs>
      <path d="M28 50 C28 34 44 34 50 50" fill="none" stroke="url(#fitTrackGradA)" strokeWidth="11" strokeLinecap="round" />
      <path d="M50 50 C56 66 72 66 72 50" fill="none" stroke="url(#fitTrackGradB)" strokeWidth="11" strokeLinecap="round" />
      <path d="M72 50 C72 34 56 34 50 50" fill="none" stroke="url(#fitTrackGradA)" strokeWidth="11" strokeLinecap="round" />
      <path d="M50 50 C44 66 28 66 28 50" fill="none" stroke="url(#fitTrackGradB)" strokeWidth="11" strokeLinecap="round" />
    </svg>
  );
}
