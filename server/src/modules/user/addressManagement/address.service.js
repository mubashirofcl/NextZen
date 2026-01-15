import Address from "./address.model.js";

export const createAddress = async (userId, data) => {

    if (!userId) {
        throw new Error("User not authenticated");
    }

    const count = await Address.countDocuments({ user: userId });

    if (count === 0) {
        data.isDefault = true;
    }

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

    if (!payload.fullName || !payload.addressLine) {
        throw new Error("Invalid address payload");
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
    const updatePayload = {};

    if (data.fullName) updatePayload.fullName = data.fullName;
    if (data.phone) updatePayload.phone = data.phone;

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
            runValidators: true,
        }
    );

    if (!address) {
        throw new Error(404, "Address not found");
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
        throw new Error(404, "Address not found");
    }

    return address;
};


export const deleteAddress = async (userId, addressId) => {

    const deletedAddress = await Address.findOneAndDelete({
        _id: addressId,
        user: userId,
    });

    if (!deletedAddress) {
        throw new Error(404, "Address not found");
    }

    if (!deletedAddress.isDefault) {
        return;
    }

    const nextDefault = await Address.findOne({ user: userId }).sort({ createdAt: 1 });

    if (!nextDefault) {
        return;
    }

    await Address.updateMany(
        { user: userId },
        { isDefault: false }
    );
    nextDefault.isDefault = true;
    await nextDefault.save();
};
