import { jest } from '@jest/globals';
import validateRequest from '../../src/middleware/validateRequest.js';
import { ValidationError } from '../../src/utils/errors.js';
import { ZodError } from 'zod';

describe('middleware/validateRequest', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('validates each request segment and replaces them with parsed values', async () => {
    const bodySchema = {
      parse: jest.fn((value = {}) => ({
        name: value.name,
        count: Number.parseInt(value.count, 10),
        token: value.token.trim(),
      })),
    };
    const querySchema = { parse: jest.fn(() => ({ include: undefined })) };
    const paramsSchema = { parse: jest.fn((value = {}) => value) };
    const headersSchema = {
      parse: jest.fn((value = {}) => ({ 'x-custom': value['x-custom'] ?? 'header' })),
    };
    const cookiesSchema = { parse: jest.fn((value = {}) => value) };

    const middleware = validateRequest({
      body: bodySchema,
      query: querySchema,
      params: paramsSchema,
      headers: headersSchema,
      cookies: cookiesSchema,
    });

    const req = {
      body: { name: 'Alice', count: '5', token: '  trimmed ' },
      query: {},
      params: { id: '550e8400-e29b-41d4-a716-446655440000' },
      headers: { 'x-custom': 'header', 'x-keep': 'value' },
      cookies: { session: 'cookie-id' },
    };
    const next = jest.fn();

    await middleware(req, {}, next);

    expect(bodySchema.parse).toHaveBeenCalledTimes(1);
    expect(headersSchema.parse).toHaveBeenCalledTimes(1);
    expect(req.body).toEqual({ name: 'Alice', count: 5, token: 'trimmed' });
    expect(req.query).toEqual({ include: undefined });
    expect(req.params).toEqual({ id: '550e8400-e29b-41d4-a716-446655440000' });
    expect(req.headers['x-keep']).toBe('value');
    expect(req.headers['x-custom']).toBe('header');
    expect(req.cookies).toEqual({ session: 'cookie-id' });
    expect(next).toHaveBeenCalledWith();
  });

  it('converts Zod validation failures into application ValidationErrors', async () => {
    const bodySchema = {
      parse: jest.fn(() => {
        throw new ZodError([
          {
            code: 'too_small',
            path: ['name'],
            message: 'Required',
            minimum: 1,
            type: 'string',
            inclusive: true,
          },
        ]);
      }),
    };

    const middleware = validateRequest({ body: bodySchema });

    const req = { body: { name: '' } };
    const next = jest.fn();

    await middleware(req, {}, next);

    expect(bodySchema.parse).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    const [error] = next.mock.calls[0];
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.details.issues[0].path).toBe('name');
  });
});
