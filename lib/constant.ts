import { type Algorithm } from "jsonwebtoken";

/** @description Refer README.md */
export default class Config {
  public static readonly DOMAIN: string =
    process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000"; // No trailing slash

  public static readonly SALT_ROUNDS: number = 10;

  public static readonly JWT_SECRET: string = Buffer.from(
    `${process.env.BUILD_ID}_${process.env.JWT_SECRET || "JWT_SECRET"}`
  ).toString("base64");

  public static readonly JWT_ALGORITHM: Algorithm = "HS512";
  public static readonly JWT_ISSUER: string = "https://jayantkageri.in";

  public static readonly SESSION_DURATION: number = parseInt(
    process.env.SESSION_DURATION || "2"
  );

  public static readonly MONGODB_URI: string =
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/";
}
