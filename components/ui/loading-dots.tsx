'use client';

export function LoadingDots() {
  return (
    <span className="inline-flex items-end gap-0.5" aria-hidden="true">
      <span className="animate-bounce [animation-delay:-0.3s]">.</span>
      <span className="animate-bounce [animation-delay:-0.15s]">.</span>
      <span className="animate-bounce">.</span>
    </span>
  );
}
