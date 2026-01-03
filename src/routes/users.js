import express from 'express';
import { auth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import { ROLES } from '../config/constants.js';
import User from '../models/User.js';

const router = express.Router();

// 1. Get Profile (Any logged in user can see their own info)
router.get('/profile', auth, async (req, res) => {
  const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
  res.json(user);
});

// 2. Get All Users (ONLY Admin)
router.get('/', auth, checkRole(ROLES.ADMIN), async (req, res) => {
  const users = await User.findAll({ attributes: { exclude: ['password'] } });
  res.json(users);
});

// 3. Update User Role (ONLY Admin)
// Example: Change a Customer to a Manager
router.put('/:id/role', auth, checkRole(ROLES.ADMIN), async (req, res) => {
  const { role } = req.body;
  if (!Object.values(ROLES).includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  
  await User.update({ role }, { where: { id: req.params.id } });
  res.json({ message: "User role updated successfully" });
});

export default router;