// Utility helper to ensure 100% of movie posters render flawlessly.
// Eliminates broken images, 404s, CORS failures, and dead placeholder services.

/**
 * Known official, high-resolution poster images for popular movies and query keywords.
 * If OMDB returns a broken Amazon S3 URL (404) or "N/A", this map resolves instantly.
 */
const CURATED_POSTERS = {
  // Global & Hollywood Blockbusters
  oppenheimer: "https://m.media-amazon.com/images/M/MV5BN2JkMDc5MGQtZjg3YS00NmFiLWIyZmQtZTJmNTM5MjVmYTQ4XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg",
  tt15398776: "https://m.media-amazon.com/images/M/MV5BN2JkMDc5MGQtZjg3YS00NmFiLWIyZmQtZTJmNTM5MjVmYTQ4XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg",
  "dune: part two": "https://m.media-amazon.com/images/M/MV5BNTc0YmQxMjEtODI5MC00NjFiLTlkMWUtOGQ5NjFmYWUyZGJhXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg",
  tt15239678: "https://m.media-amazon.com/images/M/MV5BNTc0YmQxMjEtODI5MC00NjFiLTlkMWUtOGQ5NjFmYWUyZGJhXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg",
  dune: "https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtODExYjUxOTU1ZjgxXkEyXkFqcGdeQXVyMTA3MDk2NDg2._V1_SX300.jpg",
  tt1160419: "https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtODExYjUxOTU1ZjgxXkEyXkFqcGdeQXVyMTA3MDk2NDg2._V1_SX300.jpg",
  "avengers: endgame": "https://m.media-amazon.com/images/M/MV5BMWEyNDM2ZmQtMmFkNi00MTQ1LTk1MjItMzdlZGJlYmIyYzZlXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg",
  tt4154796: "https://m.media-amazon.com/images/M/MV5BMWEyNDM2ZmQtMmFkNi00MTQ1LTk1MjItMzdlZGJlYmIyYzZlXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg",
  "the avengers": "https://m.media-amazon.com/images/M/MV5BNDYxNjQyMjAtNTdiOS00NGYwLWFmNTAtNThmYjU5ZGI2YTI1XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
  tt0848228: "https://m.media-amazon.com/images/M/MV5BNDYxNjQyMjAtNTdiOS00NGYwLWFmNTAtNThmYjU5ZGI2YTI1XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
  "the dark knight": "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_QL75_UX380_CR0,0,380,562_.jpg",
  tt0468569: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_QL75_UX380_CR0,0,380,562_.jpg",
  interstellar: "https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg",
  tt0816692: "https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg",
  "spider-man: no way home": "https://m.media-amazon.com/images/M/MV5BMmFiZGZjMmEtMTA0Ni00MzA2LTljMTYtZGI2MGJmZWYzZTQ2XkEyXkFqcGc@._V1_QL75_UX380_CR0,4,380,562_.jpg",
  tt10872600: "https://m.media-amazon.com/images/M/MV5BMmFiZGZjMmEtMTA0Ni00MzA2LTljMTYtZGI2MGJmZWYzZTQ2XkEyXkFqcGc@._V1_QL75_UX380_CR0,4,380,562_.jpg",
  inception: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_QL75_UX380_CR0,0,380,562_.jpg",
  tt1375666: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_QL75_UX380_CR0,0,380,562_.jpg",
  "top gun: maverick": "https://m.media-amazon.com/images/M/MV5BMDBkZDNjMWEtOTdmMi00NmExLTg5MmMtNTFlYTJlNWY5YTdmXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg",
  tt1745960: "https://m.media-amazon.com/images/M/MV5BMDBkZDNjMWEtOTdmMi00NmExLTg5MmMtNTFlYTJlNWY5YTdmXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg",
  gladiator: "https://m.media-amazon.com/images/M/MV5BYWQ4YmNjYjEtOWE1Zi00Y2U4LWI4NTAtMTU0MjkxNWQ1ZmJiXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg",
  tt0172495: "https://m.media-amazon.com/images/M/MV5BYWQ4YmNjYjEtOWE1Zi00Y2U4LWI4NTAtMTU0MjkxNWQ1ZmJiXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg",
  "the matrix": "https://m.media-amazon.com/images/M/MV5BN2NmN2VhMTQtMDNiOS00NDlhLTliMjgtODE2ZTY0ODQyNDRhXkEyXkFqcGc@._V1_QL75_UX380_CR0,4,380,562_.jpg",
  tt0133093: "https://m.media-amazon.com/images/M/MV5BN2NmN2VhMTQtMDNiOS00NDlhLTliMjgtODE2ZTY0ODQyNDRhXkEyXkFqcGc@._V1_QL75_UX380_CR0,4,380,562_.jpg",
  "pulp fiction": "https://m.media-amazon.com/images/M/MV5BYTViYTE3ZGQtNDBlMC00ZTAyLTkyODMtZGRiZDg0MjA2YThkXkEyXkFqcGc@._V1_QL75_UY562_CR3,0,380,562_.jpg",
  tt0110912: "https://m.media-amazon.com/images/M/MV5BYTViYTE3ZGQtNDBlMC00ZTAyLTkyODMtZGRiZDg0MjA2YThkXkEyXkFqcGc@._V1_QL75_UY562_CR3,0,380,562_.jpg",
  "the shawshank redemption": "https://m.media-amazon.com/images/M/MV5BMDAyY2FhYjctNDc5OS00MDNlLThiMGUtY2UxYWVkNGY2ZjljXkEyXkFqcGc@._V1_QL75_UX380_CR0,4,380,562_.jpg",
  tt0111161: "https://m.media-amazon.com/images/M/MV5BMDAyY2FhYjctNDc5OS00MDNlLThiMGUtY2UxYWVkNGY2ZjljXkEyXkFqcGc@._V1_QL75_UX380_CR0,4,380,562_.jpg",
  "forrest gump": "https://m.media-amazon.com/images/M/MV5BNDYwNzVjMTItZmU5YS00YjQ5LTljYjgtMjY2NDVmYWMyNWFmXkEyXkFqcGc@._V1_QL75_UY562_CR4,0,380,562_.jpg",
  tt0109830: "https://m.media-amazon.com/images/M/MV5BNDYwNzVjMTItZmU5YS00YjQ5LTljYjgtMjY2NDVmYWMyNWFmXkEyXkFqcGc@._V1_QL75_UY562_CR4,0,380,562_.jpg",

  // Bollywood & Indian Cinema
  rrr: "https://m.media-amazon.com/images/M/MV5BNWMwODYyMjQtMTczMi00NTQ1LWFkYjItMGJhMWRkY2E3NDAyXkEyXkFqcGc@._V1_SX300.jpg",
  tt8178634: "https://m.media-amazon.com/images/M/MV5BNWMwODYyMjQtMTczMi00NTQ1LWFkYjItMGJhMWRkY2E3NDAyXkEyXkFqcGc@._V1_SX300.jpg",
  jawan: "https://m.media-amazon.com/images/M/MV5BMGExNGI1NDktOWI2Mi00NDM3LWIxMmQtNTQxYTgzMzI0MTA1XkEyXkFqcGc@._V1_SX300.jpg",
  tt15354916: "https://m.media-amazon.com/images/M/MV5BMGExNGI1NDktOWI2Mi00NDM3LWIxMmQtNTQxYTgzMzI0MTA1XkEyXkFqcGc@._V1_SX300.jpg",
  pathaan: "https://m.media-amazon.com/images/M/MV5BNDdkNTY1MDQtY2I5MC00OTFlLTg5OWQtZWE2YzE5NWFiMDgzXkEyXkFqcGc@._V1_SX300.jpg",
  tt12844910: "https://m.media-amazon.com/images/M/MV5BNDdkNTY1MDQtY2I5MC00OTFlLTg5OWQtZWE2YzE5NWFiMDgzXkEyXkFqcGc@._V1_SX300.jpg",
  dangal: "https://m.media-amazon.com/images/M/MV5BMTQ4MzQzMzM2Nl5BMl5BanBnXkFtZTgwMTQ1NzU3MDI@._V1_SX300.jpg",
  tt5074352: "https://m.media-amazon.com/images/M/MV5BMTQ4MzQzMzM2Nl5BMl5BanBnXkFtZTgwMTQ1NzU3MDI@._V1_SX300.jpg",
  "3 idiots": "https://m.media-amazon.com/images/M/MV5BNzc4ZWQ3NmYtODE0Ny00YTQ4LTlkZWItNTBkMGQ0MmUwMmJlXkEyXkFqcGc@._V1_SX300.jpg",
  tt1187043: "https://m.media-amazon.com/images/M/MV5BNzc4ZWQ3NmYtODE0Ny00YTQ4LTlkZWItNTBkMGQ0MmUwMmJlXkEyXkFqcGc@._V1_SX300.jpg",
  baahubali: "https://m.media-amazon.com/images/M/MV5BM2YxZThhZmEtYzM0Yi00OWYxLWI4NGYtM2Y2ZDNmOGE0ZWQzXkEyXkFqcGc@._V1_SX300.jpg",
  tt2631186: "https://m.media-amazon.com/images/M/MV5BM2YxZThhZmEtYzM0Yi00OWYxLWI4NGYtM2Y2ZDNmOGE0ZWQzXkEyXkFqcGc@._V1_SX300.jpg",
  kgf: "https://m.media-amazon.com/images/M/MV5BZmQzZjVkZTUtYj4ZC00ZDJmLWI0ZDUtZTFmMGM1Mzc5ZjIyXkEyXkFqcGc@._V1_SX300.jpg",
  tt10698680: "https://m.media-amazon.com/images/M/MV5BZmQzZjVkZTUtYj4ZC00ZDJmLWI0ZDUtZTFmMGM1Mzc5ZjIyXkEyXkFqcGc@._V1_SX300.jpg",
  animal: "https://m.media-amazon.com/images/M/MV5BZThmNDg1NjUtNWJhMC00YjA3LWJiMjItNmM4ZDQ5ZGZiN2Y2XkEyXkFqcGc@._V1_SX300.jpg",
  tt13751694: "https://m.media-amazon.com/images/M/MV5BZThmNDg1NjUtNWJhMC00YjA3LWJiMjItNmM4ZDQ5ZGZiN2Y2XkEyXkFqcGc@._V1_SX300.jpg",

  // K-Cinema & Anime
  parasite: "https://m.media-amazon.com/images/M/MV5BYjk1Y2U4MjQtY2ZiNS00OWQyLWI3MmItZWUwNmRjYWRiNWNhXkEyXkFqcGc@._V1_SX300.jpg",
  tt6751668: "https://m.media-amazon.com/images/M/MV5BYjk1Y2U4MjQtY2ZiNS00OWQyLWI3MmItZWUwNmRjYWRiNWNhXkEyXkFqcGc@._V1_SX300.jpg",
  "train to busan": "https://m.media-amazon.com/images/M/MV5BMTkwOTQ4OTg0OV5BMl5BanBnXkFtZTgwMzQyOTM0OTE@._V1_SX300.jpg",
  tt5700672: "https://m.media-amazon.com/images/M/MV5BMTkwOTQ4OTg0OV5BMl5BanBnXkFtZTgwMzQyOTM0OTE@._V1_SX300.jpg",
  "spirited away": "https://m.media-amazon.com/images/M/MV5BNTEyNmEwOWUtYzkyOC00ZTQ4LTllZmUtMjk0Y2Y5OWNNzkwL5BMl5BanBnXkFtZTgwODc5NjUwMjI@._V1_SX300.jpg",
  tt0245429: "https://m.media-amazon.com/images/M/MV5BNTEyNmEwOWUtYzkyOC00ZTQ4LTllZmUtMjk0Y2Y5OWNNzkwL5BMl5BanBnXkFtZTgwODc5NjUwMjI@._V1_SX300.jpg",
  "your name": "https://m.media-amazon.com/images/M/MV5BMjI1ODZkYTgtYTY3Yy00ZTJkLWFkOTgtZDUyYWM4MzQwNjk0XkEyXkFqcGc@._V1_SX300.jpg",
  "your name.": "https://m.media-amazon.com/images/M/MV5BMjI1ODZkYTgtYTY3Yy00ZTJkLWFkOTgtZDUyYWM4MzQwNjk0XkEyXkFqcGc@._V1_SX300.jpg",
  tt5311514: "https://m.media-amazon.com/images/M/MV5BMjI1ODZkYTgtYTY3Yy00ZTJkLWFkOTgtZDUyYWM4MzQwNjk0XkEyXkFqcGc@._V1_SX300.jpg",
  "john wick: chapter 4": "https://m.media-amazon.com/images/M/MV5BY2Q2ZmI5ZjUtNWVhMC00YzJkLTlmYjMtY2RmZDhkNzEzYjZhXkEyXkFqcGc@._V1_SX300.jpg",
  tt10366206: "https://m.media-amazon.com/images/M/MV5BY2Q2ZmI5ZjUtNWVhMC00YzJkLTlmYjMtY2RmZDhkNzEzYjZhXkEyXkFqcGc@._V1_SX300.jpg",
  "the wailing": "https://m.media-amazon.com/images/M/MV5BODkwMTgxNjA2NF5BMl5BanBnXkFtZTgwMDc0OTcwOTE@._V1_SX300.jpg",
  tt5215952: "https://m.media-amazon.com/images/M/MV5BODkwMTgxNjA2NF5BMl5BanBnXkFtZTgwMDc0OTcwOTE@._V1_SX300.jpg",
  "the host": "https://m.media-amazon.com/images/M/MV5BMTQzYzI1MDAtYzVkOC00N2U1LThmNzYtNmYyNDg5MzQwYjEwXkEyXkFqcGc@._V1_SX300.jpg",
  tt0468492: "https://m.media-amazon.com/images/M/MV5BMTQzYzI1MDAtYzVkOC00N2U1LThmNzYtNmYyNDg5MzQwYjEwXkEyXkFqcGc@._V1_SX300.jpg",
};

