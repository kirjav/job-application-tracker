const request = require("supertest");
const app = require("../../app");

jest.mock("../../middleware/authMiddleware", () => (req, res, next) => {
    req.user = { userId: 1 };
    next();
});

jest.mock("../../utils/authHelpers", () => ({
    getAuthenticatedUser: jest.fn().mockResolvedValue({
        id: 1,
        email: "test@example.com",
        password: "$2b$10$fakehash",
    }),
}));

jest.mock("bcrypt", () => ({
    compare: jest.fn().mockResolvedValue(true),
    hash: jest.fn().mockResolvedValue("$2b$10$newfakehash"),
}));

jest.mock("../../utils/prisma", () => ({
    user: {
        delete: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
        update: jest.fn(),
    },
}));

const { user: mockUser } = require("../../utils/prisma");

describe("Integration: /user routes", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("DELETE /user/delete-account", () => {
        it("returns 204 if deletion is successful", async () => {
            const res = await request(app)
                .delete("/user/delete-account")
                .send({ password: "CorrectPass123!" });

            expect(res.status).toBe(204);
            expect(mockUser.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        });

        it("returns 400 if password is missing", async () => {
            const res = await request(app)
                .delete("/user/delete-account")
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ path: ["password"] }),
                ])
            );
        });
    });

    describe("PUT /user/update-email", () => {
        it("returns 200 if email update is successful", async () => {
            mockUser.findUnique.mockResolvedValue(null);
            mockUser.update.mockResolvedValue({ id: 1 });

            const res = await request(app)
                .put("/user/update-email")
                .send({ password: "CorrectPass123!", newEmail: "new@example.com" });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Email updated successfully");
            expect(mockUser.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { email: "new@example.com" },
            });
        });

        it("returns 409 if new email is taken", async () => {
            mockUser.findUnique.mockResolvedValue({ id: 999 });

            const res = await request(app)
                .put("/user/update-email")
                .send({ password: "CorrectPass123!", newEmail: "taken@example.com" });

            expect(res.status).toBe(409);
            expect(res.body.error).toBe("Email already in use");
        });

        it("returns 400 if newEmail is missing", async () => {
            const res = await request(app)
                .put("/user/update-email")
                .send({ password: "CorrectPass123!" });

            expect(res.status).toBe(400);
            expect(res.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ path: ["newEmail"] }),
                ])
            );
        });

        it("returns 400 if email format is invalid", async () => {
            const res = await request(app)
                .put("/user/update-email")
                .send({ password: "CorrectPass123!", newEmail: "not-an-email" });

            expect(res.status).toBe(400);
            expect(res.body.errors[0]).toMatchObject({
                path: ["newEmail"],
                message: expect.stringMatching(/invalid/i),
            });
        });
    });

    describe("PUT /user/update-password", () => {
        it("returns 200 if password update is successful", async () => {
            const res = await request(app)
                .put("/user/update-password")
                .send({
                    old_password: "CorrectPass123!",
                    new_password: "NewPass123!",
                });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Password updated successfully");
            expect(mockUser.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { password: "$2b$10$newfakehash" },
            });
        });

        it("returns 400 if password is weak", async () => {
            const res = await request(app)
                .put("/user/update-password")
                .send({
                    old_password: "CorrectPass123!",
                    new_password: "123",
                });


            expect(res.status).toBe(400);
            expect(res.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: ["new_password"],
                        message: "Password must be at least 8 characters",
                    }),
                    expect.objectContaining({
                        path: ["new_password"],
                        message: "Password must include uppercase, lowercase, number, and special character",
                    }),
                ])
            );

        });

        it("returns 400 if fields are missing", async () => {
            const res = await request(app)
                .put("/user/update-password")
                .send({ new_password: "NewPass123!" });

            expect(res.status).toBe(400);
            expect(res.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ path: ["old_password"] }),
                ])
            );
        });
    });
});