import brandModel from "../../admin/brandManagement/brand.model.js";

export const getUserBrands = async (req, res, next) => {
    try {
        const brands = await brandModel.find({
            isActive: true,
            isDeleted: false,
        }).select("_id name");

        res.status(200).json(brands);
    } catch (err) {
        next(err);
    }
};
