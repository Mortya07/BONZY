export type Category =
  "Все места" | "Кофе" | "Завтраки" | "Рестораны" | "Бургеры" | "Пицца";
export type Restaurant = {
  id: string;
  name: string;
  subtitle: string;
  category: Category;
  tags: string[];
  rating: string;
  distance: string;
  address: string;
  hours: string;
  cashback: number;
  color: string;
  initials: string;
  photo: string;
  reward: string;
  rewardCost: number;
};
export type Dish = {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  weight: string;
  photo: string;
  section: string;
};
export type Cart = {
  restaurantId: string | null;
  items: Record<string, number>;
};
export type Order = {
  id: string;
  restaurantId: string;
  items: { dishId: string; name: string; price: number; quantity: number }[];
  subtotal: number;
  spent: number;
  total: number;
  earned: number;
  createdAt: string;
  mode: "takeaway" | "dinein";
  table: string;
  note: string;
  status: "preparing" | "completed" | "cancelled";
};
export type Reward = {
  id: string;
  restaurantId: string;
  name: string;
  code: string;
  createdAt: string;
};
export type State = {
  version: 1;
  name: string;
  favorites: string[];
  balances: Record<string, number>;
  cart: Cart;
  orders: Order[];
  rewards: Reward[];
};
export const initialState: State = {
  version: 1,
  name: "Алижан",
  favorites: ["aula"],
  balances: {
    aula: 1250,
    bloom: 480,
    ember: 0,
    forno: 200,
    bun: 0,
    matcha: 150,
  },
  cart: { restaurantId: null, items: {} },
  orders: [],
  rewards: [],
};
export const money = (value: number) => `${value.toLocaleString("ru-RU")} ₸`;
export const cartCount = (cart: Cart) =>
  Object.values(cart.items).reduce((a, b) => a + b, 0);
export function cartSubtotal(cart: Cart, dishes: Dish[]) {
  return Object.entries(cart.items).reduce(
    (sum, [id, quantity]) =>
      sum + (dishes.find((d) => d.id === id)?.price ?? 0) * quantity,
    0,
  );
}
export function addDish(cart: Cart, dish: Dish): Cart {
  if ((cart.items[dish.id] ?? 0) >= 99) return cart;
  if (
    cart.restaurantId &&
    cart.restaurantId !== dish.restaurantId &&
    cartCount(cart)
  )
    throw new Error("В корзине блюда другого заведения");
  return {
    restaurantId: dish.restaurantId,
    items: { ...cart.items, [dish.id]: (cart.items[dish.id] ?? 0) + 1 },
  };
}
export function changeQuantity(cart: Cart, id: string, delta: number): Cart {
  const items = { ...cart.items };
  const next = (items[id] ?? 0) + delta;
  if (next <= 0) delete items[id];
  else items[id] = Math.min(next, 99);
  return {
    restaurantId: Object.keys(items).length ? cart.restaurantId : null,
    items,
  };
}
export function checkout(
  state: State,
  restaurants: Restaurant[],
  dishes: Dish[],
  options: {
    useBonuses: boolean;
    mode: Order["mode"];
    table: string;
    note: string;
  },
  now = new Date(),
): State {
  const restaurant = restaurants.find((r) => r.id === state.cart.restaurantId);
  if (!restaurant || !cartCount(state.cart))
    throw new Error("Добавьте блюда в корзину");
  if (options.mode === "dinein" && !/^\d{1,3}$/.test(options.table.trim()))
    throw new Error("Укажите номер стола от 1 до 999");
  if (options.mode === "dinein" && Number(options.table) < 1)
    throw new Error("Номер стола должен быть больше нуля");
  const items = Object.entries(state.cart.items).map(([id, quantity]) => {
    const dish = dishes.find(
      (d) => d.id === id && d.restaurantId === restaurant.id,
    );
    if (!dish || !Number.isInteger(quantity) || quantity < 1 || quantity > 99)
      throw new Error("Проверьте состав корзины");
    return { dishId: id, name: dish.name, price: dish.price, quantity };
  });
  const subtotal = cartSubtotal(state.cart, dishes);
  const balance = state.balances[restaurant.id] ?? 0;
  const spent = options.useBonuses
    ? Math.min(balance, Math.floor(subtotal * 0.3))
    : 0;
  const total = subtotal - spent;
  const earned = Math.floor((total * restaurant.cashback) / 100);
  const order: Order = {
    id: `BZ-${now.getTime().toString(36).toUpperCase()}-${state.orders.length.toString(36).toUpperCase()}`,
    restaurantId: restaurant.id,
    items,
    subtotal,
    spent,
    total,
    earned,
    createdAt: now.toISOString(),
    mode: options.mode,
    table: options.table.trim(),
    note: options.note.trim().slice(0, 250),
    status: "preparing",
  };
  // Demo ledger: each brand has its own balance; a repeated tap after checkout sees an empty cart.
  return {
    ...state,
    balances: { ...state.balances, [restaurant.id]: balance - spent + earned },
    orders: [order, ...state.orders],
    cart: { restaurantId: null, items: {} },
  };
}
export function cancelOrder(state: State, orderId: string): State {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order || order.status !== "preparing") return state;
  const balance = state.balances[order.restaurantId] ?? 0;
  // Once earned points are used elsewhere, cancellation requires a server reconciliation.
  if (balance < order.earned)
    throw new Error(
      "Бонусы заказа уже использованы. Отмена недоступна в демоверсии.",
    );
  return {
    ...state,
    balances: {
      ...state.balances,
      [order.restaurantId]: balance - order.earned + order.spent,
    },
    orders: state.orders.map((o) =>
      o.id === orderId ? { ...o, status: "cancelled" } : o,
    ),
  };
}
export function redeemReward(
  state: State,
  restaurant: Restaurant,
  now = new Date(),
): State {
  const balance = state.balances[restaurant.id] ?? 0;
  if (balance < restaurant.rewardCost)
    throw new Error("Пока недостаточно бонусов");
  const code = `DEMO-${now.getTime().toString(36).toUpperCase()}-${state.rewards.length.toString(36).toUpperCase()}`;
  return {
    ...state,
    balances: {
      ...state.balances,
      [restaurant.id]: balance - restaurant.rewardCost,
    },
    rewards: [
      {
        id: code,
        code,
        restaurantId: restaurant.id,
        name: restaurant.reward,
        createdAt: now.toISOString(),
      },
      ...state.rewards,
    ],
  };
}
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const amount = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const validDate = (v: unknown): v is string =>
  typeof v === "string" && Number.isFinite(Date.parse(v));
