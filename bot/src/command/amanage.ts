import { bot } from "../index";
import { ConfigService } from "../service/config";
import adminListController from "../controller/adminList";
import { adminStartHandler } from "../library/adminStartHandler";

const { Commands } = require("../index");

export default new Commands(
  new RegExp(/^\/manage/),
  "Manage Bot",
  "manage",
  true,
  async (msg: any) => {
    const adminList = await adminListController.find();
    if (
      msg.chat.id == ConfigService.getConfig().tgBot.superAdmin ||
      adminList?.filter((item: any) => item.userId == msg.chat.id).length > 0
    ) {
      adminStartHandler(msg);
    } else {
      bot.sendMessage(msg.chat.id, `No permission.`, {});
    }
  },
  false
);
