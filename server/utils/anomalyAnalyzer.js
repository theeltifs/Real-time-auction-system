const FALLBACK_RAW = 'VERDICT: SUSPICIOUS\nREASON: LLM analysis unavailable. Flagged by rule engine only.';

function buildPrompt(bidContext, triggeredRules) {
  const rulesText = triggeredRules.map(r => `${r.rule}: ${r.detail}`).join('\n');

  return `You are a fraud detection system for a real-time online auction platform.

A bid has been flagged by the rule engine. Analyze the following data and determine whether this bid represents genuine suspicious behavior or a false positive.

--- BID CONTEXT ---
Auction ID: ${bidContext.auctionId}
Auction Title: ${bidContext.auctionTitle}
Starting Bid: ${bidContext.auctionStartingBid}
Previous Current Bid: ${bidContext.auctionCurrentBidBeforeThisBid}
New Bid Amount: ${bidContext.newBidAmount}
Auction End Time: ${bidContext.auctionEndTime}
Bid Placed At: ${bidContext.bidTimestamp}
Bidder ID: ${bidContext.bidderId}
Bidder Email: ${bidContext.bidderEmail}
This bidder's bid count in last 2 minutes: ${bidContext.recentBidCountByThisUserInLast2Minutes}
Total bids in this auction so far: ${bidContext.totalBidsInThisAuctionSoFar}

--- TRIGGERED RULES ---
${rulesText}

--- YOUR TASK ---
Respond in this exact format with no additional text:
VERDICT: [SUSPICIOUS or NORMAL]
REASON: [One sentence explaining your verdict, maximum 30 words]`;
}

function parseResponse(raw) {
  const verdictMatch = raw.match(/VERDICT:\s*(SUSPICIOUS|NORMAL)/i);
  const reasonMatch  = raw.match(/REASON:\s*(.+)/i);

  // Default to SUSPICIOUS if parsing fails — safer for fraud detection
  const verdict = verdictMatch ? verdictMatch[1].toUpperCase() : 'SUSPICIOUS';
  const reason  = reasonMatch  ? reasonMatch[1].trim()          : 'Unable to parse LLM reason.';

  return { verdict, reason };
}

/**
 * Calls Ollama llama3 to analyze a flagged bid and returns structured verdict.
 * Always resolves — never throws — so the caller's .catch() is only for unexpected failures.
 *
 * @returns {{ verdict: 'SUSPICIOUS'|'NORMAL', reason: string, raw: string }}
 */
async function analyzeBidAnomaly(bidContext, triggeredRules) {
  const prompt = buildPrompt(bidContext, triggeredRules);

  try {
    // Dynamic import required: ollama package is ESM-only, server is CommonJS
    const { Ollama } = await import('ollama');
    const client = new Ollama();

    const response = await client.chat({
      model: 'llama3',
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.message.content;
    const { verdict, reason } = parseResponse(raw);
    return { verdict, reason, raw };
  } catch (err) {
    console.error('[AnomalyAnalyzer] Ollama call failed:', err.message);
    const { verdict, reason } = parseResponse(FALLBACK_RAW);
    return { verdict, reason, raw: FALLBACK_RAW };
  }
}

module.exports = { analyzeBidAnomaly };
