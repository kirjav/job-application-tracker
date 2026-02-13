import { useQuery } from "@tanstack/react-query";
import API from "../utils/api";
import "./Stats.css";

const STATUS_COLOR_MAP = {
  Wishlist: "var(--wishlist-status-color)",
  Applied: "var(--applied-status-color)",
  Interviewing: "var(--interviewing-status-color)",
  Offer: "var(--offer-status-color)",
  Rejected: "var(--rejected-status-color)",
  Ghosted: "var(--ghosted-status-color)",
  Withdrawn: "var(--withdrawn-status-color)",
};

// ── Widget 1: Weekly Goal ────────────────────────────────────
function WeeklyGoalWidget({ goal, submitted }) {
  const pct = goal > 0 ? Math.min((submitted / goal) * 100, 100) : 0;
  const met = submitted >= goal && goal > 0;

  return (
    <div className="stats-widget stats-weekly-goal">
      <h2 className="stats-widget-title">Weekly Goal</h2>

      <div className="stats-goal-ring-wrap">
        <svg className="stats-goal-ring" viewBox="0 0 120 120" aria-hidden="true">
          <circle className="stats-goal-ring-track" cx="60" cy="60" r="52" />
          <circle
            className="stats-goal-ring-fill"
            cx="60"
            cy="60"
            r="52"
            style={{
              strokeDasharray: `${2 * Math.PI * 52}`,
              strokeDashoffset: `${2 * Math.PI * 52 * (1 - pct / 100)}`,
            }}
          />
        </svg>
        <div className="stats-goal-ring-label">
          <span className="stats-goal-ring-count">{submitted}</span>
          <span className="stats-goal-ring-of">of {goal}</span>
        </div>
      </div>

      <p className="stats-goal-caption">
        {met
          ? "You hit your goal this week — nice work!"
          : `${goal - submitted} more to reach your weekly target`}
      </p>

      <div className="stats-goal-bar-wrap">
        <div className="stats-goal-bar-track">
          <div
            className="stats-goal-bar-fill-clip"
            style={{ width: `${pct}%`, ["--pct"]: Math.max(pct, 0.5) }}
          >
            <div className={`stats-goal-bar-fill ${met ? "is-met" : ""}`} />
          </div>
        </div>
        <span className="stats-goal-bar-pct">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

// ── Widget 2: Status Breakdown ───────────────────────────────
function StatusBreakdownWidget({ breakdown }) {
  const maxCount = Math.max(...breakdown.map((s) => s.count), 1);
  const total = breakdown.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="stats-widget stats-status-breakdown">
      <h2 className="stats-widget-title">
        Status Overview
        <span className="stats-widget-subtitle">{total} total</span>
      </h2>

      <ul className="stats-status-list" aria-label="Applications by status">
        {breakdown.map(({ status, count }) => (
          <li key={status} className="stats-status-row">
            <div className="stats-status-label-wrap">
              <span
                className="stats-status-dot"
                style={{ backgroundColor: STATUS_COLOR_MAP[status] }}
                aria-hidden="true"
              />
              <span className="stats-status-name">{status}</span>
            </div>
            <div className="stats-status-bar-wrap">
              <div className="stats-status-bar-track">
                <div
                  className="stats-status-bar-fill"
                  style={{
                    width: `${(count / maxCount) * 100}%`,
                    backgroundColor: STATUS_COLOR_MAP[status],
                  }}
                />
              </div>
              <span className="stats-status-count">{count}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Widget 3: 8-Week Trend ───────────────────────────────────
function WeeklyTrendWidget({ trend }) {
  const maxCount = Math.max(...trend.map((w) => w.count), 1);

  return (
    <div className="stats-widget stats-weekly-trend">
      <h2 className="stats-widget-title">8-Week Activity</h2>

      <div className="stats-trend-chart" role="img" aria-label="Applications submitted per week over the last 8 weeks">
        {trend.map((week, i) => {
          const heightPct = (week.count / maxCount) * 100;
          return (
            <div
              key={i}
              className={`stats-trend-col ${week.isCurrent ? "is-current" : ""}`}
            >
              <span className="stats-trend-count">{week.count}</span>
              <div className="stats-trend-bar-wrap">
                <div
                  className="stats-trend-bar"
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                />
              </div>
              <span className="stats-trend-label">{week.weekLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Stats Page ───────────────────────────────────────────────
export default function Stats() {
  const { data, isLoading: loading } = useQuery({
    queryKey: ["applications", "stats"],
    queryFn: async () => {
      const res = await API.get("/applications/stats");
      return res.data;
    },
  });

  return (
    <div className="stats-page">
      <div className="stats-container">
        <header className="stats-header">
          <h1 className="stats-title">Stats</h1>
        </header>

        {loading ? (
          <p className="stats-loading" role="status">Loading stats...</p>
        ) : !data ? (
          <p className="stats-loading" role="status">Could not load stats.</p>
        ) : (
          <div className="stats-grid">
            <WeeklyGoalWidget
              goal={data.weeklyGoal.goal}
              submitted={data.weeklyGoal.submitted}
            />
            <StatusBreakdownWidget breakdown={data.statusBreakdown} />
            <WeeklyTrendWidget trend={data.weeklyTrend} />
          </div>
        )}
      </div>
    </div>
  );
}
