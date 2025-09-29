import React from "react";
import hottoast from "react-hot-toast";
import { toast } from "react-toastify";
import config from "./config.json";
import { PublicKey, Connection } from "@solana/web3.js";

const proxy = config.backend;
const connection = new Connection(config.rpcUrl);
export const call = async (
  url: string,
  params?: any,
  headerParams?: any
): Promise<ServerResponse | null> => {
  try {
    const result = await fetch(proxy + url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headerParams },
      body: params ? JSON.stringify(params) : null,
    });
    if (result.status === 403) {
      return null;
    }
    return await result.json();
  } catch (error) {
    // showToast("error");
    console.log(error);
  }
  return null;
};

export const checkSolBalance = async (addr: string) => {
  try {
    const publickey = new PublicKey(addr);
    const balance = (await connection.getBalance(publickey)) / 1e9;
    if (balance || balance === 0) {
      const solBalance = await subBalance(balance);
      return solBalance;
    } else {
      await retryCheckSolBalance(addr);
    }
  } catch (error) {
    console.log("checkSolBalanceError: ", error);
    return null;
  }
};

export const getWalletTokenBalances = async (walletAddress: string) => {
  try {
    // Convert the wallet address into a PublicKey
    const walletPublicKey = new PublicKey(walletAddress);

    // Fetch all token accounts for the wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPublicKey,
      {
        programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      } // Token program ID
    );

    // Extract balances from each token account
    const balances = tokenAccounts.value.map((tokenAccount: any) => {
      const accountData = tokenAccount.account.data.parsed.info;
      const address = accountData.mint as string; // Token mint address
      const decimals = accountData.tokenAmount.decimals as number; // Token decimals
      const amount = accountData.tokenAmount.uiAmount as number; // Human-readable token balance

      return {
        address,
        decimals,
        amount,
      };
    });
    return balances;
  } catch (error) {
    console.error("Error fetching token balances:", error);
  }
};

const subBalance = async (text: number) => {
  const r = Number(Math.floor(text * 1e6) / 1e6);
  return r;
};
const retryCheckSolBalance = async (addr: string) => {
  try {
    const publickey = new PublicKey(addr);
    const balance = (await connection.getBalance(publickey)) / 1e9;
    if (balance || balance === 0) {
      const solBalance = await subBalance(balance);
      return solBalance;
    } else {
      return null;
    }
  } catch (error) {
    console.log("checkSolBalanceError: ", error);
    return null;
  }
};
export function convertToDate(date: any) {
  return new Date(date).toLocaleDateString();
}
export function formatNumber(number: number) {
  var SI_SYMBOL = ["", "k", "M", "G", "T", "P", "E"];
  // what tier? (determines SI symbol)
  var tier = (Math.log10(Math.abs(number)) / 3) | 0;

  // if zero, we don't need a suffix
  if (tier == 0) return number.toFixed(2);

  // get suffix and determine scale
  var suffix = SI_SYMBOL[tier];
  var scale = Math.pow(10, tier * 3);

  // scale the number
  var scaled = number / scale;
  scaled = Number(Number(scaled).toFixed(2));

  return scaled.toFixed(1) + suffix;
}

export function convertTimeToAge(inputTimeInSeconds: number) {
  const currentTimeInSeconds = Math.floor(Date.now() / 1000); // Current time in Unix timestamp format
  const elapsedTimeInSeconds = currentTimeInSeconds - inputTimeInSeconds;

  if (elapsedTimeInSeconds < 0) {
    return "Invalid time: provided time is in the future.";
  }

  const secondsInMinute = 60;
  const secondsInHour = secondsInMinute * 60;
  const secondsInDay = secondsInHour * 24;

  // Calculate the elapsed time in days, hours, minutes
  const days = Math.floor(elapsedTimeInSeconds / secondsInDay);
  const hours = Math.floor(
    (elapsedTimeInSeconds % secondsInDay) / secondsInHour
  );
  const minutes = Math.floor(
    (elapsedTimeInSeconds % secondsInHour) / secondsInMinute
  );

  let result = "";

  if (days > 0) {
    result += days + "d ";
  }

  if (hours > 0) {
    result += hours + (result ? "h " : "h ");
  }

  if (minutes > 0) {
    result += minutes + (result ? "m " : "m ");
  }

  return result.trim() || "0"; // Return '0' if no time has passed
}