/**
 * Creates an ultra-crisp, offline SVG cinema poster Data URI.
 * Guarantees zero HTTP calls and zero broken image boxes.
 */
export function createCinemaPosterSvg(title = "Featured Film", year = "", genre = "") {
  const cleanTitle = (title || "Movie")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .trim();

  // Split title into up to 2 lines if long
  let line1 = cleanTitle;
  let line2 = "";
  if (cleanTitle.length > 18) {
    const words = cleanTitle.split(" ");
    let cur = "";
    while (words.length > 0 && (cur + words[0]).length <= 16) {
      cur += (cur ? " " : "") + words.shift();
    }
    line1 = cur || cleanTitle.slice(0, 16);
    line2 = words.join(" ").slice(0, 20);
  }

  const safeYear = (year || "").toString().slice(0, 4);
  const safeGenre = (genre || "Cinema").slice(0, 14).toUpperCase();

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" width="300" height="450">
  <defs>
    <linearGradient id="pbg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#181c2b"/>
      <stop offset="50%" stop-color="#0e1018"/>
      <stop offset="100%" stop-color="#1b0e14"/>
    </linearGradient>
    <radialGradient id="pglow" cx="50%" cy="32%" r="48%">
      <stop offset="0%" stop-color="#e50914" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="300" height="450" fill="url(#pbg)"/>
  <rect width="300" height="450" fill="url(#pglow)"/>

  <!-- Aesthetic Framing -->
  <rect x="12" y="12" width="276" height="426" rx="10" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1.5"/>
  <rect x="18" y="18" width="264" height="414" rx="8" fill="none" stroke="rgba(229,9,20,0.22)" stroke-width="1" stroke-dasharray="4 4"/>

  <!-- Cinema Icon -->
  <g transform="translate(150, 135)">
    <circle r="44" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>
    <circle r="34" fill="rgba(229,9,20,0.16)"/>
    <text x="0" y="12" font-size="32" text-anchor="middle" dominant-baseline="central">🎬</text>
  </g>

  <!-- Genre Pill -->
  <g transform="translate(150, 214)">
    <rect x="-48" y="-12" width="96" height="24" rx="12" fill="rgba(229,9,20,0.18)" stroke="rgba(229,9,20,0.45)" stroke-width="1"/>
    <text x="0" y="4" font-family="'Plus Jakarta Sans', -apple-system, sans-serif" font-size="9.5" font-weight="700" fill="#ff7079" text-anchor="middle" letter-spacing="1.2">${safeGenre}</text>
  </g>

  <!-- Title lines -->
  <text x="150" y="${line2 ? "265" : "278"}" font-family="'Plus Jakarta Sans', -apple-system, sans-serif" font-size="18" font-weight="800" fill="#ffffff" text-anchor="middle">
    ${line1}
  </text>
  ${line2 ? `
  <text x="150" y="292" font-family="'Plus Jakarta Sans', -apple-system, sans-serif" font-size="16" font-weight="700" fill="#e2e8f0" text-anchor="middle">
    ${line2}
  </text>` : ""}

  <!-- Year / Release Info -->
  ${safeYear ? `
  <text x="150" y="${line2 ? "322" : "308"}" font-family="'Plus Jakarta Sans', -apple-system, sans-serif" font-size="13" font-weight="600" fill="rgba(255,255,255,0.55)" text-anchor="middle" letter-spacing="1">
    • ${safeYear} •
  </text>` : ""}

  <!-- Premium Bottom Watermark -->
  <g transform="translate(150, 410)">
    <text x="0" y="0" font-family="'Plus Jakarta Sans', -apple-system, sans-serif" font-size="9" font-weight="700" fill="rgba(255,255,255,0.25)" text-anchor="middle" letter-spacing="2">
      ✦ CINEFLIX SPOTLIGHT ✦
    </text>
  </g>
</svg>`.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * Returns a guaranteed valid poster URL for any movie object or poster string.
 */
export function getSafePosterUrl(movieOrPoster, title = "", year = "", genre = "") {
  let poster = "";
  let movieTitle = title;
  let movieYear = year;
  let movieGenre = genre;
  let movieId = "";

  if (typeof movieOrPoster === "object" && movieOrPoster !== null) {
    poster = movieOrPoster.poster_path || movieOrPoster.poster_url || movieOrPoster.poster || "";
    movieTitle = movieOrPoster.title || movieTitle;
    movieYear = movieOrPoster.release_date || movieOrPoster.release_year || movieOrPoster.year || movieYear;
    movieGenre = movieOrPoster.genre || movieGenre;
    movieId = movieOrPoster.id || movieOrPoster.imdbID || "";
  } else if (typeof movieOrPoster === "string") {
    poster = movieOrPoster;
  }

  // 1. If valid live URL from API exists (OMDB, IMDb, TMDb absolute URL, or data URI), USE IT DIRECTLY!
  if (
    poster &&
    poster !== "N/A" &&
    !poster.includes("via.placeholder.com") &&
    !poster.includes("placeholder.com") &&
    (poster.startsWith("http://") || poster.startsWith("https://") || poster.startsWith("data:"))
  ) {
    return poster;
  }

  // 2. TMDb relative path (e.g. /q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg)
  if (poster && poster.startsWith("/")) {
    return `https://image.tmdb.org/t/p/w500${poster}`;
  }

  // 3. Fallback to Curated Posters map if live poster is missing, broken, or "N/A"
  if (movieId && CURATED_POSTERS[movieId.toLowerCase()]) {
    return CURATED_POSTERS[movieId.toLowerCase()];
  }
  const normalizedTitle = (movieTitle || "").trim().toLowerCase();
  if (normalizedTitle && CURATED_POSTERS[normalizedTitle]) {
    return CURATED_POSTERS[normalizedTitle];
  }

  // 4. Ultimate graceful fallback: SVG Cinema Poster
  return createCinemaPosterSvg(movieTitle, movieYear, movieGenre);
}

/**
 * Robust image error handler attached to <img onError={...} />.
 * If any network failure or hotlink drop occurs, attempts curated poster fallback before SVG.
 */
export function handlePosterError(e, title = "", year = "", genre = "", movieId = "") {
  if (!e || !e.currentTarget) return;
  const target = e.currentTarget;
  target.onerror = null; // Prevent infinite loop

  const cleanTitle = (title || "").trim().toLowerCase();
  const cleanId = (movieId || "").trim().toLowerCase();

  const curatedFallback =
    (cleanId && CURATED_POSTERS[cleanId]) ||
    (cleanTitle && CURATED_POSTERS[cleanTitle]);

  if (curatedFallback && target.src !== curatedFallback) {
    target.src = curatedFallback;
    target.onerror = () => {
      target.onerror = null;
      target.src = createCinemaPosterSvg(title, year, genre);
      target.classList.add("poster-fallback-applied");
    };
    return;
  }

  target.src = createCinemaPosterSvg(title, year, genre);
  target.classList.add("poster-fallback-applied");
}
