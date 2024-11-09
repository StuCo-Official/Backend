import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const sendMessage = async (req, res) => {
	try {
		const { message } = req.body;
		const { id: receiverId } = req.params;
		const senderId = req.user._id;

		let chat = await Chat.findOne({
			participants: { $all: [senderId, receiverId] },
		});

		if (!chat) {
			chat = await Chat.create({
				participants: [senderId, receiverId],
			});
		}

		const newMessage = new Message({
			senderId,
			receiverId,
			message,
		});

		if (newMessage) {
			chat.messages.push(newMessage._id);
		}

		// this will run both these functions in parallel
		// equivalent to 
		// await conversation.save();
		// await newMessage.save();, but faster
        await Promise.all([chat.save(), newMessage.save()]);

		// socket io functionality
		const receiverSocketId = getReceiverSocketId(receiverId);
		// ensures that message is sent in realtime only if they are online
		if (receiverSocketId) {
			// io.to(<socket_id>).emit() used to send events to specific client
			io.to(receiverSocketId).emit("newMessage", newMessage);
		}

		return res.status(201).json(newMessage);
	} catch (error) {
		console.log("Error in sendMessage controller: ", error.message);
		return res.status(500).json({ error: "Internal server error" });
	}
};

export const getMessages = async (req, res) => {
	try {
		const { id: userToChatId } = req.params;
		const senderId = req.user._id;

		const chat = await Chat.findOne({
			participants: { $all: [senderId, userToChatId] },
		}).populate("messages"); // NOT REFERENCE BUT ACTUAL MESSAGES

		if (!chat) return res.status(200).json([]);

		const messages = chat.messages;

		return res.status(200).json(messages);
	} catch (error) {
		console.log("Error in getMessages controller: ", error.message);
		return res.status(500).json({ error: "Internal server error" });
	}
};

export const getAllChats = async (req, res) => {
	try {
		const senderId = req.user._id;
		const chats = await Chat.find({ participants: senderId })
			.select("participants updatedAt")
			.sort({ updatedAt: -1 }); // sort by most recently updated
		// return all chats the user is a participant of
		return res.status(200).json(chats);
	} catch (error) {
		console.log("Error in getAllChats controller: ", error.message);
		return res.status(500).json({ error: "Internal server error"});
	}
}