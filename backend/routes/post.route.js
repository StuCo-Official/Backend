// routes/post.routes.js
import express from 'express';

import { protectRoute } from '../middleware/protectRoute.js';
import {
    createPost,
    likeUnlikePost,
    commentOnPost,
    deletePost,
    getAllPosts,
    getLikedPosts,
    getFollowingPosts,
    getUserPosts,
} from '../controllers/post.controller.js';

const router = express.Router();

// Get all posts
router.get('/all', protectRoute, getAllPosts);

// Get liked posts by user ID
router.get('/likes/:id', protectRoute, getLikedPosts);

// Get posts from following users
router.get('/following', protectRoute, getFollowingPosts);

// Get posts by username
router.get('/user/:username', protectRoute, getUserPosts);

// Create a new post
router.post('/create', protectRoute, createPost);

// Like or unlike a post
router.post('/like/:id', protectRoute, likeUnlikePost);

// Comment on a post
router.post('/comment/:id', protectRoute, commentOnPost);

// Delete a post
router.delete('/:id', protectRoute, deletePost);

export default router;
