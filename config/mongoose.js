import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connect = await mongoose.connect(process.env.MONGODB_CONNECTION_STRING)
        console.log(`Database connected: ${connect.connection.host} ${connect.connection.name}`)
    } catch (error) {
       console.error("failed connecting to Database");
       console.log(error) 

       //try reconnect
       console.log(`Trying to reconnect-DB...`);
       setTimeout(connectDB, 5000)
    }
}

export default connectDB