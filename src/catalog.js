export const countries = { US: "United States", CA: "Canada", MX: "Mexico" };
export const normalize = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function filterCities(
  cities,
  { query = "", country = "all", sort = "population-asc" } = {},
) {
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  return cities
    .filter((city) => {
      if (country !== "all" && city.country !== country) return false;
      const text = normalize(
        `${city.name} ${city.region} ${countries[city.country]} ${city.country} ${city.concept}`,
      );
      return words.every((word) => text.includes(word));
    })
    .sort(
      (a, b) =>
        (sort === "name"
          ? a.name.localeCompare(b.name)
          : sort === "population-desc"
            ? b.population - a.population
            : a.population - b.population) || a.name.localeCompare(b.name),
    );
}
export const formatPopulation = (value) =>
  new Intl.NumberFormat("en-US").format(value);
export const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
export function card(city) {
  const label = `${city.name}, ${city.region} · ${formatPopulation(city.population)}`;
  return `<li><button class="city-card" type="button" data-city="${city.id}" title="${escape(label)}" aria-label="Explore ${escape(label)}" aria-pressed="false"><span class="icon-orb"><img src="/naicons/thumbs/${city.id}.webp" alt="" width="64" height="64" loading="lazy" decoding="async"></span><span class="card-caption"><span class="card-name">${escape(city.name)}</span><span class="card-population">${formatPopulation(city.population)}</span></span></button></li>`;
}

const slugify = (value) =>
  normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const linkIndexes = new WeakMap();
function linkIndex(cities) {
  if (linkIndexes.has(cities)) return linkIndexes.get(cities);
  const groups = new Map(),
    slugs = new Map(),
    links = new Map();
  for (const city of cities) {
    const name = slugify(city.name);
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(city);
  }
  for (const city of cities) {
    const name = slugify(city.name),
      region = slugify(city.region),
      duplicates = groups.get(name);
    let slug = name;
    if (duplicates.length > 1) {
      slug += `-${region}`;
      if (
        duplicates.filter((candidate) => slugify(candidate.region) === region)
          .length > 1
      )
        slug += `-${city.country.toLowerCase()}`;
    }
    slugs.set(city.id, slug);
    links.set(slug, city);
    links.set(city.id, city);
    links.set(slugify(`${city.name}-${city.region}-${city.country}`), city);
  }
  const index = { slugs, links };
  linkIndexes.set(cities, index);
  return index;
}
export const citySlug = (city, cities) =>
  cities ? linkIndex(cities).slugs.get(city.id) : slugify(city.name);
export const cityFromLink = (cities, value) =>
  linkIndex(cities).links.get(value);
