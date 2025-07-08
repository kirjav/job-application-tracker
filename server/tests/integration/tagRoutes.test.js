const request = require("supertest");
const app = require("../../app");

// Mock req.user injection via auth middleware
jest.mock("../../middleware/authMiddleware", () => (req, res, next) => {
  req.user = { userId: 1 };
  next();
});

jest.mock("../../utils/prisma", () => ({
  tag: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
}));

const prisma = require("../../utils/prisma");

describe("Integration: /tags routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /tags", () => {
    it("should return all tags for the user", async () => {
      const mockTags = [
        { id: 1, name: "Remote", userId: 1 },
        { id: 2, name: "Frontend", userId: 1 },
      ];
      prisma.tag.findMany.mockResolvedValue(mockTags);

      const res = await request(app).get("/tags");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockTags);
      expect(prisma.tag.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });
  });

  describe("POST /tags", () => {
    it("should create a new tag", async () => {
      const newTag = { id: 3, name: "Urgent", userId: 1 };
      prisma.tag.findUnique.mockResolvedValue(null);
      prisma.tag.create.mockResolvedValue(newTag);

      const res = await request(app).post("/tags").send({ name: "Urgent" });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(newTag);
      expect(prisma.tag.findUnique).toHaveBeenCalledWith({
        where: {
          userId_name: {
            userId: 1,
            name: "Urgent",
          },
        },
      });
      expect(prisma.tag.create).toHaveBeenCalledWith({
        data: { name: "Urgent", userId: 1 },
      });
    });

    it("should return the existing tag if already exists", async () => {
      const existingTag = { id: 4, name: "Duplicate", userId: 1 };
      prisma.tag.findUnique.mockResolvedValue(existingTag);

      const res = await request(app).post("/tags").send({ name: "Duplicate" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(existingTag);
    });

    it("should return 400 if name is missing", async () => {
      const res = await request(app).post("/tags").send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
      expect(res.body.errors[0]).toMatchObject({
        path: ["name"],
        message: expect.stringMatching(/required/i),
      });
    });

    it("should return 400 if name contains special characters", async () => {
      const res = await request(app).post("/tags").send({ name: "Invalid!" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
      expect(res.body.errors[0]).toMatchObject({
        path: ["name"],
        message: "Tag name must not contain spaces or special characters",
      });

    });
  });

  describe("DELETE /tags/:id", () => {
    it("should delete a tag if user owns it", async () => {
      prisma.tag.findUnique.mockResolvedValue({ id: 5, name: "ToDelete", userId: 1 });
      prisma.tag.delete.mockResolvedValue({});

      const res = await request(app).delete("/tags/5");

      expect(res.status).toBe(204);
      expect(prisma.tag.delete).toHaveBeenCalledWith({
        where: { id: 5 },
      });
    });

    it("should return 404 if tag not found", async () => {
      prisma.tag.findUnique.mockResolvedValue(null);

      const res = await request(app).delete("/tags/999");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Tag not found" });
    });

    it("should return 403 if user does not own tag", async () => {
      prisma.tag.findUnique.mockResolvedValue({ id: 5, name: "OtherUserTag", userId: 2 });

      const res = await request(app).delete("/tags/5");

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Forbidden" });
    });
  });
});