import User from "../../user/userCore/user.model.js";

export const findAllUsers = async ({ filter, sort, skip, limit }) => {
    const [users, totalUsers] = await Promise.all([
        User.find(filter)
            .select("-password -refreshToken")
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        User.countDocuments(filter),
    ]);

    return { users, totalUsers };
};

export const findUserById = async (userId) => {
    return await User.findById(userId).select("-password -refreshToken").lean();
};

export const updateStatus = async (userId, updateData) => {
    return await User.findByIdAndUpdate(userId, updateData, { new: true })
        .select("-password")
        .lean();
};

export const getCounts = async () => {
    const [total, active, blocked] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isBlocked: false }),
        User.countDocuments({ isBlocked: true }),
    ]);
    return { total, active, blocked };
};