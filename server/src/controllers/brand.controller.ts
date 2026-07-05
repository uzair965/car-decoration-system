import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createBrand = async (req: Request, res: Response) => {
  try {
    const brand = await prisma.brand.create({
      data: req.body,
    });
    res.status(201).json({ success: true, data: brand });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllBrands = async (req: Request, res: Response) => {
  try {
    const brands = await prisma.brand.findMany();
    res.status(200).json({ success: true, data: brands });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBrandById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const brand = await prisma.brand.findUnique({
      where: { id },
    });
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }
    res.status(200).json({ success: true, data: brand });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBrand = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const brand = await prisma.brand.update({
      where: { id },
      data: req.body,
    });
    res.status(200).json({ success: true, data: brand });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteBrand = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.brand.delete({
      where: { id },
    });
    res.status(200).json({ success: true, data: null });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
