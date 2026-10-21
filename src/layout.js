// Keep the selected circle in place and reserve only the space below it.
export function packIcons(
  ids,
  { width, cell, gap, selected, anchor, cardWidth, cardHeight },
) {
  const gutter = 8,
    step = cell + gap;
  const columns = Math.max(1, Math.floor((width - gutter * 2 + gap) / step));
  // Share leftover width between columns instead of leaving it at the right edge.
  const columnStep =
    columns > 1 ? (width - gutter * 2 - cell) / (columns - 1) : 0;
  const left = columns > 1 ? gutter : (width - cell) / 2;
  const positions = new Map();
  let reserved;
  if (ids.includes(selected)) {
    const index = ids.indexOf(selected);
    const center = anchor || {
      x: left + (index % columns) * columnStep + cell / 2,
      y: Math.floor(index / columns) * step + cell / 2,
    };
    reserved = {
      x: center.x - cardWidth / 2,
      y: center.y - cell / 2,
      width: cardWidth,
      height: cardHeight,
    };
    positions.set(selected, reserved);
  }
  let slot = 0,
    bottom = reserved ? reserved.y + reserved.height : 0;
  for (const id of ids) {
    if (id === selected) continue;
    let point;
    do {
      point = {
        x: left + (slot % columns) * columnStep,
        y: Math.floor(slot / columns) * step,
      };
      slot++;
    } while (
      reserved &&
      point.x < reserved.x + reserved.width + gap - 0.01 &&
      point.x + cell + gap > reserved.x + 0.01 &&
      point.y < reserved.y + reserved.height + gap &&
      point.y + cell + gap > reserved.y
    );
    positions.set(id, point);
    bottom = Math.max(bottom, point.y + cell);
  }
  return { positions, height: bottom + gutter };
}
