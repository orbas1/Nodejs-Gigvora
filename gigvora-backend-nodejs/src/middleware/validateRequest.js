import { ZodError } from 'zod';
import { ValidationError } from '../utils/errors.js';

function formatZodIssues(issues = []) {
  return issues.map((issue) => ({
    path: issue.path.join('.') || issue.path.join(''),
    message: issue.message,
    code: issue.code,
  }));
}

async function parseSection(schema, payload) {
  if (!schema) {
    return payload;
  }

  if (typeof schema.parseAsync === 'function') {
    return schema.parseAsync(payload ?? {});
  }

  return schema.parse(payload ?? {});
}

export default function validateRequest({ body, query, params, headers, cookies } = {}) {
  return async (req, res, next) => {
    try {
      if (body) {
        req.body = await parseSection(body, req.body);
      }
      if (query) {
        req.query = await parseSection(query, req.query);
      }
      if (params) {
        req.params = await parseSection(params, req.params);
      }
      if (headers) {
        const validatedHeaders = await parseSection(headers, req.headers);
        req.headers = { ...(req.headers ?? {}), ...validatedHeaders };
      }
      if (cookies && req.cookies) {
        req.cookies = await parseSection(cookies, req.cookies);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Request validation failed.', { issues: formatZodIssues(error.issues) }));
        return;
      }
      next(error);
    }
  };
}

