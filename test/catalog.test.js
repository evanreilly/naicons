import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { filterCities, card } from "../src/catalog.js";
import worker from "../src/worker.js";
const cities = JSON.parse(
  await readFile(new URL("../data/cities.json", import.meta.url)),
);
test("complete inventory has unique PNGs, valid coordinates, and five documented exceptions", async () => {
  assert.equal(cities.length, 544);
  assert.equal(new Set(cities.map((c) => c.id)).size, 544);
  assert.deepEqual(
    Object.fromEntries(
      ["US", "CA", "MX"].map((country) => [
        country,
        cities.filter((c) => c.country === country).length,
      ]),
    ),
    { US: 347, CA: 68, MX: 129 },
  );
  assert.equal(cities.filter((c) => c.exception).length, 5);
  for (const c of cities) {
    assert.ok(c.population > 0);
    assert.equal(c.exception, c.population < 100000);
    assert.ok(c.latitude >= 14 && c.latitude <= 72);
    assert.ok(c.longitude >= -180 && c.longitude <= -50);
    assert.match(c.filename, /^[a-z0-9-]+\.png$/);
    assert.ok(
      (await stat(new URL(`../icons/${c.filename}`, import.meta.url))).size > 0,
    );
    assert.match(c.populationSource, /^https?:\/\//);
  }
});
test("default smallest-first ordering and search across accented names, regions, and countries", () => {
  const sorted = filterCities(cities);
  assert.equal(sorted[0].name, "Burlington");
  assert.ok(
    sorted.every((c, i) => !i || sorted[i - 1].population <= c.population),
  );
  assert.equal(
    filterCities(cities, { query: "burlington vermont" })[0].name,
    "Burlington",
  );
  assert.ok(filterCities(cities, { query: "mexico" }).length >= 129);
  assert.ok(
    filterCities(cities, { query: "quebec", country: "CA" }).length > 0,
  );
  assert.equal(filterCities(cities, { query: "no such city xyz" }).length, 0);
  assert.equal(filterCities(cities, { country: "CA" }).length, 68);
  assert.equal(
    filterCities(cities, { sort: "population-desc" })[0].population,
    Math.max(...cities.map((c) => c.population)),
  );
});
test("card escapes display text", () => {
  assert.ok(
    card({ ...cities[0], name: '<script>"' }).includes("&lt;script&gt;&quot;"),
  );
});
test("worker only serves its own route and preserves asset status", async () => {
  const env = {
    ASSETS: {
      fetch: async () =>
        new Response("image", {
          status: 200,
          headers: { "Content-Type": "image/png" },
        }),
    },
  };
  assert.equal(
    (await worker.fetch(new Request("https://evans.bike/"), env)).status,
    404,
  );
  assert.equal(
    (await worker.fetch(new Request("https://evans.bike/naicons-other"), env))
      .status,
    404,
  );
  assert.equal(
    (
      await worker.fetch(
        new Request("https://evans.bike/naicons", { method: "POST" }),
        env,
      )
    ).status,
    405,
  );
  const response = await worker.fetch(
    new Request("https://evans.bike/naicons/icons/a.png"),
    env,
  );
  assert.equal(response.headers.get("Content-Type"), "image/png");
  assert.equal(await response.text(), "image");
});
