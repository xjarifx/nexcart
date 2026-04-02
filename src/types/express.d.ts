/**
 * types/express.d.ts
 *
 * Extends the Express `Request` interface to include the authenticated user.
 * `req.user` is populated by the `authenticate` middleware after JWT verification.
 * It is `undefined` on unauthenticated routes.
 */

import { Role } from "../generated/prisma/enums.js";

type AuthenticatedUser = {
  id: string;
  role: Role;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
