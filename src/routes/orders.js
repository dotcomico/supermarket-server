import express from "express";
import { auth } from "../middleware/auth.js";
import { checkRole } from "../middleware/checkRole.js";
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  getAllUserOrders
} from "../controllers/orderController.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

// 1. Customers can see their own orders, Admin/Manager sees all
router.get("/", auth, getAllOrders);

router.get("/privet", auth, getAllUserOrders);

// 2. Specific details of one order
router.get("/:id", auth, getOrderById);

// 3. The "Checkout" - Create new order
router.post("/", auth, createOrder);

// 4. Update status (e.g., Manager changes 'pending' to 'shipped')
router.put("/:id", auth, checkRole(ROLES.ADMIN, ROLES.MANAGER), updateOrderStatus);

// 5. Delete an order (Usually only for Admin)
router.delete("/:id", auth, checkRole(ROLES.ADMIN), deleteOrder);

export default router;