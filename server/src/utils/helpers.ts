import { Request } from 'express';

// ==================================================
// Pagination helper
// Parses page & limit from query string, returns skip/take for Prisma
// ==================================================
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

export const getPagination = (req: Request): PaginationParams => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const skip = (page - 1) * limit;

  return { page, limit, skip, take: limit };
};

// ==================================================
// Pagination response metadata
// ==================================================
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const getPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

// ==================================================
// Sort helper
// Parses sortBy & sortOrder from query string for Prisma orderBy
// ==================================================
export const getSorting = (
  req: Request,
  allowedFields: string[],
  defaultField: string = 'createdAt',
  defaultOrder: 'asc' | 'desc' = 'desc'
) => {
  const sortBy = (req.query.sortBy as string) || defaultField;
  const sortOrder = ((req.query.sortOrder as string) || defaultOrder) as 'asc' | 'desc';

  // Only allow sorting by whitelisted fields to prevent injection
  const field = allowedFields.includes(sortBy) ? sortBy : defaultField;
  const order = ['asc', 'desc'].includes(sortOrder) ? sortOrder : defaultOrder;

  return { [field]: order };
};

// ==================================================
// Search helper
// Returns a Prisma 'contains' filter for the given fields
// ==================================================
export const getSearchFilter = (
  req: Request,
  searchFields: string[]
) => {
  const search = (req.query.search as string) || '';

  if (!search.trim()) return undefined;

  return {
    OR: searchFields.map((field) => ({
      [field]: {
        contains: search,
        mode: 'insensitive' as const,
      },
    })),
  };
};

// ==================================================
// Standard API response format
// ==================================================
export const apiResponse = <T>(
  data: T,
  message: string = 'Success',
  meta?: PaginationMeta
) => {
  return {
    success: true,
    message,
    data,
    ...(meta && { meta }),
  };
};
