import { useState, useEffect } from "react";
import "./css/App.css";
import Favorites from "./pages/Favorite";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import About from "./pages/About";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMovies from "./pages/admin/AdminMovies";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminGenres from "./pages/admin/AdminGenres";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import LoaderShowcase from "./pages/LoaderShowcase";
import { Routes, Route, useLocation } from "react-router-dom";
import { MovieProvider } from "./contexts/MovieContext";
import { ToastProvider } from "./contexts/ToastContext";
import { AuthProvider } from "./contexts/AuthContext";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import MobileBottomNav from "./components/MobileBottomNav";
import AdminRoute from "./components/AdminRoute";
import AuthModal from "./components/AuthModal";

function AppContent() {
  const [showWelcomeAuth, setShowWelcomeAuth] = useState(false);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdminRoute) return;
    if (window.location.search.includes("guest")) return;
    // Show welcome auth popup once per session for guests
    const skipped = sessionStorage.getItem("cineflix_auth_skipped");
    const alreadyShown = sessionStorage.getItem("cineflix_auth_shown");
    if (!skipped && !alreadyShown) {
      sessionStorage.setItem("cineflix_auth_shown", "true");
      const timer = setTimeout(() => setShowWelcomeAuth(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isAdminRoute]);

  return (
    <>
      {!isAdminRoute && <NavBar />}
      <main className={isAdminRoute ? "admin-app-root" : "main-contents"}>
        <Routes>
          {/* User Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/about" element={<About />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/loader" element={<LoaderShowcase />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={<AdminRoute><AdminDashboard /></AdminRoute>}
          />
          <Route
            path="/admin/movies"
            element={<AdminRoute><AdminMovies /></AdminRoute>}
          />
          <Route
            path="/admin/users"
            element={<AdminRoute><AdminUsers /></AdminRoute>}
          />
          <Route
            path="/admin/reviews"
            element={<AdminRoute><AdminReviews /></AdminRoute>}
          />
          <Route
            path="/admin/genres"
            element={<AdminRoute><AdminGenres /></AdminRoute>}
          />
          <Route
            path="/admin/analytics"
            element={<AdminRoute><AdminAnalytics /></AdminRoute>}
          />
          <Route
            path="/admin/settings"
            element={<AdminRoute><AdminSettings /></AdminRoute>}
          />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <MobileBottomNav />}

      {/* Welcome / Auth Popup — shown once per session for public site */}
      {!isAdminRoute && showWelcomeAuth && (
        <AuthModal onClose={() => setShowWelcomeAuth(false)} />
      )}
    </>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MovieProvider>
          <AppContent />
        </MovieProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;