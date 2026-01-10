import * as userRepo from "./userManegment.repository.js";

export const getAllUsers = async ({ page, limit, search, status, sortBy, order }) => {
    const skip = (page - 1) * limit;
    const filter = {};

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
        ];
    }

    if (status === "active") filter.isBlocked = false;
    if (status === "blocked") filter.isBlocked = true;

    const sort = { [sortBy]: order === "asc" ? 1 : -1 };
    const { users, totalUsers } = await userRepo.findAllUsers({ filter, sort, skip, limit });

    return {
        users,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page,
    };
};

export const blockUser = async (userId, reason) => {
    const updateData = {
        isBlocked: true,
        blockReason: reason || "Blocked by Admin",
        blockedAt: new Date(),
    };

    const updatedUser = await userRepo.updateStatus(userId, updateData);
    if (!updatedUser) throw new Error("User not found");

    return updatedUser;
};

export const unblockUser = async (userId) => {
    const updateData = { isBlocked: false, blockReason: null, blockedAt: null };
    const updatedUser = await userRepo.updateStatus(userId, updateData);
    if (!updatedUser) throw new Error("User not found");

    return updatedUser;
};

export const getUserStats = async () => {
    return await userRepo.getCounts();
};