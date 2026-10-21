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

## Terrain contours

Derived from [Mapzen Terrain Tiles on AWS](https://registry.opendata.aws/terrain-tiles/),
accessed October 20, 2026. The DEM is decoded from Terrarium PNGs, smoothed,
downsampled and simplified to create illustrative contours. These modifications
are our own and are not endorsed by the source agencies. See the committed
`data/terrain-provenance.json` and `scripts/generate-terrain.py` for processing details.
This terrain data is separate from the CC0 icon artwork and MIT site code.

- USGS 3DEP (formerly NED), GMTED2010 and SRTM terrain data courtesy of the U.S. Geological Survey.
- ETOPO1: DOC/NOAA/NESDIS/NCEI, National Centers for Environmental Information, NESDIS, NOAA, U.S. Department of Commerce. US government material is not subject to copyright protection in the United States.
- Canada: Contains information licensed under the [Open Government Licence – Canada](https://open.canada.ca/en/open-government-licence-canada).
- Mexico: Source: INEGI, Continental relief, 2016.
- ArcticDEM: DEMs were created from DigitalGlobe, Inc. imagery and funded under National Science Foundation awards 1043681, 1559691, and 1542736.

[Full source attribution, licenses, and usage conditions](https://github.com/tilezen/joerd/blob/master/docs/attribution.md).
