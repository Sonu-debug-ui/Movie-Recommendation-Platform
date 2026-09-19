import { useState, useEffect, useRef, useMemo } from "react";
import { getMovieDetails } from "../services/api";
import { useMovieContext } from "../contexts/MovieContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import AuthModal from "./AuthModal";
import DottedOffsetButton from "./DottedOffsetButton";
import LiquidGlassButton from "./LiquidGlassButton";
import { getSafePosterUrl, handlePosterError } from "../utils/posterHelper";
import "../css/MovieModal.css";

// Known official YouTube video IDs mapped by IMDb ID for guaranteed HD playback
const TRAILER_MAP = {
  // Hollywood Blockbusters
  tt0848228: "eOrNl_zLfnU", // The Avengers
  tt4154796: "TcMBFSGVi1c", // Avengers: Endgame
  tt4154756: "6ZfuNTqbHE8", // Avengers: Infinity War
  tt15239678: "Way9Dexny3w", // Dune: Part Two
  tt1160419: "n9xhJrPXop4", // Dune
  tt1877830: "mqqft2x_Aa4", // The Batman
  tt1375666: "YoHD9XEInc0", // Inception
  tt0816692: "zSWdZVtXT7E", // Interstellar
  tt15398776: "uYPbbksJxIg", // Oppenheimer
  tt0133093: "vKQi3bBA1y8", // The Matrix
  tt9362722: "cqGjhVJWtEg", // Spider-Man: Across the Spider-Verse
  tt10872600: "JfVOs4VSpmA", // Spider-Man: No Way Home
  tt1745960: "qEVUtrk8_B4", // Top Gun: Maverick
  tt11358390: "23D-l6c8aJg", // Gladiator II
  tt1630029: "8Qn_spdM5Zg", // Avatar: The Way of Water
  tt6710474: "wxN1T1uxQ2g", // Everything Everywhere All at Once
  tt1856101: "gCcx85zbxz4", // Blade Runner 2049
  tt1392190: "hEJnMQG938g", // Mad Max: Fury Road
  tt0137523: "qtRKdV9zFKs", // Fight Club
  tt0068646: "UaVTIH8mujA", // The Godfather
  tt0120737: "V75dMMIW2B4", // The Lord of the Rings
  tt2543164: "tFMo3UJ4B4g", // Arrival
  tt0103064: "CRRlbK5w8AE", // Terminator 2: Judgment Day
  tt4912910: "wb49-oV0F78", // Mission: Impossible - Fallout
  tt0114369: "znmZoVkCjpI", // Seven
  tt0102926: "W6Mm8Sbe__o", // The Silence of the Lambs
  tt1130884: "5iaYLCiq5RM", // Shutter Island
  tt0209144: "4CV41hoyS8A", // Memento
  tt2267998: "2-_-1nJf8Vg", // Gone Girl
  tt0482571: "o4gHCmTQDVI", // The Prestige
  tt0110912: "s7EdQ4FqbhY", // Pulp Fiction
  tt0111161: "PLl99DlL6b4", // The Shawshank Redemption
  tt0167260: "r5X-hFf6Bwo", // The Lord of the Rings: Return of the King
  tt0050083: "TEN-2uTi2c0", // 12 Angry Men
  tt0108052: "gG22XNhtnoY", // Schindler's List
  tt2582802: "7d_jQycdQGo", // Whiplash
  tt0088763: "qvsgGtivCgs", // Back to the Future
  tt0099685: "qo5jJpHtI1Y", // Goodfellas

  // Bollywood Blockbusters
  tt10366206: "f_vbAtFSEc0", // RRR
  tt14365620: "COv52Qyctws", // Jawan
  tt10954600: "vqu4z34wENw", // Pathaan
  tt6856942: "JKa05nyUmuQ", // K.G.F: Chapter 2
  tt5074352: "dC-0qD5B8j0", // Dangal
  tt1187043: "K0eDlFX9GMc", // 3 Idiots
  tt4849494: "sOEg_yngLds", // Baahubali 2: The Conclusion
  tt13751694: "DybJscL595U", // Animal
  tt9179430: "sN75MPxgvX8", // Tumbbad
  tt4430212: "AuuX2j14NBg", // Drishyam
  tt15327088: "8mrVfZP6kMo", // Kantara
  tt1954470: "j-XG8j4w03E", // Gangs of Wasseypur
  tt1567102: "VJ9jE-Z_g7M", // Zindagi Na Milegi Dobara

  // K-Cinema & Anime
  tt6751668: "5xH0HfJHsaY", // Parasite
  tt2049403: "pyM3z73oMAk", // Train to Busan
  tt0119051: "ByXuk9QqQkk", // Spirited Away
  tt5311514: "s0wTdCQoc2k", // Your Name
  tt14247972: "fqDAfLgA_90", // Suzume
  tt11032374: "ATJYac_dORw", // Demon Slayer: Mugen Train
  tt14592960: "qqrpMRDuVfc", // Godzilla Minus One
  tt0119698: "4OiMOHRDs14", // Princess Mononoke
  tt0347149: "iwROgK94zcM", // Howl's Moving Castle
};

