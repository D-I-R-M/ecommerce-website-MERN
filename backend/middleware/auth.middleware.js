import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req,res,next) => {
    try{
        const acccessToken = req.cookies.accessToken;
        if(!acccessToken){
            return res.status(401).json({message:"Not authorized - NO token"});
        }
    try
{        const decoded = jwt.verify(acccessToken,process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded.userId).select("-password");
        if(!user){
            return res.status(401).json({message:"User not found"});
        }

        req.user = user;
        next();} catch(error){
            if(error.name === "TokenExpiredError"){
                return res.status(401).json({message:"Not authorized - Token expired"});
            }
            throw error;
        }
    } catch(error){
        console.log("Error protecting route controller page",error.message);
        return res.status(401).json({message:'Not authorized - Invalid token'});
    }
};

export const adminRoute = async (req,res,next) => {
    if(req.user && req.user.role === "admin"){
        next();
    }else{
        return res.status(401).json({message:"Not authorized - Admin only"});
    } 
}