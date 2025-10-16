import { Router } from 'express';
import { ForgotPasswordController } from '../controllers/forgot-password.controller';
import { validate } from '../middleware/validate.middleware';
import { 
  requestResetCodeSchema, 
  verifyResetCodeSchema, 
  resetPasswordSchema,
  resendResetCodeSchema 
} from '../schemas/forgot-password.schema';

const router = Router();
const ctrl = new ForgotPasswordController();

// Public routes for password reset
router.post('/request-code', validate(requestResetCodeSchema), ctrl.requestResetCode.bind(ctrl));
router.post('/verify-code', validate(verifyResetCodeSchema), ctrl.verifyResetCode.bind(ctrl));
router.post('/reset-password', validate(resetPasswordSchema), ctrl.resetPassword.bind(ctrl));
router.post('/resend', validate(resendResetCodeSchema), ctrl.resendResetCode.bind(ctrl));

export default router;
