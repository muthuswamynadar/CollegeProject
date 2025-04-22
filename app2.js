// Import Dependencies
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const ejsMate = require("ejs-mate");
const multer = require('multer');
const {Resend} = require('resend');




const resend = new Resend('re_cMVKEiZY_95eVDtUDWr64wJDp9WmAy9Tv');



const app = express();
const PORT = 3000;

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });



const linkStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/links/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const uploadLink = multer({ storage: linkStorage });

// Database Connection
mongoose.connect('mongodb+srv://zxcvbnmilu360:se06qbcRAJCTFerh@cluster0.ibwjb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));
// mongoose.connect('mongodb://localhost:27017/Linktree_Demo', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// }).then(() => console.log('MongoDB Connected'))
//   .catch(err => console.log(err));









//   se06qbcRAJCTFerh
// se06qbcRAJCTFerh
// Define User Schema

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: '/uploads/default.png' },
    bio: { type: String, default: '' },
    socialLinks: {
        instagram: { type: String, default: 'https://www.instagram.com/' },
        twitter: { type: String, default: 'https://x.com/' },
        facebook: { type: String, default: 'https://facebook.com/' }
    },
    number: { type: Number, default: 0 },
    links: [{ 
        title: String, 
        url: String, 
        image: String, 
        description: String, 
        clicks: { type: Number, default: 0 },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' } // Added approval status
    }],
    profileViews: { type: Number, default: 0 }, // Track profile visits
    role: { type: String, enum: ['user', 'admin'], default: 'user' }, // Define user/admin role
    themeColor: { type: String, default: "linear-gradient(to bottom, #ffffff, #ffffff)" }

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

// app.post('/register', upload.single('profileImage'), async (req, res) => {
//     const { username, email, password, bio, instagram, twitter, facebook } = req.body;
//     let profileImage = req.file ? '/uploads/' + req.file.filename : '/uploads/default.png';

//     try {
//         if (await User.findOne({ username })) return res.send('Username is taken. Choose another.');

//         const newUser = new User({
//             username,
//             email,
//             password: await bcrypt.hash(password, 10),
//             profileImage,
//             bio,
//             socialLinks: { instagram, twitter, facebook }
//         });

//         await newUser.save();
//         res.redirect('/a/login');
//     } catch (error) {
//         console.error(error);
//         return res.render('login', { title: 'Login', error: 'Error registering user' });
//     }
// });



// Register route

app.post('/register', upload.single('profileImage'), async (req, res) => {
    console.log("Received registration request:", req.body);

    const { username, email, password, bio, instagram, number, twitter, facebook } = req.body;
    let profileImage = req.file ? '/uploads/' + req.file.filename : '/uploads/default.png';

    try {
        // Check if username or email already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            console.log("User already exists:", existingUser);
            return res.redirect('/a/register?error=Username or email already taken');
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Assign role (Admin for a specific email)
        const role = (email === "admin@example.com") ? "admin" : "user";

        // Create a new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            profileImage,
            bio,
            socialLinks: { instagram, twitter, facebook },
            number,
            role
        });

        await newUser.save();
        console.log("User registered successfully:", newUser);

        // Send a welcome email (optional)
        (async function () {
            try {
                const { data, error } = await resend.emails.send({
                    from: 'SM-Links <onboarding@resend.dev>',
                    to: 'zxcvbnmilu360@gmail.com',
                    subject: 'Welcome to Our Platform!',
                    html: `<h3>Hello ${username},</h3><p>Welcome to our platform!</p><p>Best regards,<br>SM-Links Team</p>`,
                });

                if (error) {
                    console.error("Email error:", error);
                } else {
                    console.log("Email sent:", data);
                }
            } catch (emailError) {
                console.error("Error sending email:", emailError);
            }
        })();

        res.redirect('/a/login?success=Account created. Please login.');
    } catch (error) {
        console.error("Registration error:", error);
        res.redirect('/a/register?error=Error registering user');
    }
});







// Profile Update
app.get('/a/profile', async (req, res) => {
    if (!req.session.user) return res.redirect('/a/login');

    const user = await User.findOne({ email: req.session.user.email });
    res.render('profile', { title: 'Edit Profile', user });
});





// app.post('/update-profile', upload.single('profileImage'), async (req, res) => {
//     if (!req.session.user) return res.redirect('/a/login');

//     const { bio, instagram, twitter, facebook,themeColor} = req.body;
//     let profileImage = req.file ? '/uploads/' + req.file.filename : req.session.user.profileImage;

//     try {
//         const updatedUser = await User.findOneAndUpdate(
//             { email: req.session.user.email },
//             { bio, profileImage, socialLinks: { instagram, twitter, facebook },themeColor },
//             { new: true }
//         );

//         req.session.user = updatedUser; // Update session with new data
//         res.redirect('/a/profile?m=Profile Updated successfully');
//     } catch (error) {
//         console.error(error);
//         res.send('Error updating profile');
//     }
// });


app.post('/update-profile',  upload.single('profileImage'),async(req, res) => {
    // Log the session to ensure user is authenticated
    console.log(" user is register update "+req.session.user);

    const { bio, instagram, twitter, facebook, themeColor, startColor, endColor } = req.body;
    let profileImage = req.file ? '/uploads/' + req.file.filename : req.session.user.profileImage;

    let updatedThemeColor = themeColor;
    if (themeColor === 'custom') {
        updatedThemeColor = `linear-gradient(to bottom, ${startColor}, ${endColor})`;
    }




    try {
                const updatedUser = await User.findOneAndUpdate(
                    { email: req.session.user.email },
                    {
                                themeColor: updatedThemeColor,
                                startColor: startColor,
                                endColor: endColor,
                                bio: bio,
                                socialLinks: {
                                    instagram: instagram,
                                    twitter: twitter,
                                    facebook: facebook,
                                },
                                profileImage: profileImage || req.session.user.profileImage, // Use session for profileImage
                            }, { new: true })
        
                req.session.user = updatedUser; // Update session with new data
                res.redirect('/a/profile?m=Profile Updated successfully');
            } catch (error) {
                console.error(error);
                res.send('Error updating profile');
            }











    // Make sure email is correctly passed from session
//    await User.findOneAndUpdate({ email: req.session.user.email }, {
//         themeColor: updatedThemeColor,
//         startColor: startColor,
//         endColor: endColor,
//         bio: bio,
//         socialLinks: {
//             instagram: instagram,
//             twitter: twitter,
//             facebook: facebook,
//         },
//         profileImage: profileImage || req.session.user.profileImage, // Use session for profileImage
//     }, { new: true })
//     .then(user => {
//         if (!user) {
//             return res.status(404).send('User not found');
//         }
//         res.redirect(`/profile?m=Profile updated successfully`);
//     })
//     .catch(err => {
//         console.error(err);
//         res.status(500).send('Server error');
//     });










});




// Login Page
app.get('/a/login', (req, res) => res.render('login', { title: 'Login' }));

// Login Logic


app.post('/login', async (req, res) => {
    // console.log("Login attempt:", req.body);

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        // console.log("User not found for email:", email);
        return res.redirect('/a/login?error=Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        // console.log("Incorrect password for user:", user.email);
        return res.redirect('/a/login?error=Invalid credentials');
    }

    req.session.user = user;
    console.log("User logged in:", user);

    if (user.role === 'admin') {
        return res.redirect('/admin/dashboard');
    }

    res.redirect('/a/track-stats');
});

  

// app.post('/login', async (req, res) => {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });

//     if (!user || !(await bcrypt.compare(password, user.password))) {
//         return res.render('login', { error: "Invalid credentials", loginFormData: req.body });
//     }

//     req.session.user = user;
//     res.redirect('/a/track-stats');
// });


// Dashboard
app.get('/a/dashboard', async (req, res) => {
    if (!req.session.user) return res.redirect('/a/login');

    const user = await User.findOne({ email: req.session.user.email });
    res.render('mylinks', { title: 'My Links', user });
});



// Add Link
// app.post('/add-link', async (req, res) => {
//     if (!req.session.user) return res.redirect('/a/login');

//     const { title, url, image, description } = req.body;
//     const user = await User.findOne({ email: req.session.user.email });

//     user.links.push({ title, url, image, description });
//     await user.save();

//     res.redirect('/a/dashboard');
// });
app.post('/add-link', upload.single('image'), async (req, res) => {
    if (!req.session.user) return res.redirect('/a/login');

    const { title, url, description } = req.body;
    const image = req.file ? '/uploads/' + req.file.filename : '';
    console.log("Saved Image Path:", image);
    const user = await User.findOne({ email: req.session.user.email });
    user.links.push({ title, url, image, description, status: 'pending' });
    await user.save();

    res.redirect('/a/dashboard?m=Link submitted for approval');
});











