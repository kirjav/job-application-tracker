const bcrypt = require("bcrypt");

function isPasswordComplex(password) {
  // 1 uppercase, 1 lowercase, 1 digit, 1 special character
  const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return complexityRegex.test(password);
}

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function verifyPasswordMatch(inputPassword, hashedPassword) {
  const isValid = await bcrypt.compare(inputPassword, hashedPassword);
  if (!isValid) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }
}

module.exports = {
  isPasswordComplex,
  hashPassword,
  verifyPasswordMatch,
};
