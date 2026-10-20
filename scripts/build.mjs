import { readFile, writeFile, mkdir, rm, cp } from "node:fs/promises";
import { build } from "esbuild";
import sharp from "sharp";
import { zipSync, strToU8 } from "fflate";
import { card, filterCities } from "../src/catalog.js";
const cities = JSON.parse(await readFile("data/cities.json", "utf8"));
const out = "dist/naicons";
await rm("dist", { recursive: true, force: true });
await mkdir(`${out}/thumbs`, { recursive: true });
await cp("icons", `${out}/icons`, { recursive: true });
for (let i = 0; i < cities.length; i += 8)
  await Promise.all(
    cities
      .slice(i, i + 8)
      .map((c) =>
        sharp(`icons/${c.filename}`)
          .resize(256, 256)
          .webp({ lossless: true })
          .toFile(`${out}/thumbs/${c.id}.webp`),
      ),
  );
await build({
  entryPoints: ["src/app.js"],
  outfile: `${out}/app.js`,
  bundle: true,
  minify: true,
  format: "esm",
  target: "es2022",
});
await writeFile(
  `${out}/index.html`,
  (await readFile("src/index.html", "utf8")).replace(
    "__CARDS__",
    filterCities(cities).map(card).join(""),
  ),
);
for (const file of ["style.css", "favicon.svg"])
  await cp(`src/${file}`, `${out}/${file}`);
for (const file of ["cities.json", "provenance.json"])
  await cp(`data/${file}`, `${out}/${file}`);
const pack = {};
for (const c of cities)
  pack[`icons/${c.filename}`] = new Uint8Array(
    await readFile(`icons/${c.filename}`),
  );
for (const name of ["ICONS-LICENSE.txt", "README.md"])
  pack[name] = strToU8(await readFile(name, "utf8"));
for (const name of ["cities.json", "provenance.json"])
  pack[name] = strToU8(await readFile(`data/${name}`, "utf8"));
await writeFile(`${out}/naicons.zip`, zipSync(pack, { level: 0 }));
console.log(
  `Built ${cities.length} icons, searchable atlas, and download pack.`,
);
