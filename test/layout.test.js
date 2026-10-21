import test from "node:test";
import assert from "node:assert/strict";
import { packIcons } from "../src/layout.js";
for (const width of [360, 1184]) {
  test(`selection remains anchored at row edges and deep rows (${width}px)`, () => {
    const ids = Array.from({ length: 544 }, (_, i) => String(i));
    const options = {
      width,
      cell: 46,
      gap: 7,
      cardWidth: 99,
      cardHeight: 132,
      orbSize: 84,
    };
    let layout = packIcons(ids, options);
    for (const index of [4, 0, 86, 143, 543, 12]) {
      const selected = ids[index],
        original = layout.positions.get(selected);
      const anchor = { x: original.x + 23, y: original.y + 23 };
      layout = packIcons(ids, { ...options, selected, anchor });
      const pin = layout.positions.get(selected);
      assert.equal(pin.x + 99 / 2, anchor.x);
      assert.equal(pin.y + 4 + 84 / 2, anchor.y);
      for (const [id, point] of layout.positions) {
        if (id === selected) continue;
        assert.ok(
          point.x + 46 <= pin.x ||
            point.x >= pin.x + 99 ||
            point.y + 46 <= pin.y ||
            point.y >= pin.y + 132,
          `${id} overlaps ${selected}`,
        );
      }
    }
  });
}
