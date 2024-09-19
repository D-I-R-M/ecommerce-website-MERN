import {redis} from '../lib/redis.js';
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";


const generateTokens = (userId) => {
    const accessToken = jwt.sign({userId},process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: "15m"
    });
    const refreshToken = jwt.sign({userId},process.env.REFRESH_TOKEN_SECRET,{
        expiresIn: "7d"  
    });
    return {accessToken,refreshToken};
};

const storeRefreshToken = async (userId,refreshToken) => {
    await redis.set(`refreshToken: ${userId}`,refreshToken,"EX",60*60*24*7);
};

const setCookies = ({res,accessToken,refreshToken}) => {
    res.cookie("accessToken",accessToken,{
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict",
        maxAge: 15*60*1000
    });
    res.cookie("refreshToken",refreshToken,{
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict",
        maxAge: 7*24*60*60*1000       
    });
};

export const signup  = async (req,res) => {
    const {email,password,name} = req.body;
try
{
    const userExists = await User.findOne({email});
    if (userExists){
        return res.status(400).json({message: "USer already exists"});   
    }

    const user = await User.create({name,email,password});
    const {accessToken,refreshToken} = generateTokens(user._id);
    await storeRefreshToken(user._id,refreshToken);

    setCookies({res,accessToken,refreshToken});

    res.status(201).json(
        {_id: user._id,
        name:user.name,
        email:user.email,
        role:user.role
    });
}
 catch (error){
    console.log("Error signing up  controller page",error.message);
    res.status(500).json({message:error.message});
 }
};



export const login  = async (req,res) => {
    try{
        const {email,password} = req.body;
        const user = await User.findOne({email});
        if(user && (await user.comparePassword(password))){
            await storeRefreshToken(user._id,refreshToken)
            setCookies(res,accessToken,refreshToken)

            res.json({
                _id: user._id,
                name:user.name,
                email:user.email,
                role:user.role
            })
        } else{
            res.status(401).json({message:"Invalid credentials"});
        }
    }catch(error){
            console.log("Error logging in login controller page",error.message);
            res.status(500).json({message:error.message});
        }
    
        
};

export const logout  = async (req,res) => {
    try{
        const refreshToken = req.cookies.refreshToken;
        if(refreshToken){
            const decoded = jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);
            await redis.del(`refreshToken: ${decoded.userId}`);
        }

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.json({message:"Logged Out"});
    }
    catch(error){
        console.log("Error logging out controller page",error.message);
        res.status(500).json({message:"Error logging out",error: error.message});
    }
};

export const refreshToken  = async (req,res) => {
    try{
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken){
         return res.status(401).json({message:"NOt found"});   
        }
        const decoded = jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);

        const storedToken = await redis.get(`refreshToken: ${decoded.userId}`);
        if (storedToken!==refreshToken){
         return res.status(401).json({message:"Invalid token"});   
        }

        const accessToken = jwt.sign({decoded},process.env.ACCESS_TOKEN_SECRET,{expiresIn: "15m"});
        res.cookie("accessToken",accessToken,{
            httpOnly: true,
            secure: process.env.NODE_ENV !== "development",
            sameSite: "strict",
            maxAge: 15*60*1000
        });
        res.json({message:"Token refreshed"});
    
}   catch(error){
    console.log("Error refreshing token controller page",error.message);
    res.status(500).json({message:"Error refreshing token",error: error.message});
}
};

export const getProfile  = async (req,res) => {
    try{
        res.json(req.user);
    }
    catch(error){
        res.status(500).json({message:"Error getting profile",error: error.message});
    }
};
// XJspvTSAqiwVqMhp