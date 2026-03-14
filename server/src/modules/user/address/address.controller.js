import * as service from "./address.service.js";

export const getAddresses = async (req, res) => {
  const addresses = await service.getAddresses(req.user.userId);
  res.json(addresses);
};

export const createAddress = async (req, res) => {
  const address = await service.createAddress(
    req.user.userId,
    req.body
  );
  res.status(201).json(address);
};

export const updateAddress = async (req, res) => {
  const address = await service.updateAddress(
    req.user.userId,
    req.params.id,
    req.body
  );
  res.json(address);
};

export const deleteAddress = async (req, res) => {
  await service.deleteAddress(
    req.user.userId,
    req.params.id
  );
  res.status(204).send();
};

export const setDefaultAddress = async (req, res) => {
  const address = await service.setDefaultAddress(
    req.user.userId,
    req.params.id
  );
  res.json(address);
};
