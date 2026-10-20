import { geoConicEqualArea, geoPath, geoGraticule10 } from "d3-geo";
import { select } from "d3-selection";
import { zoom, zoomIdentity } from "d3-zoom";
import "d3-transition";
import { feature } from "topojson-client";
import cities from "../data/cities.json";
import topology from "../data/north-america.topo.json";
import { filterCities, card, countries, formatPopulation } from "./catalog.js";
const $ = (id) => document.getElementById(id);
const byId = new Map(cities.map((c) => [c.id, c]));
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
let selected,
  visible = cities,
  country = "all",
  width = 800,
  height = 565,
  current = zoomIdentity;
const land = feature(topology, topology.objects.countries);
const projection = geoConicEqualArea()
  .rotate([100, 0])
  .center([0, 45])
  .parallels([20, 60]);
const path = geoPath(projection),
  svg = select("#map");
const landPaths = select("#countries")
  .selectAll("path")
  .data(land.features)
  .join("path")
  .attr("class", "country-shape");
const grid = select("#graticule")
  .append("path")
  .datum(geoGraticule10())
  .attr("class", "graticule-path");
const dots = select("#city-points")
  .selectAll("circle")
  .data(cities)
  .join("circle")
  .attr("class", "city-point")
  .attr("r", 2.5)
  .on("click", (event, city) => {
    event.stopPropagation();
    choose(city, { fly: true });
  });
dots
  .append("title")
  .text((c) => `${c.name}, ${c.region} · ${formatPopulation(c.population)}`);
function placeMarker() {
  if (!selected) return;
  const [x, y] = current.apply(
    projection([selected.longitude, selected.latitude]),
  );
  select("#selection-marker").attr("transform", `translate(${x},${y})`);
  dots.attr("r", (c) =>
    c.id === selected.id ? 4 / current.k : 2.5 / current.k,
  );
}
const behavior = zoom()
  .scaleExtent([1, 10])
  .filter((e) => (e.type === "wheel" ? e.ctrlKey || e.metaKey : !e.button))
  .on("zoom", (e) => {
    current = e.transform;
    select("#map-transform").attr("transform", current);
    placeMarker();
  });
