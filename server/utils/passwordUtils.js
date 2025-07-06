// utils/passwordUtils.js

function isPasswordComplex(password) {
  // 1 uppercase, 1 lowercase, 1 digit, 1 special character
  const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return complexityRegex.test(password);
}

module.exports = { isPasswordComplex };
