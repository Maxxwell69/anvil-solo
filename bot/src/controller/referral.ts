const { Referral } = require("../db/model");

const findOne = async (props: any) => {
  try {
    const result = await Referral.findOne(props);
    return result;
  } catch (error) {
    throw new Error("Failed to find referral");
  }
};
const find = async () => {
  try {
    const result = await Referral.find();
    return result;
  } catch (error) {
    throw new Error("Failed to find referral list");
  }
};
const create = async (props: any) => {
  try {
    const { userId } = props;
    const _result = await Referral.findOne({
      userId,
    });
    if (_result) {
      return {
        status: 201,
        msg: `Fee is set already.`,
      };
    } else {
      const newFeeData = new Referral(props);
      const result = await newFeeData.save();
      if (result) {
        return { status: 200, msg: `Fee months is set.` };
      } else {
        return {
          status: 201,
          msg: `Please try again later due to network overload`,
        };
      }
    }
  } catch (error) {
    console.log("Failed to create feedata");
    return {
      status: 500,
      msg: `Please try again later due to network overload.`,
    };
  }
};

const updateOne = async (props: any) => {
  try {
    const result = await Referral.findOneAndUpdate(
      { ...props.filter },
      { $set: props.update },
      { new: true, upsert: true }
    );

    if (!result) {
      return {
        status: 404,
        msg: "User referral record not found",
      };
    }

    return {
      status: 200,
      data: result,
      msg: "Referral information updated successfully",
    };
  } catch (error: any) {
    console.error("Update error:", error.message);
    return {
      status: 500,
      msg: "Failed to update referral information",
      error: error.message,
    };
  }
};

const deleteOne = async (id: string) => {
  try {
    console.log("id: ", id);
    const result = await Referral.findByIdAndDelete(id);
    if (result) {
      return { status: 200, msg: `Fee is deleted.` };
    } else {
      return {
        status: 201,
        msg: `Please try again later due to network overload`,
      };
    }
  } catch (error) {
    console.log("Failed to delete feedata");
    return {
      status: 500,
      msg: `Please try again later due to network overload.`,
    };
  }
};

export default {
  find,
  findOne,
  create,
  updateOne,
  deleteOne,
};
