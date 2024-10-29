import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (request, response) => {
    try {
        const { firstName, lastName, username, email, password } = request.body;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Check if valid email
        if (!emailRegex.test(email)) {
            return response.status(400).json({ error: "Invalid email format" });
        }

        // Check if the username exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return response.status(400).json({ error: "Username is already taken" });
        }

        // Check if the email exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return response.status(400).json({ error: "Email is already taken" });
        }

        // Check the minimum password size
        if (password.length < 6) {
            return response.status(400).json({ error: "Password must be at least 6 letters long" });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username: username,
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: hashedPassword,
        });

        if (newUser) {
            // generate token
            generateTokenAndSetCookie(newUser._id, response)
            await newUser.save();

            return response.status(201).json({
                _id: newUser._id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                username: newUser.username,
                email: newUser.email,
                followers: newUser.followers,
                following: newUser.following,
                profileImage: newUser.profileImage,
                coverImage: newUser.coverImage,
            });

        } else {
            return response.status(400).json({ error: "Invalid user data" });
        }
    } catch (error) {
        console.log("Error in signup controller: ", error.message);
        return response.status(500).json({ error: "Internal Server Error" });
    }
}

export const login = async (request, response) => {
    try {
        const { email, password } = request.body;

        const user = await User.findOne({ email });
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

        if (!user || !isPasswordCorrect) {
            return response.status(400).json({ error: "Invalid email or password" });
        }

        generateTokenAndSetCookie(user._id, response);

        return response.status(200).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            email: user.email,
            followers: user.followers,
            following: user.following,
            profileImage: user.profileImage,
            coverImage: user.coverImage,
        });

    } catch (error) {
        console.log("Error in login controller: ", error.message);
        return response.status(500).json({ error: "Internal Server Error"});
    }
}

export const logout = async (request, response) => {
    try {
        response.cookie("jwt", "", {maxAge: 0});
        response.status(200).json({ message: "Logged out successfully!" });
    } catch (error) {
        console.log("Error in logout controller: ", error.message);
        return response.status(500).json({ error: "Internal Server Error"});
    }
}

export const getMe = async (request, response) => {
    try {
        const user = await User.findById(request.user._id).select("-password");
        response.status(200).json(user);
    } catch (error) {
        console.log("Error in getMe controller: ", error.message);
        return response.status(500).json({ error: "Internal Server Error"});
    }
}