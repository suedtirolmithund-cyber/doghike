import { useEffect, useRef, useState } from "react";
import { MapContainer } from "react-leaflet";

function cleanupLeafletArtifacts(shell) {
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
}

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
    setIsReady(false);
  }, [resetKey]);

  useEffect(() => {
    let firstFrame = 0;
    let secondFrame = 0;

    if (isReady) {
      return undefined;
    }

    cleanupLeafletArtifacts(shellRef.current);

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        setInstanceKey((current) => current + 1);
        setIsReady(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [isReady, resetKey]);

  useEffect(() => {
    return () => {
      cleanupLeafletArtifacts(shellRef.current);
    };
  }, []);

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
