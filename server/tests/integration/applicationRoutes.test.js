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
    tag: {
        findMany: jest.fn(),
    },
}));

jest.mock("../../services/applicationService", () => ({
    getPaginatedApplications: jest.fn(),
}));

const request = require("supertest");
const app = require("../../app");
const { createMockApplication } = require("../__mocks__/mockApplication");
const prisma = require("../../utils/prisma");
const { getPaginatedApplications } = require("../../services/applicationService");


describe("Integration: /applications routes", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /applications", () => {
        it("should create a new application with tags", async () => {
            const mockApp = createMockApplication();
            const tagIds = [10, 11];
            prisma.tag.findMany.mockResolvedValue([
                { id: 10, name: "Remote", userId: 1 },
                { id: 11, name: "Urgent", userId: 1 },
            ]);
            prisma.application.create.mockResolvedValue(mockApp);

            const res = await request(app).post("/applications").send({
                company: mockApp.company,
                position: mockApp.position,
                status: mockApp.status,
                source: mockApp.source,
                notes: mockApp.notes,
                dateApplied: mockApp.dateApplied.toISOString(),
                resumeUrl: mockApp.resumeUrl,
                tagIds,
            });

            expect(res.status).toBe(201);
            expect(prisma.tag.findMany).toHaveBeenCalledWith({
                where: {
                    id: { in: tagIds },
                    userId: 1,
                },
            });
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
                    tags: { connect: [{ id: 10 }, { id: 11 }] },
                },
            });
        });
    });

    describe("GET /applications", () => {
        it("should return paginated applications for the user", async () => {
            const mockResponse = {
                applications: [
                    createMockApplication(),
                    createMockApplication({ id: 102, company: "B Corp" }),
                ],
                totalCount: 2,
                currentPage: 1,
                totalPages: 1,
                pageSize: 10,
            };

            getPaginatedApplications.mockResolvedValue(mockResponse);

            const res = await request(app).get("/applications").query({
                page: 1,
                pageSize: 10,
                tags: ["Remote", "Urgent"], // Optional: simulate filters
            });

            expect(res.status).toBe(200);
            expect(res.body.applications.length).toBe(2);
            expect(res.body.totalCount).toBe(2);

            expect(getPaginatedApplications).toHaveBeenCalledWith({
                userId: 1,
                page: 1,
                pageSize: 10,
                tagFilter: ["Remote", "Urgent"],
            });
        });

        it("should handle errors gracefully", async () => {
            getPaginatedApplications.mockRejectedValue(new Error("Failed to fetch application"));

            const res = await request(app).get("/applications");

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to fetch application");
        });
    });

    describe("PUT /applications/:id", () => {
        it("should update an application with tags", async () => {
            const mockApp = createMockApplication();
            const tagIds = [10, 11];
            prisma.application.findUnique.mockResolvedValue(mockApp);
            prisma.tag.findMany.mockResolvedValue([
                { id: 10, name: "Remote", userId: 1 },
                { id: 11, name: "Urgent", userId: 1 },
            ]);
            prisma.application.update.mockResolvedValue({
                ...mockApp,
                status: "Interview",
            });

            const res = await request(app).put("/applications/101").send({
                ...mockApp,
                status: "Interview",
                dateApplied: mockApp.dateApplied.toISOString(),
                tagIds,
            });

            expect(res.status).toBe(200);
            expect(prisma.tag.findMany).toHaveBeenCalledWith({
                where: {
                    id: { in: tagIds },
                    userId: 1,
                },
            });
            expect(prisma.application.update).toHaveBeenCalledWith({
                where: { id: 101 },
                data: expect.objectContaining({
                    status: "Interview",
                    tags: { set: [{ id: 10 }, { id: 11 }] },
                }),
            });
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
            expect(prisma.application.delete).toHaveBeenCalledWith({
                where: { id: 101 },
            });
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
