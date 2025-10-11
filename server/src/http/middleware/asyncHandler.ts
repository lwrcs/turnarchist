import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wrapper for async route handlers to ensure errors are properly caught
 * and passed to Express error handling middleware.
 *
 * In Express v4, async route handlers that throw errors don't automatically
 * get passed to error handling middleware, so we need this wrapper.
 */
export const asyncHandler = <
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
>(
  fn: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
  ) => Promise<any>,
): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
  return (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction,
  ) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
};
