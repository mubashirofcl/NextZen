import dashboardService from "./dashboard.service.js";

export const getSalesReport = async (req, res, next) => {
    try {
        const { range, startDate, endDate } = req.query;
        const report = await dashboardService.generateSalesReport({ range, startDate, endDate });
        res.status(200).json({ success: true, data: report });
    } catch (error) {
        console.error("Sales Report Controller Error:", error.message);
        next(error);
    }
};

export const getAdminDashboardStats = async (req, res, next) => {
    try {

        const { range, startDate, endDate } = req.query;
        
        const stats = await dashboardService.getDashboardStats({ range, startDate, endDate });
        
        res.status(200).json({
            success: true,
            data: stats 
        });
    } catch (error) {
        console.error("Dashboard Stats Controller Error:", error.message);
        next(error);
    }
};

export const getOrderDetails = async (req, res, next) => {
    try {
        const { id } = req.params;

        const query = id.startsWith("ORD-") 
            ? { orderNumber: id } 
            : { _id: id };

        const order = await Order.findOne(query).populate("userId");

        if (!order) return res.status(404).json({ message: "Order not found" });

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};