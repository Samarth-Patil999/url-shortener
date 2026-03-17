const rateLimiter = require('../src/middleware/rateLimiter');

// Mock Redis
jest.mock('../config/redis', () => ({
  redis: {
    incr: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn().mockResolvedValue(30),
  },
}));

const { redis } = require('../config/redis');

describe('rateLimiter', () => {
  let req, res, next;

  beforeEach(() => {
    req = { ip: '127.0.0.1' };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('allows request when under limit', async () => {
    redis.incr.mockResolvedValue(1);
    await rateLimiter(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('sets TTL on first request', async () => {
    redis.incr.mockResolvedValue(1);
    await rateLimiter(req, res, next);
    expect(redis.expire).toHaveBeenCalledWith('rate:127.0.0.1', 60);
  });

  test('blocks request when over limit', async () => {
    redis.incr.mockResolvedValue(101);
    await rateLimiter(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(next).not.toHaveBeenCalled();
  });

  test('fails open when Redis is down', async () => {
    redis.incr.mockRejectedValue(new Error('Redis down'));
    await rateLimiter(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
