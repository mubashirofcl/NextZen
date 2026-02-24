import express from 'express';
import * as chatbotController from './chatbot.controller.js';
import userAuth from "../../../middlewares/userAuth.middleware.js";

const router = express.Router();


router.post("/ask", userAuth, chatbotController.getChatbotResponse);

export default router;