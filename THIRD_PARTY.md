# Third-party data and software

- Map geometry: [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/),
  public domain, distributed via [world-atlas](https://github.com/topojson/world-atlas),
  simplified for TrainGame. Borders are illustrative, not authoritative.
- Population and coordinate sources are linked per city in `data/cities.json`.
  They include US Census Bureau, Statistics Canada, and INEGI data via the game's
  original inventory. Population vintages and geographic definitions vary.
- D3 modules: ISC license. TopoJSON client: ISC license.
- Build tools: esbuild (MIT), Sharp (Apache-2.0), fflate (MIT), Wrangler (MIT/Apache-2.0).
  Exact versions are recorded in `package-lock.json`; dependency packages contain
  their respective full license texts.
