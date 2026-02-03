/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AddHike from './pages/AddHike';
import Dashboard from './pages/Dashboard';
import Dogs from './pages/Dogs';
import EditHike from './pages/EditHike';
import HikeDetail from './pages/HikeDetail';
import Hikes from './pages/Hikes';
import MapView from './pages/MapView';
import SubmitHike from './pages/SubmitHike';
import AdminReview from './pages/AdminReview';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AddHike": AddHike,
    "Dashboard": Dashboard,
    "Dogs": Dogs,
    "EditHike": EditHike,
    "HikeDetail": HikeDetail,
    "Hikes": Hikes,
    "MapView": MapView,
    "SubmitHike": SubmitHike,
    "AdminReview": AdminReview,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};