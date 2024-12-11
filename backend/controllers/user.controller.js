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
    const {
        fullName,
        email,
        username,
        currentPassword,
        newPassword,
        bio,
        link,
        educationLevel,
        academicYear,
        major,
        gpa,
        profileImage,
        coverImage
    } = request.body;

    const userId = request.user._id;

    try {
        let user = await User.findById(userId);
        if (!user) {
            return response.status(404).json({ error: "User not found" });
        }

        // Validate password fields
        if ((newPassword && !currentPassword) || (!newPassword && currentPassword)) {
            return response.status(400).json({ error: "Please provide both current and new password if changing password" });
        }

        // Update basic info if provided
        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.username = username || user.username;
        user.bio = bio || user.bio;
        user.link = link || user.link;
        user.educationLevel = educationLevel || user.educationLevel;
        user.academicYear = academicYear || user.academicYear;
        user.major = major || user.major;
        user.gpa = gpa || user.gpa;

        // Handle password change if requested
        if (newPassword && currentPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return response.status(400).json({ error: "Current password is incorrect" });
            }

            if (newPassword.length < 6) {
                return response.status(400).json({ error: "New password should be at least 6 characters long" });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        // Handle profile image update
        let updatedProfileImage = user.profileImage;
        if (profileImage) {
            // Destroy old image if it exists
            if (user.profileImage) {
                const oldProfileImageId = user.profileImage.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(oldProfileImageId);
            }
            const uploadedProfile = await cloudinary.uploader.upload(profileImage);
            updatedProfileImage = uploadedProfile.secure_url;
        }

        // Handle cover image update
        let updatedCoverImage = user.coverImage;
        if (coverImage) {
            // Destroy old cover image if it exists
            if (user.coverImage) {
                const oldCoverImageId = user.coverImage.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(oldCoverImageId);
            }
            const uploadedCover = await cloudinary.uploader.upload(coverImage);
            updatedCoverImage = uploadedCover.secure_url;
        }

        user.profileImage = updatedProfileImage;
        user.coverImage = updatedCoverImage;

        user = await user.save();

        // Remove password before sending response
        user.password = null;

        return response.status(200).json(user);
    } catch (error) {
        console.log("Error in updateUser controller: ", error.message);
        return response.status(500).json({ error: "Internal Server Error" });
    }
};