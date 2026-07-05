import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAll = async (req: Request, res: Response) => {
  try {
    // 1. Fetch persistent database alerts
    const dbNotifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // 2. Dynamically scan inventory for low-stock items
    const lowStockProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        quantity: {
          lte: prisma.product.fields.minQuantity
        }
      },
      include: {
        brand: true,
        attributeValues: {
          include: {
            attribute: true
          }
        }
      }
    });

    // 3. Map dynamic low stock alerts
    const lowStockAlerts = lowStockProducts.map(p => {
      const details: string[] = [];
      
      // Brand Name
      if (p.brand?.name) {
        details.push(`Brand: ${p.brand.name}`);
      }

      // Vehicle Compatibility (Fits: Suzuki Mehran)
      if (p.productType === 'VehicleSpecific' && (p.vehicleBrand || p.vehicleModel)) {
        details.push(`Fits: ${p.vehicleBrand || ''} ${p.vehicleModel || ''}`);
      } else if (p.compatibleCars) {
        details.push(`Fits: ${p.compatibleCars}`);
      }

      // Custom attributes
      if (p.attributeValues && p.attributeValues.length > 0) {
        p.attributeValues.forEach(av => {
          details.push(`${av.attribute.name}: ${av.value}`);
        });
      }

      const detailString = details.length > 0 ? ` (${details.join(', ')})` : '';

      return {
        id: `low-stock-${p.id}`,
        title: 'Low Stock Warning',
        message: `Product "${p.name}"${detailString} (${p.sku}) has only ${p.quantity} left (Minimum threshold: ${p.minQuantity}).`,
        type: 'LowStock',
        isRead: false,
        createdAt: new Date()
      };
    });

    // Combine both sets
    const allNotifications = [...lowStockAlerts, ...dbNotifications];

    res.status(200).json({ success: true, data: allNotifications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Low stock warnings are dynamic, so if they are clicked we just acknowledge
    if (id.startsWith('low-stock-')) {
      return res.status(200).json({ success: true, message: 'Acknowledged' });
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.status(200).json({ success: true, data: notification });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
