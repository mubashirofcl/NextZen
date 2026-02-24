import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import productModel from "../../admin/productManagement/product.model.js";
import variantModel from "../../admin/productManagement/variant.model.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const generateAIResponse = async (productId, userMessage, history = [], userName = "Guest") => {
    try {
        const productData = await productModel.findById(productId)
            .populate("brandId", "name")
            .populate("categoryId", "name")
            .populate("offerId", "discountValue discountType title");

        if (!productData) throw new Error("Product context not found.");

        const variants = await variantModel.find({ productId, isDeleted: false });

        const productSnapshot = {
            name: productData.name,
            brand: productData.brandId?.name || "NextZen",
            category: productData.categoryId?.name,
            description: productData.description,
            sizeType: productData.sizeType,
            highlights: productData.highlights || [],
            activeOffer: productData.offerId ? {
                title: productData.offerId.title,
                value: productData.offerId.discountValue,
                type: productData.offerId.discountType
            } : "No active offers",
            availableVariants: variants.map(v => ({
                colorName: v.color,
                hexCode: v.hex,
                inventory: v.sizes.map(s => ({
                    size: s.size,
                    stockCount: s.stock,
                    price: s.salePrice || s.originalPrice,
                    inStock: s.stock > 0
                }))
            }))
        };

        const systemInstruction = `
    You are "NextZen Style Concierge", a high-end fashion AI. 
    CONTEXT DATA: ${JSON.stringify(productSnapshot)}

    STRICT OPERATING RULES:
    1. DATA LIMIT: Only state product facts (price, stock, size) found in the CONTEXT DATA. 
    2. STYLING ASSISTANCE: You ARE allowed to give styling advice. 
       - If asked about "matching", suggest complementary colors (e.g., this item matches well with white, black, or denim).
       - If asked about "skin tone", provide inclusive, positive fashion suggestions (e.g., "This vibrant shade looks stunning on deeper skin tones").
    3. HARD REFUSAL: For technical specs NOT in context (material, wash care, weight), strictly say: "I don't have that specific detail for this product."
    4. NO HALLUCINATION: Never invent features. If the context doesn't mention "pockets," do not say it has pockets.
    5. CURRENCY: Always use Indian ₹ for prices.
    6. STOCK: Always reflect accurate stock (Available vs Depleted) from context.
    7. OFF-TOPIC: Refuse non-fashion queries (jokes, weather, etc) politely.
    8. BREVITY: Max 2-3 sentences. Stay sleek and professional.
`;

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" }, { apiVersion: 'v1' });
            const chat = model.startChat({
                history: history.slice(-4).map(msg => ({
                    role: msg.role === "user" ? "user" : "model",
                    parts: [{ text: msg.text }],
                })),
                generationConfig: { temperature: 0.1, maxOutputTokens: 250 }
            });

            const result = await chat.sendMessage(`User Question: ${userMessage}\n\nProtocol: If info is missing, say you don't know.`);
            return result.response.text().trim();

        } catch (geminiError) {
            if (geminiError.message?.includes("429") || geminiError.message?.includes("404")) {
                const completion = await groq.chat.completions.create({
                    messages: [
                        { role: "system", content: systemInstruction },
                        ...history.slice(-4).map(msg => ({ role: msg.role === "user" ? "user" : "assistant", content: msg.text })),
                        { role: "user", content: userMessage }
                    ],
                    model: "llama-3.3-70b-versatile",
                    temperature: 0.1
                });
                return completion.choices[0]?.message?.content || "I don't have that information right now.";
            }
            throw geminiError;
        }

    } catch (error) {
        console.error("Style Concierge Error:", error.message);
        return "I'm sorry, I can't access those product details right now.";
    }
};