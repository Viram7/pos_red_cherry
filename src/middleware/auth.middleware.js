const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

exports.verifyUserToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ⚡ Use decoded.userId (matches your JWT payload)
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    req.user = user; // ✅ attach full user object to request
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};
