import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMocks } from "node-mocks-http";
import { POST } from "@/app/api/projects/[projectId]/brief/generate/route";
import { prismaClientMock } from "../setup";
import { getServerSession } from "next-auth";
import * as ai from "@/backend/ai";
import { AiSdkService } from "@/backend/modules/infrastructure/ai/aiSdkService";
import { NextRequest } from "next/server";
import { ProjectStatus } from "@prisma/client";

vi.mock("next-auth");
vi.mock("@/backend/ai");
vi.mock("@/backend/modules/infrastructure/ai/aiSdkService");

describe("Generate Brief API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("POST /api/projects/[projectId]/brief/generate", () => {
    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { req } = createMocks({ method: "POST" });

      const response = await POST(req as NextRequest, {
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

      const { req } = createMocks({ method: "POST" });

      const response = await POST(req as NextRequest, {
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

      prismaClientMock.project.findFirst.mockResolvedValue(null);

      const { req } = createMocks({ method: "POST" });

      const response = await POST(req as NextRequest, {
        params: Promise.resolve({ projectId: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should generate a project brief", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: "test@example.com" },
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

      prismaClientMock.project.findFirst.mockResolvedValue(project);

      vi.mocked(ai.loadTemplate).mockResolvedValue({
        template: "template",
      });

      vi.mocked(ai.buildPromptFromTemplate).mockResolvedValue("prompt");

      const generateTextMock = vi
        .fn()
        .mockResolvedValue({ text: "Generated brief content" });

      vi.spyOn(AiSdkService.prototype, "generateText").mockImplementation(
        generateTextMock
      );

      const document = {
        id: 1,
        projectId: 1,
        type: "BRIEF",
        title: "Project Brief",
        latestVersion: 1,
        contentMd: "Generated brief content",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      prismaClientMock.document.upsert.mockResolvedValue(document);

      const payload = { name: "Project 1" };

      const { req } = createMocks({ method: "POST" });
      req.json = async () => payload;

      const response = await POST(req as NextRequest, {
        params: Promise.resolve({ projectId: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.content).toBe("Generated brief content");

      expect(generateTextMock).toHaveBeenCalledOnce();
      expect(prismaClientMock.document.upsert).toHaveBeenCalledOnce();
    });
  });
});
