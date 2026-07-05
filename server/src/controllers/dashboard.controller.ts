import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DashboardController {
  static async getSummary(req: Request, res: Response) {
    try {
      const { period } = req.query; // 'thisMonth', '1month', '2months', ..., 'thisYear', 'allTime'
      
      let startDate: Date | undefined;
      let endDate = new Date();
      const now = new Date();
      let monthsCount = 6; // default
      let isDaily = false;

      let prevStartDate: Date | undefined;
      let prevEndDate: Date | undefined;
      
      if (period === 'thisMonth') {
        isDaily = true;
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // Previous calendar month comparison
        prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      } else if (period === 'thisYear') {
        startDate = new Date(now.getFullYear(), 0, 1);
        prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
        prevEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      } else if (period === 'allTime') {
        startDate = undefined;
      } else if (typeof period === 'string' && (period.endsWith('month') || period.endsWith('months'))) {
        const count = parseInt(period);
        if (!isNaN(count)) {
          monthsCount = count;
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - monthsCount);
          
          // previous equivalent month range
          prevStartDate = new Date();
          prevStartDate.setMonth(prevStartDate.getMonth() - (monthsCount * 2));
          prevEndDate = new Date(startDate.getTime());
        }
      } else {
        // default 6months
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);

        prevStartDate = new Date();
        prevStartDate.setMonth(prevStartDate.getMonth() - 12);
        prevEndDate = new Date(startDate.getTime());
      }

      const dateFilter = startDate ? { gte: startDate, lte: endDate } : undefined;

      // 1. Total Revenue
      const sales = await prisma.sale.aggregate({
        _sum: { total: true },
        where: { status: 'Completed', createdAt: dateFilter }
      });
      const totalRevenue = sales._sum.total || 0;

      // 2. Total Purchases (restocking cost)
      const purchases = await prisma.purchase.aggregate({
        _sum: { total: true },
        where: { status: 'Received', createdAt: dateFilter }
      });
      const totalPurchases = purchases._sum.total || 0;

      // 2b. Net Profit (Revenue - COGS - Expenses)
      const periodSalesList = await prisma.sale.findMany({
        where: { status: 'Completed', createdAt: dateFilter },
        include: {
          items: {
            include: { product: true }
          }
        }
      });

      let costOfGoodsSold = 0;
      periodSalesList.forEach(sale => {
        sale.items.forEach(item => {
          costOfGoodsSold += item.quantity * (item.product.purchasePrice || 0);
        });
      });

      const expenseFilter = startDate ? { date: { gte: startDate, lte: endDate } } : undefined;
      const expensesAgg = await prisma.expense.aggregate({
        _sum: { amount: true },
        where: expenseFilter
      });
      const totalExpenses = expensesAgg._sum.amount || 0;
      const profit = totalRevenue - costOfGoodsSold - totalExpenses;

      // 3. Total Products and Low Stock
      const totalProducts = await prisma.product.count({ where: { isActive: true } });
      const activeProducts = await prisma.product.findMany({
        where: { isActive: true },
        select: { quantity: true, minQuantity: true }
      });
      const lowStockCount = activeProducts.filter(p => p.quantity <= p.minQuantity).length;

      // 4. Calculate calendar today stats (from 12:00 AM)
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);

      // Today's Sales (total revenue since midnight)
      const salesToday = await prisma.sale.aggregate({
        _sum: { total: true },
        where: { status: 'Completed', createdAt: { gte: startOfToday } }
      });
      const todaySales = salesToday._sum.total || 0;

      // Today's Orders (number of orders since midnight)
      const todayOrders = await prisma.sale.count({
        where: { status: 'Completed', createdAt: { gte: startOfToday } }
      });

      // Today's Customers (unique registered customers + count of walk-ins since midnight)
      const salesInToday = await prisma.sale.findMany({
        where: { status: 'Completed', createdAt: { gte: startOfToday } },
        select: { customerId: true }
      });
      const uniqueCustomerIds = new Set<string>();
      let walkInCount = 0;
      salesInToday.forEach(s => {
        if (s.customerId) {
          uniqueCustomerIds.add(s.customerId);
        } else {
          walkInCount++;
        }
      });
      const todayCustomers = uniqueCustomerIds.size + walkInCount;

      // 5. Dynamic Progress Trend Comparisons
      let prevRevenue = 0;
      let prevProfit = 0;
      let prevPurchasesTotal = 0;

      if (prevStartDate) {
        const prevSales = await prisma.sale.aggregate({
          _sum: { total: true },
          where: { 
            status: 'Completed', 
            createdAt: {
              gte: prevStartDate,
              lte: prevEndDate
            }
          }
        });
        prevRevenue = prevSales._sum.total || 0;

        const prevPurchases = await prisma.purchase.aggregate({
          _sum: { total: true },
          where: {
            status: 'Received',
            createdAt: {
              gte: prevStartDate,
              lte: prevEndDate
            }
          }
        });
        prevPurchasesTotal = prevPurchases._sum.total || 0;

        // Calculate previous COGS and Expenses
        const prevSalesList = await prisma.sale.findMany({
          where: { 
            status: 'Completed', 
            createdAt: { gte: prevStartDate, lte: prevEndDate }
          },
          include: {
            items: {
              include: { product: true }
            }
          }
        });
        let prevCOGS = 0;
        prevSalesList.forEach(sale => {
          sale.items.forEach(item => {
            prevCOGS += item.quantity * (item.product.purchasePrice || 0);
          });
        });

        const prevExpenses = await prisma.expense.aggregate({
          _sum: { amount: true },
          where: { date: { gte: prevStartDate, lte: prevEndDate } }
        });
        const prevExpensesTotal = prevExpenses._sum.amount || 0;
        prevProfit = prevRevenue - prevCOGS - prevExpensesTotal;
      }

      // Revenue Trend
      const revDiff = totalRevenue - prevRevenue;
      const revenueTrendValue = prevRevenue > 0 ? (revDiff / prevRevenue) * 100 : 0;
      const revenueTrend = {
        value: parseFloat(Math.abs(revenueTrendValue).toFixed(1)),
        label: prevStartDate ? 'vs last period' : 'all time',
        trendUp: revenueTrendValue >= 0
      };

      // Purchase Trend
      const purchaseDiff = totalPurchases - prevPurchasesTotal;
      const purchaseTrendValue = prevPurchasesTotal > 0 ? (purchaseDiff / prevPurchasesTotal) * 100 : 0;
      const purchaseTrend = {
        value: parseFloat(Math.abs(purchaseTrendValue).toFixed(1)),
        label: prevStartDate ? 'vs last period' : 'all time',
        trendUp: purchaseTrendValue >= 0
      };

      // Profit Trend
      const profitDiff = profit - prevProfit;
      const profitTrendValue = prevProfit > 0 ? (profitDiff / prevProfit) * 100 : 0;
      const profitTrend = {
        value: parseFloat(Math.abs(profitTrendValue).toFixed(1)),
        label: prevStartDate ? 'vs last period' : 'all time',
        trendUp: profitTrendValue >= 0
      };

      // 6. Recent Activity (Latest Sales)
      const recentSales = await prisma.sale.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true } } }
      });

      const recentActivity = recentSales.map(sale => ({
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        customerName: sale.customer?.name || 'Walk-in Customer',
        amount: sale.total,
        status: sale.status,
        date: sale.createdAt
      }));

      // 7. Chart Data
      const recentSalesData = await prisma.sale.findMany({
        where: { createdAt: dateFilter, status: 'Completed' },
        include: {
          items: {
            include: { product: true }
          }
        }
      });

      const recentPurchaseData = await prisma.purchase.findMany({
        where: { createdAt: dateFilter, status: 'Received' },
        select: { total: true, createdAt: true }
      });

      const recentExpenseData = await prisma.expense.findMany({
        where: expenseFilter,
        select: { amount: true, date: true }
      });

      const chartDataMap = new Map<string, { revenue: number; purchases: number; cogs: number; expenses: number }>();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      if (isDaily && startDate) {
        // Populate all days of the current calendar month
        const daysInMonth = endDate.getDate();
        const shortMonthName = monthNames[startDate.getMonth()];
        for (let i = 1; i <= daysInMonth; i++) {
          chartDataMap.set(`${shortMonthName} ${i}`, { revenue: 0, purchases: 0, cogs: 0, expenses: 0 });
        }
      } else if (period === 'allTime') {
        const years = new Set<string>();
        recentSalesData.forEach(s => years.add(s.createdAt.getFullYear().toString()));
        recentPurchaseData.forEach(p => years.add(p.createdAt.getFullYear().toString()));
        recentExpenseData.forEach(e => years.add(e.date.getFullYear().toString()));
        if (years.size === 0) {
          years.add(new Date().getFullYear().toString());
        }
        Array.from(years).forEach(y => {
          chartDataMap.set(y, { revenue: 0, purchases: 0, cogs: 0, expenses: 0 });
        });
      } else if (period === 'thisYear') {
        // Initialize all 12 months for this year
        for (let i = 0; i < 12; i++) {
          chartDataMap.set(monthNames[i], { revenue: 0, purchases: 0, cogs: 0, expenses: 0 });
        }
      } else {
        // Dynamic month range
        for (let i = monthsCount - 1; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          chartDataMap.set(monthNames[d.getMonth()], { revenue: 0, purchases: 0, cogs: 0, expenses: 0 });
        }
      }

      // Populate Sales & COGS
      recentSalesData.forEach(sale => {
        let key = '';
        if (isDaily && startDate) {
          key = `${monthNames[sale.createdAt.getMonth()]} ${sale.createdAt.getDate()}`;
        } else if (period === 'allTime') {
          key = sale.createdAt.getFullYear().toString();
        } else {
          key = monthNames[sale.createdAt.getMonth()];
        }

        if (chartDataMap.has(key)) {
          const val = chartDataMap.get(key)!;
          val.revenue += sale.total;
          sale.items.forEach(item => {
            val.cogs += item.quantity * (item.product.purchasePrice || 0);
          });
        }
      });

      // Populate Purchases
      recentPurchaseData.forEach(purchase => {
        let key = '';
        if (isDaily && startDate) {
          key = `${monthNames[purchase.createdAt.getMonth()]} ${purchase.createdAt.getDate()}`;
        } else if (period === 'allTime') {
          key = purchase.createdAt.getFullYear().toString();
        } else {
          key = monthNames[purchase.createdAt.getMonth()];
        }

        if (chartDataMap.has(key)) {
          chartDataMap.get(key)!.purchases += purchase.total;
        }
      });

      // Populate Operating Expenses
      recentExpenseData.forEach(exp => {
        let key = '';
        if (isDaily && startDate) {
          key = `${monthNames[exp.date.getMonth()]} ${exp.date.getDate()}`;
        } else if (period === 'allTime') {
          key = exp.date.getFullYear().toString();
        } else {
          key = monthNames[exp.date.getMonth()];
        }

        if (chartDataMap.has(key)) {
          chartDataMap.get(key)!.expenses += exp.amount;
        }
      });

      // Sort keys if allTime
      let entries = Array.from(chartDataMap.entries());
      if (period === 'allTime') {
        entries.sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
      }

      const chartData = entries.map(([name, data]) => ({
        name,
        revenue: data.revenue,
        expenses: data.purchases,
        profit: data.revenue - data.cogs - data.expenses
      }));

      res.status(200).json({
        success: true,
        data: {
          stats: {
            totalRevenue,
            totalPurchases,
            profit,
            totalProducts,
            lowStockCount,
            todaySales,
            todayOrders,
            todayCustomers,
            revenueTrend,
            purchaseTrend,
            profitTrend
          },
          chartData,
          recentActivity
        }
      });

    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
