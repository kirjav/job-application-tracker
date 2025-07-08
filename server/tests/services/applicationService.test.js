jest.mock("../../utils/prisma", () => ({
  application: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
}));

const prisma = require("../../utils/prisma");

const { getPaginatedApplications } = require("../../services/applicationService");


describe("Unit: applicationService.getPaginatedApplications", () => {
  const mockApps = [
    { id: 1, company: "Acme", tags: [{ tag: { name: "Remote" } }] },
    { id: 2, company: "Globex", tags: [{ tag: { name: "Urgent" } }] },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return paginated applications without tag filter", async () => {
    prisma.application.findMany.mockResolvedValue(mockApps);
    prisma.application.count.mockResolvedValue(15);

    const result = await getPaginatedApplications({
      userId: 1,
      page: 1,
      pageSize: 10,
    });

    expect(prisma.application.findMany).toHaveBeenCalledWith({
      where: { userId: 1 },
      orderBy: { dateApplied: "desc" },
      skip: 0,
      take: 10,
      include: {
        tags: { include: { tag: true } },
      },
    });

    expect(result.totalPages).toBe(2);
  });

  it("should return filtered applications by tag", async () => {
    prisma.application.findMany.mockResolvedValue([mockApps[0]]);
    prisma.application.count.mockResolvedValue(1);

    const result = await getPaginatedApplications({
      userId: 1,
      page: 1,
      pageSize: 5,
      tagFilter: ["Remote"],
    });

    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tags: {
            some: {
              tag: {
                name: { in: ["Remote"] },
                userId: 1,
              },
            },
          },
        }),
      })
    );

    expect(result.totalPages).toBe(1);
  });

  it("should handle empty result sets", async () => {
    prisma.application.findMany.mockResolvedValue([]);
    prisma.application.count.mockResolvedValue(0);

    const result = await getPaginatedApplications({
      userId: 1,
      page: 2,
      pageSize: 10,
    });

    expect(result.applications).toEqual([]);
    expect(result.totalPages).toBe(0);
  });

  // ─── EDGE CASES ─────────────────────────────────────────────

  it("should default to page=1 if negative page is given", async () => {
    prisma.application.findMany.mockResolvedValue([]);
    prisma.application.count.mockResolvedValue(0);

    await getPaginatedApplications({
      userId: 1,
      page: -3,
      pageSize: 10,
    });

    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0 })
    );
  });

  it("should default to pageSize=10 if pageSize is zero or negative", async () => {
    prisma.application.findMany.mockResolvedValue([]);
    prisma.application.count.mockResolvedValue(0);

    await getPaginatedApplications({
      userId: 1,
      page: 1,
      pageSize: 0,
    });

    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 })
    );

    await getPaginatedApplications({
      userId: 1,
      page: 1,
      pageSize: -5,
    });

    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 })
    );
  });

  it("should handle non-array tagFilter gracefully", async () => {
    prisma.application.findMany.mockResolvedValue([]);
    prisma.application.count.mockResolvedValue(0);

    const result = await getPaginatedApplications({
      userId: 1,
      page: 1,
      pageSize: 10,
      tagFilter: "not-an-array",
    });

    expect(result).toEqual({
      applications: [],
      totalCount: 0,
      currentPage: 1,
      totalPages: 0,
      pageSize: 10,
    });
  });
});