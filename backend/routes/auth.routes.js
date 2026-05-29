const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cookieParser = require('cookie-parser');
router.use(cookieParser());
const authMiddleware = require('../middleware/auth.middleware');

const User = require('../models/user.model');
const authController = require('../controller/auth.controller');


/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */

router.post('/register', authController.registerUserController);
/** * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post('/login', authController.loginUserController);
/** 
 * @route GET /api/auth/logout
 * @desc Logout a user,clear the token cookie
 * @access Public
 */

router.get('/logout', authController.logoutUserController);

/**
 * @route GET /api/auth/get-me
 * @desc Get the authenticated user's details
 * @access Private
 */
router.get('/get-me',authMiddleware, authController.getMeController);
 

module.exports = router;
