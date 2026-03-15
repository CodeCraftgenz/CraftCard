import { ApiKeyGuard } from './api-key.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ExecutionContext } from '@nestjs/common';

/**
 * API KEY GUARD TESTS
 * Validates Bearer token authentication for Enterprise API.
 */
describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;

  const mockContext = (authHeader?: string): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { authorization: authHeader },
        apiUser: undefined,
      }),
    }),
  } as unknown as ExecutionContext);

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };
    guard = new ApiKeyGuard(prisma as PrismaService);
  });

  it('should reject when no Authorization header', async () => {
    await expect(guard.canActivate(mockContext())).rejects.toThrow(/API Key ausente/);
  });

  it('should reject when header is not Bearer format', async () => {
    await expect(guard.canActivate(mockContext('Basic abc123'))).rejects.toThrow(/API Key ausente/);
  });

  it('should reject when API key is too short', async () => {
    await expect(guard.canActivate(mockContext('Bearer short'))).rejects.toThrow(/inválida/);
  });

  it('should reject when API key not found in database', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      guard.canActivate(mockContext('Bearer ' + 'a'.repeat(64))),
    ).rejects.toThrow(/não encontrada/);
  });

  it('should reject when user plan is not ENTERPRISE', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1', email: 'test@test.com', plan: 'PRO', name: 'Test',
    });

    await expect(
      guard.canActivate(mockContext('Bearer ' + 'a'.repeat(64))),
    ).rejects.toThrow(/Enterprise/);
  });

  it('should allow when API key is valid and plan is ENTERPRISE', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1', email: 'test@test.com', plan: 'ENTERPRISE', name: 'Test',
    });

    const ctx = mockContext('Bearer ' + 'a'.repeat(64));
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
  });

  it('should attach apiUser to request on success', async () => {
    const user = { id: 'user-1', email: 'enterprise@corp.com', plan: 'ENTERPRISE', name: 'Corp' };
    prisma.user.findUnique.mockResolvedValue(user);

    const reqObj: Record<string, unknown> = { headers: { authorization: 'Bearer ' + 'b'.repeat(64) } };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => reqObj }),
    } as unknown as ExecutionContext;

    await guard.canActivate(ctx);
    expect(reqObj.apiUser).toEqual(user);
  });
});
