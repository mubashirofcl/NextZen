import dashboardRepository from "./dashboard.repository.js";

const generateSalesReport = async ({ range, startDate, endDate }) => {
    let start = new Date();
    let end = new Date();

    end.setHours(23, 59, 59, 999);

    if (range === 'today') {
        start.setHours(0, 0, 0, 0);
    } else if (range === 'thisWeek') {
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
    } else if (range === 'thisMonth') {
        start = new Date(start.getFullYear(), start.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
    } else if (range === 'custom' && startDate && endDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
    } else {
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
    }

    return await dashboardRepository.getDetailedSalesReport(start, end);
};


const getDashboardStats = async () => {
    const stats = await dashboardRepository.getDashboardAnalytics();

    if (!stats) {
        return {
            totals: { totalRevenue: 0, totalOrders: 0 },
            statusDistribution: [],
            recentOrders: [],
            returnRequests: []
        };
    }

    return stats;
};

export default { generateSalesReport, getDashboardStats };