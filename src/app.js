import { geoConicEqualArea, geoPath } from "d3-geo";
import { select } from "d3-selection";
import { zoom, zoomIdentity } from "d3-zoom";
import "d3-transition";
import { feature } from "topojson-client";
import cities from "../data/cities.json";
import topology from "../data/north-america.topo.json";
import terrain from "../data/terrain-contours.json";
import { packIcons } from "./layout.js";
import { iconMotion } from "./motion.js";
import {
  filterCities,
  countries,
  formatPopulation,
  citySlug,
  cityFromLink,
} from "./catalog.js";
const $ = (id) => document.getElementById(id);
const byId = new Map(cities.map((c) => [c.id, c]));
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
let selected,
  visible = cities,
  country = "all",
  descending = false,
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
const landClip = svg
  .append("defs")
  .append("clipPath")
  .attr("id", "terrain-land-clip")
  .attr("clipPathUnits", "userSpaceOnUse")
  .selectAll("path")
  .data(land.features)
  .join("path");
const contourPaths = select("#terrain")
  .selectAll("path")
  .data(terrain.features)
  .join("path")
  .attr("class", "terrain-contour")
  .classed("index-contour", (d) => d.properties.elevation % 1000 === 0);
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
  dots.attr("r", (c) =>
    c.id === selected?.id ? 4 / current.k : 2.5 / current.k,
  );
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
  const k = Math.max(2.4, current.k);
  const mapBox = $("map").getBoundingClientRect();
  const sheetBox = $("collection").getBoundingClientRect();
  const targetX = sheetBox.left + sheetBox.width / 2 - mapBox.left;
  const targetY = Math.max(
    145,
    $("filters").getBoundingClientRect().top - mapBox.top - 46,
  );
  move(zoomIdentity.translate(targetX - k * x, targetY - k * y).scale(k));
}
function overviewTransform() {
  const [x, y] = projection([-100, 45]);
  const k = 1.45;
  return zoomIdentity
    .translate(width * 0.5 - k * x, height * 0.48 - k * y)
    .scale(k);
}
function resize() {
  const box = $("map").getBoundingClientRect();
  width = box.width;
  height = box.height;
  svg.attr("viewBox", `0 0 ${width} ${height}`);
  projection.fitExtent(
    [
      [22, 30],
      [width - 22, height * 0.72],
    ],
    land,
  );
  landPaths.attr("d", path);
  landClip.attr("d", path);
  contourPaths.attr("d", path);
  dots
    .attr("cx", (c) => projection([c.longitude, c.latitude])[0])
    .attr("cy", (c) => projection([c.longitude, c.latitude])[1]);
  behavior.extent([
    [0, 0],
    [width, height],
  ]);
  svg.call(behavior.transform, overviewTransform());
  if (selected) fly();
  else placeMarker();
}
new ResizeObserver(resize).observe($("map"));
function choose(
  city,
  { fly: shouldFly = false, scroll = false, hash = true, layout = true } = {},
) {
  const previous = layout ? captureIcons() : null;
  const gridBox = $("icon-grid").getBoundingClientRect();
  const orb =
    city &&
    iconNodes.get(city.id)?.querySelector(".icon-orb").getBoundingClientRect();
  const anchor = orb
    ? {
        x: orb.left + orb.width / 2 - gridBox.left,
        y: orb.top + orb.height / 2 - gridBox.top,
      }
    : null;
  selected = city;
  $("selection-content").hidden = !city;
  $("selection-marker").style.display = city ? "" : "none";
  document
    .querySelectorAll('.city-card[aria-pressed="true"]')
    .forEach((el) => el.setAttribute("aria-pressed", "false"));
  dots.classed("active", (c) => c.id === city?.id);
  if (!city) {
    if (layout) layoutIcons(previous, null, true);
    placeMarker();
    if (hash) history.replaceState(null, "", location.pathname);
    return;
  }
  const thumb = `/naicons/thumbs/${city.id}.webp`;
  $("selected-region").textContent =
    `${city.region} · ${countries[city.country]}`;
  $("selected-name").textContent = city.name;
  $("selected-image").src = thumb;
  $("selected-image").alt = `${city.name} city icon`;
  $("selected-population").textContent = formatPopulation(city.population);
  $("download-icon").href = `/naicons/icons/${city.filename}`;
  $("download-icon").download = city.filename;
  $("marker-image").setAttribute("href", thumb);
  $("marker-name").textContent = city.name;
  document
    .querySelector(`[data-city="${city.id}"]`)
    ?.setAttribute("aria-pressed", "true");
  if (layout) layoutIcons(previous, anchor, true);
  if (hash) history.replaceState(null, "", `#city=${citySlug(city, cities)}`);
  placeMarker();
  if (shouldFly) fly();
  if (scroll)
    $("atlas").scrollIntoView({
      behavior: reduced ? "instant" : "smooth",
      block: "start",
    });
}
// Reuse the actual elements so their positions can tween across a new order.
const iconNodes = new Map(
  [...$("icon-grid").children].map((node) => [
    node.querySelector("button").dataset.city,
    node,
  ]),
);
function captureIcons() {
  return new Map(
    [...$("icon-grid").children].map((node) => [
      node,
      node.getBoundingClientRect(),
    ]),
  );
}
function layoutIcons(previous, anchor, preserveScroll = false) {
  const grid = $("icon-grid");
  const scrollTop = $("collection").scrollTop;
  const previousHeight = grid.offsetHeight;
  const mobile = matchMedia("(max-width: 700px)").matches;
  const cell = mobile ? 42 : 46,
    gap = mobile ? 6 : 7;
  const active = selected && iconNodes.get(selected.id);
  for (const node of iconNodes.values())
    node.getAnimations().forEach((a) => a.cancel());
  const button = active?.querySelector("button");
  const cardWidth = button?.offsetWidth || 0,
    cardHeight = button?.offsetHeight || 0;
  const packed = packIcons(
    visible.map((c) => c.id),
    {
      width: grid.clientWidth,
      cell,
      gap,
      selected: selected?.id,
      anchor,
      cardWidth,
      cardHeight,
    },
  );
  grid.classList.add("packed");
  grid.style.height = `${preserveScroll ? Math.max(previousHeight, packed.height) : packed.height}px`;
  for (const city of visible) {
    const node = iconNodes.get(city.id),
      point = packed.positions.get(city.id);
    node.style.left = `${point.x}px`;
    node.style.top = `${point.y}px`;
  }
  if (preserveScroll) {
    $("collection").scrollTop = scrollTop;
    requestAnimationFrame(() => {
      $("collection").scrollTop = scrollTop;
    });
  }
  if (!previous || reduced) return;
  const moves = [...grid.children].map((node) => ({
    node,
    before: previous.get(node),
    after: node.getBoundingClientRect(),
  }));
  const bounds = {
    top: $("filters").getBoundingClientRect().bottom,
    bottom: $("collection").getBoundingClientRect().bottom,
  };
  for (const { node, before, after } of moves) {
    if (node === active && anchor) continue;
    const frames = iconMotion(before, after, bounds);
    if (frames)
      node.animate(frames, {
        duration: 650,
        easing: "cubic-bezier(.22, 1, .36, 1)",
      });
  }
}
let gridWidth = 0;
new ResizeObserver(([entry]) => {
  if (entry.contentRect.width === gridWidth) return;
  gridWidth = entry.contentRect.width;
  layoutIcons();
}).observe($("icon-grid"));
function update({ animate = false } = {}) {
  const previous = new Map(
    [...$("icon-grid").children].map((node) => [
      node,
      node.getBoundingClientRect(),
    ]),
  );
  for (const node of iconNodes.values())
    node.getAnimations().forEach((animation) => animation.cancel());
  visible = filterCities(cities, {
    query: $("search").value,
    country,
    sort: descending ? "population-desc" : "population-asc",
  });
  $("icon-grid").replaceChildren(
    ...visible.map((city) => iconNodes.get(city.id)),
  );
  $("empty-state").hidden = visible.length > 0;
  $("result-count").textContent =
    `${visible.length} ${visible.length === 1 ? "icon" : "icons"}`;
  const ids = new Set(visible.map((c) => c.id));
  dots
    .classed("dimmed", (c) => !ids.has(c.id))
    .style("pointer-events", (c) => (ids.has(c.id) ? null : "none"));
  choose(
    visible.find((c) => c.id === selected?.id),
    {
      hash: false,
      layout: false,
    },
  );
  layoutIcons(animate ? previous : null);
}
$("icon-grid").addEventListener("click", (event) => {
  const button = event.target.closest("[data-city]");
  if (button)
    choose(
      selected?.id === button.dataset.city
        ? undefined
        : byId.get(button.dataset.city),
      { fly: true, scroll: false },
    );
});
$("collection").addEventListener(
  "scroll",
  () => {
    $("collection").classList.toggle("scrolled", $("collection").scrollTop > 8);
  },
  { passive: true },
);
$("filters").addEventListener("submit", (event) => event.preventDefault());
$("search").addEventListener("input", update);
$("sort").addEventListener("click", () => {
  descending = !descending;
  $("sort").setAttribute("aria-pressed", String(descending));
  $("sort").setAttribute(
    "aria-label",
    `Population: ${descending ? "largest" : "smallest"} first. Click for ${descending ? "smallest" : "largest"} first.`,
  );
  $("sort").title = descending ? "Largest first" : "Smallest first";
  update({ animate: true });
});
const countryCycle = ["all", "US", "CA", "MX"];
function updateCountryButton() {
  const index = countryCycle.indexOf(country);
  const name = country === "all" ? "All countries" : countries[country];
  const next = countryCycle[(index + 1) % countryCycle.length];
  const nextName = next === "all" ? "All countries" : countries[next];
  $("country-name").textContent = name;
  $("country").setAttribute(
    "aria-label",
    `Country: ${name}. Click for ${nextName}.`,
  );
  $("country").title = `Next: ${nextName}`;
}
$("country").addEventListener("click", () => {
  country =
    countryCycle[(countryCycle.indexOf(country) + 1) % countryCycle.length];
  updateCountryButton();
  update({ animate: true });
});
$("close-city").addEventListener("click", () => choose(undefined));
$("clear-filters").addEventListener("click", () => {
  $("search").value = "";
  country = "all";
  updateCountryButton();
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
$("reset-map").addEventListener("click", () => move(overviewTransform()));
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
    else if (event.key === "Home") move(overviewTransform());
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
let copyFeedbackTimer;
$("copy-link").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(
      `${location.origin}/naicons#city=${citySlug(selected, cities)}`,
    );
    $("copy-link").textContent = "Copied!";
  } catch {
    $("copy-link").textContent = "Copy from address bar";
  }
  clearTimeout(copyFeedbackTimer);
  copyFeedbackTimer = setTimeout(() => {
    $("copy-link").textContent = "Copy link";
  }, 3000);
});
function fromHash() {
  const city = cityFromLink(
    cities,
    new URLSearchParams(location.hash.slice(1)).get("city"),
  );
  if (city) choose(city, { fly: true });
}
// A reload starts a fresh exploration; opening a shared link still selects its city.
const isReload =
  performance.getEntriesByType("navigation")[0]?.type === "reload";
if (isReload) history.replaceState(null, "", location.pathname);
resize();
layoutIcons();
choose(
  isReload
    ? undefined
    : cityFromLink(
        cities,
        new URLSearchParams(location.hash.slice(1)).get("city"),
      ),
  { fly: true },
);
window.addEventListener("hashchange", fromHash);
