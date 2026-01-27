import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * OrderItem Model - Junction table for Order-Product many-to-many relationship
 * 
 * FIXED: Added explicit primary key definition to prevent unique constraint
 * on ProductId alone. The uniqueness should be on (OrderId, ProductId) combination,
 * meaning a product can appear in multiple orders, but only once per order.
 */
const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  OrderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Orders',
      key: 'id'
    }
  },
  ProductId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Products',
      key: 'id'
    }
  },
  quantity: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  priceAtPurchase: { 
    type: DataTypes.FLOAT, 
    allowNull: false,
    validate: {
      min: 0
    }
  }
}, {
  // Composite unique constraint: same product can't appear twice in same order
  indexes: [
    {
      unique: true,
      fields: ['OrderId', 'ProductId'],
      name: 'unique_order_product'
    }
  ]
});

export default OrderItem;