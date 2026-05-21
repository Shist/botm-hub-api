export default async function handler(req, res) {
  const allowedOrigins = ["https://botm-hub.web.app", "http://localhost:5173"];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "https://botm-hub.web.app");
  }

  res.setHeader("Access-Control-Allow-Credentials", true);
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

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const matchResponse = await fetch(
      `https://osu.ppy.sh/api/v2/matches/${id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      },
    );

    if (!matchResponse.ok) {
      throw new Error(
        `Failed to fetch match data (status: ${matchResponse.status})`,
      );
    }

    const matchData = await matchResponse.json();

    return res.status(200).json(matchData);
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
