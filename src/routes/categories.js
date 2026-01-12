import express from 'express';
import { auth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import { ROLES } from '../config/constants.js';
import { createCategory, getCategoryTree } from '../controllers/categoryController.js';
import upload from '../middleware/multer.js';

const router = express.Router();

router.post('/', 
  auth, 
  checkRole(ROLES.ADMIN, ROLES.MANAGER),
  upload.single('image'), 
  createCategory
);
router.get('/tree', getCategoryTree);

export default router;