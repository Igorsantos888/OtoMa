import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.roleName,
        roleDescription: user.role.description,
        permissions: user.permissions,
        cro: user.cro,
        specialty: user.specialty,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao consultar sessão' }, { status: 500 });
  }
}
