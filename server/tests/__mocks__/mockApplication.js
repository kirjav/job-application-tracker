function createMockApplication(overrides = {}) {
  return {
    id: 101,
    company: "Acme Corp",
    position: "Software Engineer",
    status: "Applied",
    source: "LinkedIn",
    notes: "Followed up via email",
    dateApplied: new Date("2025-06-01"),
    dateUpdated: new Date("2025-06-02"),
    resumeUrl: "https://example.com/resume.pdf",
    userId: 1,
    ...overrides,
  };
}

module.exports = { createMockApplication };
