# NA Icons

[Explore the collection at evans.bike/naicons](https://evans.bike/naicons).

544 transparent, 1024 × 1024 city icons made for [TrainGame](https://traingame.io),
with a searchable directory and interactive map. The default order is population,
smallest first. Search city names, states/provinces, countries, or icon subjects.
Click a card to enlarge its icon on the map. Download individual PNGs or the whole pack.

To my knowledge, there isn't an icon pack for North American cities that goes
much beyond the megacities. This collection covers every city above 100,000 in
the game's US, Canada, and Mexico inventory, plus five smaller cities for states
without a 100k city: Burlington, Vermont; Charleston, West Virginia; Cheyenne,
Wyoming; Portland, Maine; and Wilmington, Delaware.

## Coverage and sources

| Country | Icons | Population vintage |
| --- | ---: | --- |
| United States | 347 | 2024 estimates |
| Canada | 68 | 2025 estimates |
| Mexico | 129 | 2020 census |

This is the game's inventory, not a claim to cover every country in North America
or every possible municipal definition. City definitions differ by country;
these are not metro-area rankings. Each record in `data/cities.json` includes its
population source, coordinate source, geography type, and population year.
`data/provenance.json` records the export's source revision and generation model.

The original artwork was generated with **Nano Banana Pro**. Original PNGs are
in `icons/`. The build creates smaller lossless WebP previews without modifying
the originals. No image-generation prompts or account credentials are included.

The icons carry a **CC0 1.0 dedication for any rights I may hold**, without asserting
exclusive copyright in AI-generated artwork. See [ICONS-LICENSE.txt](ICONS-LICENSE.txt).
The website code uses the [MIT license](LICENSE).

The map uses public-domain Natural Earth boundaries via world-atlas countries-50m,
simplified in TrainGame. See [THIRD_PARTY.md](THIRD_PARTY.md).

## Development

Requires Node.js 22 or newer.

```sh
npm ci
npm test
npm run dev
```

Open http://localhost:8791/naicons. `npm run build` writes `dist/naicons`, including
the full PNG pack. All map data and assets are served locally; no map API key,
external font, analytics, or tile service is needed. Search and map controls use
JavaScript; the initial ascending gallery remains readable without JavaScript.

## Deployment

Pushes to `main` build and deploy the `naicons` Cloudflare Worker through GitHub
Actions. Configure the `CLOUDFLARE_API_TOKEN` repository secret with Workers Scripts
Edit permission for the account. Pull requests only test and build.

The existing evans.bike Worker forwards only `/naicons` and `/naicons/*` through
a service binding named `NAICONS` to this worker. This project has no DNS routes
or public workers.dev endpoint. It deploys independently of the personal site.
