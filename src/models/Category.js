import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Category = sequelize.define('Category', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Categories',
            key: 'id'
        }
    },

    image: { type: DataTypes.STRING, allowNull: true },

    icon: { type: DataTypes.STRING, allowNull: true }
}, {
    hooks: {
        beforeValidate: (category) => {
            if (category.name) {
                category.slug = category.name
                    .toLowerCase()
                    .trim()
                    .replace(/[^\w\s-]/g, '') // Remove special chars
                    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
                    .replace(/^-+|-+$/g, ''); // Trim hyphens from ends
            }
        }
    }
});

export default Category;