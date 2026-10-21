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
  for (let i = 0; i < 16; i++) {
    const actual = after.positions.get(String(i));
    const original = before.positions.get(String(i));
    assert.ok(Math.abs(actual.x - original.x) < 0.001);
    assert.equal(actual.y, original.y);
  }
});

for (const width of [292, 332, 347, 362, 402]) {
  test(`mobile rows justify evenly with equal side margins at ${width}px`, () => {
    const ids = Array.from({ length: 100 }, (_, i) => String(i));
    const { positions } = packIcons(ids, { width, cell: 42, gap: 6 });
    const row = [...positions.values()].filter((p) => p.y === 0);
    assert.ok(Math.abs(row[0].x - (width - row.at(-1).x - 42)) < 0.001);
    const step = row[1].x - row[0].x;
    for (let i = 1; i < row.length; i++)
      assert.ok(Math.abs(row[i].x - row[i - 1].x - step) < 0.001);
    const nextRow = [...positions.values()].filter((p) => p.y === 48);
    row.forEach((point, i) => assert.equal(nextRow[i].x, point.x));
  });
}
