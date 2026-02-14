import orderModel from '../../user/order/order.model.js';

export const getAdminOrdersRepository = async ({ status, search, page = 1, limit = 6 }) => {
    const skip = (page - 1) * limit;

    const query = {};

    if (status && status !== 'all') {
        if (status === 'returns') {
            query['items.status'] = { 
                $in: ['Return Requested', 'Return Approved', 'Return Rejected', 'Returned'] 
            };
        } else {
            query.status = status;
        }
    }

    if (search) {
        query.$and = [

            ...(query['items.status'] ? [{ 'items.status': query['items.status'] }] : []),
            ...(query.status ? [{ status: query.status }] : []),

            {
                $or: [
                    { orderNumber: { $regex: search, $options: 'i' } },
                   
                ]
            }
        ];
 
        delete query['items.status'];
        delete query.status;
    }

    const [orders, totalCount] = await Promise.all([
        orderModel.find(query)
            .populate('userId', 'name email')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        orderModel.countDocuments(query)
    ]);

    return { orders, totalCount };
};


export const getOrderDetailRepository = async (orderId) => {
    return await orderModel.findById(orderId)
        .populate('userId', 'name email phone')
        .populate('addressId')
        .populate({
            path: 'items.productId',
            select: 'name thumbnail images price salePrice mrp regularPrice originalPrice' 
        })
        .populate({
            path: 'items.variantId',
            select: 'images size color price salePrice mrp' 
        })
        .lean();
};