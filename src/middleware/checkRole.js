export const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    // 1. Check if user exists (set by auth middleware)
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    // 2. Check if the user's role is in the allowed list
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access Denied: ${req.user.role} role does not have permission.` 
      });
    }

    // 3. Success! Move to the next function
    next();
  };
};