import { Request } from 'express';
import { User } from '../entities/user.entity';

/**
 * Shape of the user object attached to request by JWT strategy.
 * The validate() method in JwtStrategy returns this shape.
 */
export interface RequestUser {
    userId: string;
    username: string;
}

/**
 * Extends the Express Request interface to include the authenticated user.
 * This type should be used in all controllers that receive requests via
 * @Request() decorator when the user is authenticated via JWT.
 *
 * Note: Currently, the JWT strategy returns a simplified RequestUser object
 * with userId and username. To access the full User entity, you would need
 * to fetch it using the userId.
 *
 * @example
 * ```typescript
 * @Post('create')
 * async create(@Request() req: AuthenticatedRequest) {
 *   const userId = req.user?.userId; // Type-safe access to user ID
 * }
 * ```
 */
export interface AuthenticatedRequest extends Request {
    user?: RequestUser;
}
