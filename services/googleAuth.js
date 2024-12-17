import { OAuth2Client } from "google-auth-library";
import "dotenv/config"

export const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)