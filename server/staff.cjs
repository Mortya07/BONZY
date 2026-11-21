const { DatabaseSync } = require("node:sqlite");
const { randomUUID, createHash } = require("node:crypto");
const path = require("node:path");
const fs = require("node:fs");
const staff = [
  { id: "aya", name: "Аяна", pin: "2468" },
  { id: "tim", name: "Тимур", pin: "1357" },
];
const digest = (value) => createHash("sha256").update(value).digest("hex");
function reject(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}
function createStaffApi(filename) {
  if (!filename) {
    const dir = path.join(__dirname, "../.expo/bonzy");
    fs.mkdirSync(dir, { recursive: true });
    filename = path.join(dir, "demo.sqlite");
  }
  const db = new DatabaseSync(filename);
  db.exec(`CREATE TABLE IF NOT EXISTS guest (id TEXT PRIMARY KEY, secret TEXT UNIQUE);
    CREATE TABLE IF NOT EXISTS shift (id TEXT PRIMARY KEY, employee TEXT, started INTEGER, ended INTEGER);
    CREATE TABLE IF NOT EXISTS session (token TEXT PRIMARY KEY, shift TEXT);
    CREATE TABLE IF NOT EXISTS event (id TEXT PRIMARY KEY, shift TEXT, guest TEXT, kind TEXT, time INTEGER, receipt TEXT UNIQUE, amount INTEGER, points INTEGER, scan TEXT UNIQUE);`);
  const failures = new Map();
  function logIn(body) {
    const employee = staff.find((e) => e.id === body.employee);
    if (!employee || body.code !== "AULA") reject("Проверьте заведение и имя");
    const now = Date.now();
    const attempts = (failures.get(employee.id) || []).filter(
      (t) => now - t < 60000,
    );
    if (attempts.length >= 5) reject("Попробуйте снова через минуту", 429);
    if (body.pin !== employee.pin) {
      failures.set(employee.id, [...attempts, now]);
      reject("Неверный PIN", 401);
    }
    failures.delete(employee.id);
    let shift = db
      .prepare(
        "SELECT id FROM shift WHERE employee=? AND ended IS NULL AND started>? ORDER BY started DESC LIMIT 1",
      )
      .get(employee.id, now - 12 * 3600000);
    if (!shift) {
      shift = { id: randomUUID() };
      db.prepare("INSERT INTO shift VALUES (?,?,?,NULL)").run(
        shift.id,
        employee.id,
        now,
      );
    }
    const token = randomUUID();
    db.prepare("INSERT INTO session VALUES (?,?)").run(digest(token), shift.id);
    return { token, name: employee.name };
  }
  function handle(route, body, token = "") {
    const now = Date.now();
    if (route === "guest") {
      if (!/^[a-f0-9-]{36}$/.test(token)) reject("Нужна карта гостя", 401);
      const secret = digest(token),
        id = secret.slice(0, 12).toUpperCase();
      db.prepare("INSERT OR IGNORE INTO guest VALUES (?,?)").run(id, secret);
      const credits = db
        .prepare(
          "SELECT id, time, receipt, amount, points FROM event WHERE guest=? AND kind='purchase' ORDER BY time DESC",
        )
        .all(id);
      return { id, credits };
    }
    if (route === "team") {
      if (body.code !== "AULA") reject("Код заведения не найден");
      return { names: staff.map(({ id, name }) => ({ id, name })) };
    }
    if (route === "login") return logIn(body);
    const shift = db
      .prepare(
        "SELECT s.* FROM shift s JOIN session a ON a.shift=s.id WHERE a.token=? AND s.ended IS NULL AND s.started>?",
      )
      .get(digest(token), now - 12 * 3600000);
    if (!shift) reject("Войдите в смену заново", 401);
    if (route === "end") {
      db.prepare("UPDATE shift SET ended=? WHERE id=?").run(now, shift.id);
      return {};
    }
    if (route === "report")
      return {
        started: shift.started,
        events: db
          .prepare(
            "SELECT * FROM event WHERE shift=? ORDER BY time DESC, rowid DESC",
          )
          .all(shift.id),
      };
    if (route === "scan") {
      const { guest, requestId, kind } = body;
      if (
        !["qr", "manual"].includes(kind) ||
        typeof guest !== "string" ||
        !db.prepare("SELECT id FROM guest WHERE id=?").get(guest)
      )
        reject("Карта BONZY не найдена");
      if (typeof requestId !== "string" || !/^[a-f0-9-]{36}$/.test(requestId))
        reject("Повторите сканирование");
      const prev = db
        .prepare("SELECT shift,guest,kind FROM event WHERE id=?")
        .get(requestId);
      if (
        prev &&
        (prev.shift !== shift.id || prev.guest !== guest || prev.kind !== kind)
      )
        reject("Сканирование уже использовано");
      if (!prev)
        db.prepare(
          "INSERT INTO event(id,shift,guest,kind,time) VALUES (?,?,?,?,?)",
        ).run(requestId, shift.id, guest, kind, now);
      return { scan: requestId, guest };
    }
    if (route === "purchase") {
      const scan =
        typeof body.scan === "string" &&
        db
          .prepare(
            "SELECT * FROM event WHERE id=? AND shift=? AND kind IN ('qr','manual')",
          )
          .get(body.scan, shift.id);
      if (!scan) reject("Сначала выберите карту гостя");
      const receipt =
        typeof body.receipt === "string" && body.receipt.trim().toUpperCase();
      if (!receipt || !/^[А-ЯЁA-Z0-9/-]{1,48}$/u.test(receipt))
        reject("Введите номер чека (буквы, цифры, / или -)");
      if (
        !Number.isSafeInteger(body.amount) ||
        body.amount < 1 ||
        body.amount > 1000000
      )
        reject("Введите сумму от 1 до 1 000 000 ₸");
      const prev = db
        .prepare("SELECT * FROM event WHERE receipt=? OR scan=?")
        .get(receipt, scan.id);
      if (prev) {
        if (
          prev.scan === scan.id &&
          prev.receipt === receipt &&
          prev.amount === body.amount
        )
          return { points: prev.points };
        reject("По этому чеку или сканированию уже начислены бонусы", 409);
      }
      const points = Math.floor(body.amount / 10);
      db.prepare("INSERT INTO event VALUES (?,?,?,?,?,?,?,?,?)").run(
        randomUUID(),
        shift.id,
        scan.guest,
        "purchase",
        now,
        receipt,
        body.amount,
        points,
        scan.id,
      );
      return { points };
    }
    reject("Маршрут не найден", 404);
  }
  return async (req, res, next) => {
    if (!req.url.startsWith("/bonzy-api/")) return next();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    try {
      if (
        req.method !== "POST" ||
        !req.headers["content-type"]?.startsWith("application/json")
      )
        reject("Нужен JSON", 415);
      let raw = "";
      for await (const block of req) {
        raw += block;
        if (raw.length > 4096) reject("Запрос слишком большой", 413);
      }
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        reject("Некорректный запрос");
      }
      if (!body || typeof body !== "object") reject("Некорректный запрос");
      const value = handle(
        req.url.slice("/bonzy-api/".length),
        body,
        (req.headers.authorization || "").replace(/^Bearer /, ""),
      );
      res.end(JSON.stringify(value));
    } catch (err) {
      res.statusCode = err.status || 500;
      res.end(
        JSON.stringify({
          error: err.status ? err.message : "Ошибка сервера BONZY",
        }),
      );
    }
  };
}
module.exports = { createStaffApi };
