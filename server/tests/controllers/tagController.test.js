jest.mock("../../utils/prisma", () => ({
    tag: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
    },
    application: {
        findUnique: jest.fn(),
    },
}));

jest.mock("../../utils/handleError", () => ({
    handleError: jest.fn((res, err, msg) =>
        res.status(err.status || 500).json({ error: msg })
    ),
}));

// Reusable mock res object
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
    getUserTags,
    createTag,
    deleteTag,
} = require("../../controllers/tagController");

const prisma = require("../../utils/prisma");
const { handleError } = require("../../utils/handleError");

describe("Unit: tagController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getUserTags", () => {
        it("should return all tags for the user", async () => {
            const tags = [{ id: 1, name: "Frontend", userId: 1 }];
            prisma.tag.findMany.mockResolvedValue(tags);

            const req = { user: { userId: 1 } };
            const res = mockRes();

            await getUserTags(req, res);

            expect(prisma.tag.findMany).toHaveBeenCalledWith({
                where: { userId: 1 },
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(tags);
        });

        it("should call handleError on failure", async () => {
            prisma.tag.findMany.mockRejectedValue(new Error("DB error"));

            const req = { user: { userId: 1 } };
            const res = mockRes();

            await getUserTags(req, res);

            expect(handleError).toHaveBeenCalledWith(
                res,
                expect.any(Error),
                "Failed to fetch tags"
            );
        });
    });

    describe("createTag", () => {
        it("should create a tag if it does not exist", async () => {
            const newTag = { id: 1, name: "Remote", userId: 1 };
            prisma.tag.findMany.mockResolvedValue([]);
            prisma.tag.create.mockResolvedValue(newTag);

            const req = {
                user: { userId: 1 },
                body: { name: "Remote" },
            };
            const res = mockRes();

            await createTag(req, res);
            expect(prisma.tag.findUnique).toHaveBeenCalledWith({
                where: {
                    userId_name: {
                        userId: 1,
                        name: "Remote",
                    },
                },
            });
            expect(prisma.tag.create).toHaveBeenCalledWith({
                data: {
                    name: "Remote",
                    userId: 1,
                },
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(newTag);
        });

        it("should return 200 and the existing tag if it already exists", async () => {
            const existingTag = { id: 1, name: "Remote", userId: 1 };

            prisma.tag.findUnique = jest.fn().mockResolvedValue(existingTag);

            const req = {
                user: { userId: 1 },
                body: { name: "Remote" },
            };
            const res = mockRes();

            await createTag(req, res);

            expect(prisma.tag.findUnique).toHaveBeenCalledWith({
                where: {
                    userId_name: {
                        userId: 1,
                        name: "Remote",
                    },
                },
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(existingTag);
        });


        it("should call handleError on failure", async () => {
            prisma.tag.findUnique.mockResolvedValue(null); // So it proceeds to create
            prisma.tag.create.mockRejectedValue(new Error("fail")); // Force failure in `create`


            const req = {
                user: { userId: 1 },
                body: { name: "FailTag" },
            };
            const res = mockRes();

            await createTag(req, res);

            expect(handleError).toHaveBeenCalledWith(
                res,
                expect.any(Error),
                "Failed to create tag"
            );
        });
    });

    describe("deleteTag", () => {
        it("should delete tag if owned by user", async () => {
            const tag = { id: 1, name: "Urgent", userId: 1 };
            prisma.application.findUnique.mockResolvedValue(null); // skip app check
            prisma.tag.delete.mockResolvedValue({});

            const req = {
                params: { id: "1" },
                user: { userId: 1 },
            };
            const res = mockRes();

            // Override findUnique for tag (correct target)
            prisma.tag.findUnique = jest.fn().mockResolvedValue(tag);

            await deleteTag(req, res);

            expect(prisma.tag.delete).toHaveBeenCalledWith({
                where: { id: 1 },
            });
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });

        it("should return 404 if tag not found", async () => {
            prisma.tag.findUnique = jest.fn().mockResolvedValue(null);

            const req = {
                params: { id: "999" },
                user: { userId: 1 },
            };
            const res = mockRes();

            await deleteTag(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: "Tag not found" });
        });

        it("should return 403 if tag not owned by user", async () => {
            prisma.tag.findUnique = jest.fn().mockResolvedValue({
                id: 1,
                name: "OtherTag",
                userId: 2,
            });

            const req = {
                params: { id: "1" },
                user: { userId: 1 },
            };
            const res = mockRes();

            await deleteTag(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
        });

        it("should call handleError on failure", async () => {
            const req = {
                user: { userId: 1 },
                body: { name: "FailTag" },
            };
            const res = mockRes();

            prisma.tag.findUnique.mockResolvedValue(null); // simulate no existing tag
            prisma.tag.create.mockRejectedValue(new Error("Failed to create tag")); // force failure

            await createTag(req, res);

            expect(handleError).toHaveBeenCalledWith(
                res,
                expect.any(Error),
                "Failed to create tag"
            );
        });

    });
});
