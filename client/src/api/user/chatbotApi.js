import userAxios from '../baseAxios';

export const askStyleAssistant = async (productId, message, history) => {
    const { data } = await userAxios.post('/user/chatbot/ask', {
        productId,
        message,
        history
    });
    return data;
};