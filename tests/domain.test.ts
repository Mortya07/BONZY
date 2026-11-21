import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDish,
  cancelOrder,
  cartSubtotal,
  changeQuantity,
  checkout,
  initialState,
  redeemReward,
  restoreState,
  type Dish,
  type Restaurant,
} from "../src/domain";
const restaurant = {
  id: "aula",
  cashback: 10,
  reward: "Тост",
  rewardCost: 1500,
} as Restaurant;
const dish = {
  id: "a1",
  restaurantId: "aula",
  name: "Тост",
  price: 3200,
} as Dish;
const other = { ...dish, id: "b1", restaurantId: "bloom" };
const makeState = () => ({
  ...structuredClone(initialState),
  cart: addDish(initialState.cart, dish),
});
const options = {
  useBonuses: true,
  mode: "takeaway" as const,
  table: "",
  note: "",
};
test("a basket contains one brand and preserves the original when a different brand is added", () => {
  const cart = addDish(initialState.cart, dish);
  assert.throws(() => addDish(cart, other));
  assert.equal(cart.items.a1, 1);
  assert.equal(cartSubtotal(cart, [dish]), 3200);
  assert.deepEqual(changeQuantity(cart, dish.id, -1), {
    restaurantId: null,
    items: {},
  });
});
test("spending is capped at 30%, earnings use paid amount, other brand balances remain separate", () => {
  const next = checkout(makeState(), [restaurant], [dish], options);
  assert.equal(next.orders[0].spent, 960);
  assert.equal(next.orders[0].total, 2240);
  assert.equal(next.orders[0].earned, 224);
  assert.equal(next.balances.aula, 514);
  assert.equal(next.balances.bloom, initialState.balances.bloom);
  assert.throws(() => checkout(next, [restaurant], [dish], options));
});
test("insufficient balance limits spending; disabling bonus spending preserves the balance", () => {
  const state = makeState();
  state.balances.aula = 100;
  const next = checkout(state, [restaurant], [dish], options);
  assert.equal(next.orders[0].spent, 100);
  assert.equal(next.orders[0].earned, 310);
  assert.equal(
    checkout(makeState(), [restaurant], [dish], {
      ...options,
      useBonuses: false,
    }).balances.aula,
    1570,
  );
});
test("cancellation reverses the bonus ledger exactly once", () => {
  const placed = checkout(makeState(), [restaurant], [dish], options);
  const cancelled = cancelOrder(placed, placed.orders[0].id);
  assert.equal(cancelled.balances.aula, initialState.balances.aula);
  assert.equal(cancelled.orders[0].status, "cancelled");
  assert.deepEqual(cancelOrder(cancelled, cancelled.orders[0].id), cancelled);
});
test("cancellation cannot create a negative balance after earnings were spent", () => {
  const placed = checkout(makeState(), [restaurant], [dish], options);
  placed.balances.aula = 0;
  assert.throws(() => cancelOrder(placed, placed.orders[0].id));
});
test("dine-in needs a valid table and basket rejects tampered quantities", () => {
  for (const table of ["", "0", "000", "abc", "-1", "1000"])
    assert.throws(() =>
      checkout(makeState(), [restaurant], [dish], {
        ...options,
        mode: "dinein",
        table,
      }),
    );
  assert.equal(
    checkout(makeState(), [restaurant], [dish], {
      ...options,
      mode: "dinein",
      table: "12",
    }).orders[0].table,
    "12",
  );
  const bad = makeState();
  bad.cart.items.a1 = -2;
  assert.throws(() => checkout(bad, [restaurant], [dish], options));
});
test("rewards deduct only the issuing brand and cannot be redeemed without balance", () => {
  assert.throws(() => redeemReward(initialState, restaurant));
  const state = structuredClone(initialState);
  state.balances.aula = 1600;
  const redeemed = redeemReward(state, restaurant);
  assert.equal(redeemed.balances.aula, 100);
  assert.equal(redeemed.rewards[0].restaurantId, "aula");
  assert.equal(redeemed.balances.bloom, initialState.balances.bloom);
  assert.throws(() => redeemReward(redeemed, restaurant));
});
test("storage survives round-trip and recovers from invalid data", () => {
  const state = checkout(makeState(), [restaurant], [dish], options);
  assert.deepEqual(restoreState(JSON.stringify(state)), state);
  for (const raw of [
    null,
    "{}",
    "broken",
    '{"version":2}',
    JSON.stringify({ ...initialState, balances: { aula: -1 } }),
  ])
    assert.deepEqual(restoreState(raw), initialState);
});
test("storage rejects malformed nested orders, rewards and unknown catalog items", () => {
  for (const bad of [
    { ...initialState, orders: [null] },
    { ...initialState, rewards: [{}] },
    { ...initialState, cart: { restaurantId: null, items: { a1: 1 } } },
  ])
    assert.deepEqual(restoreState(JSON.stringify(bad)), initialState);
  const unknown = {
    ...initialState,
    cart: { restaurantId: "aula", items: { removed: 1 } },
  };
  assert.deepEqual(
    restoreState(JSON.stringify(unknown), {
      restaurants: [restaurant],
      dishes: [dish],
    }),
    initialState,
  );
});
test("orders at identical timestamps keep distinct ids and quantities stop at 99", () => {
  const now = new Date("2026-11-14T10:00:00Z");
  const first = checkout(makeState(), [restaurant], [dish], options, now);
  const second = checkout(
    { ...first, cart: addDish(first.cart, dish) },
    [restaurant],
    [dish],
    options,
    now,
  );
  assert.notEqual(second.orders[0].id, second.orders[1].id);
  const cart = { restaurantId: "aula", items: { a1: 99 } };
  assert.equal(addDish(cart, dish).items.a1, 99);
});
