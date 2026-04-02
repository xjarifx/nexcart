/**
 * lib/paginate.ts
 *
 * Utilities for cursor-free offset pagination.
 *
 * `paginate`   — converts page/limit into Prisma-compatible skip/take values.
 * `buildMeta`  — builds the `meta` object returned in paginated API responses.
 *
 * Limits are clamped: page minimum is 1, limit is between 1 and 100.
 */

/**
 * Converts page and limit into Prisma skip/take.
 * @param page  - 1-based page number (defaults to 1)
 * @param limit - items per page (defaults to 20, max 100)
 */
export const paginate = (page = 1, limit = 20) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
};

/**
 * Builds the pagination metadata block for API responses.
 * @param total - total number of records matching the query
 * @param page  - current page number
 * @param limit - items per page
 */
export const buildMeta = (total: number, page = 1, limit = 20) => {
  const safeLimit = Math.min(Math.max(1, limit), 100);
  return {
    total,
    page,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
  };
};

/**
 * Parses `page` and `limit` from request query values.
 * Accepts string/number/undefined and returns safe numeric values.
 */
export const parsePaginationQuery = (query: {
  page?: string | number;
  limit?: string | number;
}) => {
  const parsedPage = Number(query.page);
  const parsedLimit = Number(query.limit);

  const page = Number.isFinite(parsedPage) ? parsedPage : 1;
  const limit = Number.isFinite(parsedLimit) ? parsedLimit : 20;

  return {
    page: Math.max(1, Math.trunc(page)),
    limit: Math.min(100, Math.max(1, Math.trunc(limit))),
  };
};
