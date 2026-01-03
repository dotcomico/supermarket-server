import jwt from 'jsonwebtoken';

export const auth = (req, res, next) => {
  // 1. Get token from the header (format: Bearer <token>)
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // 2. Verify token using your secret from .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. ATTACH user data to the request object
    // Now, req.user exists for the next middleware (checkRole) to use!
    req.user = decoded; 
    
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};