export function time_ago(time: number) {
  var time_formats = [
    [60, "seconds", 1], // 60
    [120, "1 minute ago", "1 minute from now"], // 60*2
    [3600, "minutes", 60], // 60*60, 60
    [7200, "1 hour ago", "1 hour from now"], // 60*60*2
    [86400, "hours", 3600], // 60*60*24, 60*60
    [172800, "Yesterday", "Tomorrow"], // 60*60*24*2
    [604800, "days", 86400], // 60*60*24*7, 60*60*24
    [1209600, "Last week", "Next week"], // 60*60*24*7*4*2
    [2419200, "weeks", 604800], // 60*60*24*7*4, 60*60*24*7
    [4838400, "Last month", "Next month"], // 60*60*24*7*4*2
    [29030400, "months", 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
    [58060800, "Last year", "Next year"], // 60*60*24*7*4*12*2
    [2903040000, "years", 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
    [5806080000, "Last century", "Next century"], // 60*60*24*7*4*12*100*2
    [58060800000, "centuries", 2903040000], // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
  ];
  var seconds = (+new Date() - time) / 1000,
    token = "ago",
    list_choice = 1;

  if (seconds == 0) {
    return "Just now";
  }
  if (seconds < 0) {
    seconds = Math.abs(seconds);
    token = "from now";
    list_choice = 2;
  }
  var i = 0,
    format;
  while ((format = time_formats[i++]))
    if (seconds < Number(format[0])) {
      if (typeof format[2] == "string") return format[list_choice];
      else
        return Math.floor(seconds / format[2]) + " " + format[1] + " " + token;
    }
  return time;
}

export const copyToClipboard = (text: string) => {
  var textField = document.createElement("textarea");
  textField.innerText = text;
  document.body.appendChild(textField);
  textField.select();
  document.execCommand("copy");
  textField.remove();
  if (text.length > 40) {
    text = text.substring(0, 15) + "..." + text.substring(text.length - 5);
  }
  showToast("Copied");
};

export const getFileContents = (
  file: File,
  format?: "dataUri" | "binary"
): Promise<ArrayBuffer | string | null> => {
  return new Promise((resolve) => {
    let reader = new FileReader();
    reader.onloadend = (e) =>
      resolve(!!e.target?.result ? (e.target?.result as ArrayBuffer) : null);
    reader.onabort = () => resolve(null);
    reader.onerror = () => resolve(null);
    if (format === "binary") {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsDataURL(file);
    }
  });
};

export const ellipsis = (address: string, start: number = 6) => {
  if (!address || address === null) return "";
  const len = start + 7;
  return address.length > len
    ? `${address?.slice(0, start)}...${address?.slice(-4)}`
    : address;
};

export const NF = (num: number, p: number = 2) =>
  num.toLocaleString("en", { maximumFractionDigits: p });

export const validateEmail = (email: string): boolean =>
  email.match(
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  ) !== null;

export const validateUsername = (username: string): boolean =>
  username.match(/^[a-zA-Z\-\_0-9]{3,20}$/) !== null;
export const validateSlugUrl = (username: string): boolean =>
  username.match(/^[a-zA-Z\-0-9]{3,50}$/) !== null;

export const validateNumber = (number: string): boolean =>
  parseFloat(number) > 0;

export const validatePhone = (number: string): boolean =>
  /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[-\s\./0-9]*$/g.test(number);

export const validatePassword = (number: string): boolean =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$#!%*?&])[A-Za-z\d@$!%*?&#]{8,30}$/g.test(
    number
  );

export const validateUrl = (str: string): boolean => {
  var expression =
    /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
  var regex = new RegExp(expression);
  return str.match(regex) ? true : false;
};

export const showToast = (text: string) => {
  hottoast.custom(
    (t: any) => {
      return (
        <div
          className={`${"animate-enter"} flex middle center`}
          style={{
            backgroundColor: "red",
            zIndex: 100000,
            padding: "1rem",
            borderRadius: "8px",
            cursor: "pointer",
          }}
          onClick={() => {
            toast.dismiss(t.id);
          }}
        >
          <p style={{ color: "white" }}>
            <b> {text} </b>
          </p>
        </div>
      );
    },
    {
      duration: 10000,
    }
  );
};
export const Now = () => Math.round(new Date().getTime() / 1000);

export const delay = (delayTimes: number) => {
  return new Promise((resolve: any) => {
    setTimeout(() => {
      resolve(2);
    }, delayTimes);
  });
};
