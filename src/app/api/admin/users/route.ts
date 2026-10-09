import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, 'users:manage')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      include: {
        role: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        cro: u.cro,
        specialty: u.specialty,
        phone: u.phone,
        roleId: u.roleId,
        role: u.role.name,
        roleDescription: u.role.description,
        twoFactorEnabled: u.twoFactorEnabled,
        isActive: u.isActive,
        failedLoginAttempts: u.failedLoginAttempts,
        isLocked: !!(u.lockoutUntil && new Date() < u.lockoutUntil),
      }))
    );
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, 'users:manage')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await req.json();
    const { name, email, password, roleId, cro, specialty, phone } = data;

    if (!name || !email || !password || !roleId) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.trim().toLowerCase(),
        passwordHash,
        roleId,
        cro: cro || null,
        specialty: specialty || null,
        phone: phone || null,
      },
      include: { role: true },
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'USER_CREATED',
      entity: 'Usuario',
      entityId: newUser.id,
      details: { email: newUser.email, role: newUser.role.name },
    });

    return NextResponse.json(
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role.name,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao cadastrar usuário' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, 'users:manage')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await req.json();
    const { id, isActive, unlockAccount, roleId } = data;

    const updateData: any = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (roleId) updateData.roleId = roleId;
    if (unlockAccount) {
      updateData.failedLoginAttempts = 0;
      updateData.lockoutUntil = null;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'USER_UPDATED',
      entity: 'Usuario',
      entityId: id,
      details: updateData,
    });

    return NextResponse.json(updatedUser);
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}
