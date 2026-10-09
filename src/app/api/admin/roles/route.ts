import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, 'roles:manage')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    const parsedRoles = roles.map((r) => ({
      ...r,
      permissions: JSON.parse(r.permissions || '[]'),
    }));

    return NextResponse.json(parsedRoles);
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao buscar perfis' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, 'roles:manage')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { roleId, permissions, description } = await req.json();

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: JSON.stringify(permissions),
        description: description || undefined,
      },
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'ROLE_PERMISSIONS_UPDATED',
      entity: 'Permissoes',
      entityId: roleId,
      details: { roleName: updatedRole.name, totalPerms: permissions.length },
    });

    return NextResponse.json({
      ...updatedRole,
      permissions: JSON.parse(updatedRole.permissions),
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao atualizar permissões do perfil' }, { status: 500 });
  }
}
