import express from "express";
import { getMessages, sendMessage, getAllChats } from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/:id", protectRoute, getMessages);
router.get("/all", protectRoute, getAllChats);
router.post("/send/:id", protectRoute, sendMessage);

export default router;