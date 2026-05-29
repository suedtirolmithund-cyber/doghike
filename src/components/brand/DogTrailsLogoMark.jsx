export default function DogTrailsLogoMark({ className = "", ariaHidden = true }) {
  return (
    <img
      src="/dogtrails-logo-pin.png"
      alt={ariaHidden ? "" : "DogTrails"}
      aria-hidden={ariaHidden ? "true" : undefined}
      className={className}
      decoding="async"
      draggable="false"
    />
  );
}
