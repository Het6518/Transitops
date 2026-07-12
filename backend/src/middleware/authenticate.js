const jwt = require('jsonwebtoken');

/**
 * authenticate middleware
 * -----------------------
 * Verifies the Bearer JWT, then attaches req.user = { userId, roleId, email }.
 * Must run before requirePermission on any protected route.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Missing or malformed Authorization header' },
    });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: payload.userId,
      roleId: payload.roleId,
      email:  payload.email,
    };
    next();
  } catch (err) {
    return res.status(401).json({
      error: { code: 'TOKEN_INVALID', message: 'JWT is invalid or expired' },
    });
  }
}

module.exports = { authenticate };
