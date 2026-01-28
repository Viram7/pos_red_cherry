const User = require("../models/user.model");


exports.changeUserName = async (req, res) => {
  try {
    const { name } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User name changed successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.getMyProfile = async (req, res) => {
  try {
    // ✅ Use req.user._id since middleware attaches full user
    const userId = req.user._id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User data from token",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};








exports.getAdminProfile = async (req, res) => {
  try {
    const userId = req.user.id;  // from auth middleware

    const user = await User.findById(userId).select("name email adminProfile");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: user.adminProfile,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// CREATE / UPDATE Admin Profile
exports.createOrUpdateAdminProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { admin, company } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.adminProfile = { admin, company };
    await user.save();

    res.status(200).json({
      success: true,
      data: user.adminProfile,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// DELETE Admin Profile
exports.deleteAdminProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.adminProfile = { admin: {}, company: {} };
    await user.save();

    res.status(200).json({
      success: true,
      message: "Admin profile deleted",
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};