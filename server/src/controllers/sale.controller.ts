import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '../utils/auditLog';

const prisma = new PrismaClient();

export const create = async (req: Request, res: Response) => {
  try {
    const { customerId, items, subtotal, discount, tax, total, paidAmount, paymentMethod, status, notes } = req.body;
    
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    // Run in a transaction
    const sale = await prisma.$transaction(async (tx) => {
      // 1. Create the sale
      const newSale = await tx.sale.create({
        data: {
          invoiceNumber,
          customerId: customerId || null,
          subtotal,
          discount,
          tax,
          total,
          paidAmount,
          paymentMethod,
          status,
          notes,
          createdById: (req as any).user.id,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount || 0,
              total: (item.quantity * item.unitPrice) - (item.discount || 0)
            }))
          }
        },
        include: {
          items: {
            include: { product: true }
          },
          customer: true,
        }
      });

      // 2. If status is Completed, update product stock
      if (status === 'Completed') {
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: {
                decrement: item.quantity
              }
            }
          });
        }
      }

      return newSale;
    });

    if (sale) {
      await createAuditLog(
        req as any,
        'CHECKOUT_SALE',
        'Sale',
        sale.id,
        `POS Sale Completed (Invoice: ${sale.invoiceNumber}, Total: Rs. ${sale.total.toLocaleString()})`
      );
    }

    res.status(201).json({ success: true, data: sale });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req: Request, res: Response) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        customer: true,
        items: {
          include: { product: true }
        },
        createdBy: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: sales });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
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
    
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    
    res.status(200).json({ success: true, data: sale });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Voiding a sale (refund)
export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // e.g. "Refunded" or "Cancelled"

    const existingSale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingSale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    if (existingSale.status === 'Refunded' || existingSale.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Sale is already refunded or cancelled' });
    }

    const updatedSale = await prisma.$transaction(async (tx) => {
      const updated = await tx.sale.update({
        where: { id },
        data: { status },
      });

      // If we are cancelling/refunding a completed sale, put the stock back
      if (existingSale.status === 'Completed' && (status === 'Refunded' || status === 'Cancelled')) {
        for (const item of existingSale.items) {
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

    if (updatedSale) {
      await createAuditLog(
        req as any,
        'REFUND_SALE',
        'Sale',
        updatedSale.id,
        `POS Sale Refunded (Invoice: ${updatedSale.invoiceNumber}, Original Total: Rs. ${updatedSale.total.toLocaleString()}, Status: ${status})`
      );
    }

    res.status(200).json({ success: true, data: updatedSale });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
