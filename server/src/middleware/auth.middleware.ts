import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { AppError } from './error.middleware';

// ==================================================
// Extend Express Request to include user info
// ==================================================
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

// ==================================================
// Verify JWT token and attach user to request
// ==================================================
export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };

    // Fetch user with role and permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or deactivated.', 401);
    }

    // Attach user info to request
    let roleName = user.role.name;
    if (roleName === 'System Admin') roleName = 'Admin';

    req.user = {
      id: user.id,
      email: user.email,
      role: roleName,
      permissions: user.role.permissions.map((rp) => rp.permission.name),
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else if ((error as any).name === 'JsonWebTokenError') {
      next(new AppError('Invalid token.', 401));
    } else if ((error as any).name === 'TokenExpiredError') {
      next(new AppError('Token expired.', 401));
    } else {
      next(new AppError('Authentication failed.', 401));
    }
  }
};

// ==================================================
// Check if user has required role
// ==================================================
export const authorize = (...rolesOrArray: (string | string[])[]) => {
  const allowedRoles = rolesOrArray.flat();
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }

    next();
  };
};

// ==================================================
// Check if user has specific permission
// ==================================================
export const hasPermission = (...requiredPermissions: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    // Admin bypasses permission checks
    if (req.user.role === 'Admin') {
      return next();
    }

    const hasAll = requiredPermissions.every((perm) =>
      req.user!.permissions.includes(perm)
    );

    if (!hasAll) {
      return next(
        new AppError('You do not have the required permissions.', 403)
      );
    }

    next();
  };
};
