const { VideoCall } = require("../models");

/**
 * Create a new call session (host creates)
 */
const createCall = async (req, res) => {
  try {
    const hostId = req.userId;
    const { room_name } = req.body;

    const call = await VideoCall.create({
      host_id: hostId,
      room_name: room_name || null,
      status: "pending",
    });

    res.status(201).json({ success: true, data: call });
  } catch (error) {
    console.error("Error in createCall:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to create call",
        error: error.message,
      });
  }
};

/**
 * Join a call as guest
 */
const joinCall = async (req, res) => {
  try {
    const guestId = req.userId;
    const { callId } = req.params;

    const call = await VideoCall.findByPk(callId);
    if (!call) {
      return res
        .status(404)
        .json({ success: false, message: "Call not found" });
    }

    if (call.status === "ended" || call.status === "cancelled") {
      return res
        .status(400)
        .json({ success: false, message: "Call already ended" });
    }

    call.guest_id = guestId;
    call.status = "active";
    await call.save();

    res.status(200).json({ success: true, data: call });
  } catch (error) {
    console.error("Error in joinCall:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to join call",
        error: error.message,
      });
  }
};

/**
 * End a call (host or guest)
 */
const endCall = async (req, res) => {
  try {
    const userId = req.userId;
    const { callId } = req.params;

    const call = await VideoCall.findByPk(callId);
    if (!call) {
      return res
        .status(404)
        .json({ success: false, message: "Call not found" });
    }

    // Only participants can end the call
    if (call.host_id !== userId && call.guest_id !== userId) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You are not a participant in this call",
        });
    }

    call.status = "ended";
    await call.save();

    res.status(200).json({ success: true, data: call });
  } catch (error) {
    console.error("Error in endCall:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to end call",
        error: error.message,
      });
  }
};

const getCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const call = await VideoCall.findByPk(callId);
    if (!call) {
      return res
        .status(404)
        .json({ success: false, message: "Call not found" });
    }
    res.status(200).json({ success: true, data: call });
  } catch (error) {
    console.error("Error in getCall:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to get call",
        error: error.message,
      });
  }
};

module.exports = {
  createCall,
  joinCall,
  endCall,
  getCall,
};
