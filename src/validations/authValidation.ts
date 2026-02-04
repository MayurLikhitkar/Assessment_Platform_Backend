import { body } from 'express-validator';
import validate from './validate';

export const registerValidation = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .trim()
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/\d/)
        .withMessage('Password must contain at least one number'),
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('phone')
        .trim()
        .optional({ values: 'falsy' })
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),

    validate
];

export const loginValidation = [
    body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
    body('password').trim().notEmpty().withMessage('Password is required'),

    validate
];
