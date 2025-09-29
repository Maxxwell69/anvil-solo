const { Swap, Wallet } = require("../db/model");
import mongoose from "mongoose";
import { checkMongoHealth } from "../utils/dbHealthCheck";
const findOne = async (props: any) => {
  const { filter } = props;
  try {
    const result = await Swap.find(filter);
    return { status: 200, data: result };
  } catch (error) {
    return {
      status: 500,
      message: `Please try again.`,
    };
  }
};

const swapInfo = async () => {
  try {
    const result = await Swap.aggregate([
      {
        $lookup: {
          from: "wallets",
          let: { walletIdStr: "$wallet_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", { $toObjectId: "$$walletIdStr" }] },
              },
            },
          ],
          as: "swapDetails",
        },
      },
    ]);
    return { status: 200, data: result };
  } catch (error) {
    throw new Error("Failed to find swapInfo");
  }
};

const create = async (tokenInfo: any) => {
  try {
    const newSwap = new Swap(tokenInfo);

    const newSwapSave = await newSwap.save();
    if (newSwapSave) {
      return {
        status: 200,
        message: "Swap created successfully",
        data: newSwapSave,
      };
    }
  } catch (error) {
    console.log("Failed to create swapInfo", error);
  }
};

const updateOne = async (props: any) => {
  try {
    const result = await Swap.findOneAndUpdate(
      { _id: props._id },
      { $set: props },
      { new: true }
    );
    if (result) {
      return {
        status: 200,
        message: "Swap updated successfully",
        data: result,
      };
    } else {
      return { status: 404, message: "Swap not found" };
    }
  } catch (error) {
    throw new Error("Failed to update swapInfo");
  }
};

const swapUpdate = async (props: any) => {
  try {
    if (!props || !props._id) {
      return { status: 400, message: "Invalid update parameters" };
    }

    // Check MongoDB connection
    const dbStatus = await checkMongoHealth();
    if (dbStatus !== "Connected") {
      return { 
        status: 503, 
        message: "Database service unavailable",
        details: `Current status: ${dbStatus}`
      };
    }

    const result = await Swap.findOneAndUpdate(
      { _id: props._id },
      { $set: props },
      { 
        new: true,
        maxTimeMS: 5000,
        runValidators: true
      }
    );

    if (!result) {
      return { status: 404, message: "Swap not found" };
    }

    return {
      status: 200,
      message: "Swap updated successfully",
      data: result,
    };

  } catch (error) {
    console.error("Swap update error:", error);
    console.error("Update props:", props);

    if (error instanceof mongoose.Error.ValidationError) {
      return { 
        status: 400, 
        message: "Invalid swap data",
        errors: Object.values(error.errors).map(err => err.message)
      };
    }

    if (error instanceof mongoose.Error.CastError) {
      return { 
        status: 400, 
        message: "Invalid ID format" 
      };
    }

    return {
      status: 500,
      message: "Failed to update swap",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

/*const swapUpdate = async (props: any) => {
  
  try {
    if (!props || !props._id) {
      return { status: 400, message: "Invalid update parameters" };
    }

    // Check MongoDB connection
    const dbStatus = await checkMongoHealth();
    if (dbStatus !== "Connected") {
      return { 
        status: 503, 
        message: "Database service unavailable",
        details: `Current status: ${dbStatus}`
      };
    }


    const result = await Swap.findOneAndUpdate(
      { _id: props._id },
      { $set: props },
      { new: true }
    );

    if (result) {
      return {
        status: 200,
        message: "Swap updated successfully",
        data: result,
      };
    } else {
      return { status: 404, message: "Swap not found" };
    }
  } catch (error) {
    console.error("Swap update error:", error);
    console.error("Swap update input props:", props);
    throw new Error(`Failed to update swapInfo: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; */

const deleteOne = async (props: any) => {
  try {
    const { filter } = props;
    const result = await Swap.deleteOne(filter);
    return result;
  } catch (error) {
    throw new Error("Failed to delete swapInfo");
  }
};
const deleteMany = async (props: any) => {
  try {
    const { filter } = props;
    const result = await Swap.deleteMany(filter);
    return result;
  } catch (error) {
    throw new Error("Failed to delete swapInfo");
  }
};

export default {
  findOne,
  create,
  deleteOne,
  swapInfo,
  updateOne,
  deleteMany,
  swapUpdate,
};
