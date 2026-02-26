import Order from "../../user/order/order.model.js";
import mongoose from "mongoose";

export const getDashboardAnalytics = async () => {
    const stats = await Order.aggregate([
        {
            $facet: {
                "totals": [
                    { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" }, totalOrders: { $sum: 1 } } }
                ],
                "statusDistribution": [
                    { $group: { _id: "$status", count: { $sum: 1 } } }
                ],
                "recentOrders": [
                    { $sort: { createdAt: -1 } },
                    { $limit: 8 },
                    { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "customer" } },
                    { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
                    { $project: { orderId: "$orderNumber", customer: { $ifNull: ["$customer.name", "Guest"] }, amount: "$totalAmount", status: 1, time: "$createdAt" } }
                ],
                "returnRequests": [
                    { $match: { "items.status": { $in: ["Return Requested", "return_pending"] } } },
                    { $limit: 5 },
                    { $lookup: { from: "products", localField: "items.productId", foreignField: "_id", as: "prod" } },
                    { $unwind: "$prod" },
                    { $project: { orderId: "$orderNumber", customer: "$userId", productName: "$prod.name", reason: { $arrayElemAt: ["$items.returnReason", 0] }, date: "$updatedAt" } }
                ],

                "topProducts": [
                    { $unwind: "$items" },
                    { $match: { "items.status": { $nin: ["Cancelled", "Returned"] } } },
                    {
                        $group: {
                            _id: "$items.productId",
                            totalSold: { $sum: "$items.quantity" },
                            revenue: { $sum: "$items.totalAmount" }
                        }
                    },
                    { $sort: { totalSold: -1 } },
                    { $limit: 5 },
                    {
                        $lookup: {
                            from: "products",
                            localField: "_id",
                            foreignField: "_id",
                            as: "productInfo"
                        }
                    },
                    { $unwind: "$productInfo" },
                    {
                        $lookup: {
                            from: "variants",
                            localField: "_id",
                            foreignField: "productId",
                            as: "variants"
                        }
                    },
                    {
                        $project: {
                            name: "$productInfo.name",
   
                            thumbnail: { $arrayElemAt: [{ $arrayElemAt: ["$variants.images", 0] }, 0] },
                            totalSold: 1,
                            revenue: 1
                        }
                    }
                ],

                "topBrands": [
                    { $unwind: "$items" },
                    { $match: { "items.status": { $nin: ["Cancelled", "Returned"] } } },
                    {
                        $lookup: {
                            from: "products",
                            localField: "items.productId",
                            foreignField: "_id",
                            as: "product"
                        }
                    },
                    { $unwind: "$product" },
                    {
                        $lookup: {
                            from: "brands",
                            localField: "product.brandId",
                            foreignField: "_id",
                            as: "brandInfo"
                        }
                    },
                    { $unwind: { path: "$brandInfo", preserveNullAndEmptyArrays: true } },
                    {
                        $group: {
                            _id: { $ifNull: ["$brandInfo.name", "Unknown Brand"] },
                            salesCount: { $sum: "$items.quantity" }
                        }
                    },
                    { $sort: { salesCount: -1 } },
                    { $limit: 5 }
                ]
            }
        },
        {
            $project: {
                totals: { $arrayElemAt: ["$totals", 0] },
                statusDistribution: 1,
                recentOrders: 1,
                returnRequests: 1,
                topProducts: 1,
                topBrands: 1
            }
        }
    ]);
    return stats[0];
};

export const getDetailedSalesReport = async (startDate, endDate) => {
    return await Order.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: "delivered" } },
        { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: null,
                salesCount: { $sum: 1 },
                totalOrderAmount: { $sum: "$totalAmount" },
                productDiscount: { $sum: { $subtract: ["$totalDiscount", "$couponDiscount"] } },
                couponDiscount: { $sum: "$couponDiscount" },
                rawOrders: {
                    $push: {
                        orderNumber: "$orderNumber",
                        mongoId: "$_id",
                        customer: { $ifNull: ["$user.name", "Guest User"] },
                        amount: "$totalAmount",
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        status: "$status"
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                salesCount: { $ifNull: ["$salesCount", 0] },
                totalOrderAmount: { $ifNull: ["$totalOrderAmount", 0] },
                productDiscount: { $ifNull: ["$productDiscount", 0] },
                couponDiscount: { $ifNull: ["$couponDiscount", 0] },
                recentOrders: { $slice: [{ $ifNull: ["$rawOrders", []] }, -6] },
                allOrdersForExport: { $ifNull: ["$rawOrders", []] },
                chartData: {
                    $cond: {
                        if: { $gt: [{ $size: { $ifNull: ["$rawOrders", []] } }, 0] },
                        then: {
                            $reduce: {
                                input: "$rawOrders",
                                initialValue: [],
                                in: {
                                    $let: {
                                        vars: { index: { $indexOfArray: ["$$value.date", "$$this.date"] } },
                                        in: {
                                            $cond: [
                                                { $eq: ["$$index", -1] },
                                                { $concatArrays: ["$$value", [{ date: "$$this.date", amount: "$$this.amount" }]] },
                                                {
                                                    $map: {
                                                        input: "$$value",
                                                        as: "item",
                                                        in: {
                                                            $cond: [
                                                                { $eq: ["$$item.date", "$$this.date"] },
                                                                { date: "$$item.date", amount: { $add: ["$$item.amount", "$$this.amount"] } },
                                                                "$$item"
                                                            ]
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        },
                        else: []
                    }
                }
            }
        }
    ]);
};

export default { getDashboardAnalytics, getDetailedSalesReport };