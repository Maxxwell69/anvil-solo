import { bot } from "../index";
import { addpermission } from "../library/addpermission";
import { ConfigService } from "../service/config";
import adminListController from "../controller/adminList";
const { Commands } = require("../index");

export default new Commands(
  new RegExp(/^\/addactive/),
  "Start Bot",
  "addactive",
  true,
  async (msg: any) => {
    const fromId = msg.from.id;
    const chatId = msg.chat.id;
    if (fromId != chatId) {
      bot.sendMessage(msg.chat.id, `This command can only be used in DM.`, {});
      return;
    }
    const adminList = await adminListController.find();
    if (
      msg.chat.id == ConfigService.getConfig().tgBot.superAdmin ||
      adminList?.filter((item: any) => item.userId == msg.chat.id).length > 0
    ) {
      addpermission(msg);
    } else {
      bot.sendMessage(msg.chat.id, `No permission.`, {});
    }
  },
  false
);
