import app from "./app.js";
import 'dotenv/config'
import connectDB from "./config/mongoose.js";

connectDB()

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`servers is running on port ${PORT}`);
});
