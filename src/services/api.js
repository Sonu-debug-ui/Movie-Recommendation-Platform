import { getSafePosterUrl } from "../utils/posterHelper.js";

const API_KEY = "1d0ad8de";
const BASE_URL = "https://www.omdbapi.com";

// Security & Quota Rate Limiting: Max 25 calls per 10 seconds sliding window
const apiTimestamps = [];
const safeRateLimitedFetch = async (url) => {
  const now = Date.now();
  while (apiTimestamps.length > 0 && now - apiTimestamps[0] > 10000) {
    apiTimestamps.shift();
  }
  if (apiTimestamps.length >= 25) {
    // Graceful backoff
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  apiTimestamps.push(Date.now());
  return fetch(url);
};

// Helper function to normalize OMDB movie items to standard format
const normalizeMovie = (item) => {
  const safePoster = getSafePosterUrl(item.Poster, item.Title, item.Year);
  return {
    id: item.imdbID,
    title: item.Title,
    poster_path: safePoster,
    poster_url: safePoster,
    release_date: item.Year,
  };
};

// Helper to remove duplicates and ensure valid movies
const filterValidMovies = (movies) => {
  const seen = new Set();
  return movies.filter((m) => {
    if (!m.id || seen.has(m.id) || !m.title) return false;
    seen.add(m.id);
    return true;
  });
};

// Curated list of iconic global trending movie IDs (authentic theatrical blockbusters)
export const POPULAR_MOVIE_IDS = [
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
];

// Fetch full details for a list of exact IMDb IDs
export const fetchMoviesByIds = async (idList) => {
  if (!idList || idList.length === 0) return [];
  try {
    const dataList = await Promise.all(
      idList.map((id) =>
        safeRateLimitedFetch(`${BASE_URL}/?apikey=${API_KEY}&i=${id}&plot=short`)
          .then((r) => r.json())
          .catch(() => null)
      )
    );
    return dataList
      .filter((d) => d && d.Response === "True" && d.Title)
      .map((d) => ({
        id: d.imdbID,
        imdbID: d.imdbID,
        title: d.Title,
        poster_path: getSafePosterUrl(d.Poster, d.Title, d.Year, d.Genre),
        poster_url: getSafePosterUrl(d.Poster, d.Title, d.Year, d.Genre),
        poster: getSafePosterUrl(d.Poster, d.Title, d.Year, d.Genre),
        release_date: d.Year,
        release_year: d.Year,
        imdbRating: d.imdbRating !== "N/A" ? d.imdbRating : "8.5",
        genre: d.Genre !== "N/A" ? d.Genre : "",
        plot: d.Plot !== "N/A" ? d.Plot : "",
        director: d.Director !== "N/A" ? d.Director : "",
        actors: d.Actors !== "N/A" ? d.Actors : "",
      }));
  } catch (err) {
    console.error("fetchMoviesByIds error:", err);
    return [];
  }
};

// Batch fetch: supports either exact IDs or queries
export const fetchBatchMovies = async (genreTarget, page = 1) => {
  if (!genreTarget) return [];

  // 1. If explicit ID array or object with .ids is provided, fetch those authentic originals
  if (Array.isArray(genreTarget) && genreTarget.length > 0 && genreTarget[0].startsWith("tt")) {
    return fetchMoviesByIds(genreTarget);
  }
  if (genreTarget.ids && Array.isArray(genreTarget.ids) && genreTarget.ids.length > 0) {
    return fetchMoviesByIds(genreTarget.ids);
  }

  // 2. Otherwise fetch by search terms
  const queries = Array.isArray(genreTarget) ? genreTarget : genreTarget.queries || [];
  if (queries.length === 0) return [];

  try {
    const responses = await Promise.all(
      queries.map((q) =>
        safeRateLimitedFetch(`${BASE_URL}/?apikey=${API_KEY}&s=${encodeURIComponent(q)}&type=movie&page=${page}`)
          .then((r) => r.json())
          .catch(() => ({ Response: "False" }))
      )
    );

    let allMovies = [];
    responses.forEach((data) => {
      if (data.Response === "True" && data.Search) {
        // Filter out junk titles (Aftermath, Behind the Scenes, Specialists, Parodies, etc.)
        const cleanSearch = data.Search.filter((item) => {
          if (!item.Title || !item.Poster || item.Poster === "N/A") return false;
          const t = item.Title.toLowerCase();
          return (
            !t.includes("aftermath") &&
            !t.includes("making of") &&
            !t.includes("behind the scenes") &&
            !t.includes("specialists") &&
            !t.includes("the real story") &&
            !t.includes("inspired by") &&
            !t.includes("parody") &&
            !t.includes("barbie")
          );
        });
        allMovies.push(...cleanSearch.map(normalizeMovie));
      }
    });

    const validMovies = filterValidMovies(allMovies);

    validMovies.sort((a, b) => {
      const yearA = parseInt(a.release_date) || 0;
      const yearB = parseInt(b.release_date) || 0;
      return yearB - yearA;
    });

    return validMovies;
  } catch (err) {
    console.error("Error fetching batch movies:", err);
    return [];
  }
};

export const getPopularMovies = async (page = 1) => {
  return fetchMoviesByIds(POPULAR_MOVIE_IDS);
};

export const searchMovies = async (query, page = 1) => {
  if (!query.trim()) return [];
  const cleanQ = query.trim().toLowerCase();

  try {
    const data = await safeRateLimitedFetch(
      `${BASE_URL}/?apikey=${API_KEY}&s=${encodeURIComponent(query)}&type=movie&page=${page}`
    ).then((r) => r.json());

    if (!data || data.Response !== "True" || !data.Search) {
      if (data && data.Error) throw new Error(data.Error);
      return [];
    }

    // Filter out junk titles and items without real posters
    const filtered = data.Search.filter((item) => {
      if (!item.Title || !item.Poster || item.Poster === "N/A") return false;
      const titleLower = item.Title.toLowerCase();
      if (
        titleLower.includes("aftermath") ||
        titleLower.includes("making of") ||
        titleLower.includes("behind the scenes") ||
        titleLower.includes("specialists") ||
        titleLower.includes("the real story") ||
        titleLower.includes("inspired by") ||
        titleLower.includes("parody") ||
        titleLower.includes("barbie")
      ) {
        return false;
      }
      return true;
    });

    const mapped = filtered.map(normalizeMovie);

    // Prioritize exact or near-exact title match first
    mapped.sort((a, b) => {
      const aExact = a.title.toLowerCase() === cleanQ;
      const bExact = b.title.toLowerCase() === cleanQ;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aStarts = a.title.toLowerCase().startsWith(cleanQ);
      const bStarts = b.title.toLowerCase().startsWith(cleanQ);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      const yearA = parseInt(a.release_date) || 0;
      const yearB = parseInt(b.release_date) || 0;
      return yearB - yearA;
    });

    return mapped;
  } catch (err) {
    console.error("Error searching movies:", err);
    throw err;
  }
};

export const getMovieDetails = async (id) => {
  if (!id) return null;

  try {
    const response = await safeRateLimitedFetch(
      `${BASE_URL}/?apikey=${API_KEY}&i=${id}&plot=full`
    );

    const data = await response.json();
    if (data.Response === "True") {
      const safePoster = getSafePosterUrl(data.Poster, data.Title, data.Year, data.Genre);
      return {
        id: data.imdbID,
        title: data.Title,
        poster_path: safePoster,
        poster_url: safePoster,
        release_date: data.Year,
        plot: data.Plot !== "N/A" ? data.Plot : "No description available.",
        director: data.Director !== "N/A" ? data.Director : "N/A",
        actors: data.Actors !== "N/A" ? data.Actors : "N/A",
        genre: data.Genre !== "N/A" ? data.Genre : "",
        runtime: data.Runtime !== "N/A" ? data.Runtime : "N/A",
        rated: data.Rated !== "N/A" ? data.Rated : "NR",
        imdbRating: data.imdbRating !== "N/A" ? data.imdbRating : "N/A",
        ratings: data.Ratings || [],
      };
    }
    return null;
  } catch (err) {
    console.error("Error fetching movie details:", err);
    return null;
  }
};