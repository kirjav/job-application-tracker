const {
    createApplication,
    getUserApplications,
    updateApplication,
    deleteApplication,
} = require("../../controllers/applicationController");

const prisma = require("../../utils/prisma");
const { createMockApplication } = require("../__mocks__/mockApplication");

// Mock res object
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
};

jest.mock("../../utils/prisma", () => ({
    application: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
}));

jest.mock("../../utils/handleError", () => ({
    handleError: jest.fn((res, err, msg) =>
        res.status(err.status || 500).json({ error: msg })
    ),
}));

const { handleError } = require("../../utils/handleError");

describe("Unit: applicationController", () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createApplication", () => {
        it("should create and return a new application", async () => {
            const mockApp = createMockApplication();
            prisma.application.create.mockResolvedValue(mockApp);

            const req = {
                body: { ...mockApp, dateApplied: mockApp.dateApplied.toISOString() },
                user: { userId: 1 },
            };
            const res = mockRes();

            await createApplication(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockApp);
        });

        it("should call handleError on failure", async () => {
            prisma.application.create.mockRejectedValue(new Error("fail"));

            const req = {
                body: createMockApplication(),
                user: { userId: 1 },
            };
            const res = mockRes();

            await createApplication(req, res);
            expect(handleError).toHaveBeenCalledWith(res, expect.any(Error), "Failed to create application");
        });
    });

    describe("getUserApplications", () => {
        it("should return all applications for the user", async () => {
            const mockApps = [createMockApplication(), createMockApplication({ id: 102 })];
            prisma.application.findMany.mockResolvedValue(mockApps);

            const req = { user: { userId: 1 } };
            const res = mockRes();

            await getUserApplications(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockApps);
        });
    });

    describe("updateApplication", () => {
        it("should update an application and return it", async () => {
            const mockApp = createMockApplication();
            prisma.application.findUnique.mockResolvedValue(mockApp);
            prisma.application.update.mockResolvedValue({ ...mockApp, status: "Updated" });

            const req = {
                params: { id: "101" },
                body: { ...mockApp, status: "Updated", dateApplied: mockApp.dateApplied.toISOString() },
                user: { userId: 1 },
            };
            const res = mockRes();

            await updateApplication(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "Updated" }));
        });

        it("should return 403 if user is not the owner", async () => {
            const mockApp = createMockApplication({ userId: 2 });
            prisma.application.findUnique.mockResolvedValue(mockApp);

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

        it("should return 404 if app not found", async () => {
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

    describe("deleteApplication", () => {
        it("should delete the application", async () => {
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

        it("should return 403 if user is not the owner", async () => {
            const mockApp = createMockApplication({ userId: 2 });
            prisma.application.findUnique.mockResolvedValue(mockApp);

            const req = {
                params: { id: "101" },
                user: { userId: 1 },
            };
            const res = mockRes();

            await deleteApplication(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
        });

        it("should return 404 if app not found", async () => {
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
