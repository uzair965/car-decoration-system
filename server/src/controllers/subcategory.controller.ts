import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==================================================
// Get all subcategories for a category
// ==================================================
export const getSubcategoriesByCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const subcategories = await prisma.subcategory.findMany({
      where: { categoryId },
      include: {
        attributes: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.status(200).json({ success: true, data: subcategories });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================================================
// Get a single subcategory by ID
// ==================================================
export const getSubcategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subcategory = await prisma.subcategory.findUnique({
      where: { id },
      include: {
        attributes: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
    if (!subcategory) {
      return res.status(404).json({ success: false, message: 'Subcategory not found' });
    }
    res.status(200).json({ success: true, data: subcategory });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================================================
// Create subcategory with attribute template
// ==================================================
export const createSubcategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const { name, attributes } = req.body;

    const subcategory = await prisma.subcategory.create({
      data: {
        categoryId,
        name,
        attributes: attributes && attributes.length > 0 ? {
          create: attributes.map((attr: any) => ({
            name: attr.name,
            type: attr.type,
            dropdownOptions: attr.dropdownOptions || null,
            displayOrder: attr.displayOrder || 0,
          })),
        } : undefined,
      },
      include: {
        attributes: true,
      },
    });

    res.status(201).json({ success: true, data: subcategory });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================================================
// Update subcategory and attributes template
// ==================================================
export const updateSubcategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, attributes } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update subcategory name
      const subcategory = await tx.subcategory.update({
        where: { id },
        data: { name },
      });

      if (attributes) {
        // 2. Fetch existing attributes of this subcategory
        const existingAttributes = await tx.subcategoryAttribute.findMany({
          where: { subcategoryId: id },
        });

        const incomingIds = attributes.map((a: any) => a.id).filter(Boolean);
        const attributeIdsToDelete = existingAttributes
          .map((ea) => ea.id)
          .filter((id) => !incomingIds.includes(id));

        // 3. Delete attributes that were removed
        if (attributeIdsToDelete.length > 0) {
          await tx.subcategoryAttribute.deleteMany({
            where: { id: { in: attributeIdsToDelete } },
          });
        }

        // 4. Create or update attributes
        for (const attr of attributes) {
          if (attr.id) {
            // Update
            await tx.subcategoryAttribute.update({
              where: { id: attr.id },
              data: {
                name: attr.name,
                type: attr.type,
                dropdownOptions: attr.dropdownOptions || null,
                displayOrder: attr.displayOrder || 0,
              },
            });
          } else {
            // Create
            await tx.subcategoryAttribute.create({
              data: {
                subcategoryId: id,
                name: attr.name,
                type: attr.type,
                dropdownOptions: attr.dropdownOptions || null,
                displayOrder: attr.displayOrder || 0,
              },
            });
          }
        }
      }

      return subcategory;
    });

    // Fetch final result with updated attributes
    const updatedSubcategory = await prisma.subcategory.findUnique({
      where: { id },
      include: {
        attributes: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    res.status(200).json({ success: true, data: updatedSubcategory });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================================================
// Delete Subcategory
// ==================================================
export const deleteSubcategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.subcategory.delete({
      where: { id },
    });
    res.status(200).json({ success: true, data: null });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
