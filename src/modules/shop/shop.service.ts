/**
 * shop/shop.service.ts
 *
 * Business logic for shop management.
 *
 * Shop lifecycle:
 *   PENDING (created) → ACTIVE (admin approves) → SUSPENDED (admin suspends)
 *
 * A user can only own one shop. Shops start as PENDING and must be approved
 * by an admin before their products appear in the public catalog.
 * Public browsing only shows ACTIVE shops.
 */

import { slugify } from "../../lib/slug.js";
import { paginate, buildMeta } from "../../lib/paginate.js";
import { AppError } from "../../types/errors.js";
import { ShopStatus } from "../../generated/prisma/enums.js";
import {
  findShopByOwnerId,
  findShopBySlug,
  findShopById,
  findAllShops,
  countShops,
  createShop,
  updateShopById,
} from "./shop.repository.js";

/** Creates a new shop for the authenticated user. One shop per user is enforced. */
export const createShopService = async (
  ownerId: string,
  data: { name: string; description: string },
) => {
  const existing = await findShopByOwnerId(ownerId);
  if (existing) throw new AppError("You already have a shop", 409);

  const slug = slugify(data.name);
  const slugExists = await findShopBySlug(slug);
  if (slugExists) throw new AppError("Shop name already taken", 409);

  const shop = await createShop({ ownerId, slug, ...data });
  return { data: shop };
};

export const getMyShopService = async (ownerId: string) => {
  const shop = await findShopByOwnerId(ownerId);
  if (!shop) throw new AppError("You don't have a shop yet", 404);
  return { data: shop };
};

/**
 * Updates the authenticated user's shop.
 * If the name changes, regenerates the slug and checks for conflicts.
 */
export const updateMyShopService = async (
  ownerId: string,
  data: { name?: string; description?: string },
) => {
  const shop = await findShopByOwnerId(ownerId);
  if (!shop) throw new AppError("You don't have a shop yet", 404);

  const slug = data.name ? slugify(data.name) : undefined;
  if (slug && slug !== shop.slug) {
    const slugExists = await findShopBySlug(slug);
    if (slugExists) throw new AppError("Shop name already taken", 409);
  }

  const updated = await updateShopById(shop.id, {
    ...data,
    ...(slug && { slug }),
  });
  return { data: updated };
};

/** Public shop lookup — only returns ACTIVE shops. Returns 404 for PENDING/SUSPENDED. */
export const getShopBySlugService = async (slug: string) => {
  const shop = await findShopBySlug(slug);
  if (!shop) throw new AppError("Shop not found", 404);
  // Hide non-active shops from public view (don't leak their existence)
  if (shop.status !== ShopStatus.ACTIVE)
    throw new AppError("Shop not found", 404);
  return { data: shop };
};

/** Admin: list all shops, optionally filtered by status. */
export const getAllShopsService = async (
  page: number,
  limit: number,
  status?: string,
) => {
  const validStatuses = Object.values(ShopStatus);
  if (status && !validStatuses.includes(status as ShopStatus)) {
    throw new AppError(
      `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      400,
    );
  }

  const { skip, take } = paginate(page, limit);
  const parsedStatus = status as ShopStatus | undefined;
  const [shops, total] = await Promise.all([
    findAllShops(skip, take, parsedStatus),
    countShops(parsedStatus),
  ]);
  return { data: shops, meta: buildMeta(total, page, limit) };
};

/** Admin: approve a PENDING or SUSPENDED shop → ACTIVE. */
export const approveShopService = async (id: string) => {
  const shop = await findShopById(id);
  if (!shop) throw new AppError("Shop not found", 404);
  if (shop.status === ShopStatus.ACTIVE)
    throw new AppError("Shop is already active", 400);
  const updated = await updateShopById(id, { status: ShopStatus.ACTIVE });
  return { data: updated };
};

/** Admin: suspend an ACTIVE shop → SUSPENDED. Products become invisible to public. */
export const suspendShopService = async (id: string) => {
  const shop = await findShopById(id);
  if (!shop) throw new AppError("Shop not found", 404);
  if (shop.status === ShopStatus.SUSPENDED)
    throw new AppError("Shop is already suspended", 400);
  const updated = await updateShopById(id, { status: ShopStatus.SUSPENDED });
  return { data: updated };
};
