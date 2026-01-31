import * as userMgmtService from "./userManegment.service.js";

export const getUsers = async (req, res) => {
    try {
        let {
            page = 1,
            limit = 5,
            search = "",
            status = "",
            sortBy = "createdAt",
            order = "desc",
        } = req.query;

        search = typeof search === "string" ? search.trim() : "";
        status = typeof status === "string" ? status.trim() : "";

        const result = await userMgmtService.getAllUsers({
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            search,
            status,
            sortBy,
            order,
        });

        res.status(200).json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};



export const handleBlock = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        const data = await userMgmtService.blockUser(userId, reason);
        res.status(200).json({ success: true, message: "User blocked successfully", data });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const handleUnblock = async (req, res) => {
    try {
        const { userId } = req.params;
        const data = await userMgmtService.unblockUser(userId);
        res.status(200).json({ success: true, message: "User unblocked successfully", data });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const getStats = async (req, res) => {
    try {
        const data = await userMgmtService.getUserStats();
        res.status(200).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};