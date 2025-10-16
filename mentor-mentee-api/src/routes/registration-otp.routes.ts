import { Router } from 'express';
import { RegistrationOtpController } from '../controllers/registration-otp.controller';
import { validate } from '../middleware/validate.middleware';
import { requestRegisterCodeSchema, verifyRegisterCodeSchema, resendRegisterCodeSchema } from '../schemas/registration-otp.schema';

const router = Router();
const ctrl = new RegistrationOtpController();

// Public routes for OTP registration
router.post('/request-code', validate(requestRegisterCodeSchema), ctrl.requestCode.bind(ctrl));
router.post('/verify', validate(verifyRegisterCodeSchema), ctrl.verifyCode.bind(ctrl));
router.post('/resend', validate(resendRegisterCodeSchema), ctrl.resendCode.bind(ctrl));

export default router;