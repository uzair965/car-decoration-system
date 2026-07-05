import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

const mapUserWithPermissions = (user: any) => {
  const { password, roleId, ...userWithoutPassword } = user;
  return {
    ...userWithoutPassword,
    role: user.role,
    permissions: user.role.permissions.map((rp: any) => rp.permission.name),
  };
};

export class AuthService {
  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        }
      }
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials or deactivated account');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const tokens = generateTokens(user.id);
    return { user: mapUserWithPermissions(user), ...tokens };
  }

  static async register(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Find default 'Employee' role if not specified
    let roleId = data.roleId;
    if (!roleId) {
      const employeeRole = await prisma.role.findUnique({ where: { name: 'Employee' } });
      if (employeeRole) roleId = employeeRole.id;
    }

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        roleId
      },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        }
      }
    });

    const tokens = generateTokens(user.id);
    return { user: mapUserWithPermissions(user), ...tokens };
  }

  static async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const tokens = generateTokens(decoded.userId);
      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static async logout() {
    return true;
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return mapUserWithPermissions(user);
  }
}
