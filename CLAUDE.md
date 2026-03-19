# Meta Scout

MTG Standard metagame tracking app with live data feeds.

## Tech Stack
- **Framework**: Next.js (Pages Router)
- **Deployment**: Vercel
- **Live URL**: https://mtg-meta-scout.vercel.app/

## Features
- **Live Meta tab**: Real-time metagame data scraped from MTGTop8
- **Card Sourcer tab**: Decklist parser with live AU store prices (Games Portal, Good Games, MTG Mate)
- **Decklist viewer**: Click any archetype to see latest winning list
- **Matchup matrix**: Head-to-head win rates between top decks
- **Deck picker**: EV calculator based on predicted meta

## API Endpoints
| Endpoint | Description |
|----------|-------------|
| `/api/metagame` | Fetches Standard meta from MTGTop8 (cached fallback if blocked) |
| `/api/decklist?archetype={id}` | Fetches latest winning decklist for an archetype |
| `/api/search?q={card}` | Fetches live prices from AU card stores |

## Key Implementation Notes
- **Pricing**: Use `price_max` for Near Mint condition (not `price` which is damaged/cheapest)
- **MTGTop8 scraping**: Works from Vercel with proper browser headers
- **AU Shopify stores**: Return prices in dollars, not cents (no /100 conversion needed)

## File Structure
```
pages/
  index.jsx      # Main app with all tabs
  _app.jsx       # Next.js wrapper
  api/
    metagame.js  # MTGTop8 meta scraper
    decklist.js  # MTGTop8 decklist fetcher
    search.js    # AU card store price aggregator
```

## Common Tasks
- Update cached meta data: Edit `CACHED_META` in `pages/api/metagame.js`
- Add new store: Edit `STORES` object in `pages/api/search.js`
- Modify tabs: Edit the tabs array in `pages/index.jsx` around line 213
