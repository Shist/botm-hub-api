import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  OsuTokenResponse,
  OsuMatchEvent,
  OsuMatchUser,
  OsuMatchData,
} from "../types";

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

  const { id } = req.query;

  if (!id) {
    return res
      .status(400)
      .json({ error: "Match ID is required (e.g. ?id=123456)" });
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

    const allEvents: OsuMatchEvent[] = [];
    const allUsers = new Map<number, OsuMatchUser>();
    let matchInfo: unknown = null;

    const maxLoops = 20;
    let currentUrl = `https://osu.ppy.sh/api/v2/matches/${id}?limit=100`;
    let loops = 0;

    while (loops < maxLoops) {
      loops++;
      const matchResponse = await fetch(currentUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (!matchResponse.ok) {
        if (loops === 1) {
          return res.status(matchResponse.status).json({
            error: `Osu! API error: Match not found or access denied (status: ${matchResponse.status})`,
          });
        } else {
          break;
        }
      }

      const matchData = (await matchResponse.json()) as OsuMatchData;

      if (!matchInfo && matchData.match) {
        matchInfo = matchData.match;
      }

      if (matchData.users && Array.isArray(matchData.users)) {
        matchData.users.forEach((u) => allUsers.set(u.id, u));
      }

      const events = matchData.events;
      if (!events || events.length === 0) {
        break;
      }

      allEvents.push(...events);

      const minEventId = Math.min(...events.map((e) => e.id));
      currentUrl = `https://osu.ppy.sh/api/v2/matches/${id}?before=${minEventId}&limit=100`;

      if (events.length < 100) {
        break;
      }
    }

    allEvents.sort((a, b) => a.id - b.id);

    return res.status(200).json({
      match: matchInfo,
      events: allEvents,
      users: Array.from(allUsers.values()),
      first_event_id: allEvents.length > 0 ? allEvents[0].id : null,
      latest_event_id:
        allEvents.length > 0 ? allEvents[allEvents.length - 1].id : null,
    });
  } catch (error) {
    console.error("Server Error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: msg });
  }
}
