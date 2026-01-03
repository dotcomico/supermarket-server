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
  deleteProduct
} from '../controllers/productController.js';

const router = express.Router();

// ANYONE can see products
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// ONLY Admins and Managers can add/update products
router.post(
  '/', 
  auth, 
  checkRole(ROLES.ADMIN, ROLES.MANAGER), 
  upload.single('image'), 
  createProduct
);

router.put(
  '/:id', 
  auth, 
  checkRole(ROLES.ADMIN, ROLES.MANAGER), 
  upload.single('image'), 
  updateProduct
);

// ONLY Admins can delete a product
router.delete('/:id', auth, checkRole(ROLES.ADMIN), deleteProduct);

export default router;