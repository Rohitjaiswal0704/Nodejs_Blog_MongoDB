const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
mongoose
    .connect("mongodb://127.0.0.1:27017/pp100")
    .then(() => console.log("connected!"))
    .catch((err) => console.log(err.message));
