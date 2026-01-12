import Category from '../models/Category.js';

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
    res.status(500).json({ error: error.message });
  }
};