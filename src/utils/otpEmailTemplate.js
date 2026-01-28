// src/utils/otpEmailTemplate.js
module.exports = (name, otp) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial; background:#f4f6f8; padding:20px;">
  <div style="max-width:500px; margin:auto; background:#fff; padding:25px; border-radius:8px;">
    <h2>Hello ${name}</h2>
    <p>Your password reset OTP is:</p>
    <h1 style="letter-spacing:4px; color:#2563eb;">${otp}</h1>
    <p>This OTP is valid for 10 minutes.</p>
    <p>If you didn't request this, ignore this email.</p>
  </div>
</body>
</html>
`;
