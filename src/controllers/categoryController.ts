import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import categoryModel from '../models/categoryModel';
import { CustomRequest } from '../types/authTypes';
import questionModel from '../models/questionModel';

export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await categoryModel.find({ isActive: true });
        return res.json(categories);
    } catch (error: any) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getCategoryById = async (req: Request, res: Response) => {
    try {
        const category = await categoryModel.findOne({
            id: Number(req.params.id),
        });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        return res.json(category);
    } catch (error: any) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const createCategory = async (req: CustomRequest, res: Response) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, type, subCategories, icon } = req.body;

        // Check if category already exists
        const existingCategory = await categoryModel.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        const category = new categoryModel({
            name,
            description,
            type,
            subCategories,
            icon,
            colorCode,
            createdBy: req.user?.userId,
        });

        await category.save();
        res.status(201).json(category);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateCategory = async (req: CustomRequest, res: Response) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const category = await categoryModel.findOne({
            id: Number(req.params.id),
        });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const { name, description, type, subCategories, icon, isActive } = req.body;

        // Update category
        category.name = name || category.name;
        category.description = description || category.description;
        category.type = type || category.type;
        category.subCategories = subCategories || category.subCategories;
        category.icon = icon || category.icon;
        if (isActive !== undefined) category.isActive = isActive;

        await category.save();
        res.json(category);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const deleteCategory = async (req: CustomRequest, res: Response) => {
    try {
        const category = await categoryModel.findOne({
            id: Number(req.params.id),
        });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check if category has questions
        const questionCount = await questionModel.countDocuments({
            categoryId: category._id,
        });

        if (questionCount > 0) {
            return res.status(400).json({
                message: 'Cannot delete category with questions. Please reassign questions first.',
            });
        }

        await category.deleteOne();
        res.json({ message: 'Category deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getCategoryQuestions = async (req: Request, res: Response) => {
    try {
        const category = await categoryModel.findOne({ id: Number(req.params.id) });
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const questions = await questionModel.find({
            categoryId: category._id,
        }).sort({ createdAt: -1 });

        res.json(questions);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getCategoryTree = async (req: Request, res: Response) => {
    try {
        const categories = await categoryModel.find({ isActive: true });

        // Group by type for tree structure
        const tree = categories.reduce((acc: any, category) => {
            category.type.forEach((type) => {
                if (!acc[type]) {
                    acc[type] = [];
                }
                acc[type].push(category);
            });
            return acc;
        }, {});

        res.json(tree);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};