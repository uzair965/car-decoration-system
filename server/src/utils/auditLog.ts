import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// ==================================================
// Log every important action to the audit_logs table
// ==================================================
export const createAuditLog = async (
  req: AuthRequest,
  action: string,
  entity: string,
  entityId: string,
  details?: string
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || 'system',
        action,
        entity,
        entityId,
        details: details || null,
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      },
    });
  } catch (error) {
    // Don't let audit log failures break the main operation
    console.error('Failed to create audit log:', error);
  }
};
