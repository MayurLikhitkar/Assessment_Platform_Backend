import { body } from 'express-validator';
import validate from './validate';
import { UserRole } from '../models/userModel';

export const registerValidation = [
    body('email')
        .trim()
        .isEmail().withMessage('Please provide a valid email address')
        .isLength({ max: 254 }).withMessage('Email address is too long')
        .normalizeEmail(),
    body('password')
        .trim()
        .isLength({ min: 8, max: 128 }).withMessage('Password must be at least 8 characters long and at most 128 characters long')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/\d/).withMessage('Password must contain at least one number'),
    body('confirmPassword')
        .trim()
        .notEmpty().withMessage('Confirm password is required')
        .custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match'),
    body('fullName')
        .trim()
        .notEmpty().withMessage('Full name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s'-]+$/).withMessage('Full name contains invalid characters'),
    body('phone')
        .optional({ values: 'falsy' })
        .trim()
        .isMobilePhone('any').withMessage('Please provide a valid phone number')
        .isLength({ max: 20 }).withMessage('Phone number must be at most 20 digits long'),

    validate
];

export const loginValidation = [
    body('email')
        .trim()
        .isEmail().withMessage('Please provide a valid email address')
        .isLength({ max: 254 }).withMessage('Email address is too long')
        .normalizeEmail(),
    body('password')
        .trim()
        .notEmpty().withMessage('Password is required')
        .isLength({ max: 128 }).withMessage('Password must be at most 128 characters long'),

    validate
];

export const addUserValidation = [
    body('email')
        .trim()
        .isEmail().withMessage('Please provide a valid email address')
        .isLength({ max: 254 }).withMessage('Email address is too long')
        .normalizeEmail(),
    body('password')
        .trim()
        .isLength({ min: 8, max: 128 }).withMessage('Password must be at least 8 characters long and at most 128 characters long'),
    body('fullName')
        .trim()
        .notEmpty().withMessage('Full name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s'-]+$/).withMessage('Full name contains invalid characters'),
    body('phone')
        .optional({ values: 'falsy' })
        .trim()
        .isMobilePhone('any').withMessage('Please provide a valid phone number')
        .isLength({ max: 20 }).withMessage('Phone number must be at most 20 digits long'),
    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(Object.values(UserRole)).withMessage('Invalid role'),
    validate
];