svg.call(behavior).on("dblclick.zoom", null);
function move(transform) {
  svg.interrupt();
  if (reduced) svg.call(behavior.transform, transform);
  else svg.transition().duration(500).call(behavior.transform, transform);
}
function fly() {
  if (!selected) return;
  const [x, y] = projection([selected.longitude, selected.latitude]);
  const k = Math.max(1.8, current.k);
  move(
    zoomIdentity.translate(width * 0.5 - k * x, height * 0.58 - k * y).scale(k),
  );
}
function resize() {
  const box = $("map").getBoundingClientRect();
  width = box.width;
  height = box.height;
  svg.attr("viewBox", `0 0 ${width} ${height}`);
  projection.fitExtent(
    [
      [22, 82],
      [width - 22, height - 42],
    ],
    land,
  );
  landPaths.attr("d", path);
  grid.attr("d", path);
  dots
    .attr("cx", (c) => projection([c.longitude, c.latitude])[0])
    .attr("cy", (c) => projection([c.longitude, c.latitude])[1]);
  behavior.extent([
    [0, 0],
    [width, height],
  ]);
  svg.call(behavior.transform, zoomIdentity);
  placeMarker();
}
new ResizeObserver(resize).observe($("map"));
function choose(
  city,
  { fly: shouldFly = false, scroll = false, hash = true } = {},
) {
  selected = city;
  $("selection-content").hidden = !city;
  $("selection-empty").hidden = !!city;
  $("selection-marker").style.display = city ? "" : "none";
  document
    .querySelectorAll('.city-card[aria-pressed="true"]')
    .forEach((el) => el.setAttribute("aria-pressed", "false"));
  dots.classed("active", (c) => c.id === city?.id);
  if (!city) return;
  const thumb = `/naicons/thumbs/${city.id}.webp`;
  $("selected-country").textContent = city.country;
  $("selected-region").textContent =
    `${city.region} · ${countries[city.country]}`;
  $("selected-name").textContent = city.name;
  $("selected-concept").textContent = city.concept;
  $("selected-image").src = thumb;
  $("selected-image").alt = `${city.name} city icon`;
  $("selected-population").textContent = formatPopulation(city.population);
  $("selected-year").textContent =
    `${city.populationYear} ${city.country === "MX" ? "census" : "estimate"}`;
  $("selected-exception").hidden = !city.exception;
  $("selected-exception").textContent =
    `A small-city exception, included so ${city.region} has a place on the map.`;
  $("download-icon").href = `/naicons/icons/${city.filename}`;
  $("download-icon").download = city.filename;
  $("population-source").href = city.populationSource;
  $("marker-image").setAttribute("href", thumb);
  $("marker-name").textContent = city.name;
  $("map-caption").textContent =
    `${city.name}, ${city.region} · ${formatPopulation(city.population)} people`;
  document
    .querySelector(`[data-city="${city.id}"]`)
    ?.setAttribute("aria-pressed", "true");
  if (hash) history.replaceState(null, "", `#city=${city.id}`);
  placeMarker();
  if (shouldFly) fly();
  if (scroll)
    $("atlas").scrollIntoView({
      behavior: reduced ? "instant" : "smooth",
      block: "start",
    });
}
function update() {
  visible = filterCities(cities, {
    query: $("search").value,
    country,
    sort: $("sort").value,
  });
  $("icon-grid").innerHTML = visible.map(card).join("");
  $("empty-state").hidden = visible.length > 0;
  const order = {
    "population-asc": "smallest first",
    "population-desc": "largest first",
    name: "A–Z",
  }[$("sort").value];
  $("result-count").textContent =
    `${visible.length} ${visible.length === 1 ? "icon" : "icons"} · ${order}`;
  const ids = new Set(visible.map((c) => c.id));
  dots
    .classed("dimmed", (c) => !ids.has(c.id))
    .style("pointer-events", (c) => (ids.has(c.id) ? null : "none"));
  choose(visible.find((c) => c.id === selected?.id) || visible[0], {
    hash: false,
  });
}
$("icon-grid").addEventListener("click", (event) => {
  const button = event.target.closest("[data-city]");
  if (button)
    choose(byId.get(button.dataset.city), { fly: true, scroll: true });
});
$("filters").addEventListener("submit", (event) => event.preventDefault());
$("search").addEventListener("input", update);
$("sort").addEventListener("change", update);
document.querySelectorAll("[data-country]").forEach((button) =>
  button.addEventListener("click", () => {
    country = button.dataset.country;
    document
      .querySelectorAll("[data-country]")
      .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    update();
  }),
);
$("clear-filters").addEventListener("click", () => {
  $("search").value = "";
  country = "all";
  document
    .querySelectorAll("[data-country]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.country === "all")),
    );
  update();
  $("search").focus();
});
function scale(factor) {
  svg.interrupt();
  const target = reduced ? svg : svg.transition().duration(250);
  target.call(behavior.scaleBy, factor);
}
$("zoom-in").addEventListener("click", () => scale(1.5));
$("zoom-out").addEventListener("click", () => scale(1 / 1.5));
$("reset-map").addEventListener("click", () => move(zoomIdentity));
$("map").addEventListener("keydown", (event) => {
  if (
    [
      "+",
      "=",
      "-",
      "Home",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
    ].includes(event.key)
  ) {
    event.preventDefault();
    if (event.key === "+" || event.key === "=") scale(1.5);
    else if (event.key === "-") scale(1 / 1.5);
    else if (event.key === "Home") move(zoomIdentity);
    else {
      const [x, y] = {
        ArrowLeft: [50, 0],
        ArrowRight: [-50, 0],
        ArrowUp: [0, 50],
        ArrowDown: [0, -50],
      }[event.key];
      svg.call(behavior.translateBy, x / current.k, y / current.k);
    }
  }
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "/" &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
  ) {
    event.preventDefault();
    $("search").focus();
  }
});
let toastTimer;
$("copy-link").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(
      `${location.origin}/naicons#city=${selected.id}`,
    );
    $("toast").textContent = "City link copied";
  } catch {
    $("toast").textContent = "Copy the city link from your address bar";
  }
  $("toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("toast").hidden = true), 3000);
});
function fromHash() {
  const id = new URLSearchParams(location.hash.slice(1)).get("city");
  if (byId.has(id)) choose(byId.get(id), { fly: true, hash: false });
}
resize();
choose(
  byId.get(new URLSearchParams(location.hash.slice(1)).get("city")) ||
    cities[0],
  { hash: false },
);
window.addEventListener("hashchange", fromHash);
