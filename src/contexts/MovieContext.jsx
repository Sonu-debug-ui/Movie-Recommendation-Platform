import { createContext, useState, useContext, useEffect, useRef } from "react";
import { useToast } from "./ToastContext";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";

const MovieContext = createContext();

export const useMovieContext = () => useContext(MovieContext);

export const MovieProvider = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast() || {};

  // Current active user's storage keys (changes per Gmail / login account)
  const getUserFavoritesKey = (userId) => (userId ? `favorites_${userId}` : "favorites_guest");
  const getUserRatingsKey = (userId) => (userId ? `userRatings_${userId}` : "userRatings_guest");

  const [favorites, setFavorites] = useState([]);
  const [userRatings, setUserRatings] = useState({});
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);

  // Track the previous user ID to handle account transitions cleanly
  const prevUserIdRef = useRef(undefined);

  const getId = (movie) => {
    if (!movie) return null;
    const val = movie.id ?? movie.imdbID;
    return val ? String(val) : null;
  };

  // Synchronize favorites and ratings whenever the logged-in user changes
  useEffect(() => {
    const currentUserId = user?.id || null;

    // Avoid unnecessary resets if the user ID didn't change
    if (prevUserIdRef.current === currentUserId && prevUserIdRef.current !== undefined) {
      return;
    }
    prevUserIdRef.current = currentUserId;

    const favKey = getUserFavoritesKey(currentUserId);
    const ratKey = getUserRatingsKey(currentUserId);

    // 1. Load from this specific user's local cache immediately for instant UI
    try {
      const storedFavs = localStorage.getItem(favKey);
      setFavorites(storedFavs ? JSON.parse(storedFavs) : []);

      const storedRatings = localStorage.getItem(ratKey);
      setUserRatings(storedRatings ? JSON.parse(storedRatings) : {});
    } catch (e) {
      console.error("Error reading user-scoped storage:", e);
      setFavorites([]);
      setUserRatings({});
    }

    // 2. If an authenticated user is logged in, sync with Supabase PostgreSQL in the background
    if (currentUserId) {
      const syncFromSupabase = async () => {
        setLoadingWatchlist(true);
        try {
          // Fetch user's personal watchlist from Supabase
          const { data: watchlistRows, error: wlErr } = await supabase
            .from("watchlist")
            .select("movie_id, movie_title, movie_poster")
            .eq("user_id", currentUserId);

          if (!wlErr && watchlistRows) {
            setFavorites((prevFavs) => {
              // Combine locally cached full movie objects with cloud watchlist rows
              const cloudIds = new Set(watchlistRows.map((r) => String(r.movie_id)));
              
              // Filter out any local items that were deleted from cloud on other devices
              const localMap = new Map();
              prevFavs.forEach((m) => {
                const id = getId(m);
                if (id && cloudIds.has(id)) {
                  localMap.set(id, m);
                }
              });

              // Add items from cloud that might be missing locally
              const merged = watchlistRows.map((row) => {
                const id = String(row.movie_id);
                if (localMap.has(id)) {
                  return localMap.get(id);
                }
                return {
                  id: id,
                  imdbID: id,
                  title: row.movie_title || "Movie",
                  poster_path: row.movie_poster,
                  poster_url: row.movie_poster,
                  poster: row.movie_poster,
                };
              });

              try {
                localStorage.setItem(favKey, JSON.stringify(merged));
              } catch (e) {}

              return merged;
            });
          }

          // Fetch user's ratings from Supabase
          const { data: ratingRows, error: rErr } = await supabase
            .from("ratings")
            .select("movie_id, stars")
            .eq("user_id", currentUserId);

          if (!rErr && ratingRows) {
            setUserRatings((prevRatings) => {
              const updated = { ...prevRatings };
              ratingRows.forEach((row) => {
                if (row.movie_id) {
                  const id = String(row.movie_id);
                  updated[id] = {
                    ...(updated[id] || {}),
                    rating: row.stars,
                  };
                }
              });

              try {
                localStorage.setItem(ratKey, JSON.stringify(updated));
              } catch (e) {}

              return updated;
            });
          }
        } catch (err) {
          console.warn("Supabase watchlist sync warning:", err);
        } finally {
          setLoadingWatchlist(false);
        }
      };

      syncFromSupabase();
    }
  }, [user?.id]);

  const addToFavorites = async (movie) => {
    const targetId = getId(movie);
    if (!targetId) return;

    const currentUserId = user?.id || null;
    const favKey = getUserFavoritesKey(currentUserId);

    let updatedList = [];
    setFavorites((prev) => {
      if (prev.some((m) => getId(m) === targetId)) return prev;
      updatedList = [...prev, movie];
      try {
        localStorage.setItem(favKey, JSON.stringify(updatedList));
      } catch (e) {}
      return updatedList;
    });

    if (showToast) {
      showToast(`Added "${movie.title || "Movie"}" to your favorites!`, "success");
    }

    // If signed in, sync addition to Supabase watchlist table
    if (currentUserId) {
      try {
        const poster = movie.poster_path || movie.poster_url || movie.poster || "";
        await supabase.from("watchlist").upsert(
          {
            user_id: currentUserId,
            movie_id: targetId,
            movie_title: movie.title || "Movie",
            movie_poster: poster,
          },
          { onConflict: "user_id,movie_id" }
        );
      } catch (err) {
        console.warn("Watchlist upsert error:", err);
      }
    }
  };

  const removeFromFavorites = async (movieId) => {
    const targetId = String(movieId);
    const currentUserId = user?.id || null;
    const favKey = getUserFavoritesKey(currentUserId);

    let removedMovieTitle = "";
    setFavorites((prev) => {
      const targetMovie = prev.find((m) => getId(m) === targetId);
      if (targetMovie) removedMovieTitle = targetMovie.title;
      const filtered = prev.filter((m) => getId(m) !== targetId);
      try {
        localStorage.setItem(favKey, JSON.stringify(filtered));
      } catch (e) {}
      return filtered;
    });

    if (showToast) {
      showToast(
        removedMovieTitle
          ? `Removed "${removedMovieTitle}" from favorites`
          : "Removed from favorites",
        "info"
      );
    }

    // If signed in, remove from Supabase watchlist table
    if (currentUserId) {
      try {
        await supabase
          .from("watchlist")
          .delete()
          .eq("user_id", currentUserId)
          .eq("movie_id", targetId);
      } catch (err) {
        console.warn("Watchlist delete error:", err);
      }
    }
  };

  const isFavorite = (movieId) => {
    if (!movieId) return false;
    const targetId = String(movieId);
    return favorites.some((movie) => getId(movie) === targetId);
  };

  const setMovieRating = async (movieId, rating, review = "") => {
    if (!movieId) return;
    const targetId = String(movieId);
    const currentUserId = user?.id || null;
    const ratKey = getUserRatingsKey(currentUserId);

    setUserRatings((prev) => {
      const updated = {
        ...prev,
        [targetId]: { rating, review, updatedAt: new Date().toISOString() },
      };
      try {
        localStorage.setItem(ratKey, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (showToast) {
      showToast(`Saved rating (${rating}★) & review!`, "success");
    }

    // If signed in, save rating to Supabase ratings table
    if (currentUserId) {
      try {
        await supabase.from("ratings").upsert(
          {
            user_id: currentUserId,
            movie_id: targetId,
            stars: rating,
          },
          { onConflict: "user_id,movie_id" }
        );
      } catch (err) {
        console.warn("Supabase rating error:", err);
      }
    }
  };

  const getMovieRating = (movieId) => {
    if (!movieId) return null;
    return userRatings[String(movieId)] || null;
  };

  const value = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    userRatings,
    setMovieRating,
    getMovieRating,
    loadingWatchlist,
  };

  return <MovieContext.Provider value={value}>{children}</MovieContext.Provider>;
};
