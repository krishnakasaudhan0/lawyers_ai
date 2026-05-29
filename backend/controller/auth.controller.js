const userModel = require("../models/user.model");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const tokenBlacklistModel = require("../models/blacklist.model");
require('dotenv').config();

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
};

/**
 * @name resgisterUserController
 * @route POST /api/auth/register
 * @desc controller to register a new user
 * @access Public
 */
async function registerUserController(req, res) {
    try {
        const { username, email, password } = req.body;

        if(!username || !email || !password) {
            return res.status(400).json({ message: 'Please provide username, email and password' });
        }

        // Check if the user already exists
        const existingUser = await userModel.findOne({$or: [{ email },{username}] });
        if (existingUser) {
            return res.status(400).json({ message: 'user already exists' });
        }

        const saltrounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltrounds);

        // Create a new user
        const newUser = new userModel({
            username,
            email,
            password: hashedPassword
        });

        // Save the user to the database
        await newUser.save();

        const token = jwt.sign({ id : newUser._id,username: newUser.username }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.cookie('token', token, cookieOptions);

        res.status(201).json({ message: 'User registered successfully' ,
            user:{
                id: newUser._id,
                username: newUser.username,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ message: `${field} already exists` });
        }
        res.status(500).json({ message: 'Server error' });
    }
}


/**
 * @name loginUserController
 * @route POST /api/auth/login
 * @desc controller to login a user
 * @access Public
 */

async function loginUserController(req, res) {
    try {
        const { email, password } = req.body;

        if(!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Check if the user exists
        const existingUser = await userModel.findOne({ email });
        if (!existingUser) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Compare the provided password with the hashed password in the database
        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id : existingUser._id,username: existingUser.username }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.cookie('token', token, cookieOptions);

        res.status(200).json({ message: 'User logged in successfully',
            user:{
                id: existingUser._id,
                username: existingUser.username,
                email: existingUser.email
            }
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

/**
 * @name logoutUserController
 * @route POST /api/auth/logout
 * @desc controller to logout a user
 * @access Public
 */

async function logoutUserController(req, res) {
    try {
       const token = req.cookies.token;
         if(!token) {
          return res.status(400).json({ message: 'No token provided' });
         }
         await tokenBlacklistModel.create({ token });
        res.clearCookie('token');   
        res.status(200).json({ message: 'User logged out successfully' });
    } catch (error) {
        console.error('Error logging out user:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

async function getMeController(req, res) {
    try {
        const user = await userModel.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({message: 'User details fetched successfully', user :{
            id: user._id,
            username: user.username,
            email: user.email
        }});
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
};