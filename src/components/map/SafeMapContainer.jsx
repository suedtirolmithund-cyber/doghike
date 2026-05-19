import { useEffect, useState } from "react";
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

  if (!isReady) {
    return <div className={fallbackClassName ?? className} style={style} />;
  }

  return (
    <MapContainer key={resetKey} style={style} className={className} {...props}>
      {children}
    </MapContainer>
  );
}
