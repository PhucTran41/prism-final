import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMocks } from "node-mocks-http";
import { GET, DELETE } from "@/app/api/projects/[projectId]/route";
import { prismaClientMock } from "../setup";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { ProjectStatus } from "@prisma/client";

vi.mock("next-auth");

describe("Project API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/projects/[projectId]", () => {
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

    it("returns 403 if user does not own the project", async () => {
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

    it("returns 404 if project not found", async () => {
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
        name: "Project 1",
        description: "Description 1",
        ownerId: 1,
        status: ProjectStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      prismaClientMock.project.findUnique.mockResolvedValue(null);

      const { req } = createMocks({ method: "GET" });

      const response = await GET(req as NextRequest, {
        params: Promise.resolve({ projectId: "1" }),
      });

      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Not found");
    });

    it("returns the project for the authenticated owner", async () => {
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
        name: "Project 1",
        description: "Description 1",
        ownerId: 1,
        status: ProjectStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      prismaClientMock.project.findFirst.mockResolvedValue(project);
      prismaClientMock.project.findUnique.mockResolvedValue(project);

      const { req } = createMocks({ method: "GET" });

      const response = await GET(req as NextRequest, {
        params: Promise.resolve({ projectId: "1" }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("Project 1");
    });
  });

  describe("DELETE /api/projects/[projectId]", () => {
    it("returns 401 if user is not authenticated", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { req } = createMocks({ method: "DELETE" });

      const response = await DELETE(req as NextRequest, {
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

      prismaClientMock.user.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const { req } = createMocks({ method: "DELETE" });

      const response = await DELETE(req as NextRequest, {
        params: Promise.resolve({ projectId: "invalid" }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid projectId");
    });

    it("deletes the project", async () => {
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
        name: "Project 1",
        description: "Description 1",
        ownerId: 1,
        status: ProjectStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      prismaClientMock.project.findFirst.mockResolvedValue(project);
      prismaClientMock.project.update.mockResolvedValue({
        ...project,
        deletedAt: new Date(),
      });

      const { req } = createMocks({ method: "DELETE" });

      const response = await DELETE(req as NextRequest, {
        params: Promise.resolve({ projectId: "1" }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(prismaClientMock.project.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
