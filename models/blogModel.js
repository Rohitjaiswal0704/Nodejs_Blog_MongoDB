const mongoose = require("mongoose");

const blogModel = new mongoose.Schema({
    blog: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Blog = mongoose.model("blog", blogModel);

module.exports = Blog;
