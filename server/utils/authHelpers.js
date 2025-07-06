const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getAuthenticatedUser(userId) {
  if (!userId) throw new Error("User ID is required");

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  return user;
}

module.exports = { getAuthenticatedUser };