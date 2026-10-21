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
      cardWidth: 46,
      cardHeight: 100,
    };
    let layout = packIcons(ids, options);
    for (const index of [4, 0, 86, 143, 543, 12]) {
      const selected = ids[index],
        original = layout.positions.get(selected);
      const anchor = { x: original.x + 23, y: original.y + 23 };
      layout = packIcons(ids, { ...options, selected, anchor });
      const pin = layout.positions.get(selected);
      assert.equal(pin.x + 46 / 2, anchor.x);
      assert.equal(pin.y + 46 / 2, anchor.y);
      for (const [id, point] of layout.positions) {
        if (id === selected) continue;
        assert.ok(
          point.x + 46 <= pin.x ||
            point.x >= pin.x + 46 ||
            point.y + 46 <= pin.y ||
            point.y >= pin.y + 100,
          `${id} overlaps ${selected}`,
        );
      }
    }
  });
}

test("downward expansion leaves preceding icons and adjacent columns in place", () => {
  const ids = Array.from({ length: 100 }, (_, i) => String(i));
  const options = {
    width: 360,
    cell: 46,
    gap: 7,
    cardWidth: 46,
    cardHeight: 100,
  };
  const before = packIcons(ids, options);
  const point = before.positions.get("10");
  const after = packIcons(ids, {
    ...options,
    selected: "10",
    anchor: { x: point.x + 23, y: point.y + 23 },
  });
  for (let i = 0; i < 16; i++)
    assert.deepEqual(
      {
        x: after.positions.get(String(i)).x,
        y: after.positions.get(String(i)).y,
      },
      before.positions.get(String(i)),
    );
});
