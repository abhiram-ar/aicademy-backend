import app from "./app.ts";
import 'dotenv/config'
import connectDB from "./config/mongoose.ts";

connectDB()


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`servers is running on port ${PORT}`);
});
