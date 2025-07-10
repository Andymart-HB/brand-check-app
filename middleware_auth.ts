import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ 
      error: 'Access denied',
      message: 'Bearer token required',
      statusCode: 401,
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    // In production, use a proper JWT secret
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
    
    // For simplicity, we'll accept any properly formatted JWT or a simple token
    if (token === process.env.EDIT_TOKEN || token === 'dev-edit-token') {
      req.user = { id: 'editor', role: 'editor' };
      next();
      return;
    }

    // Try to verify as JWT
    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;
      next();
    } catch (jwtError) {
      logger.warn('Invalid JWT token provided', { token: token.substring(0, 10) + '...' });
      res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid or expired token',
        statusCode: 403,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Token authentication error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Token validation failed',
      statusCode: 500,
      timestamp: new Date().toISOString()
    });
  }
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
    
    if (token === process.env.EDIT_TOKEN || token === 'dev-edit-token') {
      req.user = { id: 'editor', role: 'editor' };
    } else {
      try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
      } catch (jwtError) {
        // Invalid token, but continue without auth
        logger.debug('Invalid token in optional auth, continuing without user');
      }
    }
  } catch (error) {
    logger.warn('Optional auth error:', error);
  }

  next();
}

export function generateToken(payload: any, expiresIn: string = '24h'): string {
  const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
  return jwt.sign(payload, jwtSecret, { expiresIn });
}