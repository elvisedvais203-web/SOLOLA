import type { NextFunction, Request, Response } from "express";
import { env } from "../config/nextalkenv";
import { ApiError } from "../utils/nextalkapierror";

/** Bloque les routes e-mail / mot de passe lorsque AUTH_FIREBASE_ONLY est activé. */
export function rejectEmailPasswordAuthWhenFirebaseOnly(
  _req: Request,
  _res: Response,
  next: NextFunction
) {
  if (env.authFirebaseOnly) {
    next(
      new ApiError(
        403,
        "Authentification par e-mail et mot de passe désactivée. Utilise Google, Apple ou le téléphone (Firebase)."
      )
    );
  } else {
    next();
  }
}
