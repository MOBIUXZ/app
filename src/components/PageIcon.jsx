import { getPageIcon } from "../domain/pageIcons.js";

function renderShape(shape, index) {
  if (shape.type === "rect") {
    return <rect key={index} width={shape.width} height={shape.height} x={shape.x} y={shape.y} rx={shape.rx || 0} />;
  }
  if (shape.type === "circle") {
    return <circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} />;
  }
  if (shape.type === "line") {
    return <line key={index} x1={shape.x1} x2={shape.x2} y1={shape.y1} y2={shape.y2} />;
  }
  if (shape.type === "path") {
    return <path key={index} d={shape.d} />;
  }
  return null;
}

export function PageIcon({ id, size }) {
  var icon = getPageIcon(id);
  if (!icon) return null;
  var px = size || icon.sizePx;
  return (
    <svg
      width={px}
      height={px}
      viewBox={icon.viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={icon.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0, color: "var(--ft-accent)" }}
    >
      {icon.shapes.map(renderShape)}
    </svg>
  );
}

export function PageHeading({ title, icon, className, iconSize }) {
  return (
    <div className={className}>
      {icon ? <PageIcon id={icon} size={iconSize} /> : null}
      <span>{title}</span>
    </div>
  );
}
