import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
import Notification   from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary"; 

export const createPost = async (request, response) => {
    try {
        const { text } = request.body;
        const { img } = request.body;

        const userId = request.user._id.toString();
        const user = User.findById(userId);
        if (!user) {
            return response.status(404).json({ error: "User not found! "});
        }

        if (!text && !img) {
            return response.status(400).json({ error: "Post must have a text or image"});
        }

        if (img) {
            // upload the image to cloudinary and assign url to post
            const uploadResponse = await cloudinary.uploader.upload(img);
            img = uploadResponse.secure_url;
        }

        const post = new Post({
            user : userId, 
            text : text, 
            img : img
        });

        await post.save();
        return response.status(201).json(post);
    } catch (error) {
        console.log("Error in createPost controller: ", error.message);
        return response.status(500).json({ error: error.message});
    }    
};

export const likeUnlikePost = async (request, response) => {
    try {
        const userId = request.user._id;
        const { id : postId } = request.params;

        const post = await Post.findById(postId);
        if (!post) {
            return response.status(404).json({ error: "Post not found" });
        }

        const userLikePost = post.likes.includes(userId);

        if (userLikePost) {
            // Unlike the post
            await Post.updateOne({_id:postId}, {$pull: {likes: userId}});
            await User.updateOne({_id:userId}, {$pull: {likedPosts: postId}});
            return response.status(200).json({ message: "Post unliked successfully" });
        } else {
            // Like the post 
            post.likes.push(userId);
            await User.updateOne({_id:userId}, {$push: {likedPosts: postId}});
            
            await post.save();

            // create and send notification
            const notification = new Notification({
                from: userId,
                to: post.user,
                type: "like"
            });
            await notification.save();
            
            return response.status(200).json({ message: "Post liked successfully" });
        }
    } catch (error) {
        console.log("Error in likeUnlikePost controller: ", error.message);
        return response.status(500).json({ error: "Internal Server Error" });
    }
};

export const commentOnPost = async (request, response) => {
    try {
        const { text } = request.body;
        const postId = request.params.id;
        const userId = request.user._id;

        if (!text) {
            return response.status(400).json({ error: "Text is required" });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return response.status(404).json({ error: "No such post" });
        }

        const comment = {
            user: userId,
            text: text
        };

        post.comments.push(comment);
        await post.save();

        response.status(200).json(post);
    } catch (error) {
        console.log("Error in commentOnPost controller: ", error.message);
        return response.status(500).json({ error: error.message});
    }
};

export const deletePost = async (request, response) => {
    try {
        const post = await Post.findById(request.params.id);
        if (!post) {
            return response.status(404).json({ error: "No such post found" });
        }

        if(post.user.toString() !== request.user._id.toString()) {
            return response.status(401).json({ error: "You are not authorised to delete this post" });
        }

        if (post.img) {
            const imgId = post.img.split("/").pop().split(".")[0]
            await cloudinary.uploader.destroy(imgId);
        }

        await Post.findByIdAndDelete(request.params.id);

        return response.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.log("Error in deletePost controller: ", error.message);
        return response.status(500).json({ error: error.message});
    }
};

export const getAllPosts = async (request, response) => {
	try {
		const posts = await Post.find()
			.sort({ createdAt: -1 })
            .populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});


		if (posts.length === 0) {
			return response.status(200).json([]);
		}

		response.status(200).json(posts);
	} catch (error) {
		console.log("Error in getAllPosts controller: ", error);
		response.status(500).json({ error: "Internal server error" });
	}
};

export const getLikedPosts = async (request, response) => {
	const userId = request.params.id;

	try {
		const user = await User.findById(userId);
		if (!user) {
            return response.status(404).json({ error: "User not found" });
        }

		const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		response.status(200).json(likedPosts);
	} catch (error) {
		console.log("Error in getLikedPosts controller: ", error);
		response.status(500).json({ error: "Internal server error" });
	}
};


export const getFollowingPosts = async (request, response) => {
	try {
		const userId = request.user._id;
		const user = await User.findById(userId);
		if (!user) return response.status(404).json({ error: "User not found" });

		const following = user.following;

		const feedPosts = await Post.find({ user: { $in: following } })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

        response.status(200).json(feedPosts);
	} catch (error) {
		console.log("Error in getFollowingPosts controller: ", error);
		response.status(500).json({ error: "Internal server error" });
	}
};

export const getUserPosts = async (request, response) => {
	try {
		const { username } = request.params;

		const user = await User.findOne({ username });
		if (!user) {
            return response.status(404).json({ error: "User not found" });
        }
        
		const posts = await Post.find({ user: user._id })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		response.status(200).json(posts);
	} catch (error) {
		console.log("Error in getUserPosts controller: ", error);
		response.status(500).json({ error: "Internal server error" });
	}
};