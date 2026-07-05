import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '../utils/auditLog';

const prisma = new PrismaClient();

export const create = async (req: Request, res: Response) => {
  try {
    const { supplierId, items, subtotal, discount, tax, total, paidAmount, status, notes } = req.body;
    
    // Generate invoice number
    const invoiceNumber = `PUR-${Date.now()}`;

    // Run in a transaction
    const purchase = await prisma.$transaction(async (tx) => {
      // 1. Create the purchase
      const newPurchase = await tx.purchase.create({
        data: {
          invoiceNumber,
          supplierId,
          subtotal,
          discount,
          tax,
          total,
          paidAmount,
          status,
          notes,
          createdById: (req as any).user.id,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice
            }))
          }
        },
        include: {
          items: true,
          supplier: true,
        }
      });

      // 2. If status is 'Received', update product stock
      if (status === 'Received') {
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: {
                increment: item.quantity
              }
            }
          });
        }
      }

      return newPurchase;
    });

    if (purchase) {
      await createAuditLog(
        req as any,
        'CREATE_PURCHASE',
        'Purchase',
        purchase.id,
        `Created purchase order (Invoice: ${purchase.invoiceNumber}, Status: ${purchase.status}, Total: Rs. ${purchase.total.toLocaleString()})`
      );
    }

    res.status(201).json({ success: true, data: purchase });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req: Request, res: Response) => {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: true,
        createdBy: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: purchases });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            product: true
          }
        },
        createdBy: {
          select: { name: true, email: true }
        }
      }
    });
    
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }
    
    res.status(200).json({ success: true, data: purchase });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existingPurchase = await prisma.purchase.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingPurchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    if (existingPurchase.status === 'Received') {
      return res.status(400).json({ success: false, message: 'Cannot update status of an already received order. Please make an inventory adjustment instead.' });
    }

    const updatedPurchase = await prisma.$transaction(async (tx) => {
      const updated = await tx.purchase.update({
        where: { id },
        data: { status },
      });

      // If it is now marked as received, update stock
      if (status === 'Received') {
        for (const item of existingPurchase.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: {
                increment: item.quantity
              }
            }
          });
        }
      }

      return updated;
    });

    if (updatedPurchase) {
      await createAuditLog(
        req as any,
        'RECEIVE_PURCHASE',
        'Purchase',
        updatedPurchase.id,
        `Updated purchase status to Received (Invoice: ${updatedPurchase.invoiceNumber}, Stock updated)`
      );
    }

    res.status(200).json({ success: true, data: updatedPurchase });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { supplierId, items, subtotal, discount, tax, total, paidAmount, status, notes } = req.body;

    const existingPurchase = await prisma.purchase.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingPurchase) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    if (existingPurchase.status === 'Received') {
      return res.status(400).json({ success: false, message: 'Cannot edit an already received order.' });
    }

    const updatedPurchase = await prisma.$transaction(async (tx) => {
      // 1. Delete existing items
      await tx.purchaseItem.deleteMany({
        where: { purchaseId: id }
      });

      // 2. Update the purchase itself and create new items
      const updated = await tx.purchase.update({
        where: { id },
        data: {
          supplierId,
          subtotal,
          discount,
          tax,
          total,
          paidAmount,
          status,
          notes,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice
            }))
          }
        },
        include: {
          items: true,
          supplier: true
        }
      });

      // 3. If the status is updated to 'Received', increment stock
      if (status === 'Received') {
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: {
                increment: item.quantity
              }
            }
          });
        }
      }

      return updated;
    });

    if (updatedPurchase) {
      await createAuditLog(
        req as any,
        'UPDATE_PURCHASE',
        'Purchase',
        updatedPurchase.id,
        `Updated purchase order (Invoice: ${updatedPurchase.invoiceNumber}, Status: ${updatedPurchase.status}, Total: Rs. ${updatedPurchase.total.toLocaleString()})`
      );
    }

    res.status(200).json({ success: true, data: updatedPurchase });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingPurchase = await prisma.purchase.findUnique({
      where: { id }
    });

    if (!existingPurchase) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    if (existingPurchase.status === 'Received') {
      return res.status(400).json({ success: false, message: 'Cannot delete an already received order. Please adjust inventory instead.' });
    }

    await createAuditLog(
      req as any,
      'DELETE_PURCHASE',
      'Purchase',
      id,
      `Deleted pending purchase order ID: ${id}`
    );

    await prisma.purchase.delete({
      where: { id }
    });

    res.status(200).json({ success: true, message: 'Purchase order deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
