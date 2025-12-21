import { Request, Response } from 'express';
import 'express-async-errors';
import { RegistrationOtpService } from '../services/registration-otp.service';
import { success, conflictError, tooManyRequestError, badRequestError } from '../utils/responses';

const service = new RegistrationOtpService();

export class RegistrationOtpController {
  async requestCode(req: Request, res: Response) {
    try {
      const data = await service.requestCode(req.body);
      return success(res, data, 201);
    } catch (e: any) {
      if (e.message === 'User already exists') return conflictError(res, 'Email already registered');
      if (e.message === 'Too many requests') return tooManyRequestError(res, 'Please wait before requesting again');
      throw e;
    }
  }

  async verifyCode(req: Request, res: Response) {
    try {
      const result = await service.verifyCode(req.body);
      return success(res, result);
    } catch (e: any) {
      if (e.message === 'Verification not found') return badRequestError(res, 'Vui lòng yêu cầu mã trước');
      if (e.message === 'Code expired') return badRequestError(res, 'Mã đã hết hạn, vui lòng yêu cầu mã mới');
      if (e.message === 'Too many attempts') return tooManyRequestError(res, 'Too many attempts, request a new code later');
      if (e.message === 'Invalid code') return badRequestError(res, 'Mã không đúng');
      throw e;
    }
  }

  async resendCode(req: Request, res: Response) {
    try {
      const data = await service.resendCode(req.body);
      return success(res, data);
    } catch (e: any) {
      if (e.message === 'Verification not found') return badRequestError(res, 'Vui lòng yêu cầu mã trước');
      if (e.message === 'Too many requests') return tooManyRequestError(res, 'Please wait before resending');
      throw e;
    }
  }
}