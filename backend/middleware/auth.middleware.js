const jwt=require('jsonwebtoken');
const tokenBlacklistModel = require("../models/blacklist.model");

async function authMiddleware(req,res,next){
    const token = req.cookies.token;
    if(!token){
        return res.status(401).json({message:'Unauthorized, no token provided'});
    }
    try{
        // Check if token is blacklisted
        const isBlacklisted = await tokenBlacklistModel.findOne({ token });
        if (isBlacklisted) {
            return res.status(401).json({ message: 'Unauthorized, token is blacklisted' });
        }
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }catch(error){
        console.error('Error verifying token:',error);
        return res.status(401).json({message:'Unauthorized, invalid token'});
    }
}

module.exports=authMiddleware;