import { lazy } from "react";
import __Layout from "./Layout.jsx";

const CHUNK_IMPORT_RETRY_PREFIX = "doghike_lazy_import_retry:";

const lazyPage = (loader, key = "page") =>
  lazy(async () => {
    try {
      return await loader();
    } catch (error) {
      const errorMessage = String(error);
      const isChunkLoadError =
        errorMessage.includes("Failed to fetch dynamically imported module")
        || errorMessage.includes("Importing a module script failed");

      if (isChunkLoadError && typeof window !== "undefined") {
        const retryKey = `${CHUNK_IMPORT_RETRY_PREFIX}${key}`;
        const alreadyRetried = window.sessionStorage.getItem(retryKey) === "1";

        if (!alreadyRetried) {
          window.sessionStorage.setItem(retryKey, "1");
          window.location.reload();
          return new Promise(() => {});
        }

        window.sessionStorage.removeItem(retryKey);
      }

      throw error;
    }
  });

export const PAGES = {
  AGB: lazyPage(() => import("./pages/AGB"), "AGB"),
  AddHike: lazyPage(() => import("./pages/AddHike"), "AddHike"),
  AddJournalEntry: lazyPage(() => import("./pages/AddJournalEntry"), "AddJournalEntry"),
  AdminDashboard: lazyPage(() => import("./pages/AdminDashboard"), "AdminDashboard"),
  AdminReview: lazyPage(() => import("./pages/AdminReview"), "AdminReview"),
  Dashboard: lazyPage(() => import("./pages/Dashboard"), "Dashboard"),
  Datenschutz: lazyPage(() => import("./pages/Datenschutz"), "Datenschutz"),
  DifficultyHelp: lazyPage(() => import("./pages/DifficultyHelp"), "DifficultyHelp"),
  Dogs: lazyPage(() => import("./pages/Dogs"), "Dogs"),
  EditHike: lazyPage(() => import("./pages/EditHike"), "EditHike"),
  EditPublicHike: lazyPage(() => import("./pages/EditPublicHike"), "EditPublicHike"),
  EditRoute: lazyPage(() => import("./pages/EditRoute"), "EditRoute"),
  Friends: lazyPage(() => import("./pages/Friends"), "Friends"),
  HikeDetail: lazyPage(() => import("./pages/HikeDetail"), "HikeDetail"),
  Hikes: lazyPage(() => import("./pages/Hikes"), "Hikes"),
  Impressum: lazyPage(() => import("./pages/Impressum"), "Impressum"),
  Journal: lazyPage(() => import("./pages/Journal"), "Journal"),
  JournalDetail: lazyPage(() => import("./pages/JournalDetail"), "JournalDetail"),
  Legal: lazyPage(() => import("./pages/Legal"), "Legal"),
  Login: lazyPage(() => import("./pages/Login"), "Login"),
  MapView: lazyPage(() => import("./pages/MapView"), "MapView"),
  Notifications: lazyPage(() => import("./pages/Notifications"), "Notifications"),
  Profile: lazyPage(() => import("./pages/Profile"), "Profile"),
  RouteDetail: lazyPage(() => import("./pages/RouteDetail"), "RouteDetail"),
  RoutePlanner: lazyPage(() => import("./pages/RoutePlanner"), "RoutePlanner"),
  SubmitHike: lazyPage(() => import("./pages/SubmitHike"), "SubmitHike"),
  Support: lazyPage(() => import("./pages/Support"), "Support"),
  TopDogs: lazyPage(() => import("./pages/TopDogs"), "TopDogs"),
  WaterHelp: lazyPage(() => import("./pages/WaterHelp"), "WaterHelp"),
};

export const pagesConfig = {
  mainPage: "Dashboard",
  Pages: PAGES,
  Layout: __Layout,
};
