const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.header("token");

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  try {
    const payload = jwt.verify(token, "secretkey");

    req.user = payload.id;

    next();
  } catch (err) {
    res.status(401).json({
      message: "Invalid Token",
    });
  }
};