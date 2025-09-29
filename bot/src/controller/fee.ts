const { Fee } = require("../db/model");

const findOne = async (props: any) => {
    try {
        const result = await Fee.findOne(props);
        return result;
    }catch(error){
        throw new Error("Failed to find feeInfo");
    }
}

const find = async () => {
    try {
        const result = await Fee.find();
        return result;
    }catch(error){
        throw new Error("Failed to find fee list");
    }
}

const create = async (props: any) => {
    try {
        const _result = await Fee.findOne({ userId: props.userId });
        if (_result) {
            return {
                status: 201,
                msg: `Fee is already set for this user.`
            };
        }
        const newFee = new Fee(props);
        const result = await newFee.save();
        if (result) {
            return { status: 200, msg: `Fee is set successfully.` };
        } else {
            return {
                status: 201,
                msg: `Please try again later due to network overload`
            };
        }
    }catch(error){
        console.log("Failed to create fee");
        return {
            status: 500,
            msg: `Please try again later due to network overload.`
        };
    }
}

const updateOne = async (props: any) => {
    try {
        const result = await Fee.findOneAndUpdate(
            { userId: props.userId },
            { $set: { fee: props.fee } },
            { new: true }
        );
        if (result) {
            return { status: 200, msg: `Fee is updated successfully.` };
        } else {
            return {
                status: 201,
                msg: `User fee not found or update failed`
            };
        }
    }catch(error){
        console.log("Failed to update fee");
        return {
            status: 500,
            msg: `Please try again later due to network overload.`
        };
    }
}

export default {
    find,
    findOne,
    create,
    updateOne
}