var express = require("express");
var router = express.Router();

const nodemailer = require("nodemailer");
const upload = require("./multer");
const path = require("path");
const fs = require("fs");

const Blog = require("../models/blogModel");
const User = require("../models/userModel");
const passport = require("passport");
const LocalStrategy = require("passport-local");

passport.use(new LocalStrategy(User.authenticate()));

router.get("/", function (req, res, next) {
    res.render("index", { title: "Homepage" });
});

// -----------------------------------------------------

router.get("/signup", function (req, res, next) {
    res.render("signup", { title: "Create Account" });
});
router.post("/signup", function (req, res, next) {
    const { username, email, password } = req.body;

    User.register({ username, email }, password)
        .then(() => {
            res.render("signin", {
                title: "Signin Account",
                message: "Registered Successfully.",
            });
        })
        .catch((err) => res.send(err));
});

//-------------------------------------------------

router.get("/signin", function (req, res, next) {
    res.render("signin", { title: "Signin Account", message: "" });
});

router.post(
    "/signin",
    passport.authenticate("local", {
        successRedirect: "/home",
        failureRedirect: "/signin",
    }),
    function (req, res, next) {}
);

// -----------------------------------------
router.get("/home", isLoggedIn, function (req, res, next) {
    Blog.find()
        .populate("author")
        .then((blogs) => {
            res.render("home", {
                title: req.user.username + " Profile",
                user: req.user,
                blogs,
            });
        });
});

// -------------------------------------------------
router.get("/signout", isLoggedIn, function (req, res, next) {
    req.logout(function () {
        res.redirect("/signin");
    });
});

// ----------------------------------------------------------------
router.get("/forgot-password", function (req, res, next) {
    res.render("forget", {
        title: "Forget Password",
        message: "",
    });
});

router.post("/forgot-password", function (req, res, next) {
    User.findOne({ email: req.body.email })
        .then((user) => {
            if (!user)
                return res.render("forget", {
                    title: "Forget Password",
                    message: "No User Found, invalid email!",
                });

            // code to send email
            // req.protocol + "://" + req.get("host") + req.originalUrl;
            const pageurl =
                req.protocol +
                "://" +
                req.get("host") +
                "/change-password/" +
                user._id;
            // -------------------Nodemailer starts----------------------
            const transport = nodemailer.createTransport({
                service: "gmail",
                host: "smtp.gmail.com",
                port: 465,
                auth: {
                    user: "ujjain7389@gmail.com",
                    pass: "fgzwnumxudfavbqo",
                },
            });

            const mailOptions = {
                from: "Rohit jaiswal <ujjain7389@gmail.com>",
                to: req.body.email,
                subject: "Password Reset Link",
                text: "Do not share this link to anyone.",
                html: `<a href=${pageurl}>Password Reset Link</a>`,
            };

            transport.sendMail(mailOptions, (err, info) => {
                if (err) return res.send(err);
                console.log(info);
                user.passwordResetToken = 1;
                user.save();
                return res.send(
                    "<h1 style='text-align:center;color: tomato; margin-top:10%'><span style='font-size:60px;'>✔️</span> <br />Email Sent! Check your inbox , <br/>check spam in case not found in inbox.</h1>"
                );
            });
        })
        .catch((err) => res.send(err));
});

router.get("/change-password/:id", function (req, res, next) {
    res.render("forgetPassword", {
        title: "Forget Password",
        id: req.params.id,
    });
});

router.post("/change-password/:id", function (req, res, next) {
    User.findById(req.params.id)
        .then((user) => {
            if (user.passwordResetToken === 1) {
                user.setPassword(req.body.password, function (err, user) {
                    user.passwordResetToken = 0;
                    user.save();
                    res.redirect("/signin");
                });
            } else {
                res.send(
                    "Link expired! <a href='/forgot-password'>Start Again</a>"
                );
            }
        })
        .catch((err) => res.send(err));
});

// ---------------------------------------------------

router.get("/reset-password", isLoggedIn, function (req, res, next) {
    res.render("reset", { title: "Reset Password" });
});

// ------------------------------------------------------------

router.post("/reset-password", function (req, res, next) {
    // reset password coding...
    req.user.changePassword(
        req.body.oldpassword,
        req.body.newpassword,
        function (err) {
            if (err) return res.send(err);
            res.redirect("/signout");
        }
    );
});

// --------------------------------------------------------------

router.get("/delete-account", isLoggedIn, function (req, res, next) {
    User.findByIdAndDelete(req.user._id)
        .then(() => {
            res.redirect("/signout");
        })
        .catch((err) => res.send(err));
});

// ------------------------------------------------------------
router.get("/settings", isLoggedIn, function (req, res, next) {
    res.render("settings", { title: "User Settings", user: req.user });
});

router.post(
    "/settings",
    isLoggedIn,
    upload.single("avatar"),
    function (req, res, next) {
        const updatedUser = {
            username: req.body.username,
            email: req.body.email,
        };

        if (req.file) {
            if (req.user.avatar !== "profile.png") {
                fs.unlinkSync(
                    path.join(
                        __dirname,
                        "..",
                        "public",
                        "uploads",
                        req.user.avatar
                    )
                );
            }
            updatedUser.avatar = req.file.filename;
        }

        User.findByIdAndUpdate(req.user._id, updatedUser)
            .then(() => {
                res.redirect("/settings");
            })
            .catch((err) => res.send(err));
    }
);

// ------------------------------------------
router.get("/write", isLoggedIn, function (req, res, next) {
    res.render("write", { title: "Write Blog" });
});

router.post(
    "/uploadFile",
    isLoggedIn,
    upload.single("blog"),
    function (req, res, next) {
        res.json({
            success: 1,
            file: {
                url:
                    req.protocol +
                    "://" +
                    req.get("host") +
                    "/uploads/" +
                    req.file.filename,
            },
        });
    }
);

router.post("/write", isLoggedIn, async function (req, res, next) {
    try {
        const newBlog = new Blog({
            author: req.user._id,
            blog: req.body.blog,
        });
        await req.user.list.push(newBlog._id);
        await req.user.save();
        await newBlog.save();
    } catch (error) {
        res.send(err);
    }
});

// ------------------------------------------
router.get("/lists", isLoggedIn, function (req, res, next) {
    req.user.populate("list").then((user) => {
        res.render("lists", { title: "Your Blogs", user, blogs: user.list });
    });
});

// -----------------------
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/signin");
}

// --------------------------------------------
router.get("/navigation", isLoggedIn, function (req, res, next) {
    res.render("navigation", { user: req.user });
});

// --------------------------------------------
router.get("/image", isLoggedIn, function (req, res, next) {
    res.render("image", { title:"View Image " });
});

// --------------------------------------------
router.get("/video", isLoggedIn, function (req, res, next) {
    res.render("video", { title:"View Image " });
});

module.exports = router;
