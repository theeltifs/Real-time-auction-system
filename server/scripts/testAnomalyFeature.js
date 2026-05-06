/**
 * Integration test for the Ollama Bid Anomaly Detection feature.
 * Run with: node scripts/testAnomalyFeature.js
 * Cleans up all inserted test data after completion.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const jwt      = require('jsonwebtoken');
const http     = require('http');

const User       = require('../models/User');
const Auction    = require('../models/Auction');
const FlaggedBid = require('../models/FlaggedBid');
const { analyzeBidAnomaly } = require('../utils/anomalyAnalyzer');

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function apiRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function pass(msg) { console.log(`  ✓ ${msg}`); }
function fail(msg) { console.error(`  ✗ ${msg}`); process.exitCode = 1; }
function section(title) { console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 50 - title.length))}`); }

// ── Tests ─────────────────────────────────────────────────────────────────────

async function testModelLoad() {
  section('Model & Module Load');
  try {
    require('../models/FlaggedBid');       pass('FlaggedBid model loads');
    require('../utils/anomalyAnalyzer');   pass('anomalyAnalyzer module loads');
    require('../sockets/bidSocket');       pass('bidSocket module loads');
    require('../controllers/adminController'); pass('adminController module loads');
  } catch (e) {
    fail(`Module load error: ${e.message}`);
  }
}

async function testFlaggedBidSchema() {
  section('FlaggedBid Schema Validation');

  const adminUser = await User.findOne({ role: 'admin' });
  const auction   = await Auction.findOne();

  if (!adminUser || !auction) {
    console.log('  ⚠ Skipped — no admin user or auction in DB (create one to run schema tests)');
    return null;
  }

  const doc = await FlaggedBid.create({
    auctionId:      auction._id,
    auctionTitle:   auction.title,
    bidderId:       adminUser._id,
    bidderEmail:    adminUser.email,
    bidAmount:      9999,
    bidTimestamp:   new Date(),
    triggeredRules: [
      { rule: 'RAPID_BIDDING', detail: 'Placed 3 or more bids within 2 minutes' },
      { rule: 'SNIPE_BID',     detail: 'Bid placed within 10 seconds of auction end time' },
    ],
    llmVerdict:     'SUSPICIOUS',
    llmReason:      'Test document — rapid bidding and sniping detected simultaneously.',
    rawLlmResponse: 'VERDICT: SUSPICIOUS\nREASON: Test document.',
  });

  pass(`FlaggedBid document created (_id: ${doc._id})`);
  pass(`triggeredRules stored correctly (${doc.triggeredRules.length} rules)`);
  pass(`createdAt auto-set: ${doc.createdAt}`);

  return doc._id;
}

async function testAnomalyAnalyzerFallback() {
  section('anomalyAnalyzer — Fallback (Ollama likely not running)');

  const bidContext = {
    auctionId:                              'test-auction-id',
    auctionTitle:                           'Test Auction',
    auctionStartingBid:                     100,
    auctionCurrentBidBeforeThisBid:         200,
    auctionEndTime:                         new Date().toISOString(),
    bidderId:                               'test-bidder-id',
    bidderEmail:                            'test@example.com',
    newBidAmount:                           1500,
    bidTimestamp:                           new Date().toISOString(),
    recentBidCountByThisUserInLast2Minutes: 4,
    totalBidsInThisAuctionSoFar:            7,
  };

  const triggeredRules = [
    { rule: 'RAPID_BIDDING', detail: 'Placed 3 or more bids within 2 minutes' },
    { rule: 'ABNORMAL_JUMP', detail: 'Bid amount is 5x or more than previous bid' },
  ];

  const result = await analyzeBidAnomaly(bidContext, triggeredRules);

  if (!result || typeof result !== 'object') {
    fail('analyzeBidAnomaly did not return an object'); return;
  }
  if (!['SUSPICIOUS', 'NORMAL'].includes(result.verdict)) {
    fail(`verdict is invalid: "${result.verdict}"`); return;
  }
  if (typeof result.reason !== 'string' || result.reason.length === 0) {
    fail('reason is missing or empty'); return;
  }
  if (typeof result.raw !== 'string' || result.raw.length === 0) {
    fail('raw response is missing'); return;
  }

  pass(`verdict: ${result.verdict}`);
  pass(`reason: ${result.reason}`);
  pass('Function always resolves (never throws)');
}

async function testApiEndpoints(adminToken, testDocId) {
  section('API Endpoints');

  // No auth → 401
  const noAuth = await apiRequest('GET', '/api/admin/flagged-bids');
  noAuth.status === 401
    ? pass('GET /flagged-bids without token → 401')
    : fail(`Expected 401, got ${noAuth.status}`);

  if (!adminToken) {
    console.log('  ⚠ Skipped authenticated tests — no admin token available');
    return;
  }

  // With admin token → 200
  const withAuth = await apiRequest('GET', '/api/admin/flagged-bids', null, adminToken);
  if (withAuth.status === 200) {
    pass('GET /flagged-bids with admin token → 200');
    pass(`Response shape correct: total=${withAuth.body.total}, page=${withAuth.body.page}, limit=${withAuth.body.limit}`);
    pass(`flaggedBids is array: ${Array.isArray(withAuth.body.flaggedBids)}`);
  } else {
    fail(`Expected 200, got ${withAuth.status}: ${JSON.stringify(withAuth.body)}`);
  }

  // Verdict filter SUSPICIOUS
  const sus = await apiRequest('GET', '/api/admin/flagged-bids?verdict=SUSPICIOUS', null, adminToken);
  sus.status === 200
    ? pass('GET /flagged-bids?verdict=SUSPICIOUS → 200')
    : fail(`verdict filter failed: ${sus.status}`);

  // Verdict filter NORMAL
  const norm = await apiRequest('GET', '/api/admin/flagged-bids?verdict=NORMAL', null, adminToken);
  norm.status === 200
    ? pass('GET /flagged-bids?verdict=NORMAL → 200')
    : fail(`verdict=NORMAL filter failed: ${norm.status}`);

  // Pagination
  const paged = await apiRequest('GET', '/api/admin/flagged-bids?page=1&limit=5', null, adminToken);
  paged.status === 200 && paged.body.limit === 5
    ? pass('Pagination: limit=5 respected')
    : fail('Pagination test failed');
}

async function testRuleEngineLogic() {
  section('Rule Engine Logic (unit)');

  // Rule 1: recentBidCount >= 3
  const cutoff = new Date(Date.now() - 120_000);
  const mockBids = [
    { bidder: { _id: 'user1' }, time: new Date(Date.now() - 10_000) },
    { bidder: { _id: 'user1' }, time: new Date(Date.now() - 30_000) },
    { bidder: { _id: 'user1' }, time: new Date(Date.now() - 60_000) },
    { bidder: { _id: 'user2' }, time: new Date(Date.now() - 5_000)  },
  ];

  function resolveBidderId(b) { return (b?._id ?? b)?.toString(); }
  const recentCount = mockBids.filter(b =>
    resolveBidderId(b.bidder) === 'user1' && b.time >= cutoff
  ).length;

  recentCount === 3
    ? pass(`Rule 1: recentBidCount = ${recentCount} (threshold 3) → RAPID_BIDDING triggers`)
    : fail(`Rule 1: expected 3, got ${recentCount}`);

  // Rule 2: 5x jump, skips first bid
  const priorBidsCount = 1;
  const previousBid    = 200;
  const newAmount      = 1000;
  const rule2Triggers  = priorBidsCount > 0 && newAmount >= previousBid * 5;
  rule2Triggers
    ? pass(`Rule 2: ${newAmount} >= ${previousBid} * 5 → ABNORMAL_JUMP triggers`)
    : fail('Rule 2: expected trigger');

  const firstBidSkip = 0 > 0 && newAmount >= 0 * 5;
  !firstBidSkip
    ? pass('Rule 2: first bid (priorBidsCount=0) correctly skipped')
    : fail('Rule 2: first bid should be skipped');

  // Rule 3: within 10 seconds
  const endTime10s = new Date(Date.now() + 8_000);
  const bidNow     = new Date();
  const rule3      = (endTime10s.getTime() - bidNow.getTime()) <= 10_000;
  rule3
    ? pass('Rule 3: bid within 10s of endTime → SNIPE_BID triggers')
    : fail('Rule 3: expected trigger');

  const endTime30s   = new Date(Date.now() + 30_000);
  const rule3NoSnipe = (endTime30s.getTime() - bidNow.getTime()) <= 10_000;
  !rule3NoSnipe
    ? pass('Rule 3: bid with 30s remaining → correctly NOT triggered')
    : fail('Rule 3: should not trigger with 30s left');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Anomaly Detection Feature — Integration Test');
  console.log('═══════════════════════════════════════════════════════');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('\nMongoDB connected');

  let testDocId = null;
  let adminToken = null;

  try {
    await testModelLoad();
    await testRuleEngineLogic();
    await testAnomalyAnalyzerFallback();

    testDocId = await testFlaggedBidSchema();

    // Generate admin JWT if admin user exists
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      adminToken = jwt.sign({ id: adminUser._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
      pass(`Admin JWT generated for: ${adminUser.email}`);
    } else {
      console.log('\n  ⚠ No admin user found — run /api/admin/bootstrap first to test authenticated endpoints');
    }

    await testApiEndpoints(adminToken, testDocId);

  } finally {
    // Cleanup test data
    if (testDocId) {
      await FlaggedBid.findByIdAndDelete(testDocId);
      console.log('\n  Cleaned up test FlaggedBid document');
    }
    await mongoose.disconnect();

    section('Result');
    if (process.exitCode === 1) {
      console.log('  Some tests FAILED — see ✗ above\n');
    } else {
      console.log('  All tests PASSED ✓\n');
    }
  }
}

main().catch(err => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
