import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { ROLES, ORDER_STATUS } from '../config/constants.js';

// Get all orders (Admin sees all, Customers see only their own)
export const getAllOrders = async (req, res) => {
  try {
    let orders;

    if (req.user.role === ROLES.ADMIN || req.user.role === ROLES.MANAGER) {
      // Admin/Manager sees all orders
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
    } else {
      // Customer sees only their orders
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
    }

    res.json(orders);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

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

    // Check authorization: Only order owner or admin/manager can view
    if (
      req.user.role !== ROLES.ADMIN && 
      req.user.role !== ROLES.MANAGER && 
      order.UserId !== req.user.id
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new order (Checkout)
export const createOrder = async (req, res) => {
  try {
    const { items, address } = req.body; // items: [{ productId, quantity }]

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    let totalAmount = 0;
    const orderItems = [];

    // Validate products and calculate total
    for (const item of items) {
      const product = await Product.findByPk(item.productId);

      if (!product) {
        return res.status(404).json({ 
          message: `Product with ID ${item.productId} not found` 
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        priceAtPurchase: product.price
      });

      // Reduce stock
      await product.update({ stock: product.stock - item.quantity });
    }

    // Create the order
    const order = await Order.create({
      UserId: req.user.id,
      totalAmount,
      address,
      status: ORDER_STATUS.PENDING
    });

    // Create order items (bulk insert - faster and safer)
    const orderItemsToCreate = orderItems.map(item => ({
      OrderId: order.id,
      ProductId: item.productId,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase
    }));

    await OrderItem.bulkCreate(orderItemsToCreate);

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

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
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

    // Delete associated OrderItems first (cascade might handle this)
    await OrderItem.destroy({ where: { OrderId: order.id } });
    
    await order.destroy();

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};