import express from "express";
import walletController from "../controller/wallet";
import feeSettingController from "../controller/feeSetting";
import adminSettingController from "../controller/adminSetting";
import tokenSettingController from "../controller/tokenSetting";
import userListController from "../controller/userList";

const router = express.Router();

// Wallet routes
router.get("/wallet", async (req, res) => {
  try {
    const result = await walletController.find();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch wallet info" });
  }
});

router.post("/wallet", async (req, res) => {
  try {
    const { userId, publicKey, privateKey } = req.body;
    const result = await walletController.create(userId, publicKey, privateKey);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to create wallet" });
  }
});

// Fee Setting routes
router.post("/fee-setting", async (req, res) => {
  try {
    const result = await feeSettingController.create(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to create fee setting" });
  }
});

// Admin Setting routes
router.get("/admin-setting", async (req, res) => {
  try {
    const result = await adminSettingController.find();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch admin settings" });
  }
});

// Token Setting routes
router.get("/token-setting", async (req, res) => {
  try {
    const result = await tokenSettingController.findOne(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch token settings" });
  }
});

// User List routes
router.post("/user", async (req, res) => {
  try {
    const result = await userListController.create(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.get("/user", async (req, res) => {
  try {
    const result = await userListController.findOne(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user info" });
  }
});

export default router;