function validOrder(v: unknown): v is Order {
  if (!record(v)) return false;
  if (
    typeof v.id !== "string" ||
    typeof v.restaurantId !== "string" ||
    !validDate(v.createdAt)
  )
    return false;
  if (
    !["preparing", "completed", "cancelled"].includes(v.status as string) ||
    !["takeaway", "dinein"].includes(v.mode as string)
  )
    return false;
  if (
    typeof v.table !== "string" ||
    typeof v.note !== "string" ||
    !["subtotal", "spent", "total", "earned"].every((k) => amount(v[k]))
  )
    return false;
  if (!Array.isArray(v.items) || v.items.length === 0) return false;
  return v.items.every(
    (i) =>
      record(i) &&
      typeof i.dishId === "string" &&
      typeof i.name === "string" &&
      amount(i.price) &&
      amount(i.quantity) &&
      i.quantity > 0 &&
      i.quantity <= 99,
  );
}
export function restoreState(
  raw: string | null,
  catalog?: { restaurants: Restaurant[]; dishes: Dish[] },
): State {
  if (!raw) return initialState;
  try {
    const s: unknown = JSON.parse(raw);
    if (!record(s)) return initialState;
    if (
      s.version !== 1 ||
      typeof s.name !== "string" ||
      !s.name.trim() ||
      s.name.length > 30 ||
      !Array.isArray(s.favorites) ||
      !s.favorites.every((v: unknown) => typeof v === "string") ||
      !record(s.balances) ||
      !Object.values(s.balances).every(
        (v) => typeof v === "number" && Number.isInteger(v) && v >= 0,
      ) ||
      !record(s.cart) ||
      !(
        s.cart.restaurantId === null || typeof s.cart.restaurantId === "string"
      ) ||
      !record(s.cart.items) ||
      !Object.values(s.cart.items).every(
        (v) => typeof v === "number" && Number.isInteger(v) && v > 0 && v <= 99,
      ) ||
      !Array.isArray(s.orders) ||
      !s.orders.every(validOrder) ||
      !Array.isArray(s.rewards) ||
      !s.rewards.every(
        (r) =>
          record(r) &&
          typeof r.id === "string" &&
          typeof r.restaurantId === "string" &&
          typeof r.name === "string" &&
          typeof r.code === "string" &&
          validDate(r.createdAt),
      )
    )
      return initialState;
    const restored = s as unknown as State;
    if (
      Object.keys(restored.cart.items).length > 0 &&
      restored.cart.restaurantId === null
    )
      return initialState;
    if (
      new Set(restored.orders.map((o) => o.id)).size !==
        restored.orders.length ||
      new Set(restored.rewards.map((r) => r.id)).size !==
        restored.rewards.length
    )
      return initialState;
    if (catalog) {
      const ids = new Set(catalog.restaurants.map((r) => r.id));
      if (
        restored.favorites.some((id) => !ids.has(id)) ||
        Object.keys(restored.balances).some((id) => !ids.has(id))
      )
        return initialState;
      if (
        restored.cart.restaurantId !== null &&
        !ids.has(restored.cart.restaurantId)
      )
        return initialState;
      if (
        Object.keys(restored.cart.items).some(
          (id) =>
            !catalog.dishes.some(
              (d) =>
                d.id === id && d.restaurantId === restored.cart.restaurantId,
            ),
        )
      )
        return initialState;
      if (
        restored.orders.some((o) => !ids.has(o.restaurantId)) ||
        restored.rewards.some((r) => !ids.has(r.restaurantId))
      )
        return initialState;
    }
    return restored;
  } catch {
    return initialState;
  }
}
