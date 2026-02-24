import dashboardRepository from "./dashboard.repository.js";

/**
 * Generates sales report data based on date ranges.
 * Ensures that start and end times are normalized to cover full days.
 */
const generateSalesReport = async ({ range, startDate, endDate }) => {
    let start = new Date();
    let end = new Date();

    // Set default end to the very end of the current day to capture all transactions
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
        // Parse YYYY-MM-DD strings from frontend
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
    } else {
        // Fallback to last 30 days
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
    }

    return await dashboardRepository.getDetailedSalesReport(start, end);
};

/**
 * Fetches dashboard analytics.
 * Combined with the repository fix, this now includes 'Return Requested' 
 * and 'return_pending' statuses to show requests immediately.
 */
const getDashboardStats = async () => {
    const stats = await dashboardRepository.getDashboardAnalytics();

    // Safety check to prevent frontend "undefined" crashes
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