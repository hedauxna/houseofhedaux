import { spline } from "./route-debug.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const SAMPLES = 8192;
const routeCache = new WeakMap();

export function mountRouteMarkers(container, route, drivers) {
  const doc = container.ownerDocument;
  const win = doc.defaultView;
  const svg = doc.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${route.imageWidth} ${route.imageHeight}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.classList.add("pit-wall-route-overlay", "pit-wall-marker-overlay");
  const path = doc.createElementNS(SVG_NS, "path");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "none");
  svg.append(path);
  const markers = drivers.map(({ initials, teamColour, getProgress, getTyre = () => null, isVisible = () => true }) => {
    const wrapper = doc.createElementNS(SVG_NS, "g");
    wrapper.setAttribute("aria-label", `${initials} driver marker`);
    wrapper.setAttribute("role", "img");
    const marker = doc.createElementNS(SVG_NS, "g");
    marker.classList.add("pit-wall-moving-driver");
    marker.innerHTML = '<circle class="pit-wall-marker-tyre" r="23"></circle><circle class="pit-wall-marker-team" r="20"></circle><text dy=".35em"></text>';
    marker.querySelector(".pit-wall-marker-team").setAttribute("fill", teamColour);
    marker.querySelector("text").textContent = initials;
    wrapper.append(marker);
    svg.append(wrapper);
    return { marker, wrapper, initials, getProgress, getTyre, isVisible, progress: null, visible: null, tyre: null };
  });
  container.append(svg);
  let geometry;
  let frame = null;
  let markerScale = 1;

  function position(item, progress) {
    const index = Math.min(SAMPLES - 1, Math.floor(progress * SAMPLES));
    const fraction = progress * SAMPLES - index;
    const { points } = geometry;
    const x = points[index * 2] + (points[(index + 1) * 2] - points[index * 2]) * fraction;
    const y = points[index * 2 + 1] + (points[(index + 1) * 2 + 1] - points[index * 2 + 1]) * fraction;
    item.marker.setAttribute("transform", `translate(${x} ${y}) scale(${markerScale})`);
  }

  function update(force = false) {
    for (const item of markers) {
      const visible = Boolean(item.isVisible());
      if (item.visible !== visible) {
        if (!visible && item.visible) {
          item.progress = Math.min(1, Math.max(0, item.getProgress()));
          position(item, item.progress);
        }
        item.marker.style.display = visible ? "" : "none";
        item.visible = visible;
      }
      if (!visible) continue;
      const tyre = item.getTyre();
      if (tyre !== item.tyre) {
        item.marker.dataset.tyre = tyre || "";
        item.wrapper.setAttribute("aria-label", `${item.initials} driver marker${tyre ? `, ${tyre} tyre` : ""}`);
        item.tyre = tyre;
      }
      const progress = Math.min(1, Math.max(0, item.getProgress()));
      if (force || progress !== item.progress) position(item, progress);
      item.progress = progress;
    }
  }

  function resizeMarker() {
    const matrix = svg.getScreenCTM();
    const scale = matrix && Math.hypot(matrix.a, matrix.b);
    if (scale > 0) markerScale = 13 / (20 * scale);
    update(true);
  }

  function refresh() {
    const definition = spline(route.points);
    path.setAttribute("d", definition);
    geometry = routeCache.get(route);
    if (!geometry || geometry.definition !== definition) {
      const length = path.getTotalLength();
      if (!Number.isFinite(length) || length <= 0) throw new Error("Circuit route has no usable length");
      const points = new Float64Array((SAMPLES + 1) * 2);
      for (let index = 0; index <= SAMPLES; index += 1) {
        const point = path.getPointAtLength(index * length / SAMPLES);
        points[index * 2] = point.x;
        points[index * 2 + 1] = point.y;
      }
      geometry = { definition, points };
      routeCache.set(route, geometry);
    }
    resizeMarker();
  }

  function tick() {
    update();
    frame = win.requestAnimationFrame(tick);
  }

  let resizeObserver;
  try {
    refresh();
    resizeObserver = new win.ResizeObserver(resizeMarker);
    resizeObserver.observe(svg);
  } catch (error) {
    resizeObserver?.disconnect();
    svg.remove();
    throw error;
  }
  return {
    resume() {
      svg.style.display = "";
      refresh();
      if (frame === null) frame = win.requestAnimationFrame(tick);
    },
    pause(hide = false) {
      if (frame !== null) win.cancelAnimationFrame(frame);
      frame = null;
      svg.style.display = hide ? "none" : "";
    },
    update,
    remove() {
      if (frame !== null) win.cancelAnimationFrame(frame);
      frame = null;
      resizeObserver.disconnect();
      svg.remove();
    },
  };
}

export function mountRouteMarker(container, route, initials, teamColour, getProgress, isVisible = () => true) {
  return mountRouteMarkers(container, route, [{ initials, teamColour, getProgress, isVisible }]);
}
