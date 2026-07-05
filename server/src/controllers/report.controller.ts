import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getProfitLoss = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filters if provided
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate as string);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate as string);
    }

    const expenseDateFilter: any = {};
    if (startDate || endDate) {
      expenseDateFilter.date = {};
      if (startDate) expenseDateFilter.date.gte = new Date(startDate as string);
      if (endDate) expenseDateFilter.date.lte = new Date(endDate as string);
    }

    // 1. Fetch sales
    const sales = await prisma.sale.findMany({
      where: {
        status: 'Completed',
        ...dateFilter
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // 2. Fetch expenses
    const expenses = await prisma.expense.findMany({
      where: expenseDateFilter,
      include: { category: true }
    });

    // 3. Compute calculations
    let totalRevenue = 0;
    let costOfGoodsSold = 0;
    
    sales.forEach(sale => {
      totalRevenue += sale.total;
      sale.items.forEach(item => {
        // COGS = quantity sold * purchase cost of product
        costOfGoodsSold += item.quantity * (item.product.purchasePrice || 0);
      });
    });

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const grossProfit = totalRevenue - costOfGoodsSold;
    const netProfit = grossProfit - totalExpenses;

    // Group expenses by category
    const expenseBreakdown: Record<string, number> = {};
    expenses.forEach(exp => {
      const catName = exp.category.name;
      expenseBreakdown[catName] = (expenseBreakdown[catName] || 0) + exp.amount;
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          costOfGoodsSold,
          grossProfit,
          totalExpenses,
          netProfit,
          grossProfitMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
          netProfitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
        },
        expenseBreakdown: Object.entries(expenseBreakdown).map(([name, amount]) => ({ name, amount })),
        salesCount: sales.length,
        expensesCount: expenses.length
      }
    });

  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
