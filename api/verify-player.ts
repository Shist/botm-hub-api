import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OsuTokenResponse } from "../types";

let cachedToken: string | null = null;
let tokenExpirationTime: number = 0;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allowedOrigins = ["https://botm-hub.web.app", "http://localhost:5173"];
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "https://botm-hub.web.app");
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { player, type = "username" } = req.query;

  if (!player) {
    return res.status(400).json({ error: "Player identifier is required" });
  }

  try {
    let accessToken = cachedToken;

    if (!accessToken || Date.now() > tokenExpirationTime) {
      const tokenResponse = await fetch("https://osu.ppy.sh/oauth/token", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.OSU_CLIENT_ID,
          client_secret: process.env.OSU_CLIENT_SECRET,
          grant_type: "client_credentials",
          scope: "public",
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to get osu! authorization token");
      }

      const tokenData = (await tokenResponse.json()) as OsuTokenResponse;
      accessToken = tokenData.access_token;
      cachedToken = accessToken;
      tokenExpirationTime =
        Date.now() + tokenData.expires_in * 1000 - 5 * 60 * 1000;
    }

    const userResponse = await fetch(
      `https://osu.ppy.sh/api/v2/users/${encodeURIComponent(String(player))}?key=${type}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      },
    );

    if (userResponse.status === 404) {
      return res.status(200).json({ isValid: false, reason: "NOT_FOUND" });
    }

    if (!userResponse.ok) {
      throw new Error(`Osu! API error (status: ${userResponse.status})`);
    }

    const userData = await userResponse.json();

    if (userData.country_code !== "BY") {
      return res.status(200).json({ isValid: false, reason: "NOT_BY" });
    }

    return res.status(200).json({
      isValid: true,
      osuId: userData.id,
      nick: userData.username,
    });
  } catch (error) {
    console.error("Server Error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: msg });
  }
}
