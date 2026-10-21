// Pack around the selected artwork's center, not around its position in the order.
export function packIcons(
  ids,
  { width, cell, gap, selected, anchor, cardWidth, cardHeight, orbSize },
) {
  const gutter = 28,
    step = cell + gap;
  const columns = Math.max(1, Math.floor((width - gutter * 2 + gap) / step));
  const positions = new Map();
  let reserved;
  if (ids.includes(selected)) {
    const index = ids.indexOf(selected);
    const center = anchor || {
      x: gutter + (index % columns) * step + cell / 2,
      y: gutter + Math.floor(index / columns) * step + cell / 2,
    };
    reserved = {
      x: center.x - cardWidth / 2,
      y: center.y - orbSize / 2 - 4,
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
        x: gutter + (slot % columns) * step,
        y: gutter + Math.floor(slot / columns) * step,
      };
      slot++;
    } while (
      reserved &&
      point.x < reserved.x + reserved.width + gap &&
      point.x + cell + gap > reserved.x &&
      point.y < reserved.y + reserved.height + gap &&
      point.y + cell + gap > reserved.y
    );
    positions.set(id, point);
    bottom = Math.max(bottom, point.y + cell);
  }
  return { positions, height: bottom + gutter };
}
