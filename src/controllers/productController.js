import { body, validationResult } from 'express-validator';
import { Op } from 'sequelize'; // Add at top
import Product from '../models/Product.js';
import Category from '../models/Category.js';
// Validation middleware
export const validateProduct = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Name must be 3-100 characters'),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('categoryId').isInt().withMessage('Valid category ID required'),
  body('description').optional().trim().isLength({ max: 1000 })
    .withMessage('Description too long (max 1000 chars)'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be 0 or positive')
];

// Helper to check validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Get all products (with search, filters, pagination)
export const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, categoryId, minPrice, maxPrice } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    // Search by name
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    // Filter by category
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug']
      },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      products: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug', 'icon']
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new product
export const createProduct = async (req, res) => {
  try {
    const { name, categoryId, description, price, stock } = req.body;
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    // Handle both image uploads
    const image = req.files?.image?.[0] ? `/uploads/${req.files.image[0].filename}` : null;
    const image360 = req.files?.image360?.[0] ? `/uploads/${req.files.image360[0].filename}` : null;

    const newProduct = await Product.create({
      name,
      categoryId,
      description,
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      image,
      image360
    });

    const completeProduct = await Product.findByPk(newProduct.id, {
      include: { model: Category, as: 'category' }
    });

    res.status(201).json({
      message: 'Product created successfully',
      product: completeProduct
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update product
// Update product (validation in route)
export const updateProduct = async (req, res) => {
  try {
    const { name, categoryId, description, price, stock, removeImage, removeImage360 } = req.body;
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Verify category if being updated
    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }
    }

    // Prepare update data
    const updateData = {
      name: name || product.name,
      categoryId: categoryId || product.categoryId,
      description: description !== undefined ? description : product.description,
      price: price ? parseFloat(price) : product.price,
      stock: stock !== undefined ? parseInt(stock) : product.stock
    };

    // Handle main image: new upload, explicit removal, or keep existing
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
      // Optionally: delete old file from disk here
    } else if (removeImage === 'true') {
      updateData.image = null;
      // Optionally: delete old file from disk here
    }

    // Handle 360° image removal (if you support 360° uploads)
    if (removeImage360 === 'true') {
      updateData.image360 = null;
    }

    await product.update(updateData);

    // Fetch updated product with category
    const updatedProduct = await Product.findByPk(product.id, {
      include: { model: Category, as: 'category' }
    });

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.destroy();

    res.json({
      message: 'Product deleted successfully',
      deletedId: req.params.id
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export { handleValidationErrors };