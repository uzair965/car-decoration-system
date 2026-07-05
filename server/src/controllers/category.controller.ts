import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createCategory = async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.create({
      data: req.body,
    });
    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany();
    res.status(200).json({ success: true, data: categories });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, data: category });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.update({
      where: { id },
      data: req.body,
    });
    res.status(200).json({ success: true, data: category });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({
      where: { id },
    });
    res.status(200).json({ success: true, data: null });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
