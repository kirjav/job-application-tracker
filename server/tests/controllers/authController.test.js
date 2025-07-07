const { registerUser, loginUser } = require("../../controllers/authController");

const prisma = require("../../utils/prisma");
const { isPasswordComplex, hashPassword, verifyPasswordMatch } = require("../../utils/passwordUtils");
const jwt = require("jsonwebtoken");
const { handleError } = require("../../utils/handleError");

// 🧪 Mock response object
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ⬇️ Mocks
jest.mock("../../utils/prisma", () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("../../utils/passwordUtils", () => ({
  isPasswordComplex: jest.fn(),
  hashPassword: jest.fn(),
  verifyPasswordMatch: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));

jest.mock("../../utils/handleError", () => ({
  handleError: jest.fn((res, err, msg) =>
    res.status(err.status || 500).json({ error: msg })
  ),
}));

describe("Unit: authController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerUser", () => {
    it("should return 400 if email or password missing", async () => {
      const res = mockRes();
      await registerUser({ body: { email: "" } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Email and password required" });
    });

    it("should return 409 if user already exists", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 });
      const res = mockRes();
      await registerUser({ body: { email: "test@example.com", password: "Test123!" } }, res);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: "User already exists" });
    });

    it("should return 400 if password is not complex", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      isPasswordComplex.mockReturnValue(false);

      const res = mockRes();
      await registerUser({ body: { email: "test@example.com", password: "simple" } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Password does not meet complexity requirements" });
    });

    it("should create user and return 201", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      isPasswordComplex.mockReturnValue(true);
      hashPassword.mockResolvedValue("hashed_pw");
      prisma.user.create.mockResolvedValue({ id: 1 });

      const res = mockRes();
      await registerUser({ body: { email: "test@example.com", password: "Test123!" } }, res);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "test@example.com",
          password: "hashed_pw",
        },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: "User created successfully!" });
    });

    it("should call handleError on error", async () => {
      prisma.user.findUnique.mockRejectedValue(new Error("db error"));
      const res = mockRes();
      await registerUser({ body: { email: "test@example.com", password: "Test123!" } }, res);
      expect(handleError).toHaveBeenCalledWith(res, expect.any(Error), "Internal server error");
    });
  });

  describe("loginUser", () => {
    it("should return 400 if missing credentials", async () => {
      const res = mockRes();
      await loginUser({ body: { email: "" } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Email and password required" });
    });

    it("should return 401 if user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const res = mockRes();
      await loginUser({ body: { email: "fake@example.com", password: "pass" } }, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
    });

    it("should return token on successful login", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        password: "hashed_pw",
      });
      verifyPasswordMatch.mockResolvedValue();
      jwt.sign.mockReturnValue("mock.jwt.token");

      const res = mockRes();
      await loginUser({ body: { email: "test@example.com", password: "Test123!" } }, res);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 1, email: "test@example.com" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ token: "mock.jwt.token" });
    });

    it("should call handleError on error", async () => {
      prisma.user.findUnique.mockRejectedValue(new Error("fail"));
      const res = mockRes();
      await loginUser({ body: { email: "test@example.com", password: "pass" } }, res);
      expect(handleError).toHaveBeenCalledWith(res, expect.any(Error), "Internal server error");
    });
  });
});
