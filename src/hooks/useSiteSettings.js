import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export const DEFAULT_SETTINGS = {
  siteName: "CineFlix",
  tagline: "Your Premium Global Cinema Platform",
  moviesPerPage: "20",
  showWelcomeModal: true,
  allowRegistration: true,
  featuredGenre: "Action",
};

export function useSiteSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("cineflix_admin_settings");
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    // 1. Listen for real-time local updates dispatched by AdminSettings
    const handleUpdate = (e) => {
      if (e.detail) {
        setSettings((prev) => ({ ...prev, ...e.detail }));
        if (e.detail.siteName) {
          document.title = `${e.detail.siteName} | Movie Recommendation Platform`;
        }
      }
    };
    window.addEventListener("cineflix_settings_updated", handleUpdate);

    // 2. Fetch from Supabase site_settings if available
    const fetchFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("*")
          .limit(1);

        if (!error && data && data.length > 0) {
          const dbRow = data[0];
          const mapped = {
            siteName: dbRow.site_name || "CineFlix",
            tagline: dbRow.tagline || "Your Premium Global Cinema Platform",
            moviesPerPage: String(dbRow.movies_per_page || 20),
            showWelcomeModal: dbRow.show_welcome_modal ?? true,
            allowRegistration: dbRow.allow_registration ?? true,
            featuredGenre: dbRow.featured_genre || "Action",
          };
          setSettings((prev) => ({ ...prev, ...mapped }));
          localStorage.setItem("cineflix_admin_settings", JSON.stringify(mapped));
          if (mapped.siteName) {
            document.title = `${mapped.siteName} | Movie Recommendation Platform`;
          }
        }
      } catch (err) {
        // Table might not exist yet or offline
      }
    };

    fetchFromSupabase();

    // Set initial title
    if (settings.siteName) {
      document.title = `${settings.siteName} | Movie Recommendation Platform`;
    }

    return () => window.removeEventListener("cineflix_settings_updated", handleUpdate);
  }, []);

  return settings;
}
