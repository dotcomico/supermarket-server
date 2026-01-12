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
    // Fetch only top-level categories and include their children
    const categories = await Category.findAll({
      where: { parentId: null },
      include: {
        all: true, 
        nested: true // allows for infinite depth in the JSON response
      }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};