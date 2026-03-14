import { body, validationResult } from 'express-validator';

export const couponValidationRules = [
    body('code')
        .trim()
        .notEmpty().withMessage('Coupon code is required')
        .isLength({ min: 3, max: 15 }).withMessage('Code must be between 3-15 characters')
        .toUpperCase(),

    body('discountType')
        .isIn(['PERCENT', 'FLAT']).withMessage('Type must be either PERCENT or FLAT'),

    body('discountValue')
        .isNumeric().withMessage('Discount value must be a number')
        .custom((value, { req }) => {
            if (req.body.discountType === 'PERCENT' && (value <= 0 || value > 100)) {
                throw new Error('Percentage must be between 1 and 100');
            }
            if (req.body.discountType === 'FLAT' && value <= 0) {
                throw new Error('Flat discount must be greater than 0');
            }
            return true;
        }),

    body('minPurchaseAmt')
        .optional()
        .isNumeric().withMessage('Minimum purchase must be a number')
        .default(0),

    body('maxDiscount')
        .optional({ nullable: true })
        .isNumeric().withMessage('Max discount must be a number'),

    body('usageLimit')
        .isInt({ min: 1 }).withMessage('Usage limit must be at least 1'),

    body('startDate')
        .isISO8601().withMessage('Valid start date is required'),

    body('endDate')
        .isISO8601().withMessage('Valid end date is required')
        .custom((value, { req }) => {
            if (new Date(value) <= new Date(req.body.startDate)) {
                throw new Error('End date must be after the start date');
            }
            return true;
        }),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('Description is too long'),
];

export const validateCoupon = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }
    next(); 
};