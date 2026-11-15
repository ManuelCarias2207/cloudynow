/** Inline SVG icons; decorative by default (aria-hidden), the parent control carries the name. */
export function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

export function LocateIcon({ className }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className={className}>
      <circle cx="8" cy="8" r="4.5" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2" />
    </svg>
  );
}
