import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: 'Interior Accessories', slug: 'interior-accessories' },
  { name: 'Exterior Accessories', slug: 'exterior-accessories' },
  { name: 'Lighting', slug: 'lighting' },
  { name: 'Audio & Multimedia', slug: 'audio-multimedia' },
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Car Care', slug: 'car-care' },
  { name: 'Security & Safety', slug: 'security-safety' },
  { name: 'Wheels & Tyres', slug: 'wheels-tyres' },
  { name: 'Performance Parts', slug: 'performance-parts' },
  { name: 'Vehicle Protection', slug: 'vehicle-protection' },
  { name: 'Services', slug: 'services' },
  { name: 'General Accessories', slug: 'general-accessories' },
  { name: 'Others', slug: 'others' },
];

export const cleanAndSeedSystem = async (req: Request, res: Response) => {
  try {
    // We execute everything inside a transaction to ensure integrity
    await prisma.$transaction(async (tx) => {
      // 1. Delete transactional data
      await tx.payment.deleteMany();
      await tx.saleItem.deleteMany();
      await tx.sale.deleteMany();
      
      await tx.purchaseItem.deleteMany();
      await tx.purchase.deleteMany();
      
      await tx.inventoryAdjustment.deleteMany();
      await tx.expense.deleteMany();
      await tx.notification.deleteMany();
      await tx.auditLog.deleteMany();

      // 2. Delete product values and products
      await tx.productAttributeValue.deleteMany();
      await tx.product.deleteMany();
      
      // 3. Delete customer information
      await tx.vehicle.deleteMany();
      await tx.customer.deleteMany();

      // 4. Delete suppliers and brands
      await tx.supplier.deleteMany();
      await tx.brand.deleteMany();

      // 5. Delete category / subcategory configurations
      await tx.subcategoryAttribute.deleteMany();
      await tx.subcategory.deleteMany();
      await tx.category.deleteMany();

      // 6. Seed the 13 required default categories
      for (const cat of DEFAULT_CATEGORIES) {
        await tx.category.create({
          data: {
            name: cat.name,
            slug: cat.slug,
            description: `Default category for ${cat.name}`,
            isActive: true,
          },
        });
      }
    });

    res.status(200).json({ 
      success: true, 
      message: 'System data cleared and default categories seeded successfully.' 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
