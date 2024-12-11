import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (userId, response) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '15d'
    });

    response.cookie("jwt", token, {
        maxAge: 15*24*60*60*1000, // in milliseconds
        httpOnly: true, // prevent XS attacks cross site scripting attacks
        sameSite: "strict", // CRSF attacks cross-site request forgery attacks
        secure: process.env.NODE_ENV !== "development", 
    });

    return token;
}