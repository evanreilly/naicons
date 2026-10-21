const clamp = (value, limit = 64) => Math.max(-limit, Math.min(limit, value));
export function iconMotion(before, after, bounds) {
  const visible = (rect) =>
    rect && rect.bottom > bounds.top && rect.top < bounds.bottom;
  const wasVisible = visible(before),
    isVisible = visible(after);
  if (!wasVisible && !isVisible) return null;
  const x = before ? before.left - after.left : 0;
  const y = before ? before.top - after.top : 32;
  if (before && Math.abs(x) < 0.5 && Math.abs(y) < 0.5) return null;
  if (!wasVisible)
    return [
      { transform: `translate(${clamp(x)}px, ${clamp(y)}px)`, opacity: 0 },
      { transform: "translate(0, 0)", opacity: 1 },
    ];
  if (!isVisible)
    return [
      { transform: `translate(${x}px, ${y}px)`, opacity: 1 },
      {
        transform: `translate(${x - clamp(x)}px, ${y - clamp(y)}px)`,
        opacity: 0,
      },
    ];
  return [
    { transform: `translate(${x}px, ${y}px)`, opacity: 1 },
    { transform: "translate(0, 0)", opacity: 1 },
  ];
}
