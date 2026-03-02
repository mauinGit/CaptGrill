import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'captgrill-secret';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request) {
  const cookie = request.cookies.get('token');
  return cookie?.value || null;
}

export function getUserFromRequest(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}
