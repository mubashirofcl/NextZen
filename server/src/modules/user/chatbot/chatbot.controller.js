import * as chatbotService from "./chatbot.service.js";

export const getChatbotResponse = async (req, res) => {
    try {
        const { productId, message, history } = req.body;
        const userName = req.user?.name || "Guest";

        if (!productId || !message) {
            return res.status(400).json({ success: false, message: "Missing data." });
        }

        const reply = await chatbotService.generateAIResponse(
            productId,
            message,
            history || [],
            userName
        );

        res.status(200).json({ success: true, reply });
    } catch (error) {
        if (error.message?.includes("429")) {
            return res.status(200).json({
                success: true,
                reply: "The Style Concierge is currently handling many requests. Please take a 60-second break! ☕"
            });
        }
        
        res.status(500).json({
            success: false,
            reply: "Neural link flickered. Please try again shortly."
        });
    }
};