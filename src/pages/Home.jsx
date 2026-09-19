import MovieCard from "../components/MovieCard";
import SkeletonCard from "../components/SkeletonCard";
import MovieModal from "../components/MovieModal";
import HeroSpotlight from "../components/HeroSpotlight";
import StatsBar from "../components/StatsBar";
import HomeSuggestionsRail from "../components/HomeSuggestionsRail";
import Loader from "../components/Loader";
import { useState, useEffect, useRef } from "react";
import { searchMovies, getPopularMovies, fetchBatchMovies } from "../services/api";
import { useDebounce } from "../hooks/useDebounce";
import { supabase } from "../lib/supabase";
import { getSafePosterUrl, handlePosterError } from "../utils/posterHelper";
import "../css/Home.css";

const BASE_GENRES = [
  {
    id: "all",
    label: "🔥 Global Trending",
    ids: [
      "tt15398776", // Oppenheimer (2023)
      "tt15239678", // Dune: Part Two (2024)
      "tt4154796",  // Avengers: Endgame (2019)
      "tt0816692",  // Interstellar (2014)
      "tt0468569",  // The Dark Knight (2008)
      "tt10872600", // Spider-Man: No Way Home (2021)
      "tt1375666",  // Inception (2010)
      "tt1745960",  // Top Gun: Maverick (2022)
      "tt8178634",  // RRR (2022)
      "tt15354916", // Jawan (2023)
      "tt10366206", // John Wick: Chapter 4 (2023)
      "tt6751668",  // Parasite (2019)
      "tt1187043",  // 3 Idiots (2009)
      "tt5074352",  // Dangal (2016)
      "tt5311514",  // Your Name. (2016)
      "tt0172495",  // Gladiator (2000)
      "tt6710474",  // Everything Everywhere All at Once (2022)
      "tt1856101",  // Blade Runner 2049 (2017)
      "tt1392190",  // Mad Max: Fury Road (2015)
      "tt0133093",  // The Matrix (1999)
    ],
  },
  {
    id: "hollywood",
    label: "🎬 Hollywood",
    ids: [
      "tt15398776", // Oppenheimer (2023)
      "tt0468569",  // The Dark Knight (2008)
      "tt4154796",  // Avengers: Endgame (2019)
      "tt0816692",  // Interstellar (2014)
      "tt1375666",  // Inception (2010)
      "tt1745960",  // Top Gun: Maverick (2022)
      "tt0172495",  // Gladiator (2000)
      "tt0133093",  // The Matrix (1999)
      "tt0110912",  // Pulp Fiction (1994)
      "tt0111161",  // The Shawshank Redemption (1994)
      "tt0109830",  // Forrest Gump (1994)
      "tt1160419",  // Dune (2021)
      "tt0068646",  // The Godfather (1972)
      "tt0120737",  // The Lord of the Rings (2001)
      "tt0137523",  // Fight Club (1999)
      "tt0108052",  // Schindler's List (1994)
    ],
  },
  {
    id: "bollywood",
    label: "🇮🇳 Bollywood",
    ids: [
      "tt8178634",  // RRR (2022)
      "tt15354916", // Jawan (2023)
      "tt12844910", // Pathaan (2023)
      "tt5074352",  // Dangal (2016)
      "tt1187043",  // 3 Idiots (2009)
      "tt2631186",  // Baahubali: The Beginning (2015)
      "tt10698680", // K.G.F: Chapter 2 (2022)
      "tt13751694", // Animal (2023)
      "tt2356180",  // Bhaag Milkha Bhaag (2013)
      "tt9389998",  // Pushpa: The Rise (2021)
      "tt7466810",  // 777 Charlie (2022)
      "tt0073707",  // Sholay (1975)
      "tt0112870",  // Dilwale Dulhania Le Jayenge (1995)
      "tt0169102",  // Lagaan (2001)
      "tt1430612",  // PK (2014)
    ],
  },
  {
    id: "korean",
    label: "🇰🇷 K-Cinema",
    ids: [
      "tt6751668",  // Parasite (2019)
      "tt5700672",  // Train to Busan (2016)
      "tt0364569",  // Oldboy (2003)
      "tt5215952",  // The Wailing (2016)
      "tt4016934",  // The Handmaiden (2016)
      "tt0468492",  // The Host (2006)
      "tt0353969",  // Memories of Murder (2003)
      "tt1588170",  // I Saw the Devil (2010)
      "tt6878038",  // A Taxi Driver (2017)
      "tt3501416",  // Assassination (2015)
      "tt7282468",  // Burning (2018)
    ],
  },
  {
    id: "anime",
    label: "⛩️ Anime / Japan",
    ids: [
      "tt0245429",  // Spirited Away (2001)
      "tt5311514",  // Your Name. (2016)
      "tt11032374", // Demon Slayer: Mugen Train (2020)
      "tt0119698",  // Princess Mononoke (1997)
      "tt23289160", // Godzilla Minus One (2023)
      "tt0347149",  // Howl's Moving Castle (2004)
      "tt9426210",  // Weathering with You (2019)
      "tt0094625",  // Akira (1988)
      "tt5323662",  // A Silent Voice (2016)
    ],
  },
  {
    id: "action",
    label: "⚡ Action",
    ids: [
      "tt10366206", // John Wick: Chapter 4 (2023)
      "tt1745960",  // Top Gun: Maverick (2022)
      "tt1392190",  // Mad Max: Fury Road (2015)
      "tt0468569",  // The Dark Knight (2008)
      "tt1345836",  // The Dark Knight Rises (2012)
      "tt4912910",  // Mission: Impossible - Fallout (2018)
      "tt0172495",  // Gladiator (2000)
      "tt0133093",  // The Matrix (1999)
      "tt0103064",  // Terminator 2: Judgment Day (1991)
      "tt8178634",  // RRR (2022)
    ],
  },
  {
    id: "scifi",
    label: "🚀 Sci-Fi",
    ids: [
      "tt0816692",  // Interstellar (2014)
      "tt15239678", // Dune: Part Two (2024)
      "tt1375666",  // Inception (2010)
      "tt1856101",  // Blade Runner 2049 (2017)
      "tt0133093",  // The Matrix (1999)
      "tt6710474",  // Everything Everywhere All at Once (2022)
      "tt2543164",  // Arrival (2016)
      "tt1631867",  // Edge of Tomorrow (2014)
      "tt6723592",  // Tenet (2020)
      "tt0103064",  // Terminator 2: Judgment Day (1991)
    ],
  },
  {
    id: "comedy",
    label: "😂 Comedy",
    ids: [
      "tt1119646",  // The Hangover (2009)
      "tt0829482",  // Superbad (2007)
      "tt1431045",  // Deadpool (2016)
      "tt1187043",  // 3 Idiots (2009)
      "tt2278388",  // The Grand Budapest Hotel (2014)
      "tt8946378",  // Knives Out (2019)
      "tt0365748",  // Shaun of the Dead (2004)
    ],
  },
  {
    id: "masterpieces",
    label: "👑 Masterpieces",
    ids: [
      "tt0111161", // The Shawshank Redemption (1994)
      "tt0068646", // The Godfather (1972)
      "tt0110912", // Pulp Fiction (1994)
      "tt0050083", // 12 Angry Men (1957)
      "tt0108052", // Schindler's List (1994)
      "tt0167260", // The Lord of the Rings: Return of the King (2003)
      "tt0137523", // Fight Club (1999)
      "tt0109830", // Forrest Gump (1994)
      "tt2582802", // Whiplash (2014)
      "tt0099685", // Goodfellas (1990)
    ],
  },
  {
    id: "thriller",
    label: "🕵️ Thriller & Mystery",
    ids: [
      "tt0114369", // Seven (1995)
      "tt0102926", // The Silence of the Lambs (1991)
      "tt1130884", // Shutter Island (2010)
      "tt0209144", // Memento (2001)
      "tt2267998", // Gone Girl (2014)
      "tt1392214", // Prisoners (2013)
      "tt0443706", // Zodiac (2007)
      "tt0482571", // The Prestige (2006)
      "tt4430212", // Drishyam (2015)
      "tt9179430", // Tumbbad (2018)
    ],
  },
  {
    id: "horror",
    label: "👻 Horror",
    ids: [
      "tt1457767",  // The Conjuring (2013)
      "tt7784604",  // Hereditary (2018)
      "tt6644200",  // A Quiet Place (2018)
      "tt5052448",  // Get Out (2017)
      "tt0081505",  // The Shining (1980)
      "tt1396484",  // It (2017)
      "tt1922777",  // Sinister (2012)
    ],
  },
];

// Curated popular movie suggestions with verified posters and ratings
export const POPULAR_SUGGESTIONS = [
  { id: "tt15398776", title: "Oppenheimer", year: "2023", genre: "Biography, Drama", rating: "8.9", poster: "https://m.media-amazon.com/images/M/MV5BN2JkMDc5MGQtZjg3YS00NmFiLWIyZmQtZTJmNTM5MjVmYTQ4XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg" },
  { id: "tt15239678", title: "Dune: Part Two", year: "2024", genre: "Action, Sci-Fi", rating: "8.5", poster: "https://m.media-amazon.com/images/M/MV5BNTc0YmQxMjEtODI5MC00NjFiLTlkMWUtOGQ5NjFmYWUyZGJhXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg" },
  { id: "tt0816692", title: "Interstellar", year: "2014", genre: "Sci-Fi, Adventure", rating: "8.7", poster: "https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg" },
  { id: "tt0468569", title: "The Dark Knight", year: "2008", genre: "Action, Crime", rating: "9.0", poster: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_QL75_UX380_CR0,0,380,562_.jpg" },
  { id: "tt0111161", title: "The Shawshank Redemption", year: "1994", genre: "Drama", rating: "9.3", poster: "https://m.media-amazon.com/images/M/MV5BMDAyY2FhYjctNDc5OS00MDNlLThiMGUtY2UxYWVkNGY2ZjljXkEyXkFqcGc@._V1_QL75_UX380_CR0,4,380,562_.jpg" },
  { id: "tt0068646", title: "The Godfather", year: "1972", genre: "Crime, Drama", rating: "9.2", poster: "https://m.media-amazon.com/images/M/MV5BNGEwYjgwOGQtYjg5ZS00Njc1LTk2ZGEtM2QwZWQ2NjdhZTE5XkEyXkFqcGc@._V1_QL75_UY562_CR8,0,380,562_.jpg" },
  { id: "tt0114369", title: "Seven", year: "1995", genre: "Crime, Mystery", rating: "8.6", poster: "https://m.media-amazon.com/images/M/MV5BY2IzNzMxZjctZjUxZi00YzAxLTk3ZjMtODFjODdhMDU5NDM1XkEyXkFqcGc@._V1_QL75_UX380_CR0,16,380,562_.jpg" },
  { id: "tt0482571", title: "The Prestige", year: "2006", genre: "Mystery, Sci-Fi", rating: "8.5", poster: "https://m.media-amazon.com/images/M/MV5BMTM3MzQ5MjQ5OF5BMl5BanBnXkFtZTcwMTQ3NzMzMw@@._V1_QL75_UY562_CR0,0,380,562_.jpg" },
  { id: "tt1745960", title: "Top Gun: Maverick", year: "2022", genre: "Action, Drama", rating: "8.2", poster: "https://m.media-amazon.com/images/M/MV5BMDBkZDNjMWEtOTdmMi00NmExLTg5MmMtNTFlYTJlNWY5YTdmXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg" },
  { id: "tt8178634", title: "RRR", year: "2022", genre: "Action, Drama", rating: "7.8", poster: "https://m.media-amazon.com/images/M/MV5BNWMwODYyMjQtMTczMi00NTQ1LWFkYjItMGJhMWRkY2E3NDAyXkEyXkFqcGc@._V1_SX300.jpg" },
  { id: "tt15354916", title: "Jawan", year: "2023", genre: "Action, Thriller", rating: "6.9", poster: "https://m.media-amazon.com/images/M/MV5BMGExNGI1NDktOWI2Mi00NDM3LWIxMmQtNTQxYTgzMzI0MTA1XkEyXkFqcGc@._V1_SX300.jpg" },
  { id: "tt10366206", title: "John Wick: Chapter 4", year: "2023", genre: "Action, Crime", rating: "7.6", poster: "https://m.media-amazon.com/images/M/MV5BY2Q2ZmI5ZjUtNWVhMC00YzJkLTlmYjMtY2RmZDhkNzEzYjZhXkEyXkFqcGc@._V1_SX300.jpg" },
  { id: "tt6751668", title: "Parasite", year: "2019", genre: "Drama, Thriller", rating: "8.5", poster: "https://m.media-amazon.com/images/M/MV5BYjk1Y2U4MjQtY2ZiNS00OWQyLWI3MmYtZWUwNmRjYWRiNWNhXkEyXkFqcGc@._V1_SX300.jpg" },
  { id: "tt1187043", title: "3 Idiots", year: "2009", genre: "Comedy, Drama", rating: "8.4", poster: "https://m.media-amazon.com/images/M/MV5BNzc4ZWQ3NmYtODE0Ny00YTQ4LTlkZWItNTBkMGQ0MmUwMmJlXkEyXkFqcGc@._V1_SX300.jpg" },
  { id: "tt9179430", title: "Tumbbad", year: "2018", genre: "Fantasy, Horror", rating: "8.2", poster: "https://m.media-amazon.com/images/M/MV5BNzdmZTFiZjEtNWI1MC00MDk2LTk4YzktNzQ0NmEwNGI4YmNhXkEyXkFqcGc@._V1_QL75_UX380_CR0,4,380,562_.jpg" },
  { id: "tt5311514", title: "Your Name.", year: "2016", genre: "Anime, Fantasy", rating: "8.4", poster: "https://m.media-amazon.com/images/M/MV5BMjI1ODZkYTgtYTY3Yy00ZTJkLWFkOTgtZDUyYWM4MzQwNjk0XkEyXkFqcGc@._V1_SX300.jpg" },
  { id: "tt0133093", title: "The Matrix", year: "1999", genre: "Action, Sci-Fi", rating: "8.7", poster: "https://m.media-amazon.com/images/M/MV5BN2NmN2VhMTQtMDNiOS00NDlhLTliMjgtODE2ZTY0ODQyNDRhXkEyXkFqcGc@._V1_QL75_UX380_CR0,4,380,562_.jpg" },
];

export const QUICK_TAGS = [
  "Oppenheimer",
  "Dune",
  "Interstellar",
  "The Dark Knight",
  "Top Gun",
  "Shawshank",
  "The Godfather",
  "Prestige",
  "Seven",
  "Tumbbad",
  "RRR",
  "Jawan",
  "John Wick",
  "Parasite",
  "Anime",
  "Sci-Fi",
  "Bollywood",
  "Masterpieces",
  "Thriller",
];

function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [customCatalogMovies, setCustomCatalogMovies] = useState([]);
  const [genresList, setGenresList] = useState(BASE_GENRES);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);

  // Live preview suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMovieModal, setSelectedMovieModal] = useState(null);

  const debouncedQuery = useDebounce(searchQuery, 300);
  const searchContainerRef = useRef(null);
  const gridTopRef = useRef(null);

  // 1. Fetch custom catalog movies from Supabase database
  const fetchSupabaseMovies = async () => {
    try {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const formatted = data.map((m) => ({
          id: m.id,
          imdbID: m.imdb_id || m.id,
          title: m.title,
          poster_path: m.poster_url,
          poster_url: m.poster_url,
          poster: m.poster_url,
          release_date: m.release_year ? `${m.release_year}-01-01` : "",
          release_year: m.release_year,
          genre: m.genre || "Featured",
          plot: m.description,
          description: m.description,
          director: m.director,
          actors: m.cast_members,
          cast_members: m.cast_members,
          trailer_url: m.trailer_url,
          imdbRating: "9.6",
          isCustom: true,
        }));
        setCustomCatalogMovies(formatted);
        return formatted;
      }
    } catch (e) {
      console.warn("Supabase movies fetch notice:", e);
    }
    return [];
  };

  // 2. Fetch dynamic genres from Supabase database
  const fetchSupabaseGenres = async () => {
    try {
      const { data, error } = await supabase
        .from("genres")
        .select("id, name")
        .order("name", { ascending: true });

      if (!error && data && data.length > 0) {
        const dynamic = data.map((g) => ({
          id: g.name.toLowerCase().replace(/[^a-z0-9]/g, ""),
          label: `🏷️ ${g.name}`,
          name: g.name,
          queries: [g.name.toLowerCase()],
          isDynamic: true,
        }));

        setGenresList((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const toAdd = dynamic.filter((d) => !existingIds.has(d.id));
          return [...prev, ...toAdd];
        });
      }
    } catch (e) {
      console.warn("Supabase genres fetch notice:", e);
    }
  };

  // Load popular movies + custom database movies on initial mount
  useEffect(() => {
    const loadInitialCatalog = async () => {
      try {
        const [customMovies, popularMovies] = await Promise.all([
          fetchSupabaseMovies(),
          getPopularMovies(1),
          fetchSupabaseGenres(),
        ]);

        // Merge custom catalog movies at the top
        const merged = [...customMovies, ...popularMovies];
        setMovies(merged);
      } catch (err) {
        console.error("Initial load error:", err);
        setError("Failed to load movies...");
      } finally {
        setLoading(false);
      }
    };

    loadInitialCatalog();
  }, []);

  // Fetch live suggestions as user types (debounced)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setSuggestionsLoading(true);
      setShowDropdown(true);

      try {
        const localMatches = customCatalogMovies.filter(
          (m) =>
            m.title?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            m.genre?.toLowerCase().includes(debouncedQuery.toLowerCase())
        );

        const apiResults = await searchMovies(debouncedQuery, 1);
        setSuggestions([...localMatches, ...apiResults].slice(0, 10));
      } catch (err) {
        console.error("Live search suggestion error:", err);
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery, customCatalogMovies]);

  // Click outside listener for suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearchSubmit = async (e, overrideQuery = null) => {
    if (e && e.preventDefault) e.preventDefault();
    setShowDropdown(false);

    const queryToUse = (overrideQuery !== null ? overrideQuery : searchQuery).trim();
    if (!queryToUse) return;
    if (loading) return;

    setLoading(true);
    setCurrentPage(1);
    setActiveGenre("");

    try {
      const matchingCustom = customCatalogMovies.filter(
        (m) =>
          m.title?.toLowerCase().includes(queryToUse.toLowerCase()) ||
          m.genre?.toLowerCase().includes(queryToUse.toLowerCase()) ||
          m.director?.toLowerCase().includes(queryToUse.toLowerCase())
      );

      const searchResults = await searchMovies(queryToUse, 1);
      setMovies([...matchingCustom, ...searchResults]);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to search movies...");
    } finally {
      setLoading(false);
    }
  };

  const handleGenreClick = async (genre) => {
    if (activeGenre === genre.id) return;

    setActiveGenre(genre.id);
    setSearchQuery("");
    setCurrentPage(1);
    setLoading(true);
    setError(null);

    try {
      let matchingCustom = [];
      if (genre.id === "all") {
        matchingCustom = customCatalogMovies;
      } else {
        matchingCustom = customCatalogMovies.filter((m) =>
          m.genre?.toLowerCase().includes(genre.name?.toLowerCase() || genre.id.toLowerCase())
        );
      }

      const results = await fetchBatchMovies(genre, 1);
      setMovies([...matchingCustom, ...results]);
    } catch (err) {
      console.error("Genre fetch error:", err);
      setError(`Failed to load ${genre.label} movies...`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPage = async (pageNumber) => {
    setLoading(true);
    setError(null);

    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: "smooth" });
    }

    try {
      let results = [];
      if (searchQuery.trim()) {
        results = await searchMovies(searchQuery, pageNumber);
      } else if (activeGenre) {
        const genreObj = genresList.find((g) => g.id === activeGenre);
        if (genreObj) {
          results = await fetchBatchMovies(genreObj, pageNumber);
        } else {
          results = await getPopularMovies(pageNumber);
        }
      } else {
        results = await getPopularMovies(pageNumber);
      }
      setMovies(results);
    } catch (err) {
      console.error("Page fetch error:", err);
      setError("Failed to load page results...");
    } finally {
      setLoading(false);
    }
  };

  const handlePrevPage = () => {
    if (currentPage <= 1 || loading) return;
    const prevPage = currentPage - 1;
    setCurrentPage(prevPage);
    fetchPage(prevPage);
  };

  const handleNextPage = () => {
    if (loading) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchPage(nextPage);
  };

  const handleSelectSuggestion = (movie) => {
    setShowDropdown(false);
    setSelectedMovieModal(movie);
  };

  const getSortedMovies = (list, sortKey) => {
    const items = [...list];
    if (sortKey === "year-desc") {
      return items.sort(
        (a, b) =>
          (parseInt(b.release_date || b.release_year) || 0) -
          (parseInt(a.release_date || a.release_year) || 0)
      );
    }
    if (sortKey === "rating-desc") {
      return items.sort(
        (a, b) =>
          (parseFloat(b.imdbRating || b.vote_average) || 0) -
          (parseFloat(a.imdbRating || a.vote_average) || 0)
      );
    }
    if (sortKey === "title-asc") {
      return items.sort((a, b) => a.title.localeCompare(b.title));
    }
    return items;
  };

  const sortedMovies = getSortedMovies(movies, sortBy);

  return (
    <div className="home">
      {!loading && movies.length > 0 && (
        <>
          <HeroSpotlight
            movies={movies}
            onOpenModal={(movie) => setSelectedMovieModal(movie)}
          />
          <StatsBar />
        </>
      )}

      <div className="search-container" ref={searchContainerRef}>
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search movies globally (Hollywood, Bollywood, K-Cinema, Anime)..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowDropdown(true)}
            />

            {showDropdown && (
              <div className="search-suggestions-dropdown">
                {searchQuery.trim().length < 2 ? (
                  <>
                    <div className="suggestions-header-bar">
                      <span className="suggestions-badge">⚡ POPULAR PICKS</span>
                      <span className="suggestions-subtitle">Click to search or explore</span>
                    </div>

                    <div className="suggestions-quick-chips">
                      {QUICK_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          className="suggestion-chip"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSearchQuery(tag);
                            handleSearchSubmit(e, tag);
                          }}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    <div className="suggestions-list-header">
                      🔥 Trending Movie Suggestions
                    </div>

                    {POPULAR_SUGGESTIONS.map((movie) => (
                      <div
                        key={movie.id}
                        className="suggestion-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectSuggestion(movie);
                        }}
                      >
                        <img
                          src={getSafePosterUrl(movie, movie.title, movie.year, movie.genre)}
                          alt={movie.title}
                          className="suggestion-thumb"
                          referrerPolicy="no-referrer"
                          onError={(e) => handlePosterError(e, movie.title, movie.year, movie.genre, movie.id)}
                        />
                        <div className="suggestion-details">
                          <span className="suggestion-title">{movie.title}</span>
                          <div className="suggestion-meta-row">
                            <span className="suggestion-year">{movie.year}</span>
                            <span className="suggestion-rating">⭐ {movie.rating}</span>
                            {movie.genre && (
                              <span className="suggestion-genre-pill">
                                {movie.genre.split(",")[0].trim()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : suggestionsLoading ? (
                  <div style={{ padding: "1rem", display: "flex", justifyContent: "center" }}>
                    <Loader variant="inline" text="Searching movies & suggestions..." />
                  </div>
                ) : suggestions.length > 0 ? (
                  <>
                    <div className="suggestions-list-header">
                      🎬 Matching Movie Suggestions ({suggestions.length})
                    </div>
                    {suggestions.map((movie) => (
                      <div
                        key={movie.id}
                        className="suggestion-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectSuggestion(movie);
                        }}
                      >
                        <img
                          src={getSafePosterUrl(movie, movie.title, movie.release_date || movie.release_year)}
                          alt={movie.title}
                          className="suggestion-thumb"
                          referrerPolicy="no-referrer"
                          onError={(e) =>
                            handlePosterError(
                              e,
                              movie.title,
                              movie.release_date || movie.release_year,
                              movie.genre || "",
                              movie.id || movie.imdbID || ""
                            )
                          }
                        />
                        <div className="suggestion-details">
                          <span className="suggestion-title">{movie.title}</span>
                          <div className="suggestion-meta-row">
                            <span className="suggestion-year">
                              {movie.release_date || movie.release_year}
                            </span>
                            {movie.imdbRating && movie.imdbRating !== "N/A" && (
                              <span className="suggestion-rating">⭐ {movie.imdbRating}</span>
                            )}
                            {movie.genre && (
                              <span className="suggestion-genre-pill">
                                {movie.genre.split(",")[0].trim()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="suggestion-empty">No movie suggestions found for "{searchQuery}"</div>
                )}
              </div>
            )}
          </div>

          <button type="submit" className="search-button">
            Search
          </button>
        </form>
      </div>

      {/* CineFlix Dedicated Movie Suggestions & Recommendations Rail */}
      <HomeSuggestionsRail
        onSelectMovie={(movie) => setSelectedMovieModal(movie)}
      />

      <div className="genre-filter-bar" ref={gridTopRef}>
        {genresList.map((g) => (
          <button
            key={g.id}
            className={`genre-chip ${activeGenre === g.id ? "active" : ""}`}
            onClick={() => handleGenreClick(g)}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="movies-control-bar">
        <div className="sort-container">
          <span className="sort-label">🎛️ Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="default">Default Trending</option>
            <option value="year-desc">📅 Release Year (Newest)</option>
            <option value="rating-desc">⭐ Highest Rating</option>
            <option value="title-asc">🔤 Title (A - Z)</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <Loader
          variant="section"
          text="Curating cinema blockbusters & recommendations..."
        />
      ) : (
        <>
          <div className="movies-grid">
            {sortedMovies.map((movie) => (
              <MovieCard movie={movie} key={movie.id} />
            ))}
          </div>

          {/* Join Pagination Bar Controls */}
          <div className="pagination-wrapper">
            <div className="join">
              <button
                className="join-item btn"
                onClick={handlePrevPage}
                disabled={currentPage === 1 || loading}
                title="Previous Page"
              >
                «
              </button>
              <button className="join-item btn active">
                Page {currentPage}
              </button>
              <button
                className="join-item btn"
                onClick={handleNextPage}
                disabled={loading || sortedMovies.length === 0}
                title="Next Page"
              >
                »
              </button>
            </div>
          </div>
        </>
      )}

      {selectedMovieModal && (
        <MovieModal
          movie={selectedMovieModal}
          onClose={() => setSelectedMovieModal(null)}
        />
      )}
    </div>
  );
}

export default Home;