import { lazy } from "react";
import __Layout from "./Layout.jsx";

const lazyPage = (loader) => lazy(loader);

export const PAGES = {
  AGB: lazyPage(() => import("./pages/AGB")),
  AddHike: lazyPage(() => import("./pages/AddHike")),
  AddJournalEntry: lazyPage(() => import("./pages/AddJournalEntry")),
  AdminDashboard: lazyPage(() => import("./pages/AdminDashboard")),
  AdminReview: lazyPage(() => import("./pages/AdminReview")),
  Dashboard: lazyPage(() => import("./pages/Dashboard")),
  Datenschutz: lazyPage(() => import("./pages/Datenschutz")),
  DifficultyHelp: lazyPage(() => import("./pages/DifficultyHelp")),
  Dogs: lazyPage(() => import("./pages/Dogs")),
  EditHike: lazyPage(() => import("./pages/EditHike")),
  EditPublicHike: lazyPage(() => import("./pages/EditPublicHike")),
  EditRoute: lazyPage(() => import("./pages/EditRoute")),
  Friends: lazyPage(() => import("./pages/Friends")),
  HikeDetail: lazyPage(() => import("./pages/HikeDetail")),
  Hikes: lazyPage(() => import("./pages/Hikes")),
  Impressum: lazyPage(() => import("./pages/Impressum")),
  Journal: lazyPage(() => import("./pages/Journal")),
  JournalDetail: lazyPage(() => import("./pages/JournalDetail")),
  Legal: lazyPage(() => import("./pages/Legal")),
  Login: lazyPage(() => import("./pages/Login")),
  MapView: lazyPage(() => import("./pages/MapView")),
  Notifications: lazyPage(() => import("./pages/Notifications")),
  Profile: lazyPage(() => import("./pages/Profile")),
  RouteDetail: lazyPage(() => import("./pages/RouteDetail")),
  RoutePlanner: lazyPage(() => import("./pages/RoutePlanner")),
  SubmitHike: lazyPage(() => import("./pages/SubmitHike")),
  Support: lazyPage(() => import("./pages/Support")),
  TopDogs: lazyPage(() => import("./pages/TopDogs")),
  WaterHelp: lazyPage(() => import("./pages/WaterHelp")),
};

export const pagesConfig = {
  mainPage: "Dashboard",
  Pages: PAGES,
  Layout: __Layout,
};
