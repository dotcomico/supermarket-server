import { Op } from 'sequelize';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import logger from '../utils/logger.js'; // Added logger import

export const createCategory = async (req, res) => {
  try {
    const { name, parentId, icon } = req.body;
    
    // Get image path from multer if uploaded
    const image = req.file ? `/uploads/categories/${req.file.filename}` : null;

    const category = await Category.create({ 
      name, 
      parentId: parentId || null, 
      icon, 
      image 
    });

    res.status(201).json(category);
  } catch (error) {
    logger.error('Operation failed', { error: error.message }); // Added logger
    res.status(400).json({ error: error.message });
  }
};

export const getCategoryTree = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { parentId: null },
      include: [{
        model: Category,
        as: 'children',
        include: [{ 
          model: Category, 
          as: 'children' // supports 2 levels deep
        }]
      }]
    });
    res.json(categories);
  } catch (error) {
    logger.error('Operation failed', { error: error.message }); // Added logger
    res.status(500).json({ error: error.message });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: { model: Category, as: 'parent', attributes: ['name'] }
    });
    res.json(categories);
  } catch (error) {
    logger.error('Operation failed', { error: error.message }); // Added logger
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all products for a category and its children (recursive)
 * GET /api/categories/:slug/products
 */
export const getProductsByCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 20, minPrice, maxPrice, search } = req.query;
    const offset = (page - 1) * limit;

    // Find the category by slug
    const category = await Category.findOne({ where: { slug } });
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Recursive function to get all child category IDs
    const getAllChildIds = async (categoryId) => {
      const children = await Category.findAll({
        where: { parentId: categoryId },
        attributes: ['id']
      });

      let ids = [categoryId];
      
      for (const child of children) {
        const childIds = await getAllChildIds(child.id);
        ids = [...ids, ...childIds];
      }
      
      return ids;
    };

    // Get all category IDs (parent + all descendants)
    const categoryIds = await getAllChildIds(category.id);

    // Build where clause for products
    const where = { categoryId: categoryIds };

    // Add price filters if provided
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }

    // Add search filter if provided
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    // Fetch products
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
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        image: category.image
      },
      products: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Operation failed', { error: error.message }); // Added logger
    console.error('Get products by category error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get category details with breadcrumb
 * GET /api/categories/:slug
 */
export const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const category = await Category.findOne({
      where: { slug },
      include: [
        {
          model: Category,
          as: 'children',
          attributes: ['id', 'name', 'slug', 'icon', 'image']
        },
        {
          model: Category,
          as: 'parent',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Build breadcrumb trail
    const breadcrumbs = [];
    let current = category;
    
    while (current) {
      breadcrumbs.unshift({
        id: current.id,
        name: current.name,
        slug: current.slug
      });
      
      if (current.parentId) {
        current = await Category.findByPk(current.parentId);
      } else {
        current = null;
      }
    }

    res.json({
      ...category.toJSON(),
      breadcrumbs
    });
  } catch (error) {
    logger.error('Operation failed', { error: error.message }); // Added logger
    console.error('Get category by slug error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};