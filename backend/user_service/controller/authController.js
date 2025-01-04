const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../model/users');

const registerUser = async (req, res) => {
    const {
        username,
        email,
        password,
        mobileNumber,
        age,
        gender,
        city,
        about,
        interests,
        places_visited,
        likes = 0, 
        followers = 0, 
        reviews = '',
        badges = ''
    } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = new User({
            username,
            email,
            password,  
            mobileNumber,
            age,
            gender,
            city,
            about,
            interests,
            likes: 0,
            followers: [],
            places_visited,
            reviews,
            badges
        });

        const savedUser = await newUser.save();
        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email,
                age: savedUser.age,
                mobileNumber: savedUser.mobileNumber,
                gender: savedUser.gender,
                city: savedUser.city,
                about: savedUser.about,
                interests: savedUser.interests,
                places_visited: savedUser.places_visited,
                likes: savedUser.likes,
                followers: savedUser.followers,
                reviews: savedUser.reviews,
                badges: savedUser.badges,
                createdAt: savedUser.createdAt
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteByName = async (req, res) => {
    const { name } = req.params; 
    try {
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: 'Invalid or missing name parameter' });
        }

        const user = await User.findOneAndDelete({ username: name });

        if (!user) {
            return res.status(404).json({ error: 'No user found with the given name' });
        }

        res.status(200).json({ message: 'User deleted successfully', user });
    } catch (error) {
        console.error('Error deleting user by name:', error);
        res.status(500).json({ error: 'Server error while deleting user' });
    }
};

const profile = async(req, res) => {
    console.log("Decoded user:", req.user);
    try {
        const userId = req.user.id;  
        const user = await User.findById(userId); 
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: 'Server error' });
    }
};


module.exports = { profile };


// Export the functions
module.exports = {
    registerUser,
    loginUser,
    deleteByName,
    profile
};
