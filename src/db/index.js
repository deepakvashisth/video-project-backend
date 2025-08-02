import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectToDb = async () => {
  try {
    console.log(`${process.env.MONGODB_URI}/${DB_NAME}`)
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );

    console.log(
      `succesfully connected to db || host is ${connectionInstance.connection}`
    );
  } catch (error) {
    console.error("error in connecting to db ", error);
    process.exit(1);
  }
};


export default connectToDb
