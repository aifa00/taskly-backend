import { connect } from "mongoose";

async function connection() {
  try {
    await connect(process.env.MONGODB_URL as string);
  } catch (error: any) {
    console.error(error.message);
  }
}

export default connection;
