import userAxios from "../baseAxios";


export const fetchWalletApi = async () => {
    const { data } = await userAxios.get("/users/wallet/my-wallet");
    return data;
};

export const verifyWalletBalanceApi = async (amount) => {
    const { data } = await userAxios.post("/users/wallet/verify", { amount });
    return data;
};