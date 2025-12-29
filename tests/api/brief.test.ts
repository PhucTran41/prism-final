import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMocks } from "node-mocks-http";
import { GET, PUT } from "@/app/api/projects/[projectId]/brief/route";
import { prismaClientMock } from "../setup";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { ProjectStatus } from "@prisma/client";

vi.mock("next-auth");

describe("Brief API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/projects/[projectId]/brief", () => {
    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { req } = createMocks({ method: "GET" });

      const response = await GET(req as NextRequest, {
        params: Promise.resolve({ projectId: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 for invalid projectId", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: "test@example.com" },
      });

      prismaClientMock.user.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const { req } = createMocks({ method: "GET" });

      const response = await GET(req as NextRequest, {
        params: Promise.resolve({ projectId: "invalid" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid projectId");
    });

    it("should return 403 if user does not own the project", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: "test@example.com" },
      });

      prismaClientMock.user.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
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

    it("should return the project brief", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: "test@example.com" },
      });

      prismaClientMock.user.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const project = {
        id: 1,
        ownerId: 1,
        name: "Project 1",
        description: "Description 1",
        status: ProjectStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const document = {
        id: 1,
        projectId: 1,
        type: "BRIEF",
        title: "Project Brief",
        latestVersion: 1,
        contentMd: "Brief content",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      prismaClientMock.project.findFirst.mockResolvedValue(project);
      prismaClientMock.document.findFirst.mockResolvedValue(document);

      const { req } = createMocks({ method: "GET" });

      const response = await GET(req as NextRequest, {
        params: Promise.resolve({ projectId: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.document.contentMd).toBe("Brief content");
    });
  });

  describe("PUT /api/projects/[projectId]/brief", () => {
    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { req } = createMocks({
        method: "PUT",
        body: { contentMd: "Updated content" },
      });

      req.json = async () => ({ contentMd: "Updated content" });

      const response = await PUT(req as NextRequest, {
        params: Promise.resolve({ projectId: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 for invalid payload", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: "test@example.com" },
      });

      prismaClientMock.user.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      prismaClientMock.project.findFirst.mockResolvedValue({
        id: 1,
        ownerId: 1,
        name: "Project 1",
        description: "Description 1",
        status: ProjectStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const { req } = createMocks({ method: "PUT" });
      req.json = async () => ({ contentMd: "" });

      const response = await PUT(req as NextRequest, {
        params: Promise.resolve({ projectId: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid payload");
    });

    it("should update the project brief", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: "test@example.com" },
      });

      prismaClientMock.user.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const project = {
        id: 1,
        ownerId: 1,
        name: "Project 1",
        description: "Description 1",
        status: ProjectStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const updatedDocument = {
        id: 1,
        projectId: 1,
        type: "BRIEF",
        title: "Project Brief",
        latestVersion: 2,
        contentMd: "Updated content",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      prismaClientMock.project.findFirst.mockResolvedValue(project);
      prismaClientMock.document.upsert.mockResolvedValue(updatedDocument);

      const { req } = createMocks({ method: "PUT" });
      req.json = async () => ({ contentMd: "Updated content" });

      const response = await PUT(req as NextRequest, {
        params: Promise.resolve({ projectId: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.document.contentMd).toBe("Updated content");

      expect(prismaClientMock.document.upsert).toHaveBeenCalledWith({
        where: {
          projectId_type: {
            projectId: 1,
            type: "BRIEF",
          },
        },
        create: {
          projectId: 1,
          type: "BRIEF",
          title: "Project Brief",
          contentMd: "Updated content",
        },
        update: {
          contentMd: "Updated content",
        },
      });
    });
  });
});
