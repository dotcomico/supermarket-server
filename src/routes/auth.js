import express from 'express';
import { 
  register, 
  login, 
  getMe, 
  validateRegister, 
  validateLogin 
} from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Public routes with validation
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected route - get current user
router.get('/me', auth, getMe);

export default router;