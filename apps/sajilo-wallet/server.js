// Sajilo Wallet: practice app for the Qrius Automation QA Bootcamp classwork.
// One Node file, no npm packages, real HS256 JWTs, in-memory data.
// Start:            node server.js
// Start with bugs:  node server.js --bugs   (instructor only)

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 4000;
const BUG_MODE = process.argv.includes('--bugs') || process.env.BUG_MODE === '1';
const JWT_SECRET = 'sajilo-wallet-classwork-secret';
const TOKEN_TTL_SECONDS = 30 * 60;

const MIN_AMOUNT = 10 * 100;      // paisa
const MAX_AMOUNT = 25000 * 100;   // paisa

// ---------- Seed data (amounts are stored in paisa) ----------
function seed() {
  const users = {
    'ram.thapa':   { username: 'ram.thapa',   password: 'Ram@1234',  name: 'Ram Thapa',   mobile: '9841000001', pin: '1234', balance: 3245000, status: 'active' },
    'sita.sharma': { username: 'sita.sharma', password: 'Sita@1234', name: 'Sita Sharma', mobile: '9851000002', pin: '4321', balance: 15000,  status: 'active' },
    'hari.karki':  { username: 'hari.karki',  password: 'Hari@1234', name: 'Hari Karki',  mobile: '9861000003', pin: '1111', balance: 250000, status: 'locked' },
  };
  // Wallets that can receive money but are not login accounts in this app
  const directory = {
    '9800000004': 'Bikash Gurung',
    '9810000005': 'Anita Rai',
    '9741000006': 'Pemba Sherpa',
  };
  const tx = (id, date, description, type, amount, counterparty = '') =>
    ({ id, date, description, type, amount, status: 'Success', counterparty });
  const transactions = {
    'ram.thapa': [
      tx('TXN1006', '2026-10-24', 'Received from Sita Sharma', 'Credit', 150000, '9851000002'),
      tx('TXN1005', '2026-10-22', 'NEA Electricity bill', 'Debit', 85000),
      tx('TXN1004', '2026-10-20', 'Sent to Bikash Gurung', 'Debit', 120000, '9800000004'),
      tx('TXN1003', '2026-10-18', 'Load from Nabil Bank', 'Credit', 500000),
      tx('TXN1002', '2026-10-15', 'Worldlink Internet bill', 'Debit', 110000),
      tx('TXN1001', '2026-10-12', 'Mobile top-up NTC', 'Debit', 20000),
    ],
    'sita.sharma': [
      tx('TXN1008', '2026-10-24', 'Sent to Ram Thapa', 'Debit', 150000, '9841000001'),
      tx('TXN1007', '2026-10-10', 'Load from NIC Asia Bank', 'Credit', 165000),
    ],
    'hari.karki': [],
  };
  return { users, directory, transactions, nextTxn: 1009 };
}
let db = seed();

// ---------- JWT (HS256) ----------
const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
function signJwt(payload) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}
function verifyJwt(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const expected = b64url(crypto.createHmac('sha256', JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest());
  if (expected !== parts[2]) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

// ---------- Helpers ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(data === undefined ? '' : JSON.stringify(data));
}
function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 1e5) req.destroy(); });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve(null); } });
  });
}
function authUser(req) {
  const h = req.headers['authorization'] || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const payload = verifyJwt(token);
  if (!payload) return null;
  const user = db.users[payload.sub];
  return user && user.status === 'active' ? user : null;
}
const publicUser = (u) => ({ username: u.username, name: u.name, mobile: u.mobile, balance: u.balance / 100 });
const publicTx = (t) => ({ ...t, amount: t.amount / 100 });
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// ---------- Validation shared with the UI rules ----------
function validatePayment(user, body) {
  const errors = {};
  const receiver = String(body.receiver ?? '').trim();
  const amountRaw = String(body.amount ?? '').trim();
  const purpose = String(body.purpose ?? '').trim();
  const remarks = String(body.remarks ?? '');

  if (!receiver) errors.receiver = 'Receiver mobile number is required';
  else if (!/^(97|98)\d{8}$/.test(receiver)) errors.receiver = 'Enter a valid 10-digit mobile number starting with 97 or 98';
  else if (receiver === user.mobile) errors.receiver = 'You cannot send money to your own wallet';
  else if (!findReceiverName(receiver)) errors.receiver = 'No Sajilo Wallet account found for this number';

  let paisa = null;
  if (!amountRaw) errors.amount = 'Amount is required';
  else if (!/^\d+(\.\d{1,2})?$/.test(amountRaw)) errors.amount = 'Enter a valid amount with up to 2 decimal places';
  else {
    paisa = Math.round(Number(amountRaw) * 100);
    const overMax = BUG_MODE ? paisa >= MAX_AMOUNT : paisa > MAX_AMOUNT; // BUG 1 (bug mode): Rs. 25,000 itself is rejected
    if (paisa < MIN_AMOUNT) errors.amount = 'Minimum amount is Rs. 10';
    else if (overMax) errors.amount = 'Maximum amount per transaction is Rs. 25,000';
    else if (paisa > user.balance) errors.amount = 'Insufficient balance';
  }

  const purposes = ['Personal Use', 'Bill Sharing', 'Family Expenses', 'Lend/Borrow'];
  if (!purpose) errors.purpose = 'Please select a purpose';
  else if (!purposes.includes(purpose)) errors.purpose = 'Please select a valid purpose';

  if (remarks.length > 50) errors.remarks = 'Remarks cannot be more than 50 characters';
  return { errors, receiver, paisa, purpose, remarks: remarks.trim() };
}
function findReceiverName(mobile) {
  const u = Object.values(db.users).find((x) => x.mobile === mobile);
  if (u) return u.name;
  return db.directory[mobile] || null;
}

// ---------- API ----------
async function handleApi(req, res, url) {
  const route = `${req.method} ${url.pathname}`;

  if (route === 'GET /api/config') return send(res, 200, { bugMode: BUG_MODE, minAmount: MIN_AMOUNT / 100, maxAmount: MAX_AMOUNT / 100 });

  if (route === 'POST /api/test/reset') { db = seed(); return send(res, 204); }

  if (route === 'POST /api/login') {
    const body = await readBody(req);
    if (!body) return send(res, 400, { message: 'Invalid JSON body' });
    await sleep(300);
    const username = String(body.username ?? '').trim();
    const password = String(body.password ?? '');
    if (!username && !password) return send(res, 400, { message: 'Username and password are required' });
    if (!username) return send(res, 400, { message: 'Username is required' });
    if (!password) return send(res, 400, { message: 'Password is required' });
    const user = db.users[username.toLowerCase()];
    if (!user || user.password !== password) return send(res, 401, { message: 'Invalid username or password' });
    if (user.status === 'locked') return send(res, 423, { message: 'Your account is locked. Please contact support.' });
    const now = Math.floor(Date.now() / 1000);
    const token = signJwt({ sub: user.username, name: user.name, iat: now, exp: now + TOKEN_TTL_SECONDS });
    return send(res, 200, { token, user: publicUser(user) });
  }

  // Everything below needs a valid Bearer token
  const user = authUser(req);
  if (url.pathname.startsWith('/api/') && !user) return send(res, 401, { message: 'Unauthorized' });

  if (route === 'GET /api/me') return send(res, 200, publicUser(user));

  if (route === 'GET /api/receivers') {
    const mobile = url.searchParams.get('mobile') || '';
    const name = findReceiverName(mobile);
    return name ? send(res, 200, { mobile, name }) : send(res, 404, { message: 'No Sajilo Wallet account found for this number' });
  }

  if (route === 'GET /api/transactions') {
    const type = url.searchParams.get('type') || 'All';
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    let list = [...db.transactions[user.username]];
    if (type === 'Credit' || type === 'Debit') list = list.filter((t) => t.type === type);
    if (q) list = list.filter((t) => t.id.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    if (BUG_MODE) list.reverse(); // BUG 3 (bug mode): oldest transaction shown first
    return send(res, 200, list.map(publicTx));
  }

  if (route === 'POST /api/payments') {
    const body = await readBody(req);
    if (!body) return send(res, 400, { message: 'Invalid JSON body' });
    const v = validatePayment(user, body);
    if (Object.keys(v.errors).length) return send(res, 422, { message: 'Validation failed', errors: v.errors });
    const pin = String(body.pin ?? '');
    if (!/^\d{4}$/.test(pin)) return send(res, 422, { message: 'PIN must be 4 digits', errors: { pin: 'PIN must be 4 digits' } });
    await sleep(800);
    if (pin !== user.pin) return send(res, 403, { message: 'Incorrect transaction PIN', errors: { pin: 'Incorrect transaction PIN' } });

    const receiverName = findReceiverName(v.receiver);
    const id = `TXN${db.nextTxn++}`;
    user.balance -= v.paisa;
    const debit = { id, date: today(), description: `Sent to ${receiverName}`, type: 'Debit', amount: v.paisa, status: 'Success', counterparty: v.receiver, purpose: v.purpose, remarks: v.remarks };
    db.transactions[user.username].unshift(debit);

    const receiverUser = Object.values(db.users).find((x) => x.mobile === v.receiver);
    if (receiverUser) {
      receiverUser.balance += v.paisa;
      db.transactions[receiverUser.username].unshift({ id: `TXN${db.nextTxn++}`, date: today(), description: `Received from ${user.name}`, type: 'Credit', amount: v.paisa, status: 'Success', counterparty: user.mobile });
    }
    return send(res, 201, { transaction: publicTx(debit), receiverName, balance: user.balance / 100 });
  }

  return send(res, 404, { message: 'Not found' });
}

// ---------- Static pages ----------
const PAGES = ['/', '/login', '/dashboard', '/payment', '/transactions'];
const INDEX = path.join(__dirname, 'public', 'index.html');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    if (req.method === 'GET' && PAGES.includes(url.pathname)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return fs.createReadStream(INDEX).pipe(res);
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Page not found');
  } catch (err) {
    console.error(err);
    send(res, 500, { message: 'Something went wrong' });
  }
});

server.listen(PORT, () => {
  console.log(`Sajilo Wallet running at http://localhost:${PORT}${BUG_MODE ? '  (BUG MODE ON)' : ''}`);
});
