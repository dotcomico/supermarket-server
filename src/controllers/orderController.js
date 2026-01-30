import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import sequelize from '../config/database.js';
import { ROLES, ORDER_STATUS } from '../config/constants.js';
import logger from '../utils/logger.js'; // Added logger import

// Get all orders (Admin sees all, Customers see only their own)
export const getAllOrders = async (req, res) => {
  try {
    let orders;
    if (req.user.role === ROLES.ADMIN || req.user.role === ROLES.MANAGER) {
      orders = await Order.findAll({
        include: [
          { model: User, attributes: ['id', 'username', 'email'] },
          { 
            model: Product,
            through: { attributes: ['quantity', 'priceAtPurchase'] }
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      res.json(orders);
    }
  } catch (error) {
    logger.error('Operation failed', { error: error.message }); // Added logger
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all user orders (Customers see only their own)
export const getAllUserOrders = async (req, res) => {
   try {
    let orders;
      orders = await Order.findAll({
        where: { UserId: req.user.id },
        include: [
          { 
            model: Product,
            through: { attributes: ['quantity', 'priceAtPurchase'] }
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    res.json(orders);
  } catch (error) {
    logger.error('Operation failed', { error: error.message }); // Added logger
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get specific order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['id', 'username', 'email'] },
        { 
          model: Product,
          through: { attributes: ['quantity', 'priceAtPurchase'] }
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (
      req.user.role !== ROLES.ADMIN && 
      req.user.role !== ROLES.MANAGER && 
      order.UserId !== req.user.id
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    logger.error('Operation failed', { error: error.message }); // Added logger
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new order (Checkout)
export const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { items, address } = req.body;

    if (!items || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    let totalAmount = 0;
    const orderItems = [];
    const productsToUpdate = [];

    // Validate products and calculate total
    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction });

      if (!product) {
        await transaction.rollback();
        return res.status(404).json({ 
          message: `Product with ID ${item.productId} not found` 
        });
      }

      if (product.stock < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        });
      }

      totalAmount += product.price * item.quantity;

      orderItems.push({
        ProductId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: product.price
      });

      productsToUpdate.push({
        product,
        newStock: product.stock - item.quantity
      });
    }

    // Create the order
    const order = await Order.create({
      UserId: req.user.id,
      totalAmount,
      address,
      status: ORDER_STATUS.PENDING
    }, { transaction });

    // Create order items with OrderId
    const orderItemsToCreate = orderItems.map(item => ({
      OrderId: order.id,
      ProductId: item.ProductId,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase
    }));

    await OrderItem.bulkCreate(orderItemsToCreate, { transaction });

    // Update product stock
    for (const { product, newStock } of productsToUpdate) {
      await product.update({ stock: newStock }, { transaction });
    }

    // Commit transaction
    await transaction.commit();

    // Added logger for order creation
    logger.info('Order created', { orderId: order.id, userId: req.user.id, total: totalAmount });

    // Fetch complete order with products
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        { 
          model: Product,
          through: { attributes: ['quantity', 'priceAtPurchase'] }
        }
      ]
    });

    res.status(201).json({
      message: 'Order created successfully',
      order: completeOrder
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Operation failed', { error: error.message }); // Added logger
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update order status (Admin/Manager only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!Object.values(ORDER_STATUS).includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await order.update({ status });

    const updatedOrder = await Order.findByPk(order.id, {
      include: [
        { model: User, attributes: ['id', 'username', 'email'] },
        { 
          model: Product,
          through: { attributes: ['quantity', 'priceAtPurchase'] }
        }
      ]
    });

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    logger.error('Operation failed', { error: error.message }); // Added logger
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete order (Admin only)
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await OrderItem.destroy({ where: { OrderId: order.id } });
    await order.destroy();

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    logger.error('Operation failed', { error: error.message }); // Added logger
    console.error('Delete order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};