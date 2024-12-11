import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
import Notification   from "../models/notification.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

export const getUserProfile = async (request, response) => {
    const { username } = request.params;

    try {
        const user = await User.findOne({ username })
            .select("-password")
            .select("educationLevel academicYear");

        
        if (!user) {
            return response.status(404).json({ error: "User not found!"});
        }
        
        return response.status(200).json(user);
    } catch (error) {
        console.log("Error in getUserProfile controller: ", error.message);
        return response.status(500).json({ error: "Internal Server Error"});
    }
};

export const followUnFollowUser = async (request, response) => {
    const { id } = request.params;

    try {
        const userToModify = await User.findById(id);
        const currentId = request.user._id;
        const currentUser = await User.findById(currentId);
        
        if (id === currentId.toString()) {
            return response.status(404).json({ error: "You cannot follow/unfollow yourself!"});
        }

        if (!userToModify || !currentUser) {
            return response.status(400).json({ error: "One or more of the users were not found!"});
        }

        const isFollowing = currentUser.following.includes(id);
        if (isFollowing) {
            // Unfollow the user
            await User.findByIdAndUpdate(id, { $pull: { followers: currentId } });
            await User.findByIdAndUpdate(currentId, { $pull: { following: id } });
            // TODO: return the id of the user as a response
            return response.status(200).json({ message: "User unfollowed successfully" });
        } else {
            // Follow the user
            await User.findByIdAndUpdate(id, { $push: { followers: currentId } });
            await User.findByIdAndUpdate(currentId, { $push: { following: id } });
            
            const newNotification = new Notification({
                type: "follow",
                from: currentId,
                to: userToModify._id,
            });

            await newNotification.save();

            // TODO: return the id of the user as a response
            return response.status(200).json({ message: "User followed successfully" });
        }
    } catch (error) {
        console.log("Error in followUnFollowUser controller: ", error.message);
        return response.status(500).json({ error: "Internal Server Error"});
    }
};

export const getSuggestedUsers = async (request, response) => {
    try {
        const userId = request.user._id;

        const usersFollowedByMe = await User.findById(userId).select("following");
        
        const users = await User.aggregate([
			{
				$match: {
					_id: { $ne: userId },
				},
			},
			{ $sample: { size: 10 } },
		]);

        const filteredUsers = users.filter( (user) => {
            return !usersFollowedByMe.following.includes(user._id);
        });
        const suggestedUsers = filteredUsers.slice(0, 4);

        suggestedUsers.forEach( (user) => user.password = null);
        
        return response.status(200).json(suggestedUsers);
    } catch (error) {
        console.log("Error in getSuggestedUsers controller: ", error.message);
        return response.status(500).json({ error: error.message});
    }
};

export const updateUser = async (request, response) => {
    const { dob, country, educationLevel, academicYear, contact } = request.body;
    const userId = request.user._id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return response.status(404).json({ error: "User not found" });
        }

        // Update the fields
        user.dob = dob || user.dob;
        user.country = country || user.country;
        user.educationLevel = educationLevel || user.educationLevel;
        user.academicYear = academicYear || user.academicYear;
        user.contact = contact || user.contact;

        await user.save();

        return response.status(200).json(user);
    } catch (error) {
        console.error("Error in updateUser controller:", error.message);
        return response.status(500).json({ error: "Internal Server Error" });
    }
};