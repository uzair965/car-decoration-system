import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ==================================================
  // 1. Roles & Permissions
  // ==================================================
  console.log('Creating roles and permissions...');
  
  const permissions = [
    'view:dashboard',
    'manage:users',
    'manage:roles',
    'view:inventory',
    'manage:inventory',
    'view:sales',
    'manage:sales',
    'view:purchases',
    'manage:purchases',
    'view:customers',
    'manage:customers',
    'view:suppliers',
    'manage:suppliers',
    'view:expenses',
    'manage:expenses',
    'view:reports',
    'manage:settings',
  ];

  const createdPermissions = await Promise.all(
    permissions.map((p) =>
      prisma.permission.upsert({
        where: { name: p },
        update: {},
        create: { name: p, description: `Permission to ${p}` },
      })
    )
  );

  const roles = ['Admin', 'Manager', 'Cashier', 'Employee'];
  const createdRoles = await Promise.all(
    roles.map((r) =>
      prisma.role.upsert({
        where: { name: r },
        update: {},
        create: { name: r, description: `${r} role` },
      })
    )
  );

  const adminRole = createdRoles.find((r) => r.name === 'Admin')!;
  const managerRole = createdRoles.find((r) => r.name === 'Manager')!;
  const cashierRole = createdRoles.find((r) => r.name === 'Cashier')!;

  // Note: Admin gets all permissions implicitly in middleware, but let's assign some to Manager and Cashier
  const cashierPermissions = createdPermissions.filter(p => p.name.includes('sales') || p.name.includes('customers'));
  
  for (const perm of cashierPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: cashierRole.id, permissionId: perm.id }
      },
      update: {},
      create: { roleId: cashierRole.id, permissionId: perm.id }
    });
  }

  // ==================================================
  // 2. Default Users
  // ==================================================
  console.log('Creating default users...');
  
  const defaultPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const cashierPassword = await bcrypt.hash('cashier123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cardecor.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@cardecor.com',
      password: defaultPassword,
      phone: '03001234567',
      roleId: adminRole.id,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@cardecor.com' },
    update: {},
    create: {
      name: 'Shop Manager',
      email: 'manager@cardecor.com',
      password: managerPassword,
      phone: '03001234568',
      roleId: managerRole.id,
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@cardecor.com' },
    update: {},
    create: {
      name: 'Main Cashier',
      email: 'cashier@cardecor.com',
      password: cashierPassword,
      phone: '03001234569',
      roleId: cashierRole.id,
    },
  });

  // ==================================================
  // 3. Settings
  // ==================================================
  console.log('Configuring settings...');
  
  const settings = [
    { key: 'business_name', value: 'Car Decoration & Accessories' },
    { key: 'phone', value: '+92 300 1234567' },
    { key: 'address', value: '123 Auto Market, City' },
    { key: 'currency', value: 'PKR' },
    { key: 'tax_percentage', value: '18' },
    { key: 'invoice_footer', value: 'Thank you for your business! Goods once sold will not be returned.' },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  // ==================================================
  // 4. Categories & Brands
  // ==================================================
  console.log('Creating categories and brands...');
  
  const categories = ['Seat Covers', 'Audio Systems', 'Lighting', 'Floor Mats', 'Exterior Mods', 'Interior Accessories', 'Car Care'];
  const createdCats = await Promise.all(
    categories.map((c) =>
      prisma.category.upsert({
        where: { name: c },
        update: {},
        create: { name: c, slug: c.toLowerCase().replace(/ /g, '-') },
      })
    )
  );

  const brands = ['Pioneer', 'Sony', 'JBL', '3M', 'Meguiars', 'Toyota Genuine', 'Honda Genuine', 'Local'];
  const createdBrands = await Promise.all(
    brands.map((b) =>
      prisma.brand.upsert({
        where: { name: b },
        update: {},
        create: { name: b, slug: b.toLowerCase().replace(/ /g, '-') },
      })
    )
  );

  // ==================================================
  // 5. Suppliers (10)
  // ==================================================
  console.log('Creating 10 suppliers...');
  
  const suppliers = [];
  for (let i = 1; i <= 10; i++) {
    const s = await prisma.supplier.create({
      data: {
        name: `Supplier ${i}`,
        email: `supplier${i}@example.com`,
        phone: `0321${1000000 + i}`,
        company: `Auto Parts Wholesale ${i}`,
        address: `Wholesale Market Shop ${i}`,
      },
    });
    suppliers.push(s);
  }

  // ==================================================
  // 6. Customers (20) & Vehicles
  // ==================================================
  console.log('Creating 20 customers with vehicles...');
  
  const customers = [];
  const carMakes = ['Toyota', 'Honda', 'Suzuki', 'Kia', 'Hyundai'];
  
  for (let i = 1; i <= 20; i++) {
    const c = await prisma.customer.create({
      data: {
        name: `Customer ${i}`,
        email: `customer${i}@example.com`,
        phone: `0333${1000000 + i}`,
        address: `City Area ${i}`,
        vehicles: {
          create: {
            make: carMakes[i % carMakes.length],
            model: 'Sedan',
            year: 2015 + (i % 9),
            plateNumber: `ABC-${1000 + i}`,
            color: i % 2 === 0 ? 'White' : 'Black',
          }
        }
      },
    });
    customers.push(c);
  }

  // ==================================================
  // 7. Products (20)
  // ==================================================
  console.log('Creating 20 products...');
  
  const products = [];
  for (let i = 1; i <= 20; i++) {
    const purchasePrice = 1000 + (i * 100);
    const p = await prisma.product.create({
      data: {
        name: `Car Accessory ${i}`,
        sku: `SKU-${1000 + i}`,
        barcode: `8901234${1000 + i}`,
        description: `High quality car accessory ${i} for decoration and utility.`,
        purchasePrice,
        sellingPrice: purchasePrice * 1.5, // 50% margin
        quantity: 50,
        minQuantity: 10,
        shelfNumber: `A-${(i % 5) + 1}`,
        categoryId: createdCats[i % createdCats.length].id,
        brandId: createdBrands[i % createdBrands.length].id,
        supplierId: suppliers[i % suppliers.length].id,
        compatibleCars: 'Universal fit',
        warranty: '6 Months',
      },
    });
    products.push(p);
  }

  // ==================================================
  // 8. Purchases (50)
  // ==================================================
  console.log('Creating 50 purchases...');
  
  for (let i = 1; i <= 50; i++) {
    const supplier = suppliers[i % suppliers.length];
    const product1 = products[i % products.length];
    const product2 = products[(i + 1) % products.length];
    
    const p1Qty = 5;
    const p2Qty = 10;
    const subtotal = (product1.purchasePrice * p1Qty) + (product2.purchasePrice * p2Qty);
    
    await prisma.purchase.create({
      data: {
        invoiceNumber: `PUR-${10000 + i}`,
        supplierId: supplier.id,
        subtotal,
        total: subtotal,
        paidAmount: subtotal,
        status: 'Received',
        createdById: manager.id,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)), // Random date in past
        items: {
          create: [
            { productId: product1.id, quantity: p1Qty, unitPrice: product1.purchasePrice, total: product1.purchasePrice * p1Qty },
            { productId: product2.id, quantity: p2Qty, unitPrice: product2.purchasePrice, total: product2.purchasePrice * p2Qty },
          ]
        },
        payments: {
          create: {
            amount: subtotal,
            paymentMethod: 'BankTransfer',
            type: 'Out',
            supplierId: supplier.id,
          }
        }
      }
    });
  }

  // ==================================================
  // 9. Sales (100)
  // ==================================================
  console.log('Creating 100 sales...');
  
  for (let i = 1; i <= 100; i++) {
    const customer = customers[i % customers.length];
    const product = products[i % products.length];
    
    const qty = 1 + (i % 3);
    const subtotal = product.sellingPrice * qty;
    const tax = subtotal * 0.18; // 18% tax
    const total = subtotal + tax;
    
    await prisma.sale.create({
      data: {
        invoiceNumber: `INV-${10000 + i}`,
        customerId: customer.id,
        subtotal,
        tax,
        total,
        paidAmount: total,
        paymentMethod: i % 2 === 0 ? 'Cash' : 'Card',
        status: 'Completed',
        createdById: cashier.id,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)), // Random date in past
        items: {
          create: [
            { productId: product.id, quantity: qty, unitPrice: product.sellingPrice, total: subtotal }
          ]
        },
        payments: {
          create: {
            amount: total,
            paymentMethod: i % 2 === 0 ? 'Cash' : 'Card',
            type: 'In',
            customerId: customer.id,
          }
        }
      }
    });
  }

  // ==================================================
  // 10. Expense Categories & Expenses
  // ==================================================
  console.log('Creating expenses...');
  
  const expCats = ['Rent', 'Utilities', 'Salaries', 'Maintenance', 'Marketing'];
  const createdExpCats = await Promise.all(
    expCats.map((c) =>
      prisma.expenseCategory.upsert({
        where: { name: c },
        update: {},
        create: { name: c, slug: c.toLowerCase().replace(/ /g, '-') },
      })
    )
  );

  for (let i = 1; i <= 30; i++) {
    await prisma.expense.create({
      data: {
        description: `Monthly Expense ${i}`,
        amount: 5000 + (Math.random() * 20000),
        date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
        categoryId: createdExpCats[i % createdExpCats.length].id,
        createdById: manager.id,
      }
    });
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