app.get('/admin/dashboard', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/a/login');
    }

    try {
        const users = await User.find(); // Get all users
        res.render('admin', { title: 'Admin Panel', users }); // Send users array to EJS
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send("Server Error");
    }
});

app.post('/admin/approve-link/:userId/:index', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/a/login');

    const { userId, index } = req.params;
    const user = await User.findById(userId);

    if (user && user.links[index]) {
        user.links[index].status = 'approved';
        await user.save();
    }

    res.redirect('/admin/dashboard?m=Link Approved');
});

app.post('/admin/reject-link/:userId/:index', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/a/login');

    const { userId, index } = req.params;
    const user = await User.findById(userId);

    if (user && user.links[index]) {
        user.links[index].status = 'rejected';
        await user.save();
    }

    res.redirect('/admin/dashboard?m=Link Rejected');
});


app.post('/admin/delete-user/:userId', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/a/login');

    try {
        await User.findByIdAndDelete(req.params.userId);
        res.redirect('/admin/dashboard?m=User Deleted');
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).send("Server Error");
    }
});




// // Update Link
// app.post('/update-link/:index', async (req, res) => {
//     if (!req.session.user) return res.redirect('/a/login');

//     const { index } = req.params;
//     const { title, url, image, description } = req.body;

//     try {
//         const user = await User.findOne({ email: req.session.user.email });

//         if (!user || !user.links[index]) return res.status(404).send("Link not found");

//         Object.assign(user.links[index], { title, url, image, description });

//         await user.save();
//         res.redirect('/a/dashboard');
//     } catch (error) {
//         console.error(error);
//         res.status(500).send("Server Error");
//     }
// });

app.post('/update-link/:index', uploadLink.single('image'), async (req, res) => {
    if (!req.session.user) return res.redirect('/a/login');
    const { index } = req.params;
    const { title, url, description } = req.body;

    const user = await User.findOne({ email: req.session.user.email });
    if (!user || !user.links[index]) return res.status(404).send("Link not found");

    const image = req.file ? '/links/' + req.file.filename : user.links[index].image;
    Object.assign(user.links[index], { title, url, image, description,status: "pending" });

    await user.save();
    res.redirect('/a/dashboard?m=Link submitted');
});



//new route
app.get('/track-link/:username/:index', async (req, res) => {
    try {
        const { username, index } = req.params;
        const user = await User.findOne({ username });

        if (!user || !user.links[index]) return res.status(404).send("Link not found");

        // Increment link click count
        user.links[index].clicks += 1;
        await user.save();

        // Redirect to the actual link
        res.redirect(user.links[index].url);
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
        res.redirect("/a/dashboard?m=Deleted Successfully");
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

        // Increment profile views
        user.profileViews += 1;
        await user.save();

        res.render("userProfile", { user, title: user.username });
    } catch (error) {
        res.status(500).send("Server Error");
    }
});






// Add new route to track stats
app.get('/a/track-stats', async (req, res) => {
    try {
        // Check if the user is logged in
        if (!req.session.user) return res.redirect('/a/login');

        // Fetch user data
        const user = await User.findOne({ email: req.session.user.email });

        // Gather data for rendering
        const totalLinks = user.links.length;
        const totalProfileViews = user.profileViews;

        // Prepare data for table (links and clicks)
        const linksData = user.links.map(link => ({
            title: link.title,
            url: link.url,
            clicks: link.clicks
        }));

        // Render the stats page with data
        res.render('dashboard', {
            title: 'Dashboard',
            totalLinks,
            totalProfileViews,
            linksData,
            user
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});





// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));



app.post('/add-link', upload.single('image'), async (req, res) => {
    if (!req.session.user) return res.redirect('/a/login');
    const { title, url, description } = req.body;
    const image = req.file ? '/links/' + req.file.filename : '';

    const user = await User.findOne({ email: req.session.user.email });
    user.links.push({ title, url, image, description });
    await user.save();
    res.redirect('/a/mylinks');
});

// Update Link (Now supports image uploads)
app.post('/update-link/:index', upload.single('image'), async (req, res) => {
    if (!req.session.user) return res.redirect('/a/login');
    const { index } = req.params;
    const { title, url, description } = req.body;

    const user = await User.findOne({ email: req.session.user.email });
    if (!user || !user.links[index]) return res.status(404).send("Link not found");

    const image = req.file ? '/links/' + req.file.filename : user.links[index].image;
    Object.assign(user.links[index], { title, url, image, description });

    await user.save();
    res.redirect('/a/dashboard?m=Updated');
});