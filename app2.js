const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const app = express();

mongoose.connect("mongodb://localhost:27017/linktreeDemo", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    links: [
        {
            title: String,
            url: String,
            image: String,
            description: String,
        },
    ],
});

const User = mongoose.model("User", UserSchema);

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: "secret", resave: false, saveUninitialized: true }));

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.redirect("/login");
}

// --- LOGIN & REGISTER ROUTES ---
app.get("/login", (req, res) => {
    res.render("login", { title: "Login", error: null });
});

app.get("/register", (req, res) => res.render("register", { title: 'Register', error: null }));

app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, links: [] });
        await user.save();
        req.session.userId = user._id;
        res.redirect("/dashboard");
    } catch (error) {
        res.render("register", { title: 'Register', error: "Username already exists or invalid data." });
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.render("login", { title: "Login", error: "User not found." });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.render("login", { title: "Login", error: "Invalid password." });
        }
        req.session.userId = user._id;
        res.redirect("/dashboard");
    } catch (error) {
        res.render("login", { title: "Login", error: "An error occurred during login." });
    }
});

// --- USER DASHBOARD ---
app.get("/dashboard", isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        res.render("dashboard", { user });
    } catch (error) {
        res.status(500).send("An error occurred while fetching the dashboard.");
    }
});

// --- ADD LINK ---
app.post("/add-link", isAuthenticated, async (req, res) => {
    const { title, url, image, description } = req.body;
    try {
        await User.findByIdAndUpdate(req.session.userId, {
            $push: { links: { title, url, image, description } },
        });
        res.redirect("/dashboard");
    } catch (error) {
        res.status(500).send("An error occurred while adding the link.");
    }
});

// --- DELETE LINK ---
app.post("/delete-link/:index", isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        user.links.splice(req.params.index, 1);
        await user.save();
        res.redirect("/dashboard");
    } catch (error) {
        res.status(500).send("An error occurred while deleting the link.");
    }
});

// --- UPDATE LINK ---
app.post("/update-link/:index", isAuthenticated, async (req, res) => {
    const { title, url, image, description } = req.body;
    try {
        const user = await User.findById(req.session.userId);
        user.links[req.params.index] = { title, url, image, description };
        await user.save();
        res.redirect("/dashboard");
    } catch (error) {
        res.status(500).send("An error occurred while updating the link.");
    }
});

// --- USER PROFILE PAGE ---
app.get("/:username", async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).send("User not found");
        res.render("userProfile", { user });
    } catch (error) {
        res.status(500).send("An error occurred while fetching the user profile.");
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));