export const paginate = (page = 1, limit = 20) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
};

export const buildMeta = (total: number, page = 1, limit = 20) => {
  const safeLimit = Math.min(Math.max(1, limit), 100);
  return {
    total,
    page,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
  };
};
