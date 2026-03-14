import Wallet from './wallet.model.js';

export const getWalletByUserId = async (userId) => {
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
        wallet = await Wallet.create({ userId, balance: 0, transactions: [] });
    }
    return wallet;
};

export const updateWalletBalance = async (userId, amount, type, description, orderId = null) => {

    const updateQuery = type === 'credit'
        ? { $inc: { balance: amount } }
        : { $inc: { balance: -amount } };

    let safeDescription = "Terminal Transaction";

    if (description && !description.toLowerCase().includes('undefined') && description.trim() !== "") {
        safeDescription = description;
    } else {

        if (type === 'credit') {
            safeDescription = "Refund Credited to Wallet";
        } else {
            safeDescription = "Debit for Order Purchase";
        }
    }

    return await Wallet.findOneAndUpdate(
        { userId },
        {
            ...updateQuery,
            $push: {
                transactions: {
                    amount,
                    type,
                    description: safeDescription,
                    orderId,
                    date: new Date()
                }
            }
        },
        {
            upsert: true,
            new: true,
            runValidators: true
        }
    );
};