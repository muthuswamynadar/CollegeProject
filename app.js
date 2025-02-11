// Import Dependencies
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const ejsMate = require("ejs-mate");
const multer = require('multer');

const app = express();
const PORT = 3000;

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Database Connection
mongoose.connect('mongodb://localhost:27017/linktree_clone', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Define User Schema
const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: '/uploads/default.png' },
    bio: { type: String, default: '' },
    socialLinks: {
        instagram: { type: String, default: '' },
        twitter: { type: String, default: '' },
        facebook: { type: String, default: '' }
    },
    links: [{ title: String, url: String, image: String, description: String }]
});
const User = mongoose.model('User', UserSchema);

// Middleware
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
}));

// Home Route
app.get('/', (req, res) => res.render('index', { title: 'Home' }));

// Register Page
app.get('/a/register', (req, res) => res.render('register', { title: 'Register' }));

app.post('/register', upload.single('profileImage'), async (req, res) => {
    const { username, email, password, bio, instagram, twitter, facebook } = req.body;
    let profileImage = req.file ? '/uploads/' + req.file.filename : '/uploads/default.png';

    try {
        if (await User.findOne({ username })) return res.send('Username is taken. Choose another.');

        const newUser = new User({
            username,
            email,
            password: await bcrypt.hash(password, 10),
            profileImage,
            bio,
            socialLinks: { instagram, twitter, facebook }
        });

        await newUser.save();
        res.redirect('/a/login');
    } catch (error) {
        console.error(error);
        return res.render('login', { title: 'Login', error: 'Error registering user' });
    }
});

// Profile Update
app.get('/a/profile', async (req, res) => {
    if (!req.session.user) return res.redirect('/a/login');

    const user = await User.findOne({ email: req.session.user.email });
    res.render('profile', { title: 'Edit Profile', user });
});

app.post('/update-profile', upload.single('profileImage'), async (req, res) => {
    if (!req.session.user) return res.redirect('/a/login');

    const { bio, instagram, twitter, facebook } = req.body;
    let profileImage = req.file ? '/uploads/' + req.file.filename : req.session.user.profileImage;

    try {
        const updatedUser = await User.findOneAndUpdate(
            { email: req.session.user.email },
            { bio, profileImage, socialLinks: { instagram, twitter, facebook } },
            { new: true }
        );

        req.session.user = updatedUser; // Update session with new data
        res.redirect('/a/profile');
    } catch (error) {
        console.error(error);
        res.send('Error updating profile');
    }
});

// Login Page
app.get('/a/login', (req, res) => res.render('login', { title: 'Login' }));

// Login Logic
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.render('login', { title: 'Login', error: 'Invalid credentials' });
    }

    req.session.user = user;
    res.redirect('/a/dashboard');
});

// Dashboard
app.get('/a/dashboard', async (req, res) => {
    if (!req.session.user) return res.redirect('/a/login');

    const user = await User.findOne({ email: req.session.user.email });
    res.render('dashboard', { title: 'Dashboard', user });
});

// Add Link
app.post('/add-link', async (req, res) => {
    if (!req.session.user) return res.redirect('/a/login');

    const { title, url, image, description } = req.body;
    const user = await User.findOne({ email: req.session.user.email });

    user.links.push({ title, url, image, description });
    await user.save();

    res.redirect('/a/dashboard');
});

// Update Link
app.post('/update-link/:index', async (req, res) => {
    if (!req.session.user) return res.redirect('/a/login');

    const { index } = req.params;
    const { title, url, image, description } = req.body;

    try {
        const user = await User.findOne({ email: req.session.user.email });

        if (!user || !user.links[index]) return res.status(404).send("Link not found");

        Object.assign(user.links[index], { title, url, image, description });

        await user.save();
        res.redirect('/a/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

// Delete Link
app.post('/delete-link/:index', async (req, res) => {
    if (!req.session.user) return res.redirect('/a/login');

    try {
        const user = await User.findOne({ email: req.session.user.email });

        if (!user || user.links.length <= req.params.index) return res.status(404).send("Link not found");

        user.links.splice(req.params.index, 1);
        await user.save();
        res.redirect("/a/dashboard");
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while deleting the link.");
    }
});

// Logout
app.get('/a/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

// User Profile Page
app.get('/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).send("User not found");

        res.render("userProfile", { user, title: "User Profile" });
    } catch (error) {
        res.status(500).send("Server Error");
    }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
