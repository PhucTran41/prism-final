import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMocks } from "node-mocks-http";
import { GET, POST } from "@/app/api/projects/route";
import { prismaClientMock } from "../setup";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { ProjectStatus } from "@prisma/client";

vi.mock("next-auth");

describe("Projects API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/projects", () => {
    it("returns 401 if user is not authenticated", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns an empty array if user has no projects", async () => {
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

      prismaClientMock.project.findMany.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.projects).toEqual([]);
    });

    it("returns projects for the authenticated user", async () => {
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

      const projects = [
        {
          id: 1,
          name: "Project 1",
          description: "Description 1",
          ownerId: 1,
          status: ProjectStatus.DRAFT,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 2,
          name: "Project 2",
          description: "Description 2",
          ownerId: 1,
          status: ProjectStatus.DRAFT,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      prismaClientMock.project.findMany.mockResolvedValue(projects);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.projects).toHaveLength(2);
      expect(data.projects[0].name).toBe("Project 1");
    });
  });

  describe("POST /api/projects", () => {
    it("returns 401 if user is not authenticated", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { req } = createMocks({
        method: "POST",
        body: {
          name: "New Project",
          description: "A new project description",
        },
      });

      const response = await POST(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 400 for invalid payload", async () => {
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

      const { req } = createMocks({
        method: "POST",
        body: { name: "" },
      });

      req.json = async () => ({ name: "" });

      const response = await POST(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid payload");
    });

    it("creates a new project with valid payload", async () => {
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

      const projectData = {
        name: "New Project",
        description: "A new project description",
      };

      const createdProject = {
        id: 1,
        ...projectData,
        ownerId: 1,
        status: ProjectStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      prismaClientMock.project.create.mockResolvedValue(createdProject);

      const { req } = createMocks({
        method: "POST",
        body: projectData,
      });

      req.json = async () => projectData;

      const response = await POST(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe(projectData.name);
      expect(data.description).toBe(projectData.description);

      expect(prismaClientMock.project.create).toHaveBeenCalledWith({
        data: {
          name: projectData.name,
          description: projectData.description,
          ownerId: 1,
          status: ProjectStatus.DRAFT,
        },
      });
    });
  });
});
