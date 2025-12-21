import { Request, Response } from 'express';
import 'express-async-errors';
import { ForgotPasswordService } from '../services/forgot-password.service';
import { success, badRequestError, tooManyRequestError } from '../utils/responses';

const service = new ForgotPasswordService();

export class ForgotPasswordController {
  async requestResetCode(req: Request, res: Response) {
    try {
      const data = await service.requestResetCode(req.body);
      return success(res, data, 201);
    } catch (e: any) {
      if (e.message === 'Too many requests') return tooManyRequestError(res, 'Please wait before requesting again');
      throw e;
    }
  }

  async verifyResetCode(req: Request, res: Response) {
    try {
      const result = await service.verifyResetCode(req.body);
      return success(res, result);
    } catch (e: any) {
      if (e.message === 'Reset request not found') return badRequestError(res, 'Please request a reset code first');
      if (e.message === 'Code expired') return badRequestError(res, 'Code expired, please request a new one');
      if (e.message === 'Too many attempts') return tooManyRequestError(res, 'Too many attempts, request a new code');
      if (e.message === 'Invalid code') return badRequestError(res, 'Mã không đúng');
      if (e.message === 'Code already used') return badRequestError(res, 'Mã đã được sử dụng, vui lòng yêu cầu mã mới');
      throw e;
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const result = await service.resetPassword(req.body);
      return success(res, result);
    } catch (e: any) {
      if (e.message === 'Reset request not found') return badRequestError(res, 'Vui lòng yêu cầu mã đặt lại trước');
      if (e.message === 'Code expired') return badRequestError(res, 'Mã đã hết hạn, vui lòng yêu cầu mã mới');
      if (e.message === 'Invalid code') return badRequestError(res, 'Mã không đúng');
      if (e.message === 'Code already used') return badRequestError(res, 'Mã đã được sử dụng, vui lòng yêu cầu mã mới');
      throw e;
    }
  }

  async resendResetCode(req: Request, res: Response) {
    try {
      const data = await service.resendResetCode(req.body);
      return success(res, data);
    } catch (e: any) {
      if (e.message === 'Reset request not found') return badRequestError(res, 'Vui lòng yêu cầu mã đặt lại trước');
      if (e.message === 'Too many requests') return tooManyRequestError(res, 'Please wait before resending');
      if (e.message === 'Code already used') return badRequestError(res, 'Mã đã được sử dụng, vui lòng yêu cầu mã mới');
      throw e;
    }
  }
}
