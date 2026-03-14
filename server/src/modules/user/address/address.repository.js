import Address from "./address.model.js";

export const findByUser = (userId) => {
  return Address.find({ user: userId }).sort({
    isDefault: -1,
    createdAt: -1,
  });
};

export const create = (payload) => {
  return Address.create(payload);
};

export const updateByIdAndUser = (addressId, userId, update) => {
  return Address.findOneAndUpdate(
    { _id: addressId, user: userId },
    update,
    { new: true }
  );
};

export const deleteByIdAndUser = (addressId, userId) => {
  return Address.findOneAndDelete({
    _id: addressId,
    user: userId,
  });
};

export const unsetDefaultForUser = (userId) => {
  return Address.updateMany(
    { user: userId },
    { isDefault: false }
  );
};
