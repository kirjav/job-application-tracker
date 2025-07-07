const request = require("supertest");
const app = require("../../app");
const { createMockApplication } = require("../__mocks__/mockApplication");

// ⬇️ Inject req.user
jest.mock("../../middleware/authMiddleware", () => (req, res, next) => {
    req.user = { userId: 1 };
    next();
});

jest.mock("../../utils/prisma", () => ({
    application: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
}));

const prisma = require("../../utils/prisma");

describe("Integration: /applications routes", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });


    describe("POST /applications", () => {
        it("should create a new application", async () => {
            const mockApp = createMockApplication();
            prisma.application.create.mockResolvedValue(mockApp);

            const res = await request(app).post("/applications").send({
                company: mockApp.company,
                position: mockApp.position,
                status: mockApp.status,
                source: mockApp.source,
                notes: mockApp.notes,
                dateApplied: mockApp.dateApplied.toISOString(),
                resumeUrl: mockApp.resumeUrl,
            });

            expect(res.status).toBe(201);
            expect(res.body.company).toBe(mockApp.company);
            expect(prisma.application.create).toHaveBeenCalledWith({
                data: {
                    company: mockApp.company,
                    position: mockApp.position,
                    status: mockApp.status,
                    source: mockApp.source,
                    notes: mockApp.notes,
                    dateApplied: new Date(mockApp.dateApplied),
                    resumeUrl: mockApp.resumeUrl,
                    userId: 1,
                },
            });
        });
    });

    describe("GET /applications", () => {
        it("should return all applications for user", async () => {
            const mockApps = [createMockApplication(), createMockApplication({ id: 102 })];
            prisma.application.findMany.mockResolvedValue(mockApps);

            const res = await request(app).get("/applications");

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(prisma.application.findMany).toHaveBeenCalledWith({
                where: { userId: 1 },
                orderBy: { dateApplied: "desc" },
            });
        });
    });

    describe("PUT /applications/:id", () => {
        it("should update an application", async () => {
            const mockApp = createMockApplication();
            prisma.application.findUnique.mockResolvedValue(mockApp);
            prisma.application.update.mockResolvedValue({ ...mockApp, status: "Interview" });

            const res = await request(app)
                .put("/applications/101")
                .send({ ...mockApp, status: "Interview", dateApplied: mockApp.dateApplied.toISOString() });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe("Interview");
            expect(prisma.application.update).toHaveBeenCalled();
        });

        it("should return 403 if user is not the owner", async () => {
            const mockApp = createMockApplication({ userId: 2 });
            prisma.application.findUnique.mockResolvedValue(mockApp);

            const res = await request(app).put("/applications/101").send({});

            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Forbidden");
        });

        it("should return 404 if app doesn't exist", async () => {
            prisma.application.findUnique.mockResolvedValue(null);

            const res = await request(app).put("/applications/999").send({});

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Application not found");
        });
    });

    describe("DELETE /applications/:id", () => {
        it("should delete an application", async () => {
            const mockApp = createMockApplication();
            prisma.application.findUnique.mockResolvedValue(mockApp);
            prisma.application.delete.mockResolvedValue({});

            const res = await request(app).delete("/applications/101");

            expect(res.status).toBe(204);
            expect(prisma.application.delete).toHaveBeenCalledWith({ where: { id: 101 } });
        });

        it("should return 403 if user is not the owner", async () => {
            const mockApp = createMockApplication({ userId: 2 });
            prisma.application.findUnique.mockResolvedValue(mockApp);

            const res = await request(app).delete("/applications/101");

            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Forbidden");
        });

        it("should return 404 if app doesn't exist", async () => {
            prisma.application.findUnique.mockResolvedValue(null);

            const res = await request(app).delete("/applications/999");

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Application not found");
        });
    });
});
