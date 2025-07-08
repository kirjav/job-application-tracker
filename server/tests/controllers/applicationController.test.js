jest.mock("../../utils/prisma", () => ({
    application: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    tag: {
        findMany: jest.fn(), // <- this is the missing part
        findUnique: jest.fn(),
    },
}));

jest.mock("../../services/applicationService", () => ({
    getPaginatedApplications: jest.fn(),
}));

jest.mock("../../utils/handleError", () => ({
    handleError: jest.fn((res, err, msg) =>
        res.status(err.status || 500).json({ error: msg })
    ),
}));

const { handleError } = require("../../utils/handleError");

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
};

beforeEach(() => {
    jest.clearAllMocks();
});

const {
    createApplication,
    getUserApplications,
    updateApplication,
    deleteApplication,
} = require("../../controllers/applicationController");

const prisma = require("../../utils/prisma");
const { createMockApplication } = require("../__mocks__/mockApplication");
const { getPaginatedApplications } = require("../../services/applicationService");

describe("Unit: applicationController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createApplication", () => {
        it("should create a new application and connect valid tags", async () => {
            const mockApp = createMockApplication();
            const req = {
                body: {
                    ...mockApp,
                    tagIds: [1, 2],
                    dateApplied: mockApp.dateApplied.toISOString(),
                },
                user: { userId: 1 },
            };
            const res = mockRes();

            prisma.tag.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
            prisma.application.create.mockResolvedValue(mockApp);

            await createApplication(req, res);

            expect(prisma.tag.findMany).toHaveBeenCalled();
            expect(prisma.application.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockApp);
        });

        it("should call handleError on failure", async () => {
            const req = {
                body: createMockApplication(),
                user: { userId: 1 },
            };
            const res = mockRes();

            prisma.application.create.mockRejectedValue(new Error("fail"));

            await createApplication(req, res);
            expect(handleError).toHaveBeenCalledWith(res, expect.any(Error), "Failed to create application");
        });
    });

    describe("updateApplication", () => {
        it("should update application and reset tags", async () => {
            const mockApp = createMockApplication();
            prisma.application.findUnique.mockResolvedValue(mockApp);
            prisma.tag.findMany.mockResolvedValue([{ id: 1 }]);
            prisma.application.update.mockResolvedValue({ ...mockApp, status: "Interviewing" });

            const req = {
                params: { id: "101" },
                body: {
                    ...mockApp,
                    tagIds: [1],
                    status: "Interviewing",
                    dateApplied: mockApp.dateApplied.toISOString(),
                },
                user: { userId: 1 },
            };
            const res = mockRes();

            await updateApplication(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "Interviewing" }));
        });

        it("should return 403 if user is not the owner", async () => {
            prisma.application.findUnique.mockResolvedValue(createMockApplication({ userId: 2 }));

            const req = {
                params: { id: "101" },
                body: {},
                user: { userId: 1 },
            };
            const res = mockRes();

            await updateApplication(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
        });

        it("should return 404 if application not found", async () => {
            prisma.application.findUnique.mockResolvedValue(null);

            const req = {
                params: { id: "101" },
                body: {},
                user: { userId: 1 },
            };
            const res = mockRes();

            await updateApplication(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: "Application not found" });
        });
    });

    describe("getUserApplications", () => {
        it("should fetch paginated apps for user", async () => {
            const mockData = {
                applications: [
                    createMockApplication(),
                    createMockApplication({ id: 102 }),
                ],
                totalCount: 2,
                currentPage: 1,
                totalPages: 1,
                pageSize: 10,
            };

            getPaginatedApplications.mockResolvedValue(mockData);

            const req = {
                user: { userId: 1 },
                query: {
                    page: "1",
                    pageSize: "10",
                    tags: ["Remote", "Urgent"],
                },
            };
            const res = mockRes();

            await getUserApplications(req, res);

            expect(getPaginatedApplications).toHaveBeenCalledWith({
                userId: 1,
                page: 1,
                pageSize: 10,
                tagFilter: ["Remote", "Urgent"],
            });

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockData);
        });

        it("should handle errors and call handleError", async () => {
            const req = { user: { userId: 1 }, query: {} };
            const res = mockRes();

            getPaginatedApplications.mockRejectedValue(new Error("DB fail"));

            await getUserApplications(req, res);

            expect(handleError).toHaveBeenCalledWith(
                res,
                expect.any(Error),
                "Failed to fetch application"
            );
        });
    });

    describe("deleteApplication", () => {
        it("should delete user-owned app", async () => {
            const mockApp = createMockApplication();
            prisma.application.findUnique.mockResolvedValue(mockApp);
            prisma.application.delete.mockResolvedValue({});

            const req = {
                params: { id: "101" },
                user: { userId: 1 },
            };
            const res = mockRes();

            await deleteApplication(req, res);
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });

        it("should return 403 for deleting someone else’s app", async () => {
            prisma.application.findUnique.mockResolvedValue(createMockApplication({ userId: 2 }));

            const req = {
                params: { id: "101" },
                user: { userId: 1 },
            };
            const res = mockRes();

            await deleteApplication(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
        });

        it("should return 404 if app doesn’t exist", async () => {
            prisma.application.findUnique.mockResolvedValue(null);

            const req = {
                params: { id: "999" },
                user: { userId: 1 },
            };
            const res = mockRes();

            await deleteApplication(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: "Application not found" });
        });
    });
});

