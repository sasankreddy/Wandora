const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // Extract token from Authorization header
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access denied, no token provided' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        console.log('Token verified for user:', req.user);
        next();
    } catch (error) {
        console.error('Token verification failed:', error); 
        res.status(400).json({ message: 'Invalid or expired token' });
    }
};

module.exports = authenticateToken;
