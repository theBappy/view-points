// controllers/sessionController.js
import { streamClient, chatClient } from "../libs/stream.js";
import Session from "../models/Session.js";

/* -------------------- Helper Function -------------------- */
const handleError = (res, error, message = "Internal server error") => {
  console.error("SessionController Error:", error.message);
  res.status(500).json({ msg: message, error: error.message });
};

/* -------------------- Create a New Session -------------------- */
export async function createSession(req, res) {
  try {
    const { problem, difficulty } = req.body;
    const { _id: userId, clerkId } = req.user;

    // Basic validation
    if (!problem || !difficulty) {
      return res.status(400).json({ msg: "Problem & difficulty are required." });
    }

    const validDifficulties = ["easy", "medium", "hard"];
    if (!validDifficulties.includes(difficulty.toLowerCase())) {
      return res.status(400).json({ msg: "Invalid difficulty level." });
    }

    if (typeof problem !== "string" || problem.trim().length < 5) {
      return res.status(400).json({ msg: "Problem description is too short." });
    }

    // Prevent multiple active sessions per host
    const existing = await Session.findOne({ host: userId, status: "active" });
    if (existing) {
      return res
        .status(400)
        .json({ msg: "You already have an active session." });
    }

    // Generate unique call ID for Stream video
    const callId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;

    // Create session in DB
    const session = await Session.create({
      problem,
      difficulty,
      host: userId,
      callId,
    });

    try {
      // Create Stream video call
      await streamClient.video.call("default", callId).getOrCreate({
        data: {
          created_by_id: clerkId,
          custom: { problem, difficulty, sessionId: session._id.toString() },
        },
      });

      // Create chat channel
      const channel = chatClient.channel("messaging", callId, {
        name: `${problem} Session`,
        created_by_id: clerkId,
        members: [clerkId],
      });
      await channel.create();
    } catch (streamError) {
      // Rollback DB session if Stream creation fails
      await Session.findByIdAndDelete(session._id);
      throw new Error(`Stream API error: ${streamError.message}`);
    }

    res.status(201).json({ session });
  } catch (error) {
    handleError(res, error);
  }
}

/* -------------------- Get Active Sessions -------------------- */
export async function getActiveSession(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;

    const sessions = await Session.find({ status: "active" })
      .populate("host", "name profileImage email clerkId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({ sessions });
  } catch (error) {
    handleError(res, error);
  }
}

/* -------------------- Get User’s Recent Sessions -------------------- */
export async function getMyRecentSession(req, res) {
  try {
    const { _id: userId } = req.user;
    const { page = 1, limit = 20 } = req.query;

    const sessions = await Session.find({
      status: "completed",
      $or: [{ host: userId }, { participant: userId }],
    })
      .select("problem difficulty createdAt callId status")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({ sessions });
  } catch (error) {
    handleError(res, error);
  }
}

/* -------------------- Get Session by ID -------------------- */
export async function getSessionById(req, res) {
  try {
    const { id } = req.params;
    const session = await Session.findById(id)
      .populate("host", "name email profileImage clerkId")
      .populate("participant", "name email profileImage clerkId");

    if (!session) {
      return res.status(404).json({ msg: "Session not found" });
    }

    res.status(200).json({ session });
  } catch (error) {
    handleError(res, error);
  }
}

/* -------------------- Join an Active Session -------------------- */
export async function joinSession(req, res) {
  try {
    const { id } = req.params;
    const { _id: userId, clerkId } = req.user;

    // Atomic update to prevent race condition
    const session = await Session.findOneAndUpdate(
      {
        _id: id,
        participant: { $exists: false },
        status: "active",
      },
      { participant: userId },
      { new: true }
    );

    if (!session) {
      return res
        .status(409)
        .json({ msg: "Session is already full or not active." });
    }

    if (session.host.toString() === userId.toString()) {
      return res
        .status(400)
        .json({ msg: "Host cannot join their own session." });
    }

    // Add user to Stream chat channel
    const channel = chatClient.channel("messaging", session.callId);
    await channel.addMembers([clerkId]);

    res.status(200).json({ session });
  } catch (error) {
    handleError(res, error);
  }
}

/* -------------------- End a Session -------------------- */
export async function endSession(req, res) {
  try {
    const { id } = req.params;
    const { _id: userId } = req.user;

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ msg: "Session not found" });
    }

    if (session.host.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ msg: "Only the host can end the session." });
    }

    if (session.status === "completed") {
      return res.status(400).json({ msg: "Session is already completed." });
    }

    // Cleanup Stream video & chat (safe parallel delete)
    await Promise.allSettled([
      streamClient.video.call("default", session.callId).delete({ hard: true }),
      chatClient.channel("messaging", session.callId).delete(),
    ]);

    session.status = "completed";
    await session.save();

    res.status(200).json({ session, msg: "Session ended successfully!" });
  } catch (error) {
    handleError(res, error);
  }
}
