import { prisma } from './prisma';

interface LogAuditParams {
  userId?: string | null;
  userName?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: any;
  ipAddress?: string | null;
}

export async function logAudit({
  userId,
  userName,
  action,
  entity,
  entityId,
  details,
  ipAddress = '127.0.0.1'
}: LogAuditParams) {
  try {
    let resolvedUserName = userName;
    if (!resolvedUserName && userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
      });
      resolvedUserName = user?.name;
    }

    return await prisma.auditLog.create({
      data: {
        userId,
        userName: resolvedUserName,
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        details: details ? JSON.stringify(details) : null,
        ipAddress
      }
    });
  } catch (error) {
    console.error('Falha ao registrar log de auditoria:', error);
  }
}
