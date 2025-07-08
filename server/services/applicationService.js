const prisma = require("../utils/prisma");

/**
 * Get a paginated list of user applications, with optional tag filtering
 *
 * @param {Object} options - Options for pagination and filtering
 * @param {number} options.userId - ID of the user
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.pageSize=10] - Number of items per page
 * @param {string[]} [options.tagFilter=[]] - Array of tag names to filter by
 */

const MAX_PAGE_SIZE = 100;

async function getPaginatedApplications({ userId, page = 1, pageSize = 10, tagFilter = [] }) {
  // Sanitize page
  if (typeof page !== "number" || page < 1) {
    console.warn(`Invalid page "${page}" provided, defaulting to 1`);
    page = 1;
  }

  // Sanitize and cap pageSize
  if (typeof pageSize !== "number" || pageSize < 1) {
    console.warn(`Invalid pageSize "${pageSize}" provided, defaulting to 10`);
    pageSize = 10;
  } else if (pageSize > MAX_PAGE_SIZE) {
    console.warn(`pageSize "${pageSize}" exceeds max of ${MAX_PAGE_SIZE}, capping to ${MAX_PAGE_SIZE}`);
    pageSize = MAX_PAGE_SIZE;
  }

  const whereClause = {
    userId,
    ...(Array.isArray(tagFilter) && tagFilter.length > 0 && {
      tags: {
        some: {
          tag: {
            name: { in: tagFilter },
            userId,
          },
        },
      },
    }),
  };

  const [applications, totalCount] = await Promise.all([
    prisma.application.findMany({
      where: whereClause,
      orderBy: { dateApplied: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        tags: { include: { tag: true } },
      },
    }),
    prisma.application.count({ where: whereClause }),
  ]);

  return {
    applications,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / pageSize),
    pageSize,
  };
}

module.exports = {
  getPaginatedApplications,
};