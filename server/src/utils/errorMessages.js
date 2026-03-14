

export const SERVER_MESSAGES = {

    AUTH: {
        SESSION_EXPIRED: { code: "AUTH_001", status: 401, message: "Your secure session has timed out. Please log in again." },
        ACCESS_DENIED: { code: "AUTH_002", status: 401, message: "Authentication missing or invalid." },
        INVALID_CREDENTIALS: { code: "AUTH_003", status: 401, message: "Invalid credentials provided." },
        TOO_MANY_ATTEMPTS: { code: "AUTH_004", status: 429, message: "Too many login attempts. Please try again later." },
        MISSING_TOKEN: { code: "AUTH_005", status: 401, message: "Refresh token missing." },
        INVALID_ACCESS_SESSION: { code: "AUTH_006", status: 403, message: "Invalid access session." },
        SIGNUP_INTERRUPTED: { code: "AUTH_007", status: 400, message: "Signup process interrupted due to validation." },
        LOGOUT_FAILED: { code: "AUTH_008", status: 500, message: "Failed to terminate session." },
        GOOGLE_ACCOUNT_PASSWORD: { code: "AUTH_009", status: 400, message: "Password change is not allowed for Google accounts." },

        LOGIN_SUCCESS: { status: 200, message: "Login successful" },
        LOGOUT_SUCCESS: { status: 200, message: "Logged out successfully" },
        SIGNUP_SUCCESS: { status: 201, message: "Signup successful" }
    },

    VERIFICATION: {
        INVALID_OTP: { code: "VERIFY_001", status: 400, message: "Invalid verification code." },
        MISSING_OTP: { code: "VERIFY_002", status: 400, message: "Verification code is required." },
        RESEND_FAILED: { code: "VERIFY_003", status: 400, message: "Failed to resend code." },

        OTP_SENT: { status: 200, message: "Verification code sent successfully." },
        ACCOUNT_VERIFIED: { status: 200, message: "Account verified successfully." },
        EMAIL_UPDATED: { status: 200, message: "Email updated successfully." },
        PASSWORD_SET: { status: 200, message: "Password updated successfully." }
    },

    USER: {
        NOT_FOUND: { code: "USER_001", status: 404, message: "User not found." },
        PASSWORD_INCORRECT: { code: "USER_002", status: 400, message: "Current password is incorrect." },
        PASSWORD_MISSING: { code: "USER_003", status: 400, message: "Current and new password are required." },
        UPDATE_FAILED: { code: "USER_004", status: 400, message: "Failed to update profile." },

        PROFILE_UPDATED: { status: 200, message: "Profile updated successfully." }
    },
    PRODUCT: {
        NOT_FOUND: { code: "PROD_001", status: 404, message: "Product not found." },
        OUT_OF_STOCK: { code: "PROD_002", status: 400, message: "This item is currently out of stock." },
        DIMENSION_REQUIRED: { code: "PROD_004", status: 400, message: "Product size/dimension is required." },
        WAREHOUSE_LIMIT_REACHED: (currentStock) => ({
            code: "PROD_005", status: 400, message: `Only ${currentStock} units available.`
        }),
        STOCK_MISMATCH: (sizeName) => ({
            code: "PROD_006", status: 400, message: `Stock conflict: ${sizeName} is currently out of stock.`
        })
    },

    CART_WISHLIST: {
        ALREADY_IN_CART: { code: "CART_001", status: 400, message: "Item already in cart." },
        FETCH_FAILED: { code: "WISH_001", status: 500, message: "Failed to fetch wishlist." },

        REMOVED: { status: 200, message: "Removed successfully." },
        PURGED: { status: 200, message: "Archive Purged." }
    },

    CHECKOUT: {
        ORDER_NOT_FOUND: { code: "ORD_001", status: 404, message: "Order records not found." },
        INVALID_SIGNATURE: { code: "PAY_002", status: 400, message: "Invalid Signature." },
        INVALID_AMOUNT: { code: "PAY_003", status: 400, message: "Invalid amount." },
        INSUFFICIENT_WALLET: { code: "PAY_005", status: 400, message: "Insufficient wallet balance." },
        COUPON_EXPIRED: { code: "CPN_001", status: 400, message: "Coupon has expired/blocked. Order adjusted to standard price." },
        COUPON_MINIMUM_UNMET: (minAmt) => ({
            code: "CPN_002", status: 400, message: `Remaining order total falls below the ₹${minAmt} minimum required for coupon.`
        }),
        ORDER_BLOCKED: { code: "ORD_002", status: 400, message: "Action not allowed in current state." },
        PAYMENT_VERIFIED: { status: 200, message: "Verified." },
        WALLET_FUNDED: { status: 200, message: "Funds added successfully." }
    },

    SYSTEM: {
        SERVER_ERROR: { code: "SYS_500", status: 500, message: "Internal Server Error." }
    }
};

export default SERVER_MESSAGES;
