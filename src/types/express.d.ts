/**
 * types/express.d.ts
 *
 * Extends the Express `Request` interface to include the authenticated user.
 * `req.user` is populated by the `authenticate` middleware after JWT verification.
 * It is `undefined` on unauthenticated routes.
 */

import { User } from "../generated/prisma/client.js";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
