const { UserList } = require("../db/model");

const create = async (data: any) => {
  try {
    const user = await UserList.findOne({ userId: data.userId });
    if (user) {
      return { status: 201, msg: "User exist already." };;
    } else {
      const newUser = new UserList(data);
      await newUser.save();
      return { status: 200, msg: "User added" };
    }
  } catch (error) {
    throw new Error("Failed to create userListInfo");
  }
};

const getCount = async () => {
  const userCount = (await UserList.find().countDocuments()) || 0;
  return userCount;
}

const findOne = async (props: any) => {
  try {
    const { filter } = props;
    if (!filter.userId) {
      throw new Error('userId is required');
    }
    const result = await UserList.findOne(filter);
    if (!result) {
      return { msg: 'User not found' };
    }
    return result;
  } catch (error) {
    console.error('Error in findOne:', error);
    throw new Error(`Failed to find user: ${error}`);
  }
};

const exists = async (props: any) => {
  try {
    const { filter } = props;
    if (!filter.userId) {
      throw new Error('userId is required');
    }
    const result = await UserList.findOne(filter);
    if (!result) {
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error in findOne:', error);
    throw new Error(`Failed to find user: ${error}`);
  }
};

const find = async () => {
  try {
    const result = await UserList.find();
    return result;
  } catch (error) {
    throw new Error(`Failed to find userList`);
  }
};

const updateOne = async (data: any) => {
  try {
    const result = await UserList.findOne({ userId: data.userId });
    if (result) {
      const r = await UserList.findOneAndUpdate(
        { userId: data.userId },
        { $set: data },
        { new: true }
      );
      if (r) {
        return { msg: `Permission added successfully` };
      } else {
        return { msg: `Failed to add permission` };
      }
    } else {
      return { msg: `User not found` };
    }
  } catch (error) {
    throw new Error(`Failed to add permission`);
  }
};

export default {
  getCount,
  exists,
  create,
  updateOne,
  findOne,
  find,
};
