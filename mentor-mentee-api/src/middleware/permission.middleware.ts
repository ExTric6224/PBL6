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
 * Middleware to check if user has required permission(s)
 * Supports multiple permissions with OR logic
 * 
 * @example
 * // Check for single permission
 * router.post('/', authenticate, authorizePermissions('post:create'), createPost);
 * 
 * @example
 * // Check for multiple permissions (OR logic) - user needs at least one
 * router.get('/', authenticate, authorizePermissions('post:view_any', 'post:view_own'), getPosts);
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
export function authorizePermissions(...args: any[]) {
  // Support both single permission with options, or multiple permissions
  let requiredPermissions: string[] = [];
  let options: PermissionOptions | undefined;

  if (args.length === 1 && typeof args[0] === 'string') {
    requiredPermissions = [args[0]];
  } else if (args.length === 2 && typeof args[0] === 'string' && typeof args[1] === 'object') {
    requiredPermissions = [args[0]];
    options = args[1];
  } else {
    // Multiple permissions (OR logic)
    requiredPermissions = args.filter(arg => typeof arg === 'string');
  }

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Ensure user is authenticated
      if (!req.user || !req.user.sub) {
        return authError(res, 'Authentication required');
      }

      const userId = Number(req.user.sub);

      // Get user's effective permissions (role + user overrides)
      const effectivePermissions = await getEffectivePermissions(userId);

      // Check for multiple permissions with OR logic
      if (requiredPermissions.length > 1) {
        let hasPermission = false;

        // Check if this is a resource-specific route (has userId param)
        const resourceUserId = req.params.userId ? Number(req.params.userId) : null;

        for (const permission of requiredPermissions) {
          // Check if user has this permission
          if (effectivePermissions.has(permission)) {
            // For _own permissions: ONLY for user's own resources
            if (permission.endsWith('_own')) {
              // If no specific resource (list view), allow - service will filter
              if (!resourceUserId) {
                hasPermission = true;
                break;
              }
              // If viewing specific resource, MUST be owner
              if (userId === resourceUserId) {
                hasPermission = true;
                break;
              }
              // Not owner, continue checking other permissions
              continue;
            } 
            // For _any permissions: ONLY for OTHER users' resources (NOT own)
            else if (permission.endsWith('_any')) {
              // If no specific resource (list view), allow - service will filter
              if (!resourceUserId) {
                hasPermission = true;
                break;
              }
              // If viewing specific resource, MUST NOT be owner
              if (userId !== resourceUserId) {
                hasPermission = true;
                break;
              }
              // Is owner, cannot use _any permission for own resource
              continue;
            } 
            // For other permissions without suffix
            else {
              hasPermission = true;
              break;
            }
          }
        }

        if (!hasPermission) {
          console.log(`[PERMISSION DENIED] User ${userId} tried to access. Required one of: ${requiredPermissions.join(', ')}`);
          console.log(`  User has: ${Array.from(effectivePermissions).join(', ')}`);
          return forbiddenError(res, `Insufficient permissions. Required one of: ${requiredPermissions.join(', ')}`);
        }

        // console.log(`[PERMISSION GRANTED] User ${userId} has required permission`);
        return next();
      }

      // Single permission check
      const requiredPermission = requiredPermissions[0];
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

          // Verify this is NOT the user's own resource
          if (options.getResourceOwnerId) {
            const resourceOwnerId = await options.getResourceOwnerId(req);
            if (resourceOwnerId === userId) {
              return forbiddenError(res, 'Cannot use _any permission on your own resources');
            }
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

      // No scope specified - check for exact permission
      if (!effectivePermissions.has(requiredPermission)) {
        console.log(`[PERMISSION DENIED] User ${userId} tried to access ${requiredPermission}`);
        console.log(`  Required: ${requiredPermission}`);
        console.log(`  User has: ${Array.from(effectivePermissions).join(', ')}`);
        return forbiddenError(res, `Insufficient permissions: ${requiredPermission}`);
      }

      // console.log(`[PERMISSION GRANTED] User ${userId} has ${requiredPermission}`);
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
