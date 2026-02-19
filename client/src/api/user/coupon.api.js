import userAxios from '../baseAxioss';

export const validateCouponApi = async (data) => {
    return await userAxios.post('/users/coupons/validate', data);
};

export const fetchAvailableCouponsApi = async () => {
    return await userAxios.get('/users/coupons/available');
};