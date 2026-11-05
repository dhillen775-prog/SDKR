require('dotenv').config();
const express = require('express'), cors = require('cors'), helmet = require('helmet');
const rateLimit = require('express-rate-limit'), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const { JWT_SECRET, ADMIN_USER = 'admin', ADMIN_PASSWORD, PORT = 4000, CLIENT_ORIGIN = 'http://localhost:5173', WHATSAPP_NUMBER = '919010274491' } = process.env;
if (!JWT_SECRET || !ADMIN_PASSWORD) { console.error('Set JWT_SECRET and ADMIN_PASSWORD in .env'); process.exit(1); }
const ADMIN_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 12);

const db = new Database(process.env.DB_FILE || 'sai.db');
db.exec(`CREATE TABLE IF NOT EXISTS bookings(
 id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, mobile TEXT NOT NULL, appliance TEXT NOT NULL,
 problem TEXT NOT NULL, description TEXT NOT NULL, address TEXT NOT NULL, date TEXT NOT NULL, time TEXT NOT NULL,
 notes TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'Pending', created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);

const APPLIANCES = ['Washing Machine','Air Conditioner','Refrigerator','Microwave Oven','Television','Water Purifier','Other'];
const STATUSES = ['Pending','Confirmed','In Progress','Completed','Cancelled'];
const today = () => new Date().toISOString().slice(0, 10);
const clean = (s, n) => String(s ?? '').trim().slice(0, n);

function validate(b) {
  const d = { name: clean(b.name, 80), mobile: clean(b.mobile, 15).replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, ''),
    appliance: clean(b.appliance, 40), problem: clean(b.problem, 80), description: clean(b.description, 600),
    address: clean(b.address, 300), date: clean(b.date, 10), time: clean(b.time, 30), notes: clean(b.notes, 300) };
  const e = {};
  if (d.name.length < 2) e.name = 'Enter your name';
  if (!/^[6-9]\d{9}$/.test(d.mobile)) e.mobile = 'Enter a valid 10-digit Indian mobile number';
  if (!APPLIANCES.includes(d.appliance)) e.appliance = 'Select an appliance';
  if (!d.problem) e.problem = 'Select a problem type';
  if (d.description.length < 5) e.description = 'Describe the problem';
  if (d.address.length < 8) e.address = 'Enter your full address';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date) || d.date < today()) e.date = 'Choose today or a future date';
  if (!d.time) e.time = 'Select a time';
  return { d, e };
}
const waUrl = b => `https://wa.me/${WHATSAPP_NUMBER}?text=` + encodeURIComponent(
`NEW SERVICE BOOKING – SDKR

Customer Name: ${b.name}
Phone Number: ${b.mobile}
Appliance: ${b.appliance}
Problem: ${b.problem}
Description: ${b.description}
Address: ${b.address}
Appointment Date: ${b.date}
Preferred Time: ${b.time}
Additional Notes: ${b.notes || '-'}

Please confirm this service appointment.`);

async function sendSms(b) {
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: tok, TWILIO_FROM: from, OWNER_PHONE: to } = process.env;
  if (!sid || !tok || !from || !to) return;
  try { const t = require('twilio')(sid, tok);
    await t.messages.create({ from, to, body: `SDKR new booking #${b.id}: ${b.name} ${b.mobile}, ${b.appliance} on ${b.date} ${b.time}` });
  } catch (err) { console.warn('SMS skipped:', err.message); }
}

const app = express();
app.use(helmet()); app.use(cors({ origin: CLIENT_ORIGIN })); app.use(express.json({ limit: '20kb' }));
const bookingLimit = rateLimit({ windowMs: 15 * 60e3, max: 20, message: { error: 'Too many requests, try later' } });
const loginLimit = rateLimit({ windowMs: 15 * 60e3, max: 10, message: { error: 'Too many login attempts' } });

const auth = (req, res, next) => {
  try { const t = (req.headers.authorization || '').replace('Bearer ', ''); if (jwt.verify(t, JWT_SECRET).role !== 'admin') throw 0; next(); }
  catch { res.status(401).json({ error: 'Unauthorized' }); }
};

app.post('/api/admin/login', loginLimit, (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && typeof password === 'string' && bcrypt.compareSync(password, ADMIN_HASH))
    return res.json({ token: jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' }) });
  res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/bookings', bookingLimit, async (req, res) => {
  const { d, e } = validate(req.body || {});
  if (Object.keys(e).length) return res.status(400).json({ error: 'Validation failed', fields: e });
  const dup = db.prepare(`SELECT id FROM bookings WHERE mobile=? AND date=? AND time=? AND appliance=? AND status!='Cancelled'`).get(d.mobile, d.date, d.time, d.appliance);
  if (dup) return res.status(409).json({ error: 'This booking already exists', id: dup.id });
  const r = db.prepare(`INSERT INTO bookings(name,mobile,appliance,problem,description,address,date,time,notes) VALUES(?,?,?,?,?,?,?,?,?)`)
    .run(d.name, d.mobile, d.appliance, d.problem, d.description, d.address, d.date, d.time, d.notes);
  const b = { id: r.lastInsertRowid, ...d };
  sendSms(b);
  res.status(201).json({ booking: b, whatsappUrl: waUrl(b) });
});

// Customer self-cancel: needs the booking id + the mobile used to book
app.post('/api/bookings/:id/cancel', bookingLimit, (req, res) => {
  const r = db.prepare(`UPDATE bookings SET status='Cancelled' WHERE id=? AND mobile=? AND status IN ('Pending','Confirmed')`).run(req.params.id, clean(req.body?.mobile, 15));
  r.changes ? res.json({ ok: true }) : res.status(404).json({ error: 'Booking not found or cannot be cancelled' });
});

app.get('/api/bookings', auth, (req, res) => {
  const { q = '', appliance = '', date = '' } = req.query;
  const rows = db.prepare(`SELECT * FROM bookings WHERE (name LIKE ? OR mobile LIKE ?) AND (?='' OR appliance=?) AND (?='' OR date=?) ORDER BY id DESC`)
    .all(`%${q}%`, `%${q}%`, appliance, appliance, date, date);
  const c = s => db.prepare('SELECT COUNT(*) n FROM bookings WHERE status=?').get(s).n;
  res.json({ bookings: rows, stats: { total: db.prepare('SELECT COUNT(*) n FROM bookings').get().n, pending: c('Pending'), completed: c('Completed') } });
});
app.get('/api/bookings/:id', auth, (req, res) => {
  const b = db.prepare('SELECT * FROM bookings WHERE id=?').get(req.params.id);
  b ? res.json(b) : res.status(404).json({ error: 'Not found' });
});
app.patch('/api/bookings/:id', auth, (req, res) => {
  const cur = db.prepare('SELECT * FROM bookings WHERE id=?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Not found' });
  const { status, ...rest } = req.body || {};
  if (status !== undefined && !STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const { d, e } = validate({ ...cur, ...rest });
  if (Object.keys(rest).length && Object.keys(e).length) return res.status(400).json({ error: 'Validation failed', fields: e });
  db.prepare(`UPDATE bookings SET name=?,mobile=?,appliance=?,problem=?,description=?,address=?,date=?,time=?,notes=?,status=? WHERE id=?`)
    .run(d.name, d.mobile, d.appliance, d.problem, d.description, d.address, cur.date < today() && !rest.date ? cur.date : d.date, d.time, d.notes, status || cur.status, cur.id);
  res.json(db.prepare('SELECT * FROM bookings WHERE id=?').get(cur.id));
});
app.delete('/api/bookings/:id', auth, (req, res) => {
  db.prepare('DELETE FROM bookings WHERE id=?').run(req.params.id); res.json({ ok: true });
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Server error' }); });
if (require.main === module) app.listen(PORT, () => console.log('SDKR API on :' + PORT));
module.exports = { app, validate, waUrl };
