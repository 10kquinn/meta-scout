// api/decklist.js
// Fetches a sample decklist for an archetype from MTGTop8

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { archetype } = req.query;

  if (!archetype) {
    return res.status(400).json({ error: "Missing archetype ID" });
  }

  const headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  };

  try {
    // Step 1: Fetch the archetype page to get the latest deck
    const archetypeUrl = `https://www.mtgtop8.com/archetype?a=${archetype}&meta=50&f=ST`;
    const archetypeRes = await fetch(archetypeUrl, {
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (!archetypeRes.ok) {
      throw new Error(`Failed to fetch archetype: ${archetypeRes.status}`);
    }

    const archetypeHtml = await archetypeRes.text();

    // Find the first deck link (latest winning list)
    const deckMatch = archetypeHtml.match(/href=\/event\?e=(\d+)&d=(\d+)&f=ST>([^<]+)<\/a>/);
    if (!deckMatch) {
      throw new Error("No decklists found for this archetype");
    }

    const [, eventId, deckId, deckName] = deckMatch;

    // Also get the event name
    const eventNameMatch = archetypeHtml.match(new RegExp(`href=/event\\?e=${eventId}&f=ST>([^<]+)</a>`));
    const eventName = eventNameMatch ? eventNameMatch[1] : "Unknown Event";

    // Step 2: Fetch the deck page
    const deckUrl = `https://www.mtgtop8.com/event?e=${eventId}&d=${deckId}&f=ST`;
    const deckRes = await fetch(deckUrl, {
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (!deckRes.ok) {
      throw new Error(`Failed to fetch deck: ${deckRes.status}`);
    }

    const deckHtml = await deckRes.text();

    // Parse the decklist
    const mainboard = [];
    const sideboard = [];

    // Match all cards: "4 <span class=L14>Card Name</span>"
    const cardRegex = /(\d+)\s*<span class=L14>([^<]+)<\/span>/g;
    let match;

    // Check if we're in sideboard section
    let inSideboard = false;
    const sections = deckHtml.split('SIDEBOARD');

    // Parse mainboard (first section)
    while ((match = cardRegex.exec(sections[0])) !== null) {
      const qty = parseInt(match[1]);
      const name = match[2].trim();
      mainboard.push({ qty, name });
    }

    // Parse sideboard (second section if exists)
    if (sections[1]) {
      cardRegex.lastIndex = 0;
      while ((match = cardRegex.exec(sections[1])) !== null) {
        const qty = parseInt(match[1]);
        const name = match[2].trim();
        sideboard.push({ qty, name });
      }
    }

    // Get player name if available
    const playerMatch = deckHtml.match(/by\s+<a[^>]*>([^<]+)<\/a>/);
    const player = playerMatch ? playerMatch[1] : null;

    // Get placement if available
    const placementMatch = deckHtml.match(/(\d+(?:st|nd|rd|th))\s+place/i);
    const placement = placementMatch ? placementMatch[1] : null;

    return res.status(200).json({
      archetype: deckName.trim(),
      event: eventName,
      eventId,
      deckId,
      player,
      placement,
      url: `https://www.mtgtop8.com/event?e=${eventId}&d=${deckId}&f=ST`,
      mainboard,
      sideboard,
      mainboardCount: mainboard.reduce((sum, c) => sum + c.qty, 0),
      sideboardCount: sideboard.reduce((sum, c) => sum + c.qty, 0),
    });

  } catch (error) {
    console.error("Decklist fetch error:", error);
    return res.status(500).json({
      error: "Failed to fetch decklist",
      message: error.message,
    });
  }
}
