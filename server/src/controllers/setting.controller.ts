import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAll = async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.setting.findMany();
    
    // Map array into a flat key-value object for easy frontend usage
    const mapped: Record<string, string> = {};
    settings.forEach(s => {
      mapped[s.key] = s.value;
    });

    res.status(200).json({ success: true, data: mapped });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const updates: Record<string, string> = req.body;

    // Run updates in transaction
    await prisma.$transaction(
      Object.entries(updates).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) }
        })
      )
    );

    res.status(200).json({ success: true, message: 'Settings updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
