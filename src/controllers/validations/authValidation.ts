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
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
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
