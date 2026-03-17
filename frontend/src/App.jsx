import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Filler,
} from 'chart.js';
import {
  shortenUrl, getStats, getQrUrl, getMyUrls,
  login, register, logout, isLoggedIn,
} from './services/api';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export default function App() {
  const [page, setPage] = useState('home');
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [url, setUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [myUrls, setMyUrls] = useState([]);
  const [dashLoading, setDashLoading] = useState(false);

  async function handleShorten(e) {
    e.preventDefault();
    setError(''); setResult(null); setStats(null); setShowQr(false);
    setLoading(true);
    try {
      const data = await shortenUrl(url, customSlug, expiresAt || null);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally { setLoading(false); }
  }

  async function handleStats() {
    if (!result) return;
    try {
      const data = await getStats(result.shortCode);
      setStats(data);
    } catch { setError('Could not fetch stats'); }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleAuth(e) {
    e.preventDefault();
    setAuthError(''); setAuthLoading(true);
    try {
      if (authMode === 'register') await register(authEmail, authPassword);
      await login(authEmail, authPassword);
      setLoggedIn(true); setPage('home');
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Auth failed');
    } finally { setAuthLoading(false); }
  }

  function handleLogout() {
    logout(); setLoggedIn(false); setPage('home'); setMyUrls([]);
  }

  async function handleDashboard() {
    setPage('dashboard'); setDashLoading(true);
    try { setMyUrls(await getMyUrls()); }
    catch { setMyUrls([]); }
    finally { setDashLoading(false); }
  }

  const chartData = stats?.timeline?.length > 0 ? {
    labels: stats.timeline.map(r => r.date),
    datasets: [{
      data: stats.timeline.map(r => r.clicks),
      fill: true,
      backgroundColor: 'rgba(110,231,183,0.1)',
      borderColor: '#6ee7b7',
      tension: 0.4,
      pointRadius: 3,
    }],
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#555', font: { size: 11 } }, grid: { color: '#222' } },
      y: { ticks: { color: '#555', font: { size: 11 } }, grid: { color: '#222' } },
    },
  };

  return (
    <div className="app">
      <nav className="nav">
        <span className="logo" onClick={() => setPage('home')}>snip<span>.</span></span>
        <div className="nav-right">
          {loggedIn ? (
            <>
              <button className="btn-nav" onClick={handleDashboard}>My URLs</button>
              <button className="btn-nav" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button className="btn-nav accent" onClick={() => setPage('auth')}>Login</button>
          )}
        </div>
      </nav>

      {page === 'home' && (
        <main className="main">
          <div className="hero">
            <h1 className="headline">Shorten. Share. Track.</h1>
            <p className="subline">Distributed URL shortener with real-time analytics.</p>
          </div>
          <form onSubmit={handleShorten} className="form">
            <div className="input-row">
              <input className="url-input" type="url" placeholder="Paste a long URL here..." value={url} onChange={e => setUrl(e.target.value)} required />
              <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Shortening...' : 'Shorten'}</button>
            </div>
            {loggedIn && (
              <div className="extras-row">
                <input className="url-input sm" type="text" placeholder="Custom slug (optional)" value={customSlug} onChange={e => setCustomSlug(e.target.value)} />
                <input className="url-input sm" type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} title="Expiry (optional)" />
              </div>
            )}
            {error && <p className="error">{error}</p>}
          </form>

          {result && (
            <div className="result-card">
              <div className="result-row">
                <a href={result.shortUrl} target="_blank" rel="noreferrer" className="short-url">{result.shortUrl}</a>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-sm" onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</button>
                  <button className="btn-sm" onClick={() => setShowQr(v => !v)}>QR</button>
                  <button className="btn-sm" onClick={handleStats}>Stats</button>
                </div>
              </div>
              <p className="original-url">{result.longUrl}</p>

              {showQr && (
                <div className="qr-wrap">
                  <img src={getQrUrl(result.shortCode)} alt="QR Code" className="qr-img" />
                  <a href={getQrUrl(result.shortCode)} download={`${result.shortCode}.png`} className="btn-sm">Download QR</a>
                </div>
              )}

              {stats && (
                <div className="stats-section">
                  <div className="stat-grid">
                    <div className="stat"><span className="stat-value">{stats.click_count}</span><span className="stat-label">Total clicks</span></div>
                    <div className="stat"><span className="stat-value">{new Date(stats.created_at).toLocaleDateString()}</span><span className="stat-label">Created</span></div>
                  </div>
                  {chartData && <div className="chart-wrap"><Line data={chartData} options={chartOptions} /></div>}
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {page === 'auth' && (
        <main className="main centered">
          <div className="auth-card">
            <h2 className="auth-title">{authMode === 'login' ? 'Welcome back' : 'Create account'}</h2>
            <form onSubmit={handleAuth} className="auth-form">
              <input className="url-input" type="email" placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required />
              <input className="url-input" type="password" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required />
              {authError && <p className="error">{authError}</p>}
              <button className="btn-primary full" type="submit" disabled={authLoading}>{authLoading ? 'Please wait...' : (authMode === 'login' ? 'Login' : 'Register')}</button>
            </form>
            <p className="auth-toggle">
              {authMode === 'login' ? "No account? " : 'Have an account? '}
              <span className="link" onClick={() => setAuthMode(m => m === 'login' ? 'register' : 'login')}>
                {authMode === 'login' ? 'Register' : 'Login'}
              </span>
            </p>
          </div>
        </main>
      )}

      {page === 'dashboard' && (
        <main className="main">
          <h2 className="dash-title">My URLs</h2>
          {dashLoading ? <p className="muted">Loading...</p> : myUrls.length === 0 ? (
            <p className="muted">No URLs yet. <span className="link" onClick={() => setPage('home')}>Create one!</span></p>
          ) : (
            <div className="url-list">
              {myUrls.map(u => (
                <div key={u.short_code} className="url-row">
                  <div className="url-row-left">
                    <a href={`/${u.short_code}`} target="_blank" rel="noreferrer" className="short-url sm">snip./{u.short_code}</a>
                    <p className="original-url">{u.long_url}</p>
                  </div>
                  <div className="url-row-right">
                    <span className="stat-badge">{u.click_count} clicks</span>
                    <span className="muted sm">{new Date(u.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}
    </div>
  );
}
