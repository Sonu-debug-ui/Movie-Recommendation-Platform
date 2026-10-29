import { Link } from "react-router-dom";
import { useSiteSettings } from "../hooks/useSiteSettings";
import "../css/About.css";

function About() {
  const { siteName = "CineFlix" } = useSiteSettings();

  return (
    <div className="about-page-container">
      {/* Hero Header */}
      <section className="about-hero">
        <div className="about-badge">✦ Experience Cinema Without Borders</div>
        <h1 className="about-title">
          About <span className="about-title-gradient">{siteName}</span>
        </h1>
        <p className="about-subtitle">
          Next-generation cinema discovery portal designed to eliminate choice paralysis, bridge global media catalogs, and deliver a fluid, OLED-grade entertainment experience.
        </p>
      </section>

      {/* Origin & Philosophy */}
      <section className="about-glass-card">
        <h2 className="about-card-title">🎬 The Vision Behind {siteName}</h2>
        <p className="about-text">
          In the modern digital streaming era, millions of hours of movies are released annually. However, discovering what to watch has ironically become an exhausting chore. Viewers spend upwards of 18–20 minutes merely scrolling through bloated, ad-saturated catalogs before settling on a title.
        </p>
        <p className="about-text">
          <strong>{siteName}</strong> was created to restore the magic of cinema exploration. By synthesizing real-time entertainment metadata, high-definition trailer overlays, and curated regional recommendation rails into a unified, zero-distraction dark interface, {siteName} lets you dive into great stories without cognitive overload.
        </p>
      </section>

      {/* Core Engineering Pillars */}
      <section className="about-pillars-grid">
        <div className="pillar-card">
          <span className="pillar-icon">🌏</span>
          <h3 className="pillar-title">Curated World Cinema</h3>
          <p className="pillar-description">
            Categorized feeds for Global Trending, Hollywood Classics, Bollywood Hits, K-Dramas, and Japanese Anime. True global cinema under one seamless umbrella.
          </p>
        </div>

        <div className="pillar-card">
          <span className="pillar-icon">⚡</span>
          <h3 className="pillar-title">300ms Debounced Search</h3>
          <p className="pillar-description">
            Ultra-responsive search queries across thousands of titles with real-time TMDB API integration and resilient local fallback datasets for 100% offline uptime.
          </p>
        </div>

        <div className="pillar-card">
          <span className="pillar-icon">🎴</span>
          <h3 className="pillar-title">3D KexsioCard Physics</h3>
          <p className="pillar-description">
            Bespoke interactive cards with real-time cursor tilt tracking, radial specular glows, and animated continuous border light runners in pure Vanilla CSS.
          </p>
        </div>

        <div className="pillar-card">
          <span className="pillar-icon">🛡️</span>
          <h3 className="pillar-title">Enterprise Security</h3>
          <p className="pillar-description">
            Defended by in-memory and database sliding-window rate limiters with 60s cooldown lockouts, RFC-compliant email checks, and real-time password complexity meters.
          </p>
        </div>

        <div className="pillar-card">
          <span className="pillar-icon">🍿</span>
          <h3 className="pillar-title">In-App HD Trailers</h3>
          <p className="pillar-description">
            Zero redirects. Inspect IMDb scores, cast lists, director details, and stream crisp YouTube movie trailers directly within high-performance modal overlays.
          </p>
        </div>

        <div className="pillar-card">
          <span className="pillar-icon">📊</span>
          <h3 className="pillar-title">Role-Based Governance</h3>
          <p className="pillar-description">
            Dedicated administrative back-office featuring KPI metric analytics, user account permission controls, movie catalog CRUD, and community review moderation.
          </p>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="about-tech-section">
        <h2 className="about-card-title" style={{ justifyContent: "center" }}>
          ⚙️ Modern Technology Stack
        </h2>
        <div className="about-tech-grid">
          <span className="about-tech-chip">⚛️ React 19</span>
          <span className="about-tech-chip">⚡ Vite 8</span>
          <span className="about-tech-chip">🐘 Supabase PostgreSQL</span>
          <span className="about-tech-chip">🔒 Row-Level Security (RLS)</span>
          <span className="about-tech-chip">🎨 Pure Vanilla CSS</span>
          <span className="about-tech-chip">🎬 TMDB Entertainment API</span>
          <span className="about-tech-chip">🛡️ Sliding-Window Rate Limiter</span>
        </div>
      </section>

      {/* CTA Card */}
      <section className="about-cta-card">
        <h2 className="about-cta-title">Ready to Start Watching?</h2>
        <p className="about-cta-subtitle">
          Discover handpicked masterpieces, explore trending blockbusters, or save movies to your personal cloud watchlist.
        </p>
        <div className="about-cta-actions">
          <Link to="/" className="about-btn-primary">
            🍿 Browse Movies Now
          </Link>
          <a
            href="https://github.com/Sonu-debug-ui/Movie-Recommendation-Platform"
            target="_blank"
            rel="noopener noreferrer"
            className="about-btn-secondary"
          >
            ⭐ View on GitHub
          </a>
        </div>
      </section>
    </div>
  );
}

export default About;
