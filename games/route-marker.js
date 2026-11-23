import { spline } from "./route-debug.js";

const SVG_NS = "http://www.w3.org/2000/svg";
export function mountRouteMarker(container, route, initials, teamColour, getProgress) {
  const doc = container.ownerDocument;
  const win = doc.defaultView;
  const svg = doc.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${route.imageWidth} ${route.imageHeight}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("aria-label", `${initials} driver marker`);
  svg.classList.add("pit-wall-route-overlay", "pit-wall-marker-overlay");
  svg.innerHTML = `<path fill="none" stroke="none"></path>
    <g class="pit-wall-moving-driver"><circle r="20"></circle><text dy=".35em"></text></g>`;
  const path = svg.querySelector("path");
  const marker = svg.querySelector("g");
  marker.querySelector("circle").setAttribute("fill", teamColour);
  marker.querySelector("text").textContent = initials;
  container.append(svg);
  let distance = 0;
  let length = 0;
  let frame = null;
  let markerScale = 1;

  function position() {
    const point = path.getPointAtLength(distance);
    marker.setAttribute("transform", `translate(${point.x} ${point.y}) scale(${markerScale})`);
  }

  function resizeMarker() {
    const matrix = svg.getScreenCTM();
    const scale = matrix && Math.hypot(matrix.a, matrix.b);
    if (scale > 0) markerScale = 13 / (20 * scale);
    position();
  }

  function refresh() {
    const fraction = length ? distance / length : 0;
    path.setAttribute("d", spline(route.points));
    length = path.getTotalLength();
    if (!Number.isFinite(length) || length <= 0) throw new Error("Bahrain route has no usable length");
    distance = fraction * length;
    resizeMarker();
  }

  function tick() {
    distance = Math.min(1, Math.max(0, getProgress())) * length;
    position();
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
      if (frame === null) {
        frame = win.requestAnimationFrame(tick);
      }
    },
    pause(hide = false) {
      if (frame !== null) win.cancelAnimationFrame(frame);
      frame = null;
      svg.style.display = hide ? "none" : "";
    },
    remove() {
      if (frame !== null) win.cancelAnimationFrame(frame);
      frame = null;
      resizeObserver.disconnect();
      svg.remove();
    },
  };
}
