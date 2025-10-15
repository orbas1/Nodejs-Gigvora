import { ZodError } from 'zod';
import { ValidationError } from '../utils/errors.js';

function formatZodIssues(issues = []) {
  return issues.map((issue) => ({
    path: issue.path.join('.') || issue.path.join(''),
    message: issue.message,
    code: issue.code,
  }));
}

export default function validateRequest({ body, query, params, headers, cookies } = {}) {
  return (req, res, next) => {
    try {
      if (body) {
        req.body = body.parse(req.body ?? {});
      }
      if (query) {
        req.query = query.parse(req.query ?? {});
      }
      if (params) {
        req.params = params.parse(req.params ?? {});
      }
      if (headers) {
        req.headers = { ...req.headers, ...headers.parse(req.headers ?? {}) };
      }
      if (cookies && req.cookies) {
        req.cookies = cookies.parse(req.cookies ?? {});
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

