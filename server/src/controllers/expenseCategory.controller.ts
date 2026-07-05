import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const create = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    
    const category = await prisma.expenseCategory.create({
      data: { name, slug, description }
    });
    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    
    const category = await prisma.expenseCategory.update({
      where: { id },
      data: { name, slug, description }
    });
    res.status(200).json({ success: true, data: category });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.expenseCategory.delete({
      where: { id }
    });
    res.status(200).json({ success: true, data: null });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
