import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMocks } from "node-mocks-http";
import { GET } from "@/app/api/projects/[projectId]/scope/route";
import { prismaClientMock } from "../setup";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { ProjectStatus } from "@prisma/client";

vi.mock("next-auth");

describe("Scope API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/projects/[projectId]/scope", () => {
    it("returns 401 if user is not authenticated", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { req } = createMocks({ method: "GET" });

      const response = await GET(req as NextRequest, {
        params: Promise.resolve({ projectId: "1" }),
      });

      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 400 for invalid projectId", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: "test@example.com" },
      });

      const { req } = createMocks({ method: "GET" });

      const response = await GET(req as NextRequest, {
        params: Promise.resolve({ projectId: "invalid" }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid projectId");
    });

    it("returns 403 if user does not own the project", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: "test@example.com" },
      });

      prismaClientMock.project.findFirst.mockResolvedValue(null);

      const { req } = createMocks({ method: "GET" });

      const response = await GET(req as NextRequest, {
        params: Promise.resolve({ projectId: "1" }),
      });

      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("returns the project scope document", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: "test@example.com" },
      });

      const project = {
        id: 1,
        name: "Project 1",
        description: "Description 1",
        ownerId: 1,
        status: ProjectStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const scopeDocument = {
        id: 1,
        projectId: 1,
        type: "SCOPE",
        title: "Project Scope",
        contentMd: "Scope content",
        latestVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      prismaClientMock.project.findFirst.mockResolvedValue(project);
      prismaClientMock.document.findUnique.mockResolvedValue(scopeDocument);

      const { req } = createMocks({ method: "GET" });

      const response = await GET(req as NextRequest, {
        params: Promise.resolve({ projectId: "1" }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.document.contentMd).toBe("Scope content");
    });
  });
});
