import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Authentication Middleware
 */
export const auth = async (req, res, next) => {
  // Get token from the header (format: Bearer <token>)
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // Verify token signature and decode payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch FRESH user data from database (including current role)
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'email', 'role']
    });

    // Handle case where user was deleted after token was issued
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    // Attach CURRENT database values to request (not token values)
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role 
    };
    
    next();
  } catch (err) {
    // Token expired, invalid signature, or malformed
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Token is not valid" });
  }
};