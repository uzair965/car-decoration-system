import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const create = async (req: Request, res: Response) => {
  try {
    const { description, amount, date, categoryId, notes } = req.body;
    const expense = await prisma.expense.create({
      data: {
        description,
        amount: Number(amount),
        date: new Date(date),
        categoryId,
        notes,
        createdById: (req as any).user.id
      },
      include: {
        category: true,
        createdBy: { select: { name: true } }
      }
    });
    res.status(201).json({ success: true, data: expense });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req: Request, res: Response) => {
  try {
    const expenses = await prisma.expense.findMany({
      include: {
        category: true,
        createdBy: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });
    res.status(200).json({ success: true, data: expenses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description, amount, date, categoryId, notes } = req.body;
    
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        description,
        amount: Number(amount),
        date: new Date(date),
        categoryId,
        notes,
      },
      include: {
        category: true,
        createdBy: { select: { name: true } }
      }
    });
    res.status(200).json({ success: true, data: expense });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.expense.delete({
      where: { id }
    });
    res.status(200).json({ success: true, data: null });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
