import express from 'express';
import { createCategory, getCategoryTree } from '../controllers/categoryController.js';
import upload from '../middleware/multer.js';

const router = express.Router();

router.post('/', upload.single('image'), createCategory);
router.get('/tree', getCategoryTree);

export default router;