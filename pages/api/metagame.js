// api/metagame.js
// Fetches Standard metagame data from MTGTop8

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
  };

  try {
    // Fetch MTGTop8 Standard metagame page
    const response = await fetch("https://www.mtgtop8.com/format?f=ST&meta=50", {
      headers,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`MTGTop8 returned ${response.status}`);
    }

    const html = await response.text();

    // Parse archetype data from HTML
    const archetypes = [];

    // Match archetype links and percentages
    // Pattern: <a href=archetype?a=207&meta=50&f=ST>UR Aggro</a> ... 21 %
    const archetypeRegex = /<a href=archetype\?a=(\d+)&meta=\d+&f=ST>([^<]+)<\/a>[\s\S]*?<div[^>]*class=S14>(\d+)\s*%/g;

    let match;
    while ((match = archetypeRegex.exec(html)) !== null) {
      const [, id, name, percentage] = match;
      archetypes.push({
        id: parseInt(id),
        name: name.trim(),
        metaShare: parseInt(percentage),
      });
    }

    // Also get total deck count
    const deckCountMatch = html.match(/(\d+)\s*decks/i);
    const totalDecks = deckCountMatch ? parseInt(deckCountMatch[1]) : null;

    // Get trend indicators
    const trendRegex = /<a href=archetype\?a=(\d+)[^>]*>([^<]+)<\/a>[\s\S]*?<img src=\/graph\/(up_light|up_strong|down_light|down_strong)\.png>/g;
    const trends = {};
    while ((match = trendRegex.exec(html)) !== null) {
      const [, id, , trend] = match;
      trends[id] = trend.replace('_', ' ');
    }

    // Add trends to archetypes
    archetypes.forEach(arch => {
      arch.trend = trends[arch.id] || "stable";
    });

    // Fetch recent events for win rate data
    const events = await fetchRecentEvents(headers);

    return res.status(200).json({
      source: "MTGTop8",
      format: "Standard",
      period: "Last 2 Weeks",
      totalDecks,
      lastUpdated: new Date().toISOString(),
      archetypes: archetypes.slice(0, 15), // Top 15 archetypes
      recentEvents: events,
    });

  } catch (error) {
    console.error("Metagame fetch error:", error);
    return res.status(500).json({
      error: "Failed to fetch metagame data",
      message: error.message,
    });
  }
}

async function fetchRecentEvents(headers) {
  try {
    // Search for recent Standard events
    const response = await fetch("https://www.mtgtop8.com/search", {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "format=ST&last=7",
      signal: AbortSignal.timeout(10000),
    });

    const html = await response.text();

    // Extract event IDs
    const eventIds = [...new Set(html.match(/event\?e=(\d+)/g) || [])]
      .map(e => e.match(/\d+/)[0])
      .slice(0, 5);

    const events = [];
    for (const eventId of eventIds.slice(0, 3)) {
      const event = await fetchEventDetails(eventId, headers);
      if (event) events.push(event);
    }

    return events;
  } catch (error) {
    console.error("Events fetch error:", error);
    return [];
  }
}

async function fetchEventDetails(eventId, headers) {
  try {
    const response = await fetch(`https://www.mtgtop8.com/event?e=${eventId}&f=ST`, {
      headers,
      signal: AbortSignal.timeout(8000),
    });

    const html = await response.text();

    // Extract event name
    const nameMatch = html.match(/<div class=w_title[^>]*>([^<]+)/);
    const name = nameMatch ? nameMatch[1].trim() : `Event ${eventId}`;

    // Extract date
    const dateMatch = html.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
    const date = dateMatch ? dateMatch[1] : null;

    // Extract top 8 decks with archetypes
    const deckRegex = /<a href=\?e=\d+&d=\d+&f=ST>([^<]+)<\/a>/g;
    const top8 = [];
    let deckMatch;
    while ((deckMatch = deckRegex.exec(html)) !== null && top8.length < 8) {
      top8.push(deckMatch[1].trim());
    }

    return {
      id: eventId,
      name,
      date,
      top8,
    };
  } catch (error) {
    return null;
  }
}
