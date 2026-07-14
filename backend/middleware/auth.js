const jwt = require('jsonwebtoken');

// Ye middleware har protected route pe chalega
// Kaam: check karega ki request ke saath valid token hai ya nahi
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // Header format hota hai: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token nahi mila, login required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalid ya expire ho gaya' });
    }
    req.userId = decoded.userId;
    // Ab agli function (route handler) me req.userId available hoga
    next();
  });
}

module.exports = verifyToken;
