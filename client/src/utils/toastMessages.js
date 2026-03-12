
export const TOAST_MESSAGES = {

    AUTH: {
        SESSION_EXPIRED: { title: "Session Expired", message: "Your secure session has smoothly timed out. Please log in again to continue." },
        ACCESS_DENIED: { title: "Access Restricted", message: "Please log in to your account to securely access this area." },
        INVALID_CREDENTIALS: { title: "Login Failed", message: "We couldn't verify those credentials. Please check your email and password." },
        SIGNUP_INTERRUPTED: { title: "Signup Interrupted", message: "We encountered an issue creating your account. Please check your details and try again." },
        LOGOUT_FAILED: { title: "Termination Failed", message: "We couldn't cleanly disconnect your session at the moment." },
        LOGOUT_SUCCESS: { title: "Logged Out", message: "Successfully Logged out." },
        LOGIN_SUCCESS: { title: "Welcome Back", message: "You have securely logged in to your account." },
        SIGNUP_SUCCESS: { title: "Welcome to NextZen", message: "Your account has been successfully created!" }
    },

    VERIFICATION: {
        INVALID_OTP: { title: "Invalid Code", message: "The verification code you entered is incorrect. Double-check and try again." },
        MISSING_OTP: { title: "Code Required", message: "Please enter the 6-digit verification code sent to your email." },
        RESEND_FAILED: { title: "Delivery Failed", message: "We couldn't send the new verification code. Please request again in a moment." },
        OTP_SENT: { title: "Verification Sent", message: "A fresh security code is waiting in your inbox." },
        ACCOUNT_VERIFIED: { title: "Account Verified", message: "Your account is now fully verified and active!" },
        EMAIL_UPDATED: { title: "Email Updated", message: "Your linked email address has been successfully changed." },
        PASSWORD_SET: { title: "Identity Confirmed", message: "Email verified! You may now securely set a new password." }
    },

    USER: {
        PASSWORD_INCORRECT: { title: "Identity Check Failed", message: "The current password provided does not match our records." },
        UPDATE_FAILED: { title: "Sync Error", message: "We encountered an issue updating your profile information." },
        PROFILE_UPDATED: { title: "Profile Synced", message: "Your user profile has been successfully updated." },
        PASSWORD_UPDATED: { title: "Security Updated", message: "Your password has been changed securely." }
    },

    PRODUCT: {
        NOT_FOUND: { title: "Not Found", message: "Product information is missing." },
        OUT_OF_STOCK: { title: "Out of Stock", message: "This item is currently unavailable." },
        DIMENSION_REQUIRED: { title: "Selection Required", message: "Please select a Dimension/Size before adding to archive." },
        WAREHOUSE_LIMIT_REACHED: (currentStock) => ({
            title: "Warehouse Limit", message: `Only ${currentStock} units left.`
        }),
        STOCK_MISMATCH: (sizeName) => ({
            title: "Inventory Conflict", message: `The size '${sizeName}' is now out of stock and cannot be fulfilled.`
        })
    },

    CART_WISHLIST: {
        ALREADY_IN_CART: { title: "Already Archived", message: "Item in manifest." },
        MOVE_TO_CART_FAILED: { title: "Transfer Failed", message: "Could not move item to cart." },
        CLEAR_CONFIRM: { title: "Clear Wishlist?", message: "This will remove all saved items." },
        ADDED_TO_CART: { title: "Archive Synced", message: "Secured in your archive." },
        ADDED_TO_WISHLIST: { title: "Saved for Later", message: "Item securely pinned to your wishlist archive." },
        ITEM_MOVED: { title: "Success", message: "Item moved to your shopping bag." },
        REMOVED: { title: "Item Removed", message: "The item was discarded from your list." },
        PURGED: { title: "Archive Purged", message: "Your item list has been completely cleared." }
    },

    CHECKOUT: {
        ORDER_NOT_FOUND: { title: "Manifest Missing", message: "We could not locate the details for this order." },
        GATEWAY_ERROR: { title: "Gateway Offline", message: "Payment gateway offline." },
        PAYMENT_INIT_FAILED: { title: "Initialization Error", message: "Payment initialization failed." },
        INSUFFICIENT_WALLET: { title: "Insufficient Funds", message: "Your NexZen Wallet balance is too low." },
        COUPON_EXPIRED: { title: "Coupon Expired", message: "The applied coupon is no longer available." },
        COUPON_MINIMUM_UNMET: (minAmt) => ({
            title: "Action Blocked", message: `Minimum order of ₹${minAmt} required for applied coupon.`
        }),
        ORDER_BLOCKED: { title: "Procedure Blocked", message: "You cannot alter the status of this order at this stage." },
        CANCEL_FAILED: { title: "Cancel Failed", message: "Action blocked. Unable to cancel." },
        SYNC_ERROR: { title: "Sync Error", message: "Transaction verified but manifest update failed." },

        ORDER_SECURED: { title: "Success", message: "Order confirmed successfully." },
        ORDER_PLACED: { title: "Success", message: "Order confirmed successfully." },
        ORDER_VOIDED: { title: "Order Voided", message: "All items cancelled and refunded." },
        ITEM_CANCELLED: { title: "Item Cancelled", message: "Refund credited to wallet." },
        RETURN_REQUESTED: { title: "Return Requested", message: "Manifest updated." },
        WALLET_FUNDED: { title: "Funds Added", message: "Your NexZen Wallet has been successfully topped up." },
        COUPON_APPLIED: (code) => ({ title: "Coupon Applied", message: `${code} applied successfully!` }),
        COUPON_REMOVED: { title: "Success", message: "Coupon removed" },
        CODE_COPIED: { title: "Code Copied", message: "Apply it at checkout for a discount." }
    },

    SYSTEM: {
        UNKNOWN_ERROR: { title: "Unknown Exception", message: "An unknown application error occurred." },
        ACTION_FAILED: { title: "Action Failed", message: "We encountered an issue processing your request." },
        SECURITY_ALERT: { title: "Security Alert", message: "Action blocked due to security reasons." }
    },

    PROFILE: {
        PROFILE_UPDATED: { title: "Profile Synced", message: "Your user profile has been successfully updated." },
        PASSWORD_UPDATED: { title: "Security Updated", message: "Your password has been changed securely." },
        ADDRESS_ADDED: { title: "Address Saved", message: "New delivery address added successfully." },
        ADDRESS_UPDATED: { title: "Address Updated", message: "Your address details have been updated." },
        ADDRESS_REMOVED: { title: "Address Removed", message: "The address was successfully removed." },
        ADDRESS_DEFAULT_UPDATED: { title: "Default Updated", message: "Default delivery address updated." }
    }
};

export default TOAST_MESSAGES;
