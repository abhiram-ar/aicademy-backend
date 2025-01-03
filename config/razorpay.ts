import Razorpay from "razorpay";
import "dotenv/config";

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID as string,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default razorpayInstance
