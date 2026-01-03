import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected route - get current user
router.get('/me', auth, getMe);

export default router;