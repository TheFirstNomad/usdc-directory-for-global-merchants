

# Seed 6 More AI Agent Listings

Insert 6 new AI agent records into the `partners` table with `payment_status: 'completed'` and `categories` including `"AI Agents"`. Each will have a distinct use case:

1. **TradeFlowAI** — Autonomous DeFi trading agent executing cross-chain swaps (categories: AI Agents, DeFi)
2. **ContentMintBot** — AI content creator that mints and sells NFT art on-chain (categories: AI Agents, Infrastructure)
3. **ResearchOracle** — On-chain research agent aggregating and summarizing protocol data (categories: AI Agents, Enterprise)
4. **GuardianAgent** — Security monitoring bot that detects and alerts on suspicious wallet activity (categories: AI Agents, Infrastructure)
5. **SocialPayBot** — Social tipping and micropayments agent for Telegram/Discord (categories: AI Agents, Payments)
6. **RentCollectorAI** — RWA rent collection agent that auto-invoices tenants in USDC (categories: AI Agents, RWA)

Each will have a unique wallet address, realistic description, region variation, `logo_emoji: '🤖'`, and `payment_status: 'completed'` so they appear in the `partners_public` view immediately.

### Technical Details
- Single `INSERT INTO partners (...)` statement with 6 rows via the database insert tool
- No schema changes needed
- All records will have `networks` set to relevant chains (Base, Solana, Ethereum, etc.)