// Curated suggestion catalog with active, high-resolution posters and ratings
const RECOMMENDED_POOL = [
  { id: "tt15398776", title: "Oppenheimer", year: "2023", genre: "Biography, Drama, History", rating: "8.9", poster: "https://m.media-amazon.com/images/M/MV5BN2JkMDc5MGQtZjg3YS00NmFiLWIyZmQtZTJmNTM5MjVmYTQ4XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg" },
  { id: "tt15239678", title: "Dune: Part Two", year: "2024", genre: "Action, Adventure, Sci-Fi", rating: "8.5", poster: "https://m.media-amazon.com/images/M/MV5BNTc0YmQxMjEtODI5MC00NjFiLTlkMWUtOGQ5NjFmYWUyZGJhXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg" },
  { id: "tt0816692", title: "Interstellar", year: "2014", genre: "Adventure, Drama, Sci-Fi", rating: "8.7", poster: "https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg" },
  { id: "tt0468569", title: "The Dark Knight", year: "2008", genre: "Action, Crime, Drama", rating: "9.0", poster: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_QL75_UX380_CR0,0,380,562_.jpg" },
  { id: "tt1375666", title: "Inception", year: "2010", genre: "Action, Adventure, Sci-Fi", rating: "8.8", poster: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_QL75_UX380_CR0,0,380,562_.jpg" },
  { id: "tt1745960", title: "Top Gun: Maverick", year: "2022", genre: "Action, Drama", rating: "8.2", poster: "https://m.media-amazon.com/images/M/MV5BMDBkZDNjMWEtOTdmMi00NmExLTg5MmMtNTFlYTJlNWY5YTdmXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg" },
  { id: "tt8178634", title: "RRR", year: "2022", genre: "Action, Drama", rating: "7.8", poster: "https://m.media-amazon.com/images/M/MV5BNWMwODYyMjQtMTczMi00NTQ1LWFkYjItMGJhMWRkY2E3NDAyXkEyXkFqcGc@._V1_SX300.jpg" },
  { id: "tt15354916", title: "Jawan", year: "2023", genre: "Action, Thriller", rating: "6.9", poster: "https://m.media-amazon.com/images/M/MV5BMGExNGI1NDktOWI2Mi00NDM3LWIxMmQtNTQxYTgzMzI0MTA1XkEyXkFqcGc@._V1_SX300.jpg" },
  { id: "tt10366206", title: "John Wick: Chapter 4", year: "2023", genre: "Action, Crime, Thriller", rating: "7.6", poster: "https://m.media-amazon.com/images/M/MV5BY2Q2ZmI5ZjUtNWVhMC00YzJkLTlmYjMtY2RmZDhkNzEzYjZhXkEyXkFqcGc@._V1_SX300.jpg" },
  { id: "tt6751668", title: "Parasite", year: "2019", genre: "Drama, Thriller", rating: "8.5", poster: "https://m.media-amazon.com/images/M/MV5BYjk1Y2U4MjQtY2ZiNS00OWQyLWI3MmYtZWUwNmRjYWRiNWNhXkEyXkFqcGc@._V1_SX300.jpg" },
  { id: "tt1187043", title: "3 Idiots", year: "2009", genre: "Comedy, Drama", rating: "8.4", poster: "https://m.media-amazon.com/images/M/MV5BNzc4ZWQ3NmYtODE0Ny00YTQ4LTlkZWItNTBkMGQ0MmUwMmJlXkEyXkFqcGc@._V1_SX300.jpg" },
  { id: "tt5074352", title: "Dangal", year: "2016", genre: "Action, Biography, Drama", rating: "8.3", poster: "https://m.media-amazon.com/images/M/MV5BMTQ4MzQzMzM2Nl5BMl5BanBnXkFtZTgwMTQ1NzU3MDI@._V1_SX300.jpg" },
  { id: "tt5311514", title: "Your Name.", year: "2016", genre: "Animation, Drama, Fantasy", rating: "8.4", poster: "https://m.media-amazon.com/images/M/MV5BMjI1ODZkYTgtYTY3Yy00ZTJkLWFkOTgtZDUyYWM4MzQwNjk0XkEyXkFqcGc@._V1_SX300.jpg" },
  { id: "tt0172495", title: "Gladiator", year: "2000", genre: "Action, Adventure, Drama", rating: "8.5", poster: "https://m.media-amazon.com/images/M/MV5BYWQ4YmNjYjEtOWE1Zi00Y2U4LWI4NTAtMTU0MjkxNWQ1ZmJiXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg" },
  { id: "tt0133093", title: "The Matrix", year: "1999", genre: "Action, Sci-Fi", rating: "8.7", poster: "https://m.media-amazon.com/images/M/MV5BN2NmN2VhMTQtMDNiOS00NDlhLTliMjgtODE2ZTY0ODQyNDRhXkEyXkFqcGc@._V1_QL75_UX380_CR0,4,380,562_.jpg" },
  { id: "tt6710474", title: "Everything Everywhere All at Once", year: "2022", genre: "Action, Adventure, Comedy", rating: "7.7", poster: "https://m.media-amazon.com/images/M/MV5BOWNmMzAzZmQtNDQ1NC00Nzk5LTkyMmUtNGI2N2NkOWM4MzEyXkEyXkFqcGc@._V1_QL75_UY562_CR4,0,380,562_.jpg" },
  { id: "tt1856101", title: "Blade Runner 2049", year: "2017", genre: "Action, Drama, Mystery", rating: "8.0", poster: "https://m.media-amazon.com/images/M/MV5BNzA1Njg4NzYxOV5BMl5BanBnXkFtZTgwODk5NjU3MzI@._V1_QL75_UX380_CR0,4,380,562_.jpg" },
  { id: "tt1392190", title: "Mad Max: Fury Road", year: "2015", genre: "Action, Adventure, Sci-Fi", rating: "8.1", poster: "https://m.media-amazon.com/images/M/MV5BZDRkODJhOTgtOTc1OC00NTgzLTk4NjItNDgxZDY4YjlmNDY2XkEyXkFqcGc@._V1_SX300.jpg" },
  { id: "tt0245429", title: "Spirited Away", year: "2001", genre: "Animation, Adventure, Family", rating: "8.6", poster: "https://m.media-amazon.com/images/M/MV5BNTEyNmEwOWUtYzkyOC00ZTQ4LTllZmUtMjk0Y2YwOGUzYjRiXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg" },
  { id: "tt5700672", title: "Train to Busan", year: "2016", genre: "Action, Horror, Thriller", rating: "7.6", poster: "https://m.media-amazon.com/images/M/MV5BMTkwOTQ4OTg0OV5BMl5BanBnXkFtZTgwMzQyOTM0OTE@._V1_SX300.jpg" },
  { id: "tt0137523", title: "Fight Club", year: "1999", genre: "Drama", rating: "8.8", poster: "https://m.media-amazon.com/images/M/MV5BOTgyOGQ1NDItNGU3Ny00MjU3LTg2YWEtNmEyYjBiMjI1Y2M5XkEyXkFqcGc@._V1_QL75_UX380_CR0,4,380,562_.jpg" },
];

const extractYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

function MovieModal({ movie, onClose }) {
  const [currentMovie, setCurrentMovie] = useState(movie);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [communityReviews, setCommunityReviews] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const modalContentRef = useRef(null);

  const { user } = useAuth();
  const {
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    getMovieRating,
    setMovieRating,
  } = useMovieContext();

  const targetId = currentMovie.id || currentMovie.imdbID;
  const favorite = isFavorite(targetId);

  useEffect(() => {
    setCurrentMovie(movie);
  }, [movie]);

  // User star rating & review state
  const existingRatingData = getMovieRating(targetId);
  const [userStars, setUserStars] = useState(existingRatingData?.rating || 0);
  const [hoverStars, setHoverStars] = useState(0);
  const [reviewNote, setReviewNote] = useState(existingRatingData?.review || "");

  const fetchCommunityReviews = async (id) => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, content, created_at, is_flagged, profiles(name)")
        .eq("movie_id", String(id))
        .eq("is_flagged", false)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCommunityReviews(data);
      }
    } catch (err) {
      console.warn("Reviews fetch error:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      setLoading(true);
      try {
        // If movie is custom from Supabase, already has all details
        if (currentMovie.isCustom) {
          if (isMounted) setDetails(currentMovie);
        } else {
          const data = await getMovieDetails(targetId);
          if (isMounted) {
            setDetails(data || currentMovie);
          }
        }
      } catch (err) {
        console.error("Error loading movie details:", err);
        if (isMounted) setDetails(currentMovie);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetails();
    fetchCommunityReviews(targetId);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      isMounted = false;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentMovie, targetId, onClose]);

  const onFavoriteClick = (e) => {
    e.stopPropagation();
    if (favorite) removeFromFavorites(targetId);
    else addToFavorites(details || currentMovie);
  };

  const handleSaveUserRating = async (starCount) => {
    setUserStars(starCount);
    setMovieRating(targetId, starCount, reviewNote);

    if (user) {
      try {
        await supabase.from("ratings").upsert(
          {
            user_id: user.id,
            movie_id: String(targetId),
            stars: starCount,
          },
          { onConflict: "user_id,movie_id" }
        );
      } catch (err) {
        console.error("Rating save to Supabase error:", err);
      }
    }
  };

  const handleSaveReviewNote = async (e) => {
    e.preventDefault();
    if (!reviewNote.trim()) return;

    setMovieRating(targetId, userStars || 5, reviewNote);

    if (user) {
      try {
        const { error } = await supabase.from("reviews").insert([
          {
            user_id: user.id,
            movie_id: String(targetId),
            content: reviewNote.trim(),
            is_flagged: false,
          },
        ]);

        if (!error) {
          fetchCommunityReviews(targetId);
        }
      } catch (err) {
        console.error("Review save to Supabase error:", err);
      }
    }
  };

  const movieData = details || currentMovie;
  const genres = movieData.genre ? movieData.genre.split(", ") : [];
  const year = movieData.release_date || movieData.release_year || "";
  const primaryGenre = genres[0] || "";

  const handleSelectSuggestedMovie = (sug) => {
    setCurrentMovie(sug);
    setShowTrailer(false);
    if (modalContentRef.current) {
      modalContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const relatedSuggestions = useMemo(() => {
    const curGenre = (movieData?.genre || "").toLowerCase();
    const curId = (currentMovie.id || currentMovie.imdbID || "").toLowerCase();
    const curTitle = (movieData?.title || "").toLowerCase();

    // 1. Filter out current movie
    const filtered = RECOMMENDED_POOL.filter(
      (m) => m.id.toLowerCase() !== curId && m.title.toLowerCase() !== curTitle
    );

    // 2. Score by genre overlap
    const genreWords = curGenre.split(/[, ]+/).filter((w) => w.length > 2);
    const scored = filtered.map((m) => {
      let score = 0;
      const mGenre = m.genre.toLowerCase();
      for (const w of genreWords) {
        if (mGenre.includes(w)) score += 2;
      }
      return { ...m, score };
    });

    // 3. Sort by score, then by rating
    scored.sort((a, b) => b.score - a.score || parseFloat(b.rating) - parseFloat(a.rating));

    return scored.slice(0, 6);
  }, [movieData, currentMovie]);

  const videoId =
    TRAILER_MAP[targetId] || extractYouTubeId(movieData.trailer_url);

  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${movieData.title} ${movieData.release_date || movieData.release_year || ""} official trailer`
  )}`;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" ref={modalContentRef} onClick={(e) => e.stopPropagation()}>
          <button
            className="modal-close-btn"
            onClick={onClose}
            title="Close (Esc)"
          >
            ✕
          </button>

          {loading ? (
            <div className="modal-loading">Loading movie details...</div>
          ) : (
            <div className="modal-body">
              <div className="modal-header-grid">
                <div className="modal-poster-wrapper">
                  <img
                    src={getSafePosterUrl(movieData, movieData.title, year, primaryGenre)}
                    alt={movieData.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => handlePosterError(e, movieData.title, year, primaryGenre, movieData.id || movieData.imdbID)}
                  />
                </div>

                <div className="modal-info">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <h2 className="modal-title">{movieData.title}</h2>
                    {movieData.isCustom && (
                      <span
                        style={{
                          background: "linear-gradient(135deg, #e50914, #b20710)",
                          color: "#fff",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: "6px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        PREMIERE
                      </span>
                    )}
                  </div>

                  <div className="modal-meta-row">
                    {(movieData.release_date || movieData.release_year) && (
                      <span>
                        {movieData.release_date || movieData.release_year}
                      </span>
                    )}
                    {movieData.rated && (
                      <span className="badge-rated">{movieData.rated}</span>
                    )}
                    {movieData.runtime && <span>⏱ {movieData.runtime}</span>}
                  </div>

                  {genres.length > 0 && (
                    <div className="modal-genre-pills">
                      {genres.map((g, idx) => (
                        <span className="genre-pill" key={idx}>
                          {g}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="modal-ratings">
                    {movieData.imdbRating && movieData.imdbRating !== "N/A" && (
                      <div className="rating-box">
                        <span className="icon">⭐</span>
                        <span className="value">
                          Rating {movieData.imdbRating} / 10
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="modal-actions">
                    <DottedOffsetButton
                      label={showTrailer ? "Hide Trailer" : "Watch Trailer"}
                      padding="10px 22px"
                      rounded={30}
                      fill="#e50914"
                      colors={{
                        fill: "#e50914",
                        hoverFill: "#b80710",
                        textColor: "#FFFFFF",
                        hoverTextColor: "#FFFFFF",
                      }}
                      addIcon={true}
                      icon={{
                        side: "left",
                        size: 16,
                        symbol: "🎬",
                        color: "#FFFFFF",
                        hoverColor: "#FFFFFF",
                      }}
                      border={{
                        borderColor: "rgba(255, 255, 255, 0.4)",
                        borderStyle: "dashed",
                        borderWidth: 2,
                      }}
                      hover={{
                        offsetX: 5,
                        offsetY: 5,
                        rounded: 18,
                        borderColor: "#FFFFFF",
                      }}
                      shadow={{
                        color: "#ff2e3b",
                      }}
                      font={{
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                      onClick={() => setShowTrailer(!showTrailer)}
                    />

                    <DottedOffsetButton
                      label={favorite ? "Saved in Favorites" : "Add to Favorites"}
                      padding="10px 20px"
                      rounded={30}
                      fill={favorite ? "rgba(229, 9, 20, 0.25)" : "rgba(255, 255, 255, 0.08)"}
                      colors={{
                        fill: favorite ? "rgba(229, 9, 20, 0.25)" : "rgba(255, 255, 255, 0.08)",
                        hoverFill: "rgba(255, 255, 255, 0.16)",
                        textColor: favorite ? "#fca5a5" : "#FFFFFF",
                        hoverTextColor: "#FFFFFF",
                      }}
                      addIcon={true}
                      icon={{
                        side: "left",
                        size: 16,
                        symbol: "♥",
                        color: favorite ? "#ef4444" : "#ff4d6d",
                        hoverColor: "#ffffff",
                      }}
                      border={{
                        borderColor: favorite ? "rgba(239, 68, 68, 0.6)" : "rgba(255, 255, 255, 0.25)",
                        borderStyle: "dotted",
                        borderWidth: 2,
                      }}
                      hover={{
                        offsetX: 5,
                        offsetY: 5,
                        rounded: 18,
                        borderColor: favorite ? "#ef4444" : "#ffffff",
                      }}
                      shadow={{
                        color: favorite ? "#ef4444" : "#3b82f6",
                      }}
                      font={{
                        fontSize: 14,
                        fontWeight: 600,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                      onClick={onFavoriteClick}
                    />
                  </div>
                </div>
              </div>

              {showTrailer && (
                <div className="trailer-section">
                  <div className="trailer-header">
                    <h3>🎬 Official Trailer for {movieData.title}</h3>
                    <a
                      href={youtubeSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-open-youtube"
                    >
                      ▶ Watch in 4K on YouTube ↗
                    </a>
                  </div>

                  {videoId ? (
                    <div className="video-responsive">
                      <iframe
                        width="853"
                        height="480"
                        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={`${movieData.title} Official Trailer`}
                      />
                    </div>
                  ) : (
                    <div className="trailer-fallback-card">
                      <p>
                        🎥 Click below to stream the official high-definition
                        trailer on YouTube:
                      </p>
                      <a
                        href={youtubeSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-watch-youtube-lg"
                      >
                        ▶ Stream "{movieData.title}" Trailer on YouTube ↗
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="modal-plot">
                <h3>Overview</h3>
                <p>
                  {movieData.plot ||
                    movieData.description ||
                    "No description available for this title."}
                </p>

                <div className="modal-crew">
                  {movieData.director && (
                    <div className="crew-item">
                      <span>Director</span>
                      <strong>{movieData.director}</strong>
                    </div>
                  )}
                  {(movieData.actors || movieData.cast_members) && (
                    <div className="crew-item">
                      <span>Starring</span>
                      <strong>
                        {movieData.actors || movieData.cast_members}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Star Rating & Review Section */}
              <div className="user-rating-section">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <h3>⭐ Your Rating & Review</h3>
                  {!user && (
                    <button
                      type="button"
                      onClick={() => setShowAuthModal(true)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ff4d4d",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Sign In to sync reviews to database
                    </button>
                  )}
                </div>

                <div className="star-rating-picker">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${
                        star <= (hoverStars || userStars) ? "active" : ""
                      }`}
                      onClick={() => handleSaveUserRating(star)}
                      onMouseEnter={() => setHoverStars(star)}
                      onMouseLeave={() => setHoverStars(0)}
                    >
                      ★
                    </button>
                  ))}
                  <span className="rating-label">
                    {userStars > 0
                      ? `${userStars} / 5 Stars`
                      : "Click stars to rate"}
                  </span>
                </div>

                <form
                  onSubmit={handleSaveReviewNote}
                  className="user-review-form"
                >
                  <textarea
                    placeholder={
                      user
                        ? "Write your personal thoughts or review of this movie..."
                        : "Sign in to post public reviews, or type personal notes here..."
                    }
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    className="review-textarea"
                    rows="3"
                  />
                  <LiquidGlassButton
                    type="submit"
                    label="💾 Save Review"
                    rounded={10}
                    padding="9px 20px"
                    fontSize={14}
                    bg="rgba(229, 9, 20, 0.18)"
                    hoverBg="rgba(229, 9, 20, 0.38)"
                    border="rgba(229, 9, 20, 0.45)"
                    hoverBorder="rgba(229, 9, 20, 0.9)"
                    shine="rgba(255,255,255,0.12)"
                    hoverShine="rgba(255,255,255,0.3)"
                    style={{ alignSelf: "flex-end" }}
                  />
                </form>
              </div>

              {/* Community Reviews Feed */}
              {communityReviews.length > 0 && (
                <div style={{ marginTop: "2rem" }}>
                  <h3
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    💬 Community Reviews ({communityReviews.length})
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {communityReviews.map((rev) => (
                      <div
                        key={rev.id}
                        style={{
                          background: "rgba(0, 0, 0, 0.3)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "10px",
                          padding: "12px 16px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "6px",
                          }}
                        >
                          <strong style={{ color: "#e2e8f0", fontSize: "0.9rem" }}>
                            {rev.profiles?.name || "Verified Viewer"}
                          </strong>
                          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                            {new Date(rev.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p
                          style={{
                            color: "#94a3b8",
                            fontSize: "0.9rem",
                            lineHeight: "1.4",
                            margin: 0,
                          }}
                        >
                          "{rev.content}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* More Movies Like This / Suggestions */}
              {relatedSuggestions.length > 0 && (
                <div className="modal-suggestions-section">
                  <div className="modal-suggestions-header">
                    <h3 className="modal-suggestions-title">
                      🍿 More Movies Like This • CineFlix Suggestions
                    </h3>
                    <span className="modal-suggestions-subtitle">
                      Curated recommendations based on genre & ratings
                    </span>
                  </div>

                  <div className="modal-suggestions-grid">
                    {relatedSuggestions.map((sug) => (
                      <div
                        key={sug.id}
                        className="modal-suggestion-card"
                        onClick={() => handleSelectSuggestedMovie(sug)}
                        title={`View ${sug.title}`}
                      >
                        <div className="modal-suggestion-poster">
                          <img
                            src={getSafePosterUrl(sug, sug.title, sug.year, sug.genre)}
                            alt={sug.title}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={(e) =>
                              handlePosterError(e, sug.title, sug.year, sug.genre, sug.id)
                            }
                          />
                          <span className="modal-suggestion-rating-badge">
                            ⭐ {sug.rating}
                          </span>
                        </div>
                        <div className="modal-suggestion-info">
                          <h4 className="modal-suggestion-card-title">{sug.title}</h4>
                          <div className="modal-suggestion-meta">
                            <span>{sug.year}</span>
                            {sug.genre && (
                              <span className="modal-suggestion-genre-pill">
                                {sug.genre.split(",")[0].trim()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
}

export default MovieModal;
