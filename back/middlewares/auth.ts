import type { Request, Response, NextFunction } from 'express';

// TODO: PingOne — validate JWT from Authorization header
// Replace this pass-through with real JWT verification using jsonwebtoken:
//   const token = req.headers.authorization?.replace('Bearer ', '');
//   const decoded = jwt.verify(token, process.env.JWT_SECRET);
//   req.user = decoded;
export function authenticate(_req: Request, _res: Response, next: NextFunction): void {
  next();
}

// TODO: PingOne — check roles against token claims
// Replace this pass-through with real role checking:
//   if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
export function authorize(_roles: string[]) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    next();
  };
}
