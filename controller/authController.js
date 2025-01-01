const express = require('express');
const app = express();
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const RefreshToken = require("../models/refreshToken");
const util = require("util");
const promisify = util.promisify;
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcrypt');
dotenv.config();

const promisifiedJWTsign = promisify(jwt.sign); 
const promisifiedJWTverify = promisify(jwt.verify);

app.use(express.json());
app.use(cookieParser());


async function signUpHandler(req, res) {
    try {
        const userObject = req.body;
        if(!userObject.email || !userObject.password) {
            return res.status(400).json({
                message:  "required data missing",
                status: "failure"
            })
        }
        const user = await userModel.findOne({email: userObject.email});
        
        
        if(user) {
            return res.status(400).json({
                message:  "user already exists",
                status: "failure"
            })
        }
        const hashedPassword = await bcrypt.hash(userObject.password, 10);

        const newUser = await userModel.create({
            name: userObject.name,
            email: userObject.email,
            password: hashedPassword, 
            confirmPassword: hashedPassword,
            role: userObject.role
          });
          
         // await newUser.save();
        res.status(201).json({
            "message": "user created successfully",
            user: newUser,
            status: "success"
        }) 
    } 
    catch (err) {
        res.status({
            message: err.message,
            status: "failed"
        })
    }
}



async function loginHandler(req, res) {
     try{
         const {email, password} = req.body;
         
         const user = await userModel.findOne({email});
         
         if(!user) {
             return res.status(404).json({
                 message: "Invalid email or password",
                 status: "failure1"
             })
         }
         const areEqual = bcrypt.compare(password, user.password);
         
         if(!areEqual) {
             return res.status(404).json({
                 message: "Invalid email or password",
                 status: "failure"
             })
         }
         
         const accessToken = await promisifiedJWTsign({id: user["_id"]}, process.env.JWT_SECRET_KEY, {algorithm: "HS256"}); 
         const refreshToken = await promisifiedJWTsign({ id: user["_id"] }, process.env.JWT_REFRESH_KEY);
         
         const existingRefreshToken = await RefreshToken.findOne({ userId: user._id }); 
        if (existingRefreshToken) {
            existingRefreshToken.token = refreshToken;
            existingRefreshToken.createdAt = Date.now();
            await existingRefreshToken.save(); 
        } else {
            const newRefreshToken = new RefreshToken({
                token: refreshToken,
                userId: user._id,
        });
  await newRefreshToken.save();
}
          
         res
         .cookie("accesstoken", accessToken, {
            maxAge: 20000, 
            httpOnly: true,
            secure: true
         })
         
         .cookie("refreshtoken", refreshToken, {
            maxAge: 60000,
             httpOnly: true,
             secure: true
         });
         
         res.status(200).json({
             message: "login successfull",
             status: "success",
             user: user
         })
         
 
     }
     catch (err) {
         res.status({
             message: err.message,
             status: "failed"
         })
     }
 }

function logoutHandler(req, res) {
    try{
        res.clearCookie('jwt', {path: '/'});
        res.status(200).json({
            message: "logout successfull",
            status: "success"
        })
    }
    catch (err) {
        res.status(500).json({
            message: err.message,
            status: "failure"
        })
    }
}



async function protectedRouteMiddleware(req, res, next) {
    try {

        const accessToken = req.cookies.accesstoken;
        const refreshToken = req.cookies.refreshtoken;


        // Case 1: Access token is valid, proceed to the next middleware
        if (accessToken) {
            try {
                const unlockedToken = await promisifiedJWTverify(accessToken, process.env.JWT_SECRET_KEY);
                req.id = unlockedToken.id;
                return next(); 
            } catch (err) {
                
                console.log("Access token expired or invalid:", err.message);
            }
        }

        // Case 2: If no access token but refresh token is present
        if (!refreshToken) {
            return res.status(401).json({
                message: "unauthorized access",
                status: "failure",
            });
        }

        // Case 3: Verify refresh token and generate a new access token
        try {
            const refreshTokenData = await promisifiedJWTverify(refreshToken, process.env.JWT_REFRESH_KEY);
            if (!refreshTokenData) {
                return res.status(403).json({
                    message: "forbidden access",
                    status: "failure",
                });
            }
            
            const userId = refreshTokenData.id;
        
            const newAccessToken = await promisifiedJWTsign({ id: userId["_id"] }, process.env.JWT_SECRET_KEY, { algorithm: "HS256" });

            
            res.cookie("accesstoken", newAccessToken);

            
            req.id = userId;
            return next(); 
        } catch (err) {
            return res.status(500).json({
                message: "internal server error while verifying refresh token",
                status: "failure",
            });
        }

    } catch (err) {
        return res.status(500).json({
            message: "internal server error",
            status: "failure",
        });
    }
}


async function profileHandler(req, res) {
    try{
        const userId= req.id;
        const user = await userModel.findById(userId);
        
        if(!user) {
            return res.status(404).json({
                message: "user does not exist",
                status: "failure"
            })
        }

        return res.json({
            message: "profile worked",
            status: "success", 
            user: user
        })
    }
    catch (err) {
        res.status(500).json({
            message: err.message,
            status: "failure 3"
        })
    }
}


module.exports = {
    signUpHandler,
    loginHandler,
    logoutHandler,
    protectedRouteMiddleware,
    profileHandler
}

