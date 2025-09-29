import fs from "fs";
import path from "path";
import { callBackHandler } from "./callback";
import TelegramBot from "node-telegram-bot-api";
import { removeAnswerCallback } from "./library";
import express from "express";
import router from "./router";
import { ConfigService } from "./service/config";

export const bot = new TelegramBot(ConfigService.getConfig().tgBot.token, {
  polling: true,
});

export let botUsername: string;

(async () => {
  const me = await bot.getMe();
  botUsername = me.username!;
  console.log(`Bot username is @${botUsername}`);
})();

export let answerCallbacks = {} as any;

// Initialize Express app
const app = express();
const port = 3069;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", router);

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  }
);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

bot.on("message", function (message) {
  var callback = answerCallbacks[message.chat.id];
  const msgStr = message.text;
  if (msgStr == "/cancel" && callback) {
    delete answerCallbacks[message.chat.id];
    return;
  }
  if (callback) {
    delete answerCallbacks[message.chat.id];
    return callback(message);
  }
});
bot.on("polling_error", console.log);

async function loadEvents() {
  bot.on("callback_query", async function onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    callBackHandler(msg, action);
  });
}

async function loadCommands() {
  let commands = [] as any;
  for (const vo of fs.readdirSync(__dirname + "/command")) {
    if (path.extname(vo) === ".ts" || path.extname(vo) === ".js") {
      if (!fs.lstatSync(__dirname + "/command/" + vo).isDirectory()) {
        await import("./command/" + vo).then((module) => {
          const command = module.default;
          bot.onText(command.reg, (msg) => {
            command.fn(msg);
            removeAnswerCallback(msg.chat);
          });
          if (command.isCommands && command.status) {
            commands.push({
              command: command.cmd,
              description: command.descript,
            });
          }

          if (command.cb) {
            bot.on("callback_query", command.cb);
          }
        });
      }
    }
  }
  bot
    .setMyCommands(commands)
    .then((res) => {
      console.log(
        `Register bot menu commands${res ? "success" : "fail"} ${
          commands.length
        }个`
      );
    })
    .catch((err) => {
      console.log("The menu command for registering bot is wrong", err.message);
    });
}

export class Commands {
  constructor(
    reg: RegExp,
    descript: string,
    cmd: string,
    isCommands: boolean,
    fn: Function,
    status: boolean,
    cb: Function
  ) {
    this.reg = reg;
    this.descript = descript;
    this.cmd = cmd;
    this.isCommands = isCommands;
    this.fn = fn;
    this.cb = cb;
    this.status = status;
  }
  reg: any;
  descript: string;
  cmd: string;
  isCommands: boolean;
  fn: Function;
  status: boolean;
  cb: Function;
}

export const initBot = () => {
  loadCommands();
  loadEvents();
};
