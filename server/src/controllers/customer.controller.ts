import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const create = async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.create({
      data: req.body,
    });
    res.status(201).json({ success: true, data: customer });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: customers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        vehicles: true,
      }
    });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.status(200).json({ success: true, data: customer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.update({
      where: { id },
      data: req.body,
    });
    res.status(200).json({ success: true, data: customer });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.customer.delete({
      where: { id },
    });
    res.status(200).json({ success: true, data: null });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { deleteCustomer as delete };
