import { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth';

const router = Router();

/**
 * GET /admin
 * Built-in Visual Admin Dashboard for palakons@gmail.com
 */
router.get('/admin', async (req: Request, res: Response) => {
  const user = await authenticateUser(req);

  // If not authenticated, render login prompt
  if (!user) {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Login - Longwarp Auth</title>
  <style>
    :root {
      --bg: #0d1117;
      --card-bg: rgba(22, 27, 34, 0.85);
      --border: #30363d;
      --text: #f0f6fc;
      --text-muted: #8b949e;
      --accent: #58a6ff;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body {
      background: var(--bg);
      background-image: radial-gradient(circle at 50% 20%, rgba(88, 166, 255, 0.08), transparent 50%);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 40px;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 16px 40px rgba(0,0,0,0.5);
    }
    h1 { font-size: 24px; margin-bottom: 8px; font-weight: 700; letter-spacing: -0.5px; }
    p { color: var(--text-muted); font-size: 14px; margin-bottom: 28px; line-height: 1.5; }
    .btn-google {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      padding: 14px 20px;
      background: #ffffff;
      color: #1f1f1f;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .btn-google:hover {
      background: #f1f3f4;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.3);
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background: rgba(88, 166, 255, 0.15);
      color: var(--accent);
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Longwarp Central Auth</span>
    <h1>Admin Telemetry & Stats</h1>
    <p>Please sign in with your administrator Google account (<code>palakons@gmail.com</code>) to view the real-time analytics dashboard.</p>
    <a href="/auth/google?redirect=/admin" class="btn-google">
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/>
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"/>
        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"/>
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.93 6.72-4.93z"/>
      </svg>
      Sign in with Google
    </a>
  </div>
</body>
</html>
    `);
    return;
  }

  // If not admin email
  if (user.email !== 'palakons@gmail.com') {
    res.status(403).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Access Denied</title>
  <style>
    body { background: #0d1117; color: #f0f6fc; font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #161b22; border: 1px solid #f85149; border-radius: 12px; padding: 32px; max-width: 440px; text-align: center; }
    h1 { color: #f85149; margin-bottom: 12px; }
    p { color: #8b949e; margin-bottom: 20px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Access Denied (403)</h1>
    <p>Logged in as <b>${user.email}</b>.<br>This dashboard is restricted strictly to administrator <b>palakons@gmail.com</b>.</p>
    <form action="/auth/logout" method="POST">
      <button type="submit" style="background:#f85149; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:600;">Log Out</button>
    </form>
  </div>
</body>
</html>
    `);
    return;
  }

  // Admin is authenticated! Render the comprehensive stats dashboard
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Longwarp Admin Dashboard</title>
  <style>
    :root {
      --bg: #0a0e14;
      --card-bg: rgba(18, 24, 33, 0.85);
      --border: rgba(48, 54, 61, 0.7);
      --text: #f0f6fc;
      --text-muted: #8b949e;
      --accent: #58a6ff;
      --green: #3fb950;
      --purple: #bc8cff;
      --orange: #f0883e;
      --pink: #f778ba;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body {
      background: var(--bg);
      background-image: 
        radial-gradient(circle at 15% 15%, rgba(88, 166, 255, 0.08), transparent 40%),
        radial-gradient(circle at 85% 25%, rgba(188, 140, 255, 0.08), transparent 40%);
      color: var(--text);
      min-height: 100vh;
      padding: 30px 24px;
    }
    .container { max-width: 1240px; margin: 0 auto; }
    
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
    }
    .brand { display: flex; align-items: center; gap: 14px; }
    .brand-icon {
      width: 42px; height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, #58a6ff, #bc8cff);
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 20px; color: #fff;
    }
    .brand h1 { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .brand p { font-size: 13px; color: var(--text-muted); }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .user-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--card-bg);
      padding: 6px 14px;
      border-radius: 30px;
      border: 1px solid var(--border);
      font-size: 13px;
    }
    .avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
    .btn-refresh {
      background: rgba(88, 166, 255, 0.15);
      border: 1px solid rgba(88, 166, 255, 0.4);
      color: var(--accent);
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
    }
    .btn-refresh:hover { background: rgba(88, 166, 255, 0.25); }
    .btn-logout {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 8px 14px;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      font-size: 13px;
    }
    .btn-logout:hover { color: #f85149; border-color: #f85149; }

    /* Stats Grid */
    .section-title {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-muted);
      font-weight: 700;
      margin-bottom: 14px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px 18px;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
    .stat-label { font-size: 12px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .stat-value { font-size: 28px; font-weight: 700; color: #fff; line-height: 1.1; margin-bottom: 4px; }
    .stat-sub { font-size: 12px; color: var(--text-muted); }

    /* Two column grid */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }
    @media (max-width: 900px) { .grid-2 { grid-template-columns: 1fr; } }

    .panel {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 22px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .panel-title { font-size: 15px; font-weight: 700; }
    .panel-count { font-size: 12px; background: rgba(255,255,255,0.08); padding: 3px 8px; border-radius: 12px; color: var(--text-muted); }

    /* Dish Rank Bars */
    .dish-list { display: flex; flex-direction: column; gap: 12px; }
    .dish-item { display: flex; flex-direction: column; gap: 4px; }
    .dish-header { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; }
    .dish-bar-bg { width: 100%; height: 8px; background: rgba(255,255,255,0.08); border-radius: 6px; overflow: hidden; }
    .dish-bar-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--purple)); border-radius: 6px; }

    /* Hourly Chart */
    .hourly-chart {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      height: 120px;
      padding-top: 10px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 8px;
    }
    .hour-bar-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: flex-end;
      position: relative;
    }
    .hour-bar {
      width: 100%;
      min-height: 2px;
      background: rgba(88, 166, 255, 0.4);
      border-radius: 3px 3px 0 0;
      transition: height 0.3s ease;
    }
    .hour-bar.peak { background: var(--orange); }
    .hour-label { font-size: 9px; color: var(--text-muted); margin-top: 4px; }

    /* Pills & Tables */
    .pill-group { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
    }
    .pill b { color: var(--accent); }

    .table-container {
      max-height: 360px;
      overflow-y: auto;
      border: 1px solid rgba(48, 54, 61, 0.4);
      border-radius: 8px;
    }
    table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
    th {
      background: rgba(26, 32, 44, 0.95);
      color: var(--text-muted);
      font-weight: 600;
      padding: 10px 14px;
      position: sticky; top: 0;
      border-bottom: 1px solid var(--border);
    }
    td { padding: 12px 14px; border-bottom: 1px solid rgba(48, 54, 61, 0.3); }
    tr:hover td { background: rgba(88, 166, 255, 0.04); }
    .badge-event { background: rgba(88, 166, 255, 0.15); color: var(--accent); padding: 2px 6px; border-radius: 4px; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="brand-icon">🍲</div>
        <div>
          <h1>Longwarp Shabu Telemetry & Analytics</h1>
          <p>Real-time Eating Insights & Privacy-Preserving Usage Metrics</p>
        </div>
      </div>

      <div class="user-profile">
        <div class="user-badge">
          ${user.avatarUrl ? `<img src="${user.avatarUrl}" class="avatar" alt="Avatar">` : ''}
          <span>${user.email}</span>
        </div>
        <button class="btn-refresh" onclick="loadStats()">↻ Refresh</button>
        <button class="btn-logout" onclick="logout()">Sign Out</button>
      </div>
    </header>

    <!-- 1. High Level Traffic Cards -->
    <div class="section-title">Traffic & Sessions Overview</div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Visits</div>
        <div class="stat-value" id="val-pageviews" style="color: var(--accent)">...</div>
        <div class="stat-sub">Page views recorded</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Unique Devices</div>
        <div class="stat-value" id="val-visitors" style="color: var(--purple)">...</div>
        <div class="stat-sub">Anonymous device sessions</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Buffet Meals Logged</div>
        <div class="stat-value" id="val-sessions" style="color: var(--green)">...</div>
        <div class="stat-sub">Saved dining sessions</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Calories</div>
        <div class="stat-value" id="val-calories" style="color: var(--orange)">...</div>
        <div class="stat-sub">kcal consumed across all meals</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Protein</div>
        <div class="stat-value" id="val-protein" style="color: var(--pink)">...</div>
        <div class="stat-sub">grams protein tracked</div>
      </div>
    </div>

    <!-- 2. Dining Habits & Averages -->
    <div class="section-title">Dining Habits & Benchmark Averages</div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Avg Trays / Meal</div>
        <div class="stat-value" id="val-avg-trays" style="color: var(--green)">...</div>
        <div class="stat-sub">Trays eaten per person</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Calories / Meal</div>
        <div class="stat-value" id="val-avg-calories" style="color: var(--orange)">...</div>
        <div class="stat-sub">kcal intake per session</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Protein / Meal</div>
        <div class="stat-value" id="val-avg-protein">...</div>
        <div class="stat-sub">grams protein per session</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Cost / Person</div>
        <div class="stat-value" id="val-avg-cost" style="color: var(--accent)">...</div>
        <div class="stat-sub">THB buffet tier price</div>
      </div>
    </div>

    <!-- 3. Top Dishes & Peak Hours Grid -->
    <div class="grid-2">
      <!-- Most Popular Dishes -->
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">🏆 Top 10 Favorite Dishes</div>
          <div class="panel-count" id="count-dishes">0 items</div>
        </div>
        <div class="dish-list" id="list-dishes">
          <p style="color:var(--text-muted); font-size:13px;">Loading favorite dishes...</p>
        </div>
      </div>

      <!-- Peak Dining Times -->
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">⏰ Peak Dining Hours (24h)</div>
          <div class="panel-count">Lunch vs Dinner</div>
        </div>
        <div class="hourly-chart" id="chart-hours">
          <!-- Bars generated via JS -->
        </div>
        <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-muted); margin-bottom: 16px;">
          <span>Midnight (00:00)</span>
          <span>Lunch (12:00)</span>
          <span>Dinner (19:00)</span>
          <span>23:00</span>
        </div>

        <div style="border-top: 1px solid var(--border); padding-top: 14px;">
          <div style="font-size:12px; font-weight:600; margin-bottom:8px; color:var(--text-muted);">CLIENT & PLATFORM BREAKDOWN:</div>
          <div class="pill-group" id="pill-devices">
            <!-- Device Pills -->
          </div>
        </div>
      </div>
    </div>

    <!-- 4. Tables Grid (Recent Telemetry & Sessions) -->
    <div class="grid-2">
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">📡 Real-Time Telemetry Stream</div>
          <div class="panel-count" id="count-events">0 events</div>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Device</th>
                <th>IP</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody id="body-events">
              <tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Loading events...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">🥩 Recent Buffet Sessions</div>
          <div class="panel-count" id="count-sessions">0 sessions</div>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Trays</th>
                <th>Calories</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody id="body-sessions">
              <tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Loading sessions...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <script>
    async function loadStats() {
      try {
        const res = await fetch('/api/shabu/admin/stats');
        if (!res.ok) {
          if (res.status === 403) {
            alert('Access denied: You must be logged in as palakons@gmail.com');
            window.location.reload();
          }
          return;
        }

        const data = await res.json();
        const s = data.stats || {};

        // Top summary
        document.getElementById('val-pageviews').innerText = Number(s.totalPageViews || 0).toLocaleString();
        document.getElementById('val-visitors').innerText = Number(s.totalUniqueVisitors || 0).toLocaleString();
        document.getElementById('val-sessions').innerText = Number(s.totalSessionsSaved || 0).toLocaleString();
        document.getElementById('val-calories').innerText = Number(s.totalCaloriesTracked || 0).toLocaleString();
        document.getElementById('val-protein').innerText = Number(s.totalProteinTracked || 0).toLocaleString() + 'g';

        // Averages
        document.getElementById('val-avg-trays').innerText = s.avgTraysPerMeal || 0;
        document.getElementById('val-avg-calories').innerText = Number(s.avgCaloriesPerMeal || 0).toLocaleString() + ' kcal';
        document.getElementById('val-avg-protein').innerText = (s.avgProteinPerMeal || 0) + 'g';
        document.getElementById('val-avg-cost').innerText = '฿' + (s.avgCostPerMeal || 299);

        // Top Dishes
        const dishes = data.topDishes || [];
        document.getElementById('count-dishes').innerText = dishes.length + ' ranked';
        const dishContainer = document.getElementById('list-dishes');
        if (dishes.length === 0) {
          dishContainer.innerHTML = '<p style="color:var(--text-muted); font-size:13px;">No dish items logged yet.</p>';
        } else {
          const maxCount = Math.max(...dishes.map(d => d.count), 1);
          dishContainer.innerHTML = dishes.map((d, idx) => {
            const pct = Math.round((d.count / maxCount) * 100);
            return \`
              <div class="dish-item">
                <div class="dish-header">
                  <span>#\${idx + 1} \${escapeHtml(d.name)}</span>
                  <span style="color:var(--accent);">\${d.count} trays</span>
                </div>
                <div class="dish-bar-bg">
                  <div class="dish-bar-fill" style="width: \${pct}%"></div>
                </div>
              </div>
            \`;
          }).join('');
        }

        // Peak Hours Chart
        const hourly = data.hourlyDistribution || {};
        const maxHourly = Math.max(...Object.values(hourly), 1);
        const chart = document.getElementById('chart-hours');
        let chartHtml = '';
        for (let h = 0; h < 24; h++) {
          const count = hourly[h] || 0;
          const pct = Math.max(Math.round((count / maxHourly) * 100), 4);
          const isPeak = (h >= 11 && h <= 13) || (h >= 17 && h <= 20);
          chartHtml += \`
            <div class="hour-bar-col" title="\${h}:00 - \${count} events">
              <div class="hour-bar \${isPeak ? 'peak' : ''}" style="height: \${pct}%"></div>
              <span class="hour-label">\${h}</span>
            </div>
          \`;
        }
        chart.innerHTML = chartHtml;

        // Devices & Browsers Pills
        const dev = data.deviceBreakdown || {};
        const devPills = document.getElementById('pill-devices');
        devPills.innerHTML = \`
          <span class="pill">📱 Mobile: <b>\${dev.mobile || 0}</b></span>
          <span class="pill">💻 Desktop: <b>\${dev.desktop || 0}</b></span>
          <span class="pill">📟 Tablet: <b>\${dev.tablet || 0}</b></span>
          <span class="pill">👥 Members vs Guests: <b>\${s.guestVsMemberRatio?.member || 0} / \${s.guestVsMemberRatio?.guest || 0}</b></span>
          <span class="pill">🔬 Macro Views: <b>\${s.featureEngagement?.macroViews || 0}</b></span>
          <span class="pill">📤 Shares: <b>\${s.featureEngagement?.shareClicks || 0}</b></span>
        \`;

        // Telemetry Events Table
        const events = data.recentEvents || [];
        document.getElementById('count-events').innerText = events.length + ' events';
        const eventsTbody = document.getElementById('body-events');
        if (events.length === 0) {
          eventsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No events recorded</td></tr>';
        } else {
          eventsTbody.innerHTML = events.map(e => \`
            <tr>
              <td><span class="badge-event">\${escapeHtml(e.eventType)}</span></td>
              <td><span style="font-family:monospace; font-size:11px;">\${e.userId ? '👤 Member' : '👻 Guest'}</span></td>
              <td style="color:var(--text-muted); font-size:11px;">\${e.ipAddress || '-'}</td>
              <td style="font-size:11px; color:var(--text-muted);">\${new Date(e.createdAt).toLocaleTimeString()}</td>
            </tr>
          \`).join('');
        }

        // Sessions Table
        const sessions = data.recentSessions || [];
        document.getElementById('count-sessions').innerText = sessions.length + ' sessions';
        const sessionsTbody = document.getElementById('body-sessions');
        if (sessions.length === 0) {
          sessionsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No saved sessions</td></tr>';
        } else {
          sessionsTbody.innerHTML = sessions.map(s => \`
            <tr>
              <td>\${new Date(s.sessionDate || s.createdAt).toLocaleDateString()}</td>
              <td><b>\${s.totalTrays}</b> trays</td>
              <td>\${Number(s.totalCalories).toLocaleString()} kcal</td>
              <td style="color:var(--green); font-weight:600;">฿\${s.costThb}</td>
            </tr>
          \`).join('');
        }
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    }

    function escapeHtml(str) {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    async function logout() {
      await fetch('/auth/logout', { method: 'POST' });
      window.location.reload();
    }

    // Initial load and 10s auto-refresh
    loadStats();
    setInterval(loadStats, 10000);
  </script>
</body>
</html>
  `);
});

export default router;
