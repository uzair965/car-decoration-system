import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '../utils/auditLog';

const prisma = new PrismaClient();

// ==================================================
// Create Product with dynamic attribute values
// ==================================================
export const create = async (req: Request, res: Response) => {
  try {
    const { attributeValues, ...productData } = req.body;
    
    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: productData,
      });

      if (attributeValues && attributeValues.length > 0) {
        await tx.productAttributeValue.createMany({
          data: attributeValues.map((val: any) => ({
            productId: p.id,
            attributeId: val.attributeId,
            value: String(val.value),
          })),
        });
      }
      return p;
    });

    // Return full product object
    const createdProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        subcategory: true,
        brand: true,
        supplier: true,
        attributeValues: {
          include: {
            attribute: true,
          },
        },
      },
    });

    if (createdProduct) {
      await createAuditLog(
        req as any,
        'CREATE_PRODUCT',
        'Product',
        createdProduct.id,
        `Created product "${createdProduct.name}" (SKU: ${createdProduct.sku}, Stock: ${createdProduct.quantity})`
      );
    }

    res.status(201).json({ success: true, data: createdProduct });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================================================
// Get all products
// ==================================================
export const getAll = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        subcategory: true,
        brand: true,
        supplier: true,
        attributeValues: {
          include: {
            attribute: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: products });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================================================
// Get product by ID
// ==================================================
export const getById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        subcategory: true,
        brand: true,
        supplier: true,
        attributeValues: {
          include: {
            attribute: true,
          },
        },
      },
    });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================================================
// Update Product
// ==================================================
export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { attributeValues, ...productData } = req.body;

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id },
        data: productData,
      });

      if (attributeValues) {
        // Sync attribute values: Delete all old values and create new ones
        await tx.productAttributeValue.deleteMany({
          where: { productId: id },
        });

        if (attributeValues.length > 0) {
          await tx.productAttributeValue.createMany({
            data: attributeValues.map((val: any) => ({
              productId: id,
              attributeId: val.attributeId,
              value: String(val.value),
            })),
          });
        }
      }
      return p;
    });

    // Return full updated product object
    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        subcategory: true,
        brand: true,
        supplier: true,
        attributeValues: {
          include: {
            attribute: true,
          },
        },
      },
    });

    if (updatedProduct) {
      await createAuditLog(
        req as any,
        'UPDATE_PRODUCT',
        'Product',
        updatedProduct.id,
        `Updated product "${updatedProduct.name}" (SKU: ${updatedProduct.sku}, New Price: Rs. ${updatedProduct.sellingPrice})`
      );
    }

    res.status(200).json({ success: true, data: updatedProduct });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================================================
// Delete Product
// ==================================================
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await createAuditLog(
      req as any,
      'DELETE_PRODUCT',
      'Product',
      id,
      `Deleted product with ID: ${id}`
    );

    await prisma.product.delete({
      where: { id },
    });
    res.status(200).json({ success: true, data: null });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
