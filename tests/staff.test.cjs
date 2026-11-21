const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { randomUUID } = require("node:crypto");
const { createStaffApi } = require("../server/staff.cjs");

test("a physical scan and paid receipt can be retried without duplicating points", async (t) => {
  const api = createStaffApi(":memory:");
  const server = http.createServer((req, res) =>
    api(req, res, () => res.writeHead(404).end()),
  );
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const call = async (route, body, token = "") => {
    const response = await fetch(
      "http://127.0.0.1:" + server.address().port + "/bonzy-api/" + route,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(body),
      },
    );
    return { status: response.status, data: await response.json() };
  };
  const secret = randomUUID();
  const guest = (await call("guest", {}, secret)).data.id;
  const employee = { code: "AULA", employee: "tim" };
  assert.equal((await call("login", { ...employee, pin: "0000" })).status, 401);
  const { token } = (await call("login", { ...employee, pin: "1357" })).data;
  const scan = randomUUID();
  const selection = { guest, kind: "qr", requestId: scan };
  for (let i = 0; i < 2; i++)
    assert.equal((await call("scan", selection, token)).data.scan, scan);
  const purchase = { receipt: "001", amount: 8500, scan };
  for (let i = 0; i < 2; i++)
    assert.equal((await call("purchase", purchase, token)).data.points, 850);
  const secondScan = randomUUID();
  await call(
    "scan",
    { ...selection, requestId: secondScan, kind: "manual" },
    token,
  );
  assert.equal(
    (await call("purchase", { ...purchase, scan: secondScan }, token)).status,
    409,
  );
  const { events } = (await call("report", {}, token)).data;
  assert.deepEqual(events.map((event) => event.kind).sort(), [
    "manual",
    "purchase",
    "qr",
  ]);
  assert.equal((await call("guest", {}, secret)).data.credits.length, 1);
  await call("end", {}, token);
  assert.equal((await call("report", {}, token)).status, 401);
});
