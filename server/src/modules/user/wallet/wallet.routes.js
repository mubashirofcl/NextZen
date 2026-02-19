import express from 'express';
import * as walletController from './wallet.controller.js';
import userAuth from '../../../middlewares/userAuth.middleware.js';

const router = express.Router();

router.get('/my-wallet', userAuth, walletController.getMyWallet);
router.post('/add-money', userAuth, walletController.addMoney); 

export default router;