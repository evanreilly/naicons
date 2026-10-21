import test from "node:test";
import assert from "node:assert/strict";
import { iconMotion } from "../src/motion.js";
const bounds = { top: 400, bottom: 800 };
const rect = (top, left = 0) => ({ top, bottom: top + 46, left });
test("population reversal brings distant rows in with a short visible slide", () => {
  const frames = iconMotion(rect(12000, 100), rect(450), bounds);
  assert.deepEqual(frames[0], {
    transform: "translate(64px, 64px)",
    opacity: 0,
  });
  assert.equal(frames[1].opacity, 1);
});
test("outgoing icons fade near their original position instead of crossing thousands of pixels", () => {
  const frames = iconMotion(rect(450), rect(12000), bounds);
  assert.equal(frames[0].transform, "translate(0px, -11550px)");
  assert.equal(frames[1].transform, "translate(0px, -11486px)");
  assert.equal(frames[1].opacity, 0);
});
test("visible country-filter reorders retain their full position tween", () => {
  assert.deepEqual(iconMotion(rect(450, 50), rect(600, 150), bounds), [
    { transform: "translate(-100px, -150px)", opacity: 1 },
    { transform: "translate(0, 0)", opacity: 1 },
  ]);
  assert.equal(iconMotion(rect(12000), rect(13000), bounds), null);
});
