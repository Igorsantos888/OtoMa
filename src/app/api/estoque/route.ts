import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, 'estoque:view')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const items = await prisma.stockItem.findMany({
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(items);
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao buscar estoque' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, 'estoque:edit')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const data = await req.json();

    // Se for movimentação (entrada ou saída)
    if (data.movementType) {
      const { itemId, movementType, quantity, reason } = data;
      const qty = Number(quantity);

      const item = await prisma.stockItem.findUnique({ where: { id: itemId } });
      if (!item) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });

      let newQty = item.quantity;
      if (movementType === 'ENTRADA') newQty += qty;
      else if (movementType === 'SAIDA') newQty = Math.max(0, newQty - qty);
      else if (movementType === 'AJUSTE') newQty = qty;

      await prisma.stockMovement.create({
        data: {
          itemId,
          type: movementType,
          quantity: qty,
          reason: reason || 'Movimentação manual',
          registeredBy: user.name,
        },
      });

      const updatedItem = await prisma.stockItem.update({
        where: { id: itemId },
        data: { quantity: newQty },
      });

      await logAudit({
        userId: user.id,
        userName: user.name,
        action: `STOCK_${movementType}`,
        entity: 'Estoque',
        entityId: item.id,
        details: { item: item.name, diff: qty, finalQty: newQty },
      });

      return NextResponse.json(updatedItem);
    }

    // Criar novo produto
    const newItem = await prisma.stockItem.create({
      data: {
        name: data.name,
        category: data.category || 'Geral',
        sku: data.sku || null,
        quantity: Number(data.quantity) || 0,
        minQuantity: Number(data.minQuantity) || 5,
        unit: data.unit || 'UN',
        costPrice: Number(data.costPrice) || 0,
        supplier: data.supplier || null,
        batchNumber: data.batchNumber || null,
        expirationDate: data.expirationDate || null,
      },
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'STOCK_ITEM_CREATED',
      entity: 'Estoque',
      entityId: newItem.id,
      details: { name: newItem.name },
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (err: any) {
    console.error('Erro estoque:', err);
    return NextResponse.json({ error: 'Erro ao manipular estoque' }, { status: 500 });
  }
}
