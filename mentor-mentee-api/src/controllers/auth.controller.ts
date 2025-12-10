import { Request, Response } from 'express';
import 'express-async-errors';
import { AuthService } from '../services/auth.service';
import { success, conflictError, authError } from '../utils/responses';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const user = await authService.register(req.body);
      return success(res, user, 201);
    } catch (error: any) {
      if (error.message === 'User already exists') {
        return conflictError(res, 'Email already registered');
      }
      throw error;
    }
  }

  async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req.body);
      return success(res, result);
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        return authError(res, 'Invalid email or password');
      }
      throw error;
    }
  }

  async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await authService.getCurrentUser(req.user!.sub);
      return success(res, user);
    } catch (error: any) {
      if (error.message === 'User not found') {
        return authError(res, 'User not found');
      }
      throw error;
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(
        req.user!.sub,
        currentPassword,
        newPassword
      );
      return success(res, result);
    } catch (error: any) {
      if (error.message === 'Current password is incorrect') {
        return authError(res, 'Current password is incorrect');
      }
      if (error.message === 'New password must be different from current password') {
        return authError(res, 'New password must be different from current password');
      }
      if (error.message === 'User not found') {
        return authError(res, 'User not found');
      }
      throw error;
    }
  }
}
