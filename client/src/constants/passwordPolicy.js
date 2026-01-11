export const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

export const passwordChecks = [
  {
    key: "length",
    label: "At least 8 characters",
    test: (pw) => pw.length >= PASSWORD_POLICY.minLength,
  },
  {
    key: "uppercase",
    label: "One uppercase letter",
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    key: "lowercase",
    label: "One lowercase letter",
    test: (pw) => /[a-z]/.test(pw),
  },
  {
    key: "number",
    label: "One number",
    test: (pw) => /\d/.test(pw),
  },
  {
    key: "special",
    label: "One special character",
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
];
