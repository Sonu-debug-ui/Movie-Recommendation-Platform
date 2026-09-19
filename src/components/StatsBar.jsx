import "../css/StatsBar.css";

function StatsBar() {
  return (
    <div className="stats-bar-container">
      <div className="stats-bar-card">
        <div className="stat-item">
          <span className="stat-icon">🍿</span>
          <div className="stat-content">
            <span className="stat-value">50+ Trending</span>
            <span className="stat-label">Blockbuster Movies</span>
          </div>
        </div>

        <div className="stat-divider"></div>

        <div className="stat-item">
          <span className="stat-icon">⭐</span>
          <div className="stat-content">
            <span className="stat-value">4.8 / 5.0</span>
            <span className="stat-label">Avg Community Rating</span>
          </div>
        </div>

        <div className="stat-divider"></div>

        <div className="stat-item">
          <span className="stat-icon">⚡</span>
          <div className="stat-content">
            <span className="stat-value">300ms Search</span>
            <span className="stat-label">Real-Time Debounced</span>
          </div>
        </div>

        <div className="stat-divider"></div>

        <div className="stat-item">
          <span className="stat-icon">🌐</span>
          <div className="stat-content">
            <span className="stat-value">4 Cinema Regions</span>
            <span className="stat-label">Hollywood, Bollywood & More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatsBar;
