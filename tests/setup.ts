import { vi } from 'vitest';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { prismaClient } from '@/backend/shared/infrastructure/prisma';

vi.mock('@/backend/shared/infrastructure/prisma', () => ({
  __esModule: true,
  prismaClient: mockDeep<PrismaClient>(),
}));

beforeEach(() => {
  mockReset(prismaClientMock);
});

export const prismaClientMock = prismaClient as unknown as DeepMockProxy<PrismaClient>;
