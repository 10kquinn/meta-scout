// api/search.js
// Vercel Serverless Function - proxies search requests to AU card stores
// Deploy: place this file at /api/search.js in your Vercel project root

const STORES = {
  gamesportal: {
    name: "Games Portal",
    // Shopify predictive search endpoint
    searchUrl: (q) =>
      `https://gamesportal.com.au/search/suggest.json?q=${encodeURIComponent(q)}&resources[type]=product&resources[limit]=5`,
    // Fallback: Shopify search results JSON
    fallbackUrl: (q) =>
      `https://gamesportal.com.au/search?q=${encodeURIComponent(q)}&type=product&view=json`,
    parseResults: (data) => {
      try {
        const products = data?.resources?.results?.products || [];
        return products.map((p) => ({
          name: p.title,
          price: p.price ? `$${(parseFloat(p.price) / 100).toFixed(2)}` : null,
          available: p.available,
          url: `https://gamesportal.com.au${p.url}`,
          image: p.image,
          store: "Games Portal",
        }));
      } catch {
        return [];
      }
    },
  },
  goodgames: {
    name: "Good Games",
    searchUrl: (q) =>
      `https://tcg.goodgames.com.au/search/suggest.json?q=${encodeURIComponent(q)}&resources[type]=product&resources[limit]=5`,
    parseResults: (data) => {
      try {
        const products = data?.resources?.results?.products || [];
        return products.map((p) => ({
          name: p.title,
          price: p.price ? `$${(parseFloat(p.price) / 100).toFixed(2)}` : null,
          available: p.available,
          url: `https://tcg.goodgames.com.au${p.url}`,
          image: p.image,
          store: "Good Games",
        }));
      } catch {
        return [];
      }
    },
  },
  mtgmate: {
    name: "MTG Mate",
    // MTG Mate is not Shopify - uses custom search
    // Their card pages follow: /cards/Card_Name or /cards/Card_Name/SET/NUM
    searchUrl: (q) =>
      `https://www.mtgmate.com.au/cards/${encodeURIComponent(q.replace(/ /g, " "))}`,
    parseResults: (html) => {
      // MTG Mate returns HTML - we need to parse it
      // Look for price data in the page
      try {
        const results = [];
        // Match product entries with prices
        const priceMatches = html.match(
          /\$[\d]+\.[\d]{2}/g
        );
        const stockMatch = html.match(/In Stock|Out of Stock/gi);
        if (priceMatches && priceMatches.length > 0) {
          results.push({
            name: "See MTG Mate listing",
            price: priceMatches[0],
            available: stockMatch
              ? stockMatch[0].toLowerCase().includes("in stock")
              : null,
            url: `https://www.mtgmate.com.au/cards/${encodeURIComponent(
              q.replace(/ /g, " ")
            )}`,
            image: null,
            store: "MTG Mate",
          });
        }
        return results;
      } catch {
        return [];
      }
    },
  },
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { q, store } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Missing query parameter 'q'" });
  }

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/json, text/html",
  };

  // If a specific store is requested
  if (store && STORES[store]) {
    try {
      const s = STORES[store];
      const response = await fetch(s.searchUrl(q), { headers });
      const contentType = response.headers.get("content-type") || "";

      let data;
      if (contentType.includes("json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      const results = s.parseResults(data);
      return res.status(200).json({ store: s.name, query: q, results });
    } catch (error) {
      return res
        .status(200)
        .json({ store: STORES[store].name, query: q, results: [], error: error.message });
    }
  }

  // Search all stores in parallel
  const promises = Object.entries(STORES).map(async ([key, s]) => {
    try {
      const response = await fetch(s.searchUrl(q), {
        headers,
        signal: AbortSignal.timeout(8000),
      });
      const contentType = response.headers.get("content-type") || "";
      let data;
      if (contentType.includes("json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      return { store: s.name, key, results: s.parseResults(data) };
    } catch (error) {
      return { store: s.name, key, results: [], error: error.message };
    }
  });

  const allResults = await Promise.allSettled(promises);
  const results = allResults.map((r) =>
    r.status === "fulfilled" ? r.value : { store: "Unknown", results: [], error: r.reason }
  );

  return res.status(200).json({ query: q, stores: results });
}
