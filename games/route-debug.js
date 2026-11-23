const ROUTE_URL = new URL("./bahrain-route.json", import.meta.url);
const SVG_NS = "http://www.w3.org/2000/svg";

export function spline(points) {
  const at = (index) => points[(index + points.length) % points.length];
  return points.map((point, index) => {
    const previous = at(index - 1);
    const next = at(index + 1);
    const after = at(index + 2);
    return `${index === 0 ? `M ${point[0]} ${point[1]} ` : ""}C ${point[0] + (next[0] - previous[0]) / 6} ${point[1] + (next[1] - previous[1]) / 6} ${next[0] - (after[0] - point[0]) / 6} ${next[1] - (after[1] - point[1]) / 6} ${next[0]} ${next[1]}`;
  }).join(" ") + " Z";
}

export async function loadBahrainRoute() {
  const response = await fetch(ROUTE_URL);
  if (!response.ok) throw new Error(`Bahrain route request failed (${response.status})`);
  const route = await response.json();
  if (route.imageWidth !== 958 || route.imageHeight !== 645 || !Array.isArray(route.points)
    || route.points.length < 3 || !route.points.every((point) => Array.isArray(point)
      && point.length === 2 && point.every(Number.isFinite)
      && point[0] >= 0 && point[0] <= route.imageWidth
      && point[1] >= 0 && point[1] <= route.imageHeight)) {
    throw new Error("Bahrain route has invalid coordinates or image dimensions");
  }
  return route;
}

export function mountRouteDebug(container, route, initials, onSelect) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${route.imageWidth} ${route.imageHeight}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("aria-label", "Bahrain route, numbered from waypoint 0");
  svg.classList.add("pit-wall-route-overlay");
  svg.innerHTML = `<path class="pit-wall-route-line"></path>
    ${route.points.map((_, index) => `<g class="pit-wall-route-point" data-waypoint="${index}">
      <circle r="5"></circle><text x="${index === 0 ? 17 : 7}" y="${index === 0 ? -12 : -7}">${index}</text>
    </g>`).join("")}
    <g class="pit-wall-route-player"><circle r="15"></circle><text dy=".35em"></text></g>`;
  svg.querySelector(".pit-wall-route-player text").textContent = initials;
  const path = svg.querySelector(".pit-wall-route-line");
  const player = svg.querySelector(".pit-wall-route-player");
  const markers = [...svg.querySelectorAll("[data-waypoint]")];
  let editing = false;
  let selected = null;
  const update = () => {
    path.setAttribute("d", spline(route.points));
    markers.forEach((marker, index) => {
      marker.setAttribute("transform", `translate(${route.points[index].join(" ")})`);
    });
    player.setAttribute("transform", `translate(${route.points[0].join(" ")})`);
  };
  svg.addEventListener("pointerdown", (event) => {
    const marker = event.target.closest("[data-waypoint]");
    if (!editing || !marker || event.button !== 0) return;
    selected = Number(marker.dataset.waypoint);
    markers.forEach((item, index) => item.classList.toggle("is-selected", index === selected));
    onSelect(selected);
    svg.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  svg.addEventListener("pointermove", (event) => {
    if (selected === null || !svg.hasPointerCapture(event.pointerId)) return;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    route.points[selected] = [
      Math.round(Math.max(0, Math.min(route.imageWidth, point.x)) * 100) / 100,
      Math.round(Math.max(0, Math.min(route.imageHeight, point.y)) * 100) / 100,
    ];
    update();
  });
  const release = (event) => {
    if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
  };
  svg.addEventListener("pointerup", release);
  svg.addEventListener("pointercancel", release);
  update();
  container.append(svg);
  return {
    setEditing(value) {
      editing = value;
      svg.classList.toggle("is-editing", value);
    },
    remove() { svg.remove(); },
  };
}
