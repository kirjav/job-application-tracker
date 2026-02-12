/**
 * One-time backfill: set effectiveSalary for existing applications that have
 * salary data but null effectiveSalary. Run with: node server/scripts/backfill-effective-salary.js
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function computeEffectiveSalary(salaryExact, salaryMin, salaryMax) {
  if (salaryExact != null && typeof salaryExact === "number" && !Number.isNaN(salaryExact)) {
    return salaryExact;
  }
  const min = salaryMin != null && typeof salaryMin === "number" && !Number.isNaN(salaryMin) ? salaryMin : null;
  const max = salaryMax != null && typeof salaryMax === "number" && !Number.isNaN(salaryMax) ? salaryMax : null;
  if (min != null && max != null) {
    return Math.round((min + max) / 2);
  }
  if (min != null) return min;
  if (max != null) return max;
  return null;
}

async function main() {
  const apps = await prisma.application.findMany({
    where: { effectiveSalary: null },
    select: { id: true, salaryExact: true, salaryMin: true, salaryMax: true },
  });

  let updated = 0;
  for (const app of apps) {
    const value = computeEffectiveSalary(app.salaryExact, app.salaryMin, app.salaryMax);
    if (value === null) continue;
    await prisma.application.update({
      where: { id: app.id },
      data: { effectiveSalary: value },
    });
    updated++;
  }

  console.log(`Backfilled effectiveSalary for ${updated} of ${apps.length} applications.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
