import Order from "../../user/order/order.model.js";
import User from "../../user/userCore/user.model.js";
import Product from "../productManagement/product.model.js";
import mongoose from "mongoose";

const fixNum = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

export const getDashboardAnalytics = async (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const [newUsersCount, newProductsCount] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: start, $lte: end } }),
        Product.countDocuments({ createdAt: { $gte: start, $lte: end } })
    ]);

    const stats = await Order.aggregate([
        { 
            $match: { 
                createdAt: { $gte: start, $lte: end },
                paymentStatus: { $in: ["Paid", "Refunded"] }
            } 
        },
        {
            $facet: {
                "totals": [
                    {
                        $group: {
                            _id: null,
                            totalRevenue: {
                                $sum: {
                                    $cond: [
                                        { $eq: [{ $toLower: "$status" }, "cancelled"] },
                                        0,
                                        {
                                            $cond: [
                                                { $eq: [{ $toLower: "$status" }, "returned"] },
                                                "$deliveryCharge",
                                                "$totalAmount"
                                            ]
                                        }
                                    ]
                                }
                            },
                            totalOrders: {
                                $sum: {
                                    $cond: [
                                        { $in: [{ $toLower: "$status" }, ["cancelled", "returned"]] },
                                        0,
                                        1
                                    ]
                                }
                            }
                        }
                    }
                ],
                "statusDistribution": [{ $group: { _id: "$status", count: { $sum: 1 } } }],
                "topProducts": [
                    { $unwind: "$items" },
                    { $match: { "items.status": { $nin: ["Cancelled", "Returned"] } } },
                    { $group: { _id: "$items.productId", totalSold: { $sum: "$items.quantity" }, revenue: { $sum: "$items.totalAmount" } } },
                    { $sort: { totalSold: -1 } },
                    { $limit: 5 },
                    { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "info" } },
                    { $unwind: { path: "$info", preserveNullAndEmptyArrays: true } },
                    { $lookup: { from: "variants", localField: "_id", foreignField: "productId", as: "variantInfo" } },
                    { $project: { 
                        name: { $ifNull: ["$info.name", "Unknown Product"] }, 
                        thumbnail: { $arrayElemAt: [{ $arrayElemAt: ["$variantInfo.images", 0] }, 0] }, 
                        totalSold: 1, 
                        revenue: 1 
                    } }
                ],
                "recentOrders": [
                    { $sort: { createdAt: -1 } },
                    { $limit: 8 },
                    { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "customer" } },
                    { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
                    { $project: { orderId: "$orderNumber", customer: { $ifNull: ["$customer.name", "Guest"] }, amount: "$totalAmount", status: 1 } }
                ],
                "returnRequests": [
                    { $unwind: "$items" },
                    { $match: { "items.status": "Return Requested" } },
                    { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "customer" } },
                    { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
                    { $lookup: { from: "products", localField: "items.productId", foreignField: "_id", as: "product" } },
                    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
                    { $project: {
                        mongoId: "$_id",
                        orderId: "$orderNumber",
                        customer: { $ifNull: ["$customer.name", "Guest"] },
                        productName: { $ifNull: ["$product.name", "Unknown Product"] },
                        reason: { $ifNull: ["$items.returnReason", "No return reason provided"] }
                    }},
                    { $limit: 20 }
                ],
                "topBrands": [
                    { $unwind: "$items" },
                    { $match: { "items.status": { $nin: ["Cancelled", "Returned"] } } },
                    { $lookup: { from: "products", localField: "items.productId", foreignField: "_id", as: "product" } },
                    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
                    { $lookup: { from: "brands", localField: "product.brandId", foreignField: "_id", as: "brand" } },
                    { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },
                    { $group: {
                        _id: { $ifNull: ["$brand.name", "Generic"] },
                        salesCount: { $sum: "$items.quantity" }
                    }},
                    { $sort: { salesCount: -1 } },
                    { $limit: 5 }
                ]
            }
        },
        {
            $project: {
                totals: { $ifNull: [{ $arrayElemAt: ["$totals", 0] }, { totalRevenue: 0, totalOrders: 0 }] },
                statusDistribution: 1,
                topProducts: 1,
                recentOrders: 1,
                returnRequests: 1,
                topBrands: 1
            }
        }
    ]);

    let result = stats.length > 0 ? stats[0] : null;

    if (!result) {
        result = {
            totals: { totalRevenue: 0, totalOrders: 0 },
            statusDistribution: [],
            topProducts: [],
            recentOrders: [],
            returnRequests: [],
            topBrands: []
        };
    }

    if (!result.totals || Array.isArray(result.totals)) {
        result.totals = { totalRevenue: 0, totalOrders: 0 };
    }

    result.totals.activeUsers = newUsersCount || 0;
    result.totals.listedProducts = newProductsCount || 0;
    return result;
};
export const getDetailedSalesReport = async (startDate, endDate) => {
    return await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
                paymentStatus: { $in: ["Paid", "Refunded"] }
            }
        },
        { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: null,
                salesCount: { $sum: { $cond: [{ $in: [{ $toLower: "$status" }, ["cancelled", "returned"]] }, 0, 1] } },
                totalDeliveryFees: { $sum: { $cond: [{ $eq: [{ $toLower: "$status" }, "cancelled"] }, 0, "$deliveryCharge"] } },
                productRevenue: { $sum: { $cond: [{ $in: [{ $toLower: "$status" }, ["cancelled", "returned"]] }, 0, { $subtract: ["$totalAmount", "$deliveryCharge"] }] } },
                totalOrderAmount: { $sum: { $cond: [{ $eq: [{ $toLower: "$status" }, "cancelled"] }, 0, { $cond: [{ $eq: [{ $toLower: "$status" }, "returned"] }, "$deliveryCharge", "$totalAmount"] }] } },
                productDiscount: { $sum: { $cond: [{ $in: [{ $toLower: "$status" }, ["cancelled", "returned"]] }, 0, { $subtract: ["$totalDiscount", "$couponDiscount"] }] } },
                couponDiscount: { $sum: { $cond: [{ $in: [{ $toLower: "$status" }, ["cancelled", "returned"]] }, 0, "$couponDiscount"] } },
                rawOrders: {
                    $push: {
                        orderNumber: "$orderNumber",
                        mongoId: "$_id",
                        customer: { $ifNull: ["$user.name", "Guest User"] },
                        amount: "$totalAmount",
                        deliveryCharge: "$deliveryCharge",
                        discount: "$couponDiscount",
                        paymentMethod: "$paymentMethod",
                        paymentStatus: "$paymentStatus",
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        status: "$status"
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                salesCount: 1,
                totalOrderAmount: 1,
                productRevenue: 1,
                totalDeliveryFees: 1,
                productDiscount: 1,
                couponDiscount: 1,
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
                                                {
                                                    $concatArrays: ["$$value", [{
                                                        date: "$$this.date",
                                                        amount: { $cond: [{ $eq: [{ $toLower: "$$this.status" }, "cancelled"] }, 0, { $cond: [{ $eq: [{ $toLower: "$$this.status" }, "returned"] }, "$$this.deliveryCharge", "$$this.amount"] }] }
                                                    }]]
                                                },
                                                {
                                                    $map: {
                                                        input: "$$value",
                                                        as: "item",
                                                        in: { $cond: [{ $eq: ["$$item.date", "$$this.date"] }, { date: "$$item.date", amount: { $add: ["$$item.amount", { $cond: [{ $eq: [{ $toLower: "$$this.status" }, "cancelled"] }, 0, { $cond: [{ $eq: [{ $toLower: "$$this.status" }, "returned"] }, "$$this.deliveryCharge", "$$this.amount"] }] }] } }, "$$item"] }
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