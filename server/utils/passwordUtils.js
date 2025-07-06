// utils/passwordUtils.js

function isPasswordComplex(password) {
  // Example: at least 8 characters, includes a number and a letter
  const complexityRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
  return complexityRegex.test(password);
}

module.exports = { isPasswordComplex };
