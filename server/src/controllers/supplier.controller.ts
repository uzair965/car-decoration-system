import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const create = async (req: Request, res: Response) => {
  try {
    const supplier = await prisma.supplier.create({
      data: req.body,
    });
    res.status(201).json({ success: true, data: supplier });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req: Request, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany();
    res.status(200).json({ success: true, data: suppliers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id },
    });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.status(200).json({ success: true, data: supplier });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.update({
      where: { id },
      data: req.body,
    });
    res.status(200).json({ success: true, data: supplier });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.supplier.delete({
      where: { id },
    });
    res.status(200).json({ success: true, data: null });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Also export delete to match routes
export { deleteSupplier as delete };
