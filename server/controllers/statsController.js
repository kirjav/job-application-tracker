const prisma = require("../utils/prisma");
const { handleError } = require("../utils/handleError");

const STATUS_OPTIONS = [
  "Wishlist",
  "Applied",
  "Interviewing",
  "Offer",
  "Rejected",
  "Ghosted",
  "Withdrawn",
];

/**
 * Return the Monday 00:00:00 of the week that contains `date`.
 */
function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? 6 : day - 1; // shift so Mon=0
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * GET /applications/stats
 *
 * Returns three datasets in a single response:
 *   weeklyGoal    – { goal, submitted }
 *   statusBreakdown – [{ status, count }]
 *   weeklyTrend   – [{ weekLabel, count }]  (last 8 weeks)
 */
async function getStats(req, res) {
  const userId = req.user.userId;

  try {
    // ── Resolve weekly goal ───────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { dailyApplicationGoal: true },
    });
    const dailyGoal = user?.dailyApplicationGoal ?? 3;
    const weeklyGoal = dailyGoal * 7;

    // ── Current-week boundaries (Mon 00:00 → next Mon 00:00) ─
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // ── 8-week trend boundaries ──────────────────────────────
    const trendStart = new Date(weekStart);
    trendStart.setDate(trendStart.getDate() - 7 * 7); // 7 prior weeks + current = 8

    // ── Parallel DB queries ──────────────────────────────────
    const [submittedCount, statusGroups, trendApps] = await Promise.all([
      // 1) Applications created this week
      prisma.application.count({
        where: {
          userId,
          dateApplied: { gte: weekStart, lt: weekEnd },
        },
      }),

      // 2) Status breakdown (all applications)
      prisma.application.groupBy({
        by: ["status"],
        where: { userId },
        _count: { id: true },
      }),

      // 3) Applications in the last 8 weeks (for trend)
      prisma.application.findMany({
        where: {
          userId,
          dateApplied: { gte: trendStart, lt: weekEnd },
        },
        select: { dateApplied: true },
      }),
    ]);

    // ── Build status breakdown (include zero-count statuses) ─
    const countByStatus = {};
    for (const g of statusGroups) {
      countByStatus[g.status] = g._count.id;
    }
    const statusBreakdown = STATUS_OPTIONS.map((s) => ({
      status: s,
      count: countByStatus[s] || 0,
    }));

    // ── Build 8-week trend ───────────────────────────────────
    // Create 8 buckets keyed by their Monday date
    const buckets = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() - 7 * i);
      buckets.push({
        start: new Date(d),
        weekLabel: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count: 0,
        isCurrent: i === 0,
      });
    }

    for (const app of trendApps) {
      const appWeekStart = startOfWeek(app.dateApplied);
      const appWeekMs = appWeekStart.getTime();
      const bucket = buckets.find((b) => b.start.getTime() === appWeekMs);
      if (bucket) bucket.count += 1;
    }

    const weeklyTrend = buckets.map(({ weekLabel, count, isCurrent }) => ({
      weekLabel,
      count,
      isCurrent,
    }));

    // ── Response ─────────────────────────────────────────────
    return res.json({
      weeklyGoal: { goal: weeklyGoal, submitted: submittedCount },
      statusBreakdown,
      weeklyTrend,
    });
  } catch (err) {
    return handleError(res, err, "Failed to fetch stats");
  }
}

module.exports = { getStats };
