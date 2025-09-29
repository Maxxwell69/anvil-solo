const router = require("express").Router();
const adminController = require("../controllers/adminController");
const referralController = require("../controllers/referral");

router.post("/tokenlist", async (req: any, res: any) => {
  const data = req.body;
  const response = await adminController.getTokenList(data);

  return res.send(response);
});

router.post("/tradesList", async (req: any, res: any) => {
  const data = req.body;
  const response = await adminController.getTradesList(data);
  return res.send(response);
});

router.post("/getFee", async (req: any, res: any) => {
  const data = req.body;
  const response = await adminController.getFeeData(data);
  return res.send(response);
});

router.post("/userlist", async (req: any, res: any) => {
  const data = req.body;
  const response = await adminController.getUserList(data);
  return res.send(response);
});

router.post("/login", async (req: any, res: any) => {
  const id = req.body.email;
  const password = req.body.password;
  const response = await adminController.login(id, password);
  return res.send(response);
});
router.post("/getBalance", async (req: any, res: any) => {
  const userId = req.body.userId;
  const response = await adminController.getBalance(userId);
  return res.send(response);
});

router.post("/userdetail", async (req: any, res: any) => {
  const userId = req.body.userId;
  const response = await adminController.getUserDetail(userId);
  return res.send(response);
});

router.post("/updateBotFee", async (req: any, res: any) => {
  const { userId, fee } = req.body;
  const response = await adminController.updateBotFee({ userId, fee });

  return res.send(response);
});

router.post("/updateReferralFee", async (req: any, res: any) => {
  const { userId, fee } = req.body;

  const response = await adminController.updateReferralFee({ userId, fee });

  return res.send(response);
});

//toggleReferral
router.post("/toggleReferral", async (req: any, res: any) => {
  const { userId, enabled } = req.body;

  const response = await adminController.toggleReferral(userId, enabled);

  return res.send(response);
});

//toggleStatus
router.post("/getReferralStatus", async (req: any, res: any) => {
  const { userId } = req.body;
  const response = await adminController.toggleStatus(userId);
  return res.send(response);
});

//referralInfo
router.post("/getReferralInfo", async (req: any, res: any) => {
  const { userId } = req.body;
  const response = await adminController.referralInfo(userId);
  return res.send(response);
});

router.post("/getReferraluser", async (req: any, res: any) => {
  const { userId } = req.body;
  const response = await referralController.default.findOnereferralBy(userId);
  return res.send(response);
});

router.post("/updateReferrerId", async (req: any, res: any) => {
  const data = req.body;
  const response = await referralController.default.updateOneReferralBy(data);
  return res.send(response);
});

//botFeeInfo
router.post("/getBotFee", async (req: any, res: any) => {
  const { userId } = req.body;
  const response = await adminController.botFeeInfo(userId);
  return res.send(response);
});

//getUserIdsByReferrerId
router.post("/getUserIdsByReferrerId", async (req: any, res: any) => {
  const { userId } = req.body;
  const response = await adminController.getUserIdsByReferrerId(userId);
  return res.send(response);
});

router.all("/*", async (req: any, res: any) => {
  return res.send({ error: 404, result: { msg: "404" } });
});

module.exports = router;
