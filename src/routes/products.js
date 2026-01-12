import express from 'express';
import { auth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import { ROLES } from '../config/constants.js';
import upload from '../middleware/multer.js';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  validateProduct,
  handleValidationErrors
} from '../controllers/productController.js';

const router = express.Router();

// Public routes - Anyone can view products
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Protected routes - Admin/Manager only
router.post(
  '/', 
  auth, 
  checkRole(ROLES.ADMIN, ROLES.MANAGER), 
  upload.single('image'),
  validateProduct,
  handleValidationErrors,
  createProduct
);

router.put(
  '/:id', 
  auth, 
  checkRole(ROLES.ADMIN, ROLES.MANAGER), 
  upload.single('image'),
  validateProduct,
  handleValidationErrors,
  updateProduct
);

router.delete(
  '/:id', 
  auth, 
  checkRole(ROLES.ADMIN), 
  deleteProduct
);

export default router;