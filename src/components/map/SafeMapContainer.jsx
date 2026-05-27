import { useEffect, useRef, useState } from "react";
import { MapContainer } from "react-leaflet";

export default function SafeMapContainer({
  resetKey = "default",
  style,
  className,
  fallbackClassName,
  children,
  ...props
}) {
  const [isReady, setIsReady] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);
  const shellRef = useRef(null);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    if (typeof shell === "object" && "_leaflet_id" in shell) {
      delete shell._leaflet_id;
    }

    shell.querySelectorAll(".leaflet-container").forEach((node) => {
      if (node && typeof node === "object" && "_leaflet_id" in node) {
        delete node._leaflet_id;
      }
      node.innerHTML = "";
    });

    setInstanceKey((current) => current + 1);
  }, [resetKey]);

  useEffect(() => {
    let firstFrame = 0;
    let secondFrame = 0;

    setIsReady(false);

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        setIsReady(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      setIsReady(false);
    };
  }, [resetKey]);

  return (
    <div ref={shellRef} className={fallbackClassName ?? className} style={style}>
      {isReady ? (
        <MapContainer
          key={`${resetKey}-${instanceKey}`}
          style={{ height: "100%", width: "100%" }}
          className={className}
          {...props}
        >
          {children}
        </MapContainer>
      ) : null}
    </div>
  );
}
