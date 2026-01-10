import Address from "./address.model.js";
import ApiError from "../../../utils/ApiError.js";


export const createAddress = async (userId, data) => {
    if (!userId) {
        throw new ApiError(401, "User not authenticated");
    }

    // 🔥 EXPLICIT MAPPING (NO SPREAD)
    const payload = {
        user: userId,
        fullName: data.fullName,
        phone: data.phone,
        addressLine: data.addressLine,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        landmark: data.landmark ?? null,
        addressType: data.addressType,
        isDefault: data.isDefault || false,
    };

    // 🔒 SAFETY CHECK (OPTIONAL BUT RECOMMENDED)
    if (!payload.fullName || !payload.addressLine) {
        throw new ApiError(400, "Invalid address payload");
    }

    if (payload.isDefault) {
        await Address.updateMany(
            { user: userId },
            { isDefault: false }
        );
    }

    return Address.create(payload);
};
export const updateAddress = async (userId, addressId, data) => {
    // 🔥 Build update payload safely
    const updatePayload = {};

    if (data.fullName) updatePayload.fullName = data.fullName;
    if (data.phone) updatePayload.phone = data.phone;

    // 🔑 CRITICAL MAPPING
    if (data.address) updatePayload.addressLine = data.address;

    if (data.city) updatePayload.city = data.city;
    if (data.state) updatePayload.state = data.state;
    if (data.pincode) updatePayload.pincode = data.pincode;

    if (data.landmark !== undefined) {
        updatePayload.landmark = data.landmark;
    }

    if (data.addressType) {
        updatePayload.addressType = data.addressType;
    }

    if (typeof data.isDefault === "boolean") {
        updatePayload.isDefault = data.isDefault;
    }

    // Handle default logic
    if (data.isDefault === true) {
        await Address.updateMany(
            { user: userId },
            { isDefault: false }
        );
    }

    const address = await Address.findOneAndUpdate(
        { _id: addressId, user: userId },
        updatePayload,
        {
            new: true,
            runValidators: true, // 🔒 IMPORTANT
        }
    );

    if (!address) {
        throw new ApiError(404, "Address not found");
    }

    return address;
};

export const getAddresses = async (userId) => {
    return Address.find({ user: userId }).sort({
        isDefault: -1,
        createdAt: -1,
    });
};

export const setDefaultAddress = async (userId, addressId) => {
    // unset all defaults
    await Address.updateMany(
        { user: userId },
        { isDefault: false }
    );

    const address = await Address.findOneAndUpdate(
        { _id: addressId, user: userId },
        { isDefault: true },
        { new: true }
    );

    if (!address) {
        throw new ApiError(404, "Address not found");
    }

    return address;
};


export const deleteAddress = async (userId, addressId) => {
    const deleted = await Address.findOneAndDelete({
        _id: addressId,
        user: userId,
    });

    if (!deleted) {
        throw new ApiError(404, "Address not found");
    }
};
