import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const exportBackup = async (_req: Request, res: Response) => {
  try {
    // Read all tables
    const [
      roles,
      users,
      categories,
      brands,
      suppliers,
      products,
      customers,
      sales,
      saleItems,
      purchases,
      purchaseItems,
      expenseCategories,
      expenses,
      settings
    ] = await Promise.all([
      prisma.role.findMany(),
      prisma.user.findMany(),
      prisma.category.findMany(),
      prisma.brand.findMany(),
      prisma.supplier.findMany(),
      prisma.product.findMany(),
      prisma.customer.findMany(),
      prisma.sale.findMany(),
      prisma.saleItem.findMany(),
      prisma.purchase.findMany(),
      prisma.purchaseItem.findMany(),
      prisma.expenseCategory.findMany(),
      prisma.expense.findMany(),
      prisma.setting.findMany()
    ]);

    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      roles,
      users,
      categories,
      brands,
      suppliers,
      products,
      customers,
      sales,
      saleItems,
      purchases,
      purchaseItems,
      expenseCategories,
      expenses,
      settings
    };

    res.status(200).json({ success: true, data: backupData });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const importRestore = async (req: Request, res: Response) => {
  try {
    const { backup } = req.body;
    if (!backup || backup.version !== '1.0') {
      return res.status(400).json({ success: false, message: 'Invalid backup file format' });
    }

    // Process restore inside a heavy transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing records (in reverse dependency order to avoid constraint issues)
      await tx.purchaseItem.deleteMany();
      await tx.saleItem.deleteMany();
      await tx.payment.deleteMany();
      await tx.purchase.deleteMany();
      await tx.sale.deleteMany();
      await tx.expense.deleteMany();
      await tx.inventoryAdjustment.deleteMany();
      await tx.notification.deleteMany();
      await tx.auditLog.deleteMany();
      await tx.product.deleteMany();
      await tx.customer.deleteMany();
      await tx.supplier.deleteMany();
      await tx.category.deleteMany();
      await tx.brand.deleteMany();
      await tx.expenseCategory.deleteMany();
      await tx.setting.deleteMany();
      await tx.user.deleteMany();
      await tx.role.deleteMany();

      // 2. Restore records (in correct dependency order)
      if (backup.roles?.length) await tx.role.createMany({ data: backup.roles });
      if (backup.users?.length) await tx.user.createMany({ data: backup.users });
      if (backup.categories?.length) await tx.category.createMany({ data: backup.categories });
      if (backup.brands?.length) await tx.brand.createMany({ data: backup.brands });
      if (backup.suppliers?.length) await tx.supplier.createMany({ data: backup.suppliers });
      if (backup.products?.length) await tx.product.createMany({ data: backup.products });
      if (backup.customers?.length) await tx.customer.createMany({ data: backup.customers });
      if (backup.sales?.length) await tx.sale.createMany({ data: backup.sales });
      if (backup.saleItems?.length) await tx.saleItem.createMany({ data: backup.saleItems });
      if (backup.purchases?.length) await tx.purchase.createMany({ data: backup.purchases });
      if (backup.purchaseItems?.length) await tx.purchaseItem.createMany({ data: backup.purchaseItems });
      if (backup.expenseCategories?.length) await tx.expenseCategory.createMany({ data: backup.expenseCategories });
      if (backup.expenses?.length) await tx.expense.createMany({ data: backup.expenses });
      if (backup.settings?.length) await tx.setting.createMany({ data: backup.settings });
    });

    res.status(200).json({ success: true, message: 'Database successfully restored from backup!' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: `Restore failed: ${error.message}` });
  }
};
