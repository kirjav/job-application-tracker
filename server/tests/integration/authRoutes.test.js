const request = require("supertest");
const app = require("../../app");

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

const prisma = require("../../utils/prisma");
const passwordUtils = require("../../utils/passwordUtils");
const jwt = require("jsonwebtoken");

describe("Integration: /auth routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      passwordUtils.isPasswordComplex.mockReturnValue(true);
      passwordUtils.hashPassword.mockResolvedValue("hashed_pw");
      prisma.user.create.mockResolvedValue({ id: 1 });

      const res = await request(app).post("/auth/register").send({
        email: "test@example.com",
        password: "Strong123!",
      });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("User created successfully!");
    });

    it("should return 409 if user already exists", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 });

      const res = await request(app).post("/auth/register").send({
        email: "test@example.com",
        password: "Strong123!",
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("User already exists");
    });

    it("should return 400 if password is weak", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      passwordUtils.isPasswordComplex.mockReturnValue(false); // Optional, might not even be called now

      const res = await request(app).post("/auth/register").send({
        email: "test@example.com",
        password: "weak",
      });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["password"],
            message: expect.stringMatching(/Password must.*complexity requirements|uppercase/i),
          }),
        ])
      );
    });


    it("should return 400 if email or password is missing", async () => {
      const res = await request(app).post("/auth/register").send({
        email: "",
        password: "",
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it("should return 400 if email is invalid format", async () => {
      const res = await request(app).post("/auth/register").send({
        email: "not-an-email",
        password: "Strong123!",
      });

      expect(res.status).toBe(400);
      expect(res.body.errors[0]).toMatchObject({
        path: ["email"],
        message: expect.stringMatching(/invalid/i),
      });
    });
  });

  describe("POST /auth/login", () => {
    it("should return token on successful login", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        password: "hashed_pw",
      });
      passwordUtils.verifyPasswordMatch.mockResolvedValue();
      jwt.sign.mockReturnValue("mock.jwt.token");

      const res = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "Strong123!",
      });

      expect(res.status).toBe(200);
      expect(res.body.token).toBe("mock.jwt.token");
    });

    it("should return 401 if user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app).post("/auth/login").send({
        email: "fake@example.com",
        password: "Strong123!",
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid credentials");
    });

    it("should return 400 if email or password missing", async () => {
      const res = await request(app).post("/auth/login").send({
        email: "",
        password: "",
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it("should return 400 if email format is invalid", async () => {
      const res = await request(app).post("/auth/login").send({
        email: "badformat",
        password: "Strong123!",
      });

      expect(res.status).toBe(400);
      expect(res.body.errors[0]).toMatchObject({
        path: ["email"],
        message: expect.stringMatching(/invalid/i),
      });
    });
  });
});