const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

const userModel = new mongoose.Schema({
    username: String,
    password: String,
    email: String,
    avatar: {
        type: String,
        default: "profile.png",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    list: [{ type: mongoose.Schema.Types.ObjectId, ref: "blog" }],
    bookmark: [{ type: mongoose.Schema.Types.ObjectId, ref: "blog" }],
    passwordResetToken: 0,
});

userModel.plugin(plm);
const User = mongoose.model("user", userModel);

module.exports = User;
