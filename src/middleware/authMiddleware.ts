/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import bcrypt from "bcryptjs";
import { Application, NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";

import User, { UserTypes } from "../schemas/user.js";
import CustomError from "../utils/CustomError.js";
import { betterConsoleLog, betterErrorLog } from "../utils/logMethods.js";

// import dotenv from "dotenv";
// dotenv.config();
if (process.env.NODE_ENV !== "production") {
  const dotenv = await import("dotenv");
  dotenv.config();
}

export interface AuthModule {
  authenticateJWT: RequestHandler;
  generateToken: (id: string, years_duration?: number) => string;
  initializeAuth: (app: Application) => void;
  login: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

interface JwtPayload {
  userId: string;
}

export default function () {
  const opts: {
    jwtFromRequest: (req: Request) => null | string;
    secretOrKey: string;
  } = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET ?? "fallback_secret",
  };

  passport.use(
    new JwtStrategy(opts, async (jwt_payload: JwtPayload, done) => {
      try {
        const user = await User.findById(jwt_payload.userId);
        if (user) {
          done(null, user);
        } else {
          done(null, false);
        }
      } catch (error) {
        done(error as Error, false);
      }
    }),
  );

  const authenticateJWT = passport.authenticate("jwt", { session: false });

  interface LoginRequestBody {
    password: string;
    username: string;
  }

  async function login(req: Request<object, unknown, LoginRequestBody>, res: Response, next: NextFunction) {
    try {
      const { password, username } = req.body;
      if (!username) {
        next(new CustomError("Unesite vas username.", 400));
        return;
      }
      if (!password) {
        next(new CustomError("Unesite vasu sifru.", 400));
        return;
      }

      const user: null | UserTypes = await User.findOne({ username });
      if (!user) {
        next(new CustomError("Korisničko ime nije pronađeno, molimo proverite korisničko ime i probajte opet.", 400));
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        next(new CustomError("Proverite korisničko ime ili šifru i probajte opet.", 400));
        return;
      }

      const token = generateToken(user._id.toString(), 10);
      res.json({ message: "Uspešno logovanje na sistem.", token });
    } catch (error) {
      betterErrorLog("> Error logging in a user:", error);
      next(new CustomError("Uh oh.. Server error.. Vreme je da pozovete Milija..", 500));
      return;
    }
  }

  function initializeAuth(app: Application) {
    app.use(passport.initialize());
  }

  function generateToken(id: string, years_duration = 10): string {
    try {
      const signed_token = jwt.sign({ userId: id }, process.env.JWT_SECRET || "", {
        expiresIn: `${years_duration}y`,
      });
      return signed_token;
    } catch (error) {
      betterConsoleLog("> Error while generating a token.", error);
      throw new Error("Failed to generate token");
    }
  }

  return {
    authenticateJWT,
    generateToken,
    initializeAuth,
    login,
  };
}
