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
  return `<li><button class="city-card" type="button" data-city="${city.id}" aria-label="Explore ${escape(city.name)}, ${escape(city.region)}; population ${formatPopulation(city.population)}" aria-pressed="false"><span class="card-top"><span>${city.country}</span>${city.exception ? '<span class="exception-dot" title="Below 100,000; included for state coverage">↳ Small-city exception</span>' : '<span class="card-arrow" aria-hidden="true">↗</span>'}</span><img src="/naicons/thumbs/${city.id}.webp" alt="" width="160" height="160" loading="lazy" decoding="async"><span class="card-name">${escape(city.name)}</span><span class="card-region">${escape(city.region)}</span><span class="card-population">${formatPopulation(city.population)} <span>people</span></span></button></li>`;
}
