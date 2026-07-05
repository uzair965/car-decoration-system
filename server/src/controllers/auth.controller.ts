import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { createAuditLog } from '../utils/auditLog';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Log success login
      await createAuditLog(req as any, 'LOGIN', 'User', result.user.id, `User logged in successfully`);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message });
    }
  }

  static async register(req: Request, res: Response) {
    try {
      const result = await AuthService.register(req.body);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Log success register
      await createAuditLog(req as any, 'REGISTER', 'User', result.user.id, `User registered successfully`);

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) throw new Error('No refresh token provided');

      const result = await AuthService.refreshToken(token);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      // Log logout event before destroying tokens
      await createAuditLog(req as any, 'LOGOUT', 'User', (req as any).user?.id || 'unknown', `User logged out successfully`);
      await AuthService.logout();
      res.clearCookie('refreshToken');
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getMe(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) throw new Error('Unauthorized');

      const user = await AuthService.getMe(userId);
      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message });
    }
  }
}
