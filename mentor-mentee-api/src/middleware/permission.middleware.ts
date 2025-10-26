import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { authError, forbiddenError } from '../utils/responses';
import { getEffectivePermissions } from '../services/permission.service';

export type Scope = 'own' | 'any';

export interface PermissionOptions {
  scope?: Scope;
  /**
   * Function to get the owner ID of the resource
   * Used for 'own' scope checks
   */
  getResourceOwnerId?: (req: AuthenticatedRequest) => Promise<number | null> | number | null;
}

/**
 * Middleware to check if user has required permission
 * 
 * @example
 * // Check for permission without scope
 * router.post('/', authenticate, authorizePermissions('post:create'), createPost);
 * 
 * @example
 * // Check for permission with 'own' scope
 * router.put('/:id',
 *   authenticate,
 *   authorizePermissions('post:update', {
 *     scope: 'own',
 *     getResourceOwnerId: async (req) => {
 *       const post = await prisma.post.findUnique({ where: { id: Number(req.params.id) } });
 *       return post?.authorId ?? null;
 *     }
 *   }),
 *   updatePost
 * );
 */
export function authorizePermissions(requiredPermission: string, options?: PermissionOptions) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Ensure user is authenticated
      if (!req.user || !req.user.sub) {
        return authError(res, 'Authentication required');
      }

      const userId = Number(req.user.sub);

      // Get user's effective permissions (role + user overrides)
      const effectivePermissions = await getEffectivePermissions(userId);

      // Extract base permission (remove scope suffix if exists)
      const basePermission = requiredPermission.replace(/_(own|any)$/, '');

      // Handle scope-based permission check
      if (options?.scope) {
        if (options.scope === 'any') {
          // Check for 'any' scope permission or base permission
          const hasAnyPermission = 
            effectivePermissions.has(`${basePermission}_any`) ||
            effectivePermissions.has(basePermission);

          if (!hasAnyPermission) {
            return forbiddenError(res, `Insufficient permissions: ${requiredPermission}`);
          }

          return next();
        }

        if (options.scope === 'own') {
          // Check for 'any' scope permission (higher privilege)
          if (effectivePermissions.has(`${basePermission}_any`)) {
            return next();
          }

          // Check for 'own' scope permission
          const hasOwnPermission = 
            effectivePermissions.has(`${basePermission}_own`) ||
            effectivePermissions.has(basePermission);

          if (!hasOwnPermission) {
            return forbiddenError(res, `Insufficient permissions: ${requiredPermission}`);
          }

          // Verify ownership
          if (!options.getResourceOwnerId) {
            return forbiddenError(res, 'Ownership verification not configured');
          }

          const resourceOwnerId = await options.getResourceOwnerId(req);

          if (resourceOwnerId === null) {
            return forbiddenError(res, 'Resource not found or ownership cannot be determined');
          }

          if (userId !== resourceOwnerId) {
            return forbiddenError(res, 'You do not own this resource');
          }

          return next();
        }
      }

      // No scope specified - check for exact permission or with _any suffix
      const hasPermission = 
        effectivePermissions.has(requiredPermission) ||
        effectivePermissions.has(`${basePermission}_any`) ||
        effectivePermissions.has(basePermission);

      if (!hasPermission) {
        return forbiddenError(res, `Insufficient permissions: ${requiredPermission}`);
      }

      return next();
    } catch (error) {
      console.error('Permission check error:', error);
      return forbiddenError(res, 'Permission verification failed');
    }
  };
}

/**
 * Middleware to check if user has any of the required permissions
 */
export function authorizeAnyPermission(requiredPermissions: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        return authError(res, 'Authentication required');
      }

      const userId = Number(req.user.sub);
      const effectivePermissions = await getEffectivePermissions(userId);

      const hasAny = requiredPermissions.some(perm => effectivePermissions.has(perm));

      if (!hasAny) {
        return forbiddenError(res, `Insufficient permissions. Required one of: ${requiredPermissions.join(', ')}`);
      }

      return next();
    } catch (error) {
      console.error('Permission check error:', error);
      return forbiddenError(res, 'Permission verification failed');
    }
  };
}

/**
 * Middleware to check if user has all of the required permissions
 */
export function authorizeAllPermissions(requiredPermissions: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        return authError(res, 'Authentication required');
      }

      const userId = Number(req.user.sub);
      const effectivePermissions = await getEffectivePermissions(userId);

      const hasAll = requiredPermissions.every(perm => effectivePermissions.has(perm));

      if (!hasAll) {
        return forbiddenError(res, `Insufficient permissions. Required all of: ${requiredPermissions.join(', ')}`);
      }

      return next();
    } catch (error) {
      console.error('Permission check error:', error);
      return forbiddenError(res, 'Permission verification failed');
    }
  };
}

/**
 * Helper function to check permission in controller logic
 * Use this when you need to check permission conditionally in code
 */
export async function checkPermission(userId: number, permission: string): Promise<boolean> {
  try {
    const effectivePermissions = await getEffectivePermissions(userId);
    return effectivePermissions.has(permission);
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}
