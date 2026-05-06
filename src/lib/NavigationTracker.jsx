import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pagesConfig } from "@/pages.config";

export default function NavigationTracker() {
  const location = useLocation();
  const { Pages, mainPage } = pagesConfig;
  const mainPageKey = mainPage ?? Object.keys(Pages)[0];
  const currentPath = `${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    const pathname = location.pathname;
    let pageName;

    if (pathname === "/" || pathname === "") {
      pageName = mainPageKey;
    } else {
      const pathSegment = pathname.replace(/^\//, "").split("/")[0];
      pageName = Object.keys(Pages).find(
        (key) => key.toLowerCase() === pathSegment.toLowerCase()
      ) || null;
    }

    if (pageName) {
      document.title = `${pageName} · DogHike`;
    }
    if (typeof window !== "undefined") {
      const previousPath = window.sessionStorage.getItem("doghike:current-path");

      if (previousPath && previousPath !== currentPath) {
        window.sessionStorage.setItem("doghike:last-path", previousPath);
      }

      window.sessionStorage.setItem("doghike:current-path", currentPath);
    }
  }, [currentPath, location, Pages, mainPageKey]);

  return null;
}
