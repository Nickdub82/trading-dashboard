import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

export default function TradingBotDashboard() {
  const [endpoint, setEndpoint] = useState(
    () => (typeof window !== "undefined" && window.localStorage?.getItem("bot_endpoint")) || ""
  );
  const [token, setToken] = useState(
    () => (typeof window !== "undefined" && window.localStorage?.getItem("bot_token")) || ""
  );
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [configOpen, setConfigOpen] = useState(!endpoint);
  const [expandedPos, setExpandedPos] = useState(null);
  const intervalRef = useRef(null);

  const fetchStats = async () => {
    if (!endpoint) return;
    setLoading(true);
    setError("");
    try {
      const url = new URL(endpoint.replace(/\/$/, "") + "/stats");
      if (token) url.searchParams.set("token", token);
      const res = await fetch(url.toString(), { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStats(data);
      setLastUpdate(Date.now());
    } catch (e) {
      setError(e.message || "Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!endpoint) return;
    fetchStats();
  }, [endpoint, token]);

  useEffect(() => {
    if (!autoRefresh || !endpoint) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(fetchStats, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, endpoint, token]);

  const saveConfig = () => {
    if (typeof window !== "undefined") {
      window.localStorage?.setItem("bot_endpoint", endpoint);
      window.localStorage?.setItem("bot_token", token);
    }
    setConfigOpen(false);
    fetchStats();
  };

  const fmtUSD = (n) => {
    if (n == null || isNaN(n)) return "—";
    const sign = n >= 0 ? "+" : "";
    return `${sign}$${Math.abs(n).toFixed(2).padStart(7)}`;
  };
  const fmtPct = (n) => {
    if (n == null || isNaN(n)) return "—";
    const sign = n >= 0 ? "+" : "";
    return `${sign}${n.toFixed(2)}%`;
  };
  const fmtUptime = (s) => {
    if (!s) return "—";
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };
  const fmtAgo = (ts) => {
    if (!ts) return "—";
    const sec = Math.max(0, Math.floor((Date.now() / 1000) - ts));
    if (sec < 60) return `${sec}s`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
    return `${Math.floor(sec / 86400)}d`;
  };

  const pnlColor = (n) => {
    if (n == null) return "text-zinc-400";
    if (n > 0) return "text-emerald-400";
    if (n < 0) return "text-rose-400";
    return "text-zinc-400";
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono text-sm">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Space+Grotesk:wght@400;500;700&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-mono-pro { font-family: 'JetBrains Mono', monospace; font-feature-settings: 'zero', 'ss02'; }
        body { font-family: 'JetBrains Mono', monospace; }
        .grid-lines {
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 32px 32px;
        }
        .pulse-dot {
          animation: pulse-green 2s ease-in-out infinite;
        }
        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          50% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
        }
        .tick-animate { animation: tick 0.4s ease-out; }
        @keyframes tick {
          0% { background: rgba(16, 185, 129, 0.2); }
          100% { background: transparent; }
        }
      `}</style>

      <div className="grid-lines min-h-screen font-mono-pro">
        {/* Header */}
        <header className="border-b border-zinc-800/80 px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${stats ? "bg-emerald-500 pulse-dot" : "bg-zinc-600"}`}></div>
                <h1 className="font-display text-xl font-bold tracking-tight">
                  BOT<span className="text-emerald-400">.</span>TRADING
                </h1>
              </div>
              <span className="text-xs text-zinc-500 hidden sm:inline">
                {stats?.status?.mode?.toUpperCase() || "DISCONNECTED"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-zinc-500 hidden sm:inline">
                {lastUpdate ? `synced ${fmtAgo(lastUpdate / 1000)} ago` : "not synced"}
              </span>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-2 py-1 border ${autoRefresh ? "border-emerald-500/50 text-emerald-400" : "border-zinc-700 text-zinc-500"} hover:border-emerald-500`}
              >
                {autoRefresh ? "● AUTO" : "○ MANUAL"}
              </button>
              <button
                onClick={fetchStats}
                disabled={loading || !endpoint}
                className="px-2 py-1 border border-zinc-700 hover:border-zinc-500 disabled:opacity-40"
              >
                {loading ? "..." : "↻ SYNC"}
              </button>
              <button
                onClick={() => setConfigOpen(!configOpen)}
                className="px-2 py-1 border border-zinc-700 hover:border-zinc-500"
              >
                ⚙
              </button>
            </div>
          </div>
        </header>

        {/* Config panel */}
        {configOpen && (
          <div className="border-b border-zinc-800/80 px-6 py-4 bg-zinc-900/40">
            <div className="max-w-7xl mx-auto">
              <div className="text-xs text-zinc-400 mb-2">ENDPOINT CONFIGURATION</div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  placeholder="https://your-bot.up.railway.app"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-700 focus:border-emerald-500 outline-none px-3 py-2 text-sm"
                />
                <input
                  type="password"
                  placeholder="Token (optional)"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="sm:w-64 bg-zinc-950 border border-zinc-700 focus:border-emerald-500 outline-none px-3 py-2 text-sm"
                />
                <button
                  onClick={saveConfig}
                  className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-4 py-2 text-sm"
                >
                  CONNECT
                </button>
              </div>
              <div className="text-xs text-zinc-500 mt-2">
                Tip: on Railway, enable "Public Networking" on the worker service and use the generated URL.
              </div>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="border-b border-rose-900/50 bg-rose-950/30 px-6 py-2 text-rose-400 text-xs">
            <div className="max-w-7xl mx-auto">⚠ {error}</div>
          </div>
        )}

        {/* Empty state */}
        {!stats && !error && (
          <div className="max-w-2xl mx-auto px-6 py-16 text-center">
            <div className="text-6xl mb-4 opacity-20">📡</div>
            <h2 className="font-display text-2xl font-bold mb-2">Waiting for connection</h2>
            <p className="text-zinc-500 text-sm mb-6">
              Enter your bot's public URL above to start monitoring.
            </p>
            <div className="text-left bg-zinc-900/50 border border-zinc-800 p-4 text-xs text-zinc-400">
              <div className="text-emerald-400 mb-2"># Expected endpoint format</div>
              <div>GET {"{your_url}"}/stats?token={"{optional}"}</div>
              <div className="mt-2 text-zinc-600"># Your bot must expose port via STATS_PORT env var</div>
              <div className="text-zinc-600"># Railway handles the public URL automatically</div>
            </div>
          </div>
        )}

        {/* Main content */}
        {stats && (
          <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
            {/* Top row: hero stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="CAPITAL"
                value={`$${stats.capital?.current_usdt?.toFixed(2) || "—"}`}
                sub={fmtPct(stats.capital?.total_pnl_pct)}
                subColor={pnlColor(stats.capital?.total_pnl_pct)}
                accent="emerald"
              />
              <StatCard
                label="TOTAL PNL"
                value={fmtUSD(stats.capital?.total_pnl_usdt)}
                valueColor={pnlColor(stats.capital?.total_pnl_usdt)}
                sub={`${stats.performance?.total_trades || 0} trades`}
                subColor="text-zinc-500"
              />
              <StatCard
                label="WIN RATE"
                value={`${stats.performance?.win_rate_pct?.toFixed(1) || "0"}%`}
                sub={`PF ${stats.performance?.profit_factor?.toFixed(2) || "—"}`}
                subColor="text-zinc-500"
              />
              <StatCard
                label="AI STATUS"
                value={stats.status?.ai_enabled ? "● LIVE" : "○ OFF"}
                valueColor={stats.status?.ai_enabled ? "text-emerald-400" : "text-zinc-500"}
                sub={`$${stats.ai_stats?.cost_today_usd?.toFixed(3) || "0.000"} today`}
                subColor="text-zinc-500"
              />
            </div>

            {/* AI Control Panel — NEXT LEVEL */}
            {stats.ai_state && (
              <section className={`border bg-zinc-900/20 ${stats.ai_state.is_paused ? "border-rose-500/40" : "border-purple-500/30"}`}>
                <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
                  <div className="text-xs text-zinc-400 tracking-wider flex items-center gap-2">
                    <span>🧠 AI CONTROL PANEL</span>
                    <span className="text-purple-400/60">◆ CLAUDE</span>
                  </div>
                  <div className="text-xs text-zinc-500">
                    regime check every {stats.status?.ai_enabled ? "30m" : "—"}
                  </div>
                </div>
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Status */}
                  <div>
                    <div className="text-[10px] text-zinc-500 tracking-wider mb-1">STATUS</div>
                    {stats.ai_state.is_paused ? (
                      <>
                        <div className="font-display text-xl font-bold text-rose-400">
                          ● PAUSED
                        </div>
                        <div className="text-xs text-rose-400/70 mt-0.5">
                          {Math.ceil(stats.ai_state.pause_remaining_sec / 60)}m remaining
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-display text-xl font-bold text-emerald-400">
                          ● ACTIVE
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">trading normally</div>
                      </>
                    )}
                  </div>

                  {/* Regime */}
                  <div>
                    <div className="text-[10px] text-zinc-500 tracking-wider mb-1">CURRENT REGIME</div>
                    <div className={`font-display text-xl font-bold uppercase ${
                      stats.ai_state.current_regime === "trending" ? "text-emerald-400"
                      : stats.ai_state.current_regime === "chaotic" ? "text-rose-400"
                      : stats.ai_state.current_regime === "accumulation" ? "text-amber-400"
                      : "text-zinc-400"
                    }`}>
                      {stats.ai_state.current_regime || "—"}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">detected by Claude</div>
                  </div>

                  {/* Sizing Multiplier */}
                  <div>
                    <div className="text-[10px] text-zinc-500 tracking-wider mb-1">SIZING MULT</div>
                    <div className={`font-display text-xl font-bold tabular-nums ${
                      stats.ai_state.current_sizing_mult >= 1.3 ? "text-emerald-400"
                      : stats.ai_state.current_sizing_mult >= 0.9 ? "text-zinc-200"
                      : "text-amber-400"
                    }`}>
                      × {stats.ai_state.current_sizing_mult?.toFixed(2) || "1.00"}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {stats.ai_state.current_sizing_mult >= 1.5 ? "high conviction"
                      : stats.ai_state.current_sizing_mult >= 1.0 ? "normal"
                      : stats.ai_state.current_sizing_mult >= 0.6 ? "cautious"
                      : "very cautious"}
                    </div>
                  </div>

                  {/* Active Count */}
                  <div>
                    <div className="text-[10px] text-zinc-500 tracking-wider mb-1">STRATEGIES</div>
                    <div className="font-display text-xl font-bold">
                      <span className="text-emerald-400">{stats.ai_state.enabled_strategies?.length || 0}</span>
                      <span className="text-zinc-600"> / 6</span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">enabled by Claude</div>
                  </div>
                </div>

                {/* Strategy badges */}
                <div className="px-4 pb-4 pt-0">
                  <div className="text-[10px] text-zinc-500 tracking-wider mb-2">STRATEGY STATE</div>
                  <div className="flex flex-wrap gap-2">
                    {["momentum_breakout", "trend_following", "trend_pullback", "grid_dynamic", "mean_reversion", "vol_harvest"].map(name => {
                      const enabled = stats.ai_state.enabled_strategies?.includes(name);
                      return (
                        <div
                          key={name}
                          className={`px-2 py-1 text-xs border ${
                            enabled
                              ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-400"
                              : "border-zinc-700 bg-zinc-900/40 text-zinc-600 line-through"
                          }`}
                        >
                          {enabled ? "✓ " : "✗ "}{name}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pause reason (if paused) */}
                {stats.ai_state.is_paused && stats.ai_state.pause_reason && (
                  <div className="mx-4 mb-4 p-3 bg-rose-950/30 border-l-2 border-rose-500/50 text-xs text-rose-300/90 leading-relaxed">
                    <div className="text-rose-400/80 text-[10px] tracking-wider mb-1">PAUSE REASON</div>
                    {stats.ai_state.pause_reason}
                  </div>
                )}
              </section>
            )}

            {/* Equity curve */}
            <section className="border border-zinc-800 bg-zinc-900/20">
              <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
                <div className="text-xs text-zinc-400 tracking-wider">EQUITY CURVE</div>
                <div className="text-xs text-zinc-500">
                  {stats.equity_curve?.length || 0} points
                </div>
              </div>
              <div className="p-4">
                {stats.equity_curve && stats.equity_curve.length > 1 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={stats.equity_curve} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <XAxis
                        dataKey="ts"
                        tick={{ fill: "#71717a", fontSize: 10, fontFamily: "JetBrains Mono" }}
                        axisLine={{ stroke: "#3f3f46" }}
                        tickLine={false}
                        tickFormatter={(ts) => {
                          const d = new Date(ts * 1000);
                          return `${d.getMonth() + 1}/${d.getDate()}`;
                        }}
                      />
                      <YAxis
                        tick={{ fill: "#71717a", fontSize: 10, fontFamily: "JetBrains Mono" }}
                        axisLine={{ stroke: "#3f3f46" }}
                        tickLine={false}
                        domain={["auto", "auto"]}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#09090b",
                          border: "1px solid #27272a",
                          fontSize: 11,
                          fontFamily: "JetBrains Mono",
                        }}
                        labelStyle={{ color: "#a1a1aa" }}
                        itemStyle={{ color: "#10b981" }}
                        labelFormatter={(ts) => new Date(ts * 1000).toLocaleString()}
                        formatter={(v) => [`$${v?.toFixed(2)}`, "Equity"]}
                      />
                      <ReferenceLine
                        y={stats.capital?.initial_usdt}
                        stroke="#52525b"
                        strokeDasharray="2 4"
                        strokeWidth={1}
                      />
                      <Line
                        type="monotone"
                        dataKey="equity"
                        stroke="#10b981"
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-zinc-600 text-xs">
                    Not enough data yet
                  </div>
                )}
              </div>
            </section>

            {/* Positions + Strategies */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Open positions */}
              <section className="border border-zinc-800 bg-zinc-900/20">
                <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
                  <div className="text-xs text-zinc-400 tracking-wider">OPEN POSITIONS</div>
                  <div className="text-xs text-zinc-500">{stats.open_positions?.length || 0}</div>
                </div>
                <div className="divide-y divide-zinc-800/60">
                  {stats.open_positions?.length > 0 ? (
                    stats.open_positions.map((p, i) => {
                      const isExpanded = expandedPos === i;
                      const hasReasoning = Boolean(p.ai_reasoning || p.signal_reasoning);
                      return (
                        <div key={i} className="px-4 py-3">
                          <div
                            className={`flex items-center justify-between mb-1 ${hasReasoning ? "cursor-pointer hover:opacity-80" : ""}`}
                            onClick={() => hasReasoning && setExpandedPos(isExpanded ? null : i)}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-1.5 py-0.5 ${p.side === "long" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                                {p.side?.toUpperCase()}
                              </span>
                              <span className="font-bold">{p.symbol}</span>
                              {hasReasoning && (
                                <span className="text-xs text-zinc-600">
                                  {isExpanded ? "▾" : "▸"}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-zinc-500">{p.strategy}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <div className="text-zinc-500">ENTRY</div>
                              <div>${p.entry_price}</div>
                            </div>
                            <div>
                              <div className="text-rose-400/70">STOP</div>
                              <div className="text-rose-400/90">${p.stop_loss}</div>
                            </div>
                            <div>
                              <div className="text-emerald-400/70">TARGET</div>
                              <div className="text-emerald-400/90">${p.take_profit}</div>
                            </div>
                          </div>
                          {p.ai_regime && (
                            <div className="mt-2 text-xs text-zinc-500">
                              <span className="text-purple-400/80">AI</span>: {p.ai_regime}
                              {p.ai_score != null && ` (${Number(p.ai_score).toFixed(1)})`}
                              {p.ai_confidence_mult != null && (
                                <span className="ml-2 text-zinc-600">
                                  × {Number(p.ai_confidence_mult).toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}
                          {isExpanded && hasReasoning && (
                            <div className="mt-3 p-3 bg-zinc-950/60 border-l-2 border-purple-500/40 text-xs text-zinc-300 leading-relaxed">
                              <div className="text-purple-400/80 mb-1 text-[10px] tracking-wider">
                                CLAUDE REASONING
                              </div>
                              {p.ai_reasoning || p.signal_reasoning}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-4 py-8 text-center text-zinc-600 text-xs">
                      No open positions
                    </div>
                  )}
                </div>
              </section>

              {/* By strategy */}
              <section className="border border-zinc-800 bg-zinc-900/20">
                <div className="px-4 py-2 border-b border-zinc-800">
                  <div className="text-xs text-zinc-400 tracking-wider">BY STRATEGY</div>
                </div>
                <div className="divide-y divide-zinc-800/60">
                  {stats.by_strategy?.length > 0 ? (
                    stats.by_strategy.map((s, i) => (
                      <div key={i} className="px-4 py-2 flex items-center justify-between">
                        <div>
                          <div className="text-sm">{s.name}</div>
                          <div className="text-xs text-zinc-500">
                            {s.n_trades} trades · {s.win_rate}% WR
                          </div>
                        </div>
                        <div className={`text-right font-bold ${pnlColor(s.pnl_usdt)}`}>
                          {fmtUSD(s.pnl_usdt)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-zinc-600 text-xs">
                      No closed trades yet
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Recent trades */}
            <section className="border border-zinc-800 bg-zinc-900/20">
              <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
                <div className="text-xs text-zinc-400 tracking-wider">RECENT TRADES</div>
                <div className="text-xs text-zinc-500">last 10</div>
              </div>
              <div className="overflow-x-auto">
                {stats.recent_trades?.length > 0 ? (
                  <table className="w-full text-xs">
                    <thead className="text-zinc-500 border-b border-zinc-800/60">
                      <tr>
                        <th className="px-4 py-2 text-left font-normal">SIDE</th>
                        <th className="px-4 py-2 text-left font-normal">SYMBOL</th>
                        <th className="px-4 py-2 text-left font-normal hidden md:table-cell">STRATEGY</th>
                        <th className="px-4 py-2 text-right font-normal hidden sm:table-cell">ENTRY</th>
                        <th className="px-4 py-2 text-right font-normal hidden sm:table-cell">EXIT</th>
                        <th className="px-4 py-2 text-right font-normal">PNL</th>
                        <th className="px-4 py-2 text-left font-normal hidden md:table-cell">EXIT</th>
                        <th className="px-4 py-2 text-right font-normal">AGO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                      {stats.recent_trades.map((t, i) => (
                        <tr key={i} className="hover:bg-zinc-900/40">
                          <td className="px-4 py-2">
                            <span className={`text-xs px-1.5 py-0.5 ${t.side === "long" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                              {t.side?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-2 font-bold">{t.symbol}</td>
                          <td className="px-4 py-2 text-zinc-400 hidden md:table-cell">{t.strategy}</td>
                          <td className="px-4 py-2 text-right text-zinc-400 hidden sm:table-cell">${t.entry_price}</td>
                          <td className="px-4 py-2 text-right text-zinc-400 hidden sm:table-cell">${t.exit_price}</td>
                          <td className={`px-4 py-2 text-right font-bold ${pnlColor(t.pnl_usdt)}`}>
                            {fmtUSD(t.pnl_usdt)}
                            <div className="text-xs font-normal opacity-70">{fmtPct(t.pnl_pct)}</div>
                          </td>
                          <td className="px-4 py-2 hidden md:table-cell">
                            <span className={`text-xs ${t.exit_reason === "tp" ? "text-emerald-400/70" : t.exit_reason === "sl" ? "text-rose-400/70" : "text-zinc-500"}`}>
                              {t.exit_reason?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right text-zinc-500">{fmtAgo(t.exit_time)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-4 py-8 text-center text-zinc-600 text-xs">
                    No closed trades yet
                  </div>
                )}
              </div>
            </section>

            {/* AI Insights timeline */}
            <section className="border border-zinc-800 bg-zinc-900/20">
              <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
                <div className="text-xs text-zinc-400 tracking-wider">
                  AI INSIGHTS
                  <span className="ml-2 text-purple-400/60">◆ CLAUDE</span>
                </div>
                <div className="text-xs text-zinc-500">
                  {stats.ai_insights?.length || 0} recent
                </div>
              </div>
              <div className="divide-y divide-zinc-800/40">
                {stats.ai_insights?.length > 0 ? (
                  [...stats.ai_insights].reverse().slice(0, 10).map((ins, i) => {
                    const regimeColor =
                      ins.regime === "trending" ? "emerald"
                      : ins.regime === "chaotic" ? "rose"
                      : "zinc";
                    const badgeClass = {
                      emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                      rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                      zinc: "bg-zinc-700/20 text-zinc-400 border-zinc-700/40",
                    }[regimeColor];
                    const multColor = ins.confidence_mult >= 1.0
                      ? "text-emerald-400/70"
                      : ins.confidence_mult >= 0.7 ? "text-amber-400/70"
                      : "text-rose-400/70";
                    return (
                      <div key={i} className="px-4 py-3">
                        <div className="flex items-start justify-between mb-2 gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] px-1.5 py-0.5 border ${badgeClass} tracking-wider`}>
                              {ins.regime?.toUpperCase()}
                              {ins.regime_score != null && ` ${Number(ins.regime_score).toFixed(1)}`}
                            </span>
                            <span className="text-xs font-bold">{ins.symbol}</span>
                            {ins.kill_switch && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                KILL
                              </span>
                            )}
                            {ins.pause_minutes > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                PAUSE {ins.pause_minutes}m
                              </span>
                            )}
                            {ins.confidence_mult != null && (
                              <span className={`text-[10px] ${multColor}`}>
                                × {Number(ins.confidence_mult).toFixed(2)}
                              </span>
                            )}
                            {ins.conviction_tier && ins.conviction_tier !== "medium" && (
                              <span className={`text-[10px] ${ins.conviction_tier === "high" ? "text-emerald-400/70" : "text-zinc-500"}`}>
                                {ins.conviction_tier.toUpperCase()} CONVICTION
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-zinc-500 whitespace-nowrap">
                            {fmtAgo(ins.ts)} ago
                          </span>
                        </div>
                        {ins.enabled_strategies && ins.enabled_strategies.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-1">
                            {ins.enabled_strategies.map(s => (
                              <span key={s} className="text-[10px] px-1.5 py-0.5 bg-emerald-500/5 text-emerald-400/80 border border-emerald-500/20">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                        {ins.reasoning && (
                          <div className="text-xs text-zinc-300 leading-relaxed pl-1 border-l-2 border-purple-500/30">
                            <span className="pl-2 block">{ins.reasoning}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="px-4 py-8 text-center text-zinc-600 text-xs">
                    No AI insights yet (regime checks run every 30m)
                  </div>
                )}
              </div>
            </section>

            {/* Footer meta */}
            <section className="border border-zinc-800 bg-zinc-900/20 px-4 py-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <MetaItem label="UPTIME" value={fmtUptime(stats.status?.uptime_sec)} />
                <MetaItem label="SYMBOLS" value={stats.status?.symbols?.length || 0} />
                <MetaItem label="CONSEC LOSSES" value={stats.performance?.consecutive_losses || 0} />
                <MetaItem label="TOTAL FEES" value={`$${stats.capital?.total_fees_usdt?.toFixed(2) || "0.00"}`} />
              </div>
            </section>
          </main>
        )}

        {/* Footer */}
        <footer className="border-t border-zinc-800/80 px-6 py-3 mt-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-zinc-600">
            <span>BOT.TRADING // DASHBOARD v1.0</span>
            <span>auto-refresh 30s</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function StatCard({ label, value, valueColor = "text-zinc-100", sub, subColor = "text-zinc-500", accent }) {
  const accentClass = accent === "emerald" ? "border-l-2 border-l-emerald-500" : "";
  return (
    <div className={`border border-zinc-800 bg-zinc-900/20 p-4 ${accentClass}`}>
      <div className="text-xs text-zinc-500 tracking-wider mb-1">{label}</div>
      <div className={`font-display text-2xl font-bold tabular-nums ${valueColor}`}>
        {value}
      </div>
      {sub && <div className={`text-xs mt-1 ${subColor}`}>{sub}</div>}
    </div>
  );
}

function MetaItem({ label, value }) {
  return (
    <div>
      <div className="text-zinc-500 tracking-wider">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  );
}
