import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import QRCode from "react-native-qrcode-svg";
import {
  ArrowDownUp,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Coffee,
  Compass,
  Egg,
  Gift,
  Heart,
  HelpCircle,
  Leaf,
  MapPin,
  Minus,
  Plus,
  QrCode,
  ReceiptText,
  Search,
  Settings2,
  ShoppingBag,
  Sparkles,
  Star,
  UserRound,
  Utensils,
  Wallet,
  X,
  Pizza,
  Sandwich,
} from "lucide-react-native";
import { categories, dishes, photos, restaurants } from "./src/data";
import {
  addDish,
  cancelOrder,
  cartCount,
  cartSubtotal,
  Category,
  changeQuantity,
  checkout,
  Dish,
  initialState,
  money,
  Order,
  redeemReward,
  Restaurant,
  restoreState,
  State,
} from "./src/domain";
import { Brand, Button, C, Empty, IconButton, s, Tag } from "./src/ui";

type Tab = "discover" | "favorites" | "bonuses" | "orders" | "profile";
type Sheet =
  | { type: "restaurant"; id: string }
  | { type: "cart" | "qr" | "rules" | "edit" | "notifications" }
  | { type: "order"; id: string }
  | { type: "switch"; dish: Dish }
  | null;
const iconMap: Record<string, any> = {
  compass: Compass,
  coffee: Coffee,
  egg: Egg,
  utensils: Utensils,
  pizza: Pizza,
  sandwich: Sandwich,
};
const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: "discover", label: "Открывать", icon: Compass },
  { id: "favorites", label: "Избранное", icon: Heart },
  { id: "bonuses", label: "Мои бонусы", icon: Gift },
  { id: "orders", label: "Заказы", icon: ReceiptText },
  { id: "profile", label: "Профиль", icon: UserRound },
];
const photo = (key: string) => photos[key as keyof typeof photos];
const date = (iso: string) =>
  new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
const STORAGE = "bonzy.demo.v1";

function Bonzy() {
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<State>(initialState);
  const stateRef = useRef(state);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("discover");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("Все места");
  const [sort, setSort] = useState(false);
  const [onlyBonus, setOnlyBonus] = useState(false);
  const [toast, setToast] = useState("");
  const [mode, setMode] = useState<Order["mode"]>("takeaway");
  const [table, setTable] = useState("");
  const [note, setNote] = useState("");
  const [useBonuses, setUseBonuses] = useState(false);
  const [editName, setEditName] = useState("");
  const [menuSection, setMenuSection] = useState("Всё меню");
  const saveQueue = useRef(Promise.resolve());
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const notify = (message: string) => setToast(message);
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE)
      .then((raw) => {
        if (mounted) {
          const loaded = restoreState(raw, { restaurants, dishes });
          stateRef.current = loaded;
          setState(loaded);
          setReady(true);
        }
      })
      .catch(() => {
        if (mounted) {
          setReady(true);
          setToast(
            "Не удалось прочитать сохранение. Работаем в текущем сеансе.",
          );
        }
      });
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (sheet) {
        setSheet(null);
        return true;
      }
      if (tab !== "discover") {
        setTab("discover");
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [sheet, tab]);
  const update = (fn: (current: State) => State) => {
    try {
      const next = fn(stateRef.current);
      stateRef.current = next;
      setState(next);
      saveQueue.current = saveQueue.current
        .then(() => AsyncStorage.setItem(STORAGE, JSON.stringify(next)))
        .catch(() => {
          notify("Не удалось сохранить изменения на устройстве.");
        });
      return true;
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Не удалось выполнить действие",
      );
      return false;
    }
  };
  const go = (next: Tab) => {
    setTab(next);
    setSheet(null);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };
  const openRestaurant = (id: string) => {
    setMenuSection("Всё меню");
    setSheet({ type: "restaurant", id });
  };
  const toggleFavorite = (id: string) =>
    update((current) => ({
      ...current,
      favorites: current.favorites.includes(id)
        ? current.favorites.filter((f) => f !== id)
        : [...current.favorites, id],
    }));
  const add = (dish: Dish) => {
    if (
      stateRef.current.cart.restaurantId &&
      stateRef.current.cart.restaurantId !== dish.restaurantId &&
      cartCount(stateRef.current.cart)
    ) {
      setSheet({ type: "switch", dish });
      return;
    }
    update((current) => ({ ...current, cart: addDish(current.cart, dish) }));
  };
  const totalBonuses = Object.values(state.balances).reduce((a, b) => a + b, 0);
  const count = cartCount(state.cart);
  const cartRestaurant = restaurants.find(
    (r) => r.id === state.cart.restaurantId,
  );
  const subtotal = cartSubtotal(state.cart, dishes);
  const discount =
    cartRestaurant && useBonuses
      ? Math.min(
          state.balances[cartRestaurant.id] ?? 0,
          Math.floor(subtotal * 0.3),
        )
      : 0;
  const activeRestaurant =
    sheet?.type === "restaurant"
      ? restaurants.find((r) => r.id === sheet.id)
      : undefined;
  const selectedOrder =
    sheet?.type === "order"
      ? state.orders.find((o) => o.id === sheet.id)
      : undefined;
  const visible = restaurants
    .filter(
      (r) =>
        (!query ||
          `${r.name} ${r.tags.join(" ")} ${r.address}`
            .toLocaleLowerCase("ru")
            .includes(query.toLocaleLowerCase("ru"))) &&
        (category === "Все места" || r.category === category) &&
        (!onlyBonus || (state.balances[r.id] ?? 0) > 0),
    )
    .sort((a, b) => (sort ? Number(b.rating) - Number(a.rating) : 0));
  function Quantity({ dish }: { dish: Dish }) {
    const q =
      state.cart.restaurantId === dish.restaurantId
        ? (state.cart.items[dish.id] ?? 0)
        : 0;
    return q ? (
      <View style={s.quantity}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Убрать ${dish.name}`}
          onPress={() =>
            update((current) => ({
              ...current,
              cart: changeQuantity(current.cart, dish.id, -1),
            }))
          }
          style={s.quantityBtn}
        >
          <Minus size={16} color={C.ink} />
        </Pressable>
        <Text style={s.bold}>{q}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ещё ${dish.name}`}
          disabled={q >= 99}
          onPress={() => add(dish)}
          style={s.quantityBtn}
        >
          <Plus size={16} color={C.ink} />
        </Pressable>
      </View>
    ) : (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Добавить ${dish.name}`}
        onPress={() => add(dish)}
        style={s.addButton}
      >
        <Text style={s.bold}>{money(dish.price)}</Text>
        <Plus size={18} color={C.orange} />
      </Pressable>
    );
  }
  function RestaurantCard({ restaurant: r }: { restaurant: Restaurant }) {
    return (
      <View
        style={[
          s.restaurantCard,
          { width: wide ? "31.9%" : width >= 650 ? "48%" : "100%" },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Открыть ${r.name}`}
          onPress={() => openRestaurant(r.id)}
        >
          <ImageBackground
            source={photo(r.photo)}
            style={s.restaurantImage}
            imageStyle={{ borderRadius: 20 }}
          >
            <View style={s.imageTop}>
              <Tag>↗ {r.cashback}% бонусами</Tag>
            </View>
            <View style={s.imageBottom}>
              <Text style={s.imageCaption}>
                {r.category === "Кофе"
                  ? "Пауза, которая нужна"
                  : r.category === "Завтраки"
                    ? "С добрым утром, Алматы"
                    : "Новый повод встретиться"}
              </Text>
            </View>
          </ImageBackground>
          <View style={s.cardInfo}>
            <View style={s.between}>
              <Text style={s.cardName}>{r.name}</Text>
              <View style={s.row}>
                <Star size={13} fill={C.ink} color={C.ink} />
                <Text style={s.bold}>{r.rating}</Text>
              </View>
            </View>
            <Text style={s.meta}>
              {r.tags.join(" · ")} · {r.distance}
            </Text>
            <View style={[s.row, { marginTop: 13 }]}>
              <View style={s.dot} />
              <Text style={s.small}>Навынос и в заведении</Text>
              {(state.balances[r.id] ?? 0) > 0 && (
                <Text
                  style={[
                    s.small,
                    { color: C.orange, marginLeft: "auto", fontWeight: "700" },
                  ]}
                >
                  {state.balances[r.id]} б.
                </Text>
              )}
            </View>
          </View>
        </Pressable>
        <View style={{ position: "absolute", top: 12, right: 12 }}>
          <IconButton
            icon={Heart}
            label={`${state.favorites.includes(r.id) ? "Убрать из избранного" : "В избранное"} ${r.name}`}
            active={state.favorites.includes(r.id)}
            onPress={() => toggleFavorite(r.id)}
          />
        </View>
      </View>
    );
  }
  function LoyaltyCard({ restaurant: r }: { restaurant: Restaurant }) {
    const balance = state.balances[r.id] ?? 0;
    return (
      <View style={[s.loyaltyCard, { width: wide ? "48.7%" : "100%" }]}>
        <View style={s.between}>
          <View style={s.row}>
            <Brand restaurant={r} />
            <View>
              <Text style={s.bold}>{r.name}</Text>
              <Text style={s.small}>{r.cashback}% с каждой покупки</Text>
            </View>
          </View>
          <Text style={[s.h2, { color: r.color }]}>
            {balance} <Text style={s.small}>б.</Text>
          </Text>
        </View>
        <View style={s.progress}>
          <View
            style={[
              s.progressFill,
              {
                width: `${Math.min(100, (balance / r.rewardCost) * 100)}%`,
                backgroundColor: r.color,
              },
            ]}
          />
        </View>
        <View style={s.between}>
          <Text style={s.small}>{r.reward}</Text>
          <Text style={s.small}>{r.rewardCost} б.</Text>
        </View>
        <View style={{ marginTop: 18 }}>
          <Button
            secondary
            disabled={balance < r.rewardCost}
            icon={Gift}
            onPress={() => {
              if (update((current) => redeemReward(current, r)))
                notify(`Подарок «${r.reward}» добавлен в ваши купоны`);
            }}
          >
            {balance >= r.rewardCost
              ? "Обменять на подарок"
              : `Ещё ${r.rewardCost - balance} б. до подарка`}
          </Button>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => openRestaurant(r.id)}
          style={{ alignSelf: "center", padding: 14 }}
        >
          <Text style={[s.small, { color: C.orange }]}>Открыть меню →</Text>
        </Pressable>
      </View>
    );
  }
  const nav = (bottom = false) => (
    <View style={bottom ? s.bottomNav : s.topNav}>
      {tabs.map(({ id, label, icon: Icon }) => (
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === id }}
          accessibilityLabel={label}
          key={id}
          onPress={() => go(id)}
          style={[
            bottom ? s.bottomTab : s.navTab,
            tab === id && !bottom && { backgroundColor: C.pale },
          ]}
        >
          <Icon
            size={bottom ? 22 : 18}
            color={tab === id ? C.orange : C.muted}
          />
          <Text
            style={[
              bottom ? s.bottomLabel : s.navLabel,
              tab === id && { color: C.orange },
            ]}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
  function renderdiscover() {
    return (
      <>
        <View style={[s.between, { marginBottom: 20 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.eyebrow}>ТВОЙ ГОРОД НА ВКУС</Text>
            <Text style={[s.greeting, !wide && { fontSize: 26 }]}>
              Хороший день, {state.name}{" "}
              <Text style={{ color: C.orange }}>✳</Text>
            </Text>
          </View>
          {!wide && (
            <IconButton
              icon={QrCode}
              label="Мой QR"
              onPress={() => setSheet({ type: "qr" })}
            />
          )}
          {wide && (
            <Text style={s.meta}>Маленькие открытия. Большие впечатления.</Text>
          )}
        </View>
        <View style={[s.heroRow, !wide && { flexDirection: "column" }]}>
          <View style={[s.hero, !wide && { minHeight: 300 }]}>
            <View style={[s.heroCopy, !wide && { padding: 24, width: "100%" }]}>
              <View style={s.heroBadge}>
                <Sparkles size={13} color={C.orange} />
                <Text style={s.heroBadgeText}>БОЛЬШЕ, ЧЕМ ПРОСТО ЕДА</Text>
              </View>
              <Text
                style={[s.heroTitle, !wide && { fontSize: 30, lineHeight: 35 }]}
              >
                Любимые места.{"\n"}Новые поводы{"\n"}
                <Text style={{ color: C.orange }}>возвращаться.</Text>
              </Text>
              <Text
                style={[
                  s.body,
                  { marginTop: 15, maxWidth: 245, color: "#767266" },
                ]}
              >
                Открывай рестораны, заказывай и собирай приятные бонусы.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => openRestaurant("aula")}
                style={s.heroLink}
              >
                <Text style={[s.bold, { color: C.orange }]}>
                  Найти свой вкус
                </Text>
                <ArrowRight size={18} color={C.orange} />
              </Pressable>
            </View>
            <Image
              source={photo("breakfast")}
              style={[
                s.heroPhoto,
                !wide && { right: -65, width: "55%", opacity: 0.22 },
              ]}
            />
            {wide && (
              <View style={s.heroPhotoLabel}>
                <View style={s.dot} />
                <Text style={[s.small, { color: C.ink }]}>
                  Начни с хорошего завтрака
                </Text>
              </View>
            )}
            {wide && (
              <View style={s.heroCircle}>
                <Text style={s.heroCircleText}>вкусно{"\n"}быть вместе</Text>
              </View>
            )}
          </View>
          <View
            style={[
              s.balanceHero,
              !wide && { width: "100%", minHeight: 0, padding: 22 },
            ]}
          >
            <View style={s.between}>
              <View style={s.row}>
                <Wallet size={19} color={C.green} />
                <Text style={[s.bold, { color: C.green }]}>
                  Твои приятности
                </Text>
              </View>
              <Sparkles size={21} color={C.green} />
            </View>
            <View style={!wide && s.between}>
              <Text
                style={[s.bigBalance, !wide && { marginTop: 12, fontSize: 34 }]}
              >
                {totalBonuses.toLocaleString("ru-RU")}{" "}
                <Text style={{ fontSize: 17, fontWeight: "500" }}>бонусов</Text>
              </Text>
              {!wide && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Мои бонусные карты"
                  onPress={() => go("bonuses")}
                >
                  <ArrowRight size={23} color={C.green} />
                </Pressable>
              )}
            </View>
            {wide && (
              <>
                <Text style={[s.body, { color: "#6F7C6D", marginTop: 5 }]}>
                  У каждого места — свои бонусы.{"\n"}У тебя — один BONZY.
                </Text>
                <View style={[s.row, { marginTop: 22, marginBottom: 22 }]}>
                  {restaurants.slice(0, 3).map((r) => (
                    <Brand key={r.id} restaurant={r} size={36} />
                  ))}
                  <Text style={[s.small, { marginLeft: 5 }]}>6 программ</Text>
                </View>
                <Button secondary onPress={() => go("bonuses")}>
                  Мои бонусные карты →
                </Button>
              </>
            )}
          </View>
        </View>
        <View style={[s.row, { marginTop: 30, gap: 12 }]}>
          <View style={s.search}>
            <Search size={19} color={C.muted} />
            <TextInput
              accessibilityLabel="Найти ресторан или кухню"
              placeholder="Место, кухня или настроение"
              placeholderTextColor={C.muted}
              value={query}
              onChangeText={setQuery}
              style={s.searchInput}
            />
            {!!query && (
              <Pressable
                accessibilityLabel="Очистить поиск"
                accessibilityRole="button"
                onPress={() => setQuery("")}
              >
                <X size={18} color={C.muted} />
              </Pressable>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: onlyBonus }}
            accessibilityLabel="Места с моими бонусами"
            onPress={() => setOnlyBonus(!onlyBonus)}
            style={[
              s.filterButton,
              onlyBonus && { backgroundColor: C.pale, borderColor: C.orange },
            ]}
          >
            <Settings2 size={19} color={onlyBonus ? C.orange : C.ink} />
            {wide && <Text style={s.bold}>Мои бонусы</Text>}
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.categories}
        >
          {categories.map((c) => {
            const Icon = iconMap[c.icon];
            const active = category === c.name;
            return (
              <Pressable
                key={c.name}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setCategory(c.name)}
                style={[s.category, active && s.categoryActive]}
              >
                <Icon size={18} color={active ? "#fff" : "#777B6E"} />
                <Text style={[s.categoryText, active && { color: "#fff" }]}>
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={[s.between, { marginTop: 8, marginBottom: 22 }]}>
          <View>
            <Text style={s.h2}>
              {query || category !== "Все места" || onlyBonus
                ? "Нашли для тебя"
                : "Здесь тебе понравится"}
            </Text>
            <Text style={[s.meta, { marginTop: 6 }]}>
              {visible.length} мест · выбранные с хорошим вкусом
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Сортировать по рейтингу"
            onPress={() => setSort(!sort)}
            style={s.row}
          >
            <ArrowDownUp size={15} color={C.muted} />
            {wide && (
              <Text style={s.small}>
                {sort ? "По рейтингу" : "Рекомендуем"}
              </Text>
            )}
          </Pressable>
        </View>
        <View style={s.grid}>
          {visible.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </View>
        {!visible.length && (
          <Empty
            icon={Search}
            title="Пока ничего не нашлось"
            text="Попробуй другую кухню или название."
            action={() => {
              setQuery("");
              setCategory("Все места");
              setOnlyBonus(false);
            }}
          />
        )}
        <View style={s.editorialBanner}>
          <View style={[s.row, { flex: 1 }]}>
            <Leaf size={25} color={C.green} />
            <View style={{ flex: 1 }}>
              <Text style={s.bold}>
                Хорошие привычки начинаются с любимых мест
              </Text>
              <Text style={[s.small, { marginTop: 5 }]}>
                Один QR — для бонусных программ BONZY
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityLabel="Открыть мой QR"
            accessibilityRole="button"
            onPress={() => setSheet({ type: "qr" })}
          >
            <ArrowRight size={23} color={C.green} />
          </Pressable>
        </View>
      </>
    );
  }

  function renderfavorites() {
    return (
      <>
        <Text style={s.eyebrow}>ВСЕГДА ХОРОШАЯ ИДЕЯ</Text>
        <Text style={s.pageTitle}>Любимые места</Text>
        <Text style={[s.body, { marginBottom: 26 }]}>
          Сохраняй то, к чему хочется возвращаться.
        </Text>
        <View style={s.grid}>
          {restaurants
            .filter((r) => state.favorites.includes(r.id))
            .map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
        </View>
        {!state.favorites.length && (
          <Empty
            icon={Heart}
            title="Здесь будут твои любимые"
            text="Нажми на сердечко на карточке ресторана."
            action={() => go("discover")}
          />
        )}
      </>
    );
  }

  function renderbonuses() {
    return (
      <>
        <View style={s.between}>
          <View>
            <Text style={s.eyebrow}>ПРИЯТНОСТИ В ОДНОМ МЕСТЕ</Text>
            <Text style={s.pageTitle}>Твои бонусы</Text>
          </View>
          <IconButton
            icon={HelpCircle}
            label="Правила бонусов"
            onPress={() => setSheet({ type: "rules" })}
          />
        </View>
        <View style={s.walletBanner}>
          <View style={{ flex: 1 }}>
            <Text style={[s.small, { color: "#BECFC2" }]}>
              Всего на твоих картах
            </Text>
            <Text style={[s.bigBalance, { color: "#fff", marginTop: 8 }]}>
              {totalBonuses.toLocaleString("ru-RU")}{" "}
              <Text style={{ fontSize: 18 }}>б.</Text>
            </Text>
            <Text style={{ color: "#BECFC2", fontSize: 13, marginTop: 8 }}>
              Бонусы действуют в своём заведении.
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Показать мой QR"
            accessibilityRole="button"
            onPress={() => setSheet({ type: "qr" })}
            style={s.walletQr}
          >
            <QrCode size={42} color={C.green} />
          </Pressable>
        </View>
        <Text style={[s.h2, { marginBottom: 20 }]}>Карты любимых мест</Text>
        <View style={s.grid}>
          {restaurants.map((r) => (
            <LoyaltyCard key={r.id} restaurant={r} />
          ))}
        </View>
        {state.rewards.length > 0 && (
          <>
            <Text style={[s.h2, { marginVertical: 24 }]}>Мои подарки</Text>
            {state.rewards.map((reward) => (
              <View key={reward.id} style={s.infoCard}>
                <View style={s.row}>
                  <Gift color={C.orange} size={22} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.bold}>{reward.name}</Text>
                    <Text style={s.small}>
                      {
                        restaurants.find((r) => r.id === reward.restaurantId)
                          ?.name
                      }{" "}
                      · {reward.code}
                    </Text>
                  </View>
                  <Tag>Демо</Tag>
                </View>
              </View>
            ))}
          </>
        )}
      </>
    );
  }

  function renderorders() {
    return (
      <>
        <Text style={s.eyebrow}>ТВОЯ ВКУСНАЯ ИСТОРИЯ</Text>
        <Text style={s.pageTitle}>Заказы</Text>
        <Text style={[s.body, { marginBottom: 24 }]}>
          От первого кофе до любимого ужина.
        </Text>
        {!state.orders.length ? (
          <Empty
            icon={ShoppingBag}
            title="Самое вкусное впереди"
            text="Выбери место и собери первый заказ. Мы сохраним его здесь."
            action={() => go("discover")}
          />
        ) : (
          state.orders.map((o) => {
            const r = restaurants.find((r) => r.id === o.restaurantId)!;
            return (
              <Pressable
                key={o.id}
                accessibilityRole="button"
                accessibilityLabel={`Заказ ${o.id}`}
                onPress={() => setSheet({ type: "order", id: o.id })}
                style={s.orderCard}
              >
                <View style={s.between}>
                  <View style={s.row}>
                    <Brand restaurant={r} />
                    <View>
                      <Text style={s.bold}>{r.name}</Text>
                      <Text style={s.small}>{date(o.createdAt)}</Text>
                    </View>
                  </View>
                  <Tag>
                    {o.status === "preparing"
                      ? "Готовится · демо"
                      : o.status === "completed"
                        ? "Получен"
                        : "Отменён"}
                  </Tag>
                </View>
                <View style={[s.between, { marginTop: 20 }]}>
                  <Text style={[s.body, { flex: 1 }]} numberOfLines={1}>
                    {o.items.map((i) => i.name).join(", ")}
                  </Text>
                  <Text style={s.bold}>{money(o.total)}</Text>
                  <ChevronRight size={18} color={C.muted} />
                </View>
              </Pressable>
            );
          })
        )}
      </>
    );
  }

  function renderprofile() {
    return (
      <>
        <Text style={s.eyebrow}>РАДЫ БЫТЬ РЯДОМ</Text>
        <Text style={s.pageTitle}>Мой BONZY</Text>
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={{ color: C.orange, fontSize: 32, fontWeight: "700" }}>
              {state.name[0]?.toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.h2}>{state.name}</Text>
            <Text style={s.meta}>Гость BONZY · Алматы</Text>
          </View>
          <IconButton
            icon={UserRound}
            label="Изменить имя"
            onPress={() => {
              setEditName(state.name);
              setSheet({ type: "edit" });
            }}
          />
        </View>
        {[
          {
            title: "Мой QR-код",
            subtitle: "Один код для любимых мест",
            icon: QrCode,
            action: () => setSheet({ type: "qr" } as Sheet),
          },
          {
            title: "Бонусы и подарки",
            subtitle: `${totalBonuses} бонусов на картах`,
            icon: Gift,
            action: () => go("bonuses"),
          },
          {
            title: "История заказов",
            subtitle: `${state.orders.length} заказов`,
            icon: ReceiptText,
            action: () => go("orders"),
          },
          {
            title: "Как работает BONZY",
            subtitle: "О бонусах и этой версии",
            icon: HelpCircle,
            action: () => setSheet({ type: "rules" } as Sheet),
          },
        ].map((item) => (
          <Pressable
            key={item.title}
            accessibilityRole="button"
            onPress={item.action}
            style={s.profileRow}
          >
            <item.icon color={C.green} size={23} />
            <View style={{ flex: 1 }}>
              <Text style={s.bold}>{item.title}</Text>
              <Text style={[s.small, { marginTop: 4 }]}>{item.subtitle}</Text>
            </View>
            <ChevronRight size={19} color={C.muted} />
          </Pressable>
        ))}
        <View style={[s.infoCard, { marginTop: 25 }]}>
          <Text style={s.bold}>Сделано для хороших встреч.</Text>
          <Text style={[s.body, { marginTop: 8 }]}>
            BONZY 1.0 · Демонстрационная версия. Заведения, меню, балансы и
            заказы — примеры. Данные хранятся только на этом устройстве.
            Реальные платежи и отправка заказов не подключены.
          </Text>
        </View>
      </>
    );
  }

  function renderModal() {
    return (
      <Modal
        visible={sheet !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSheet(null)}
      >
        <View
          style={[
            s.overlay,
            { paddingTop: insets.top + 15, paddingBottom: insets.bottom + 15 },
          ]}
        >
          <Pressable
            accessibilityLabel="Закрыть окно"
            onPress={() => setSheet(null)}
            style={StyleSheet.absoluteFill}
          />
          <View
            accessibilityViewIsModal
            style={[
              s.modal,
              {
                maxHeight: "100%",
                width: wide ? (activeRestaurant ? 850 : 560) : "100%",
              },
            ]}
          >
            <View style={s.modalHeader}>
              <Text style={s.modalHeading}>
                {activeRestaurant?.name ??
                  (sheet?.type === "cart"
                    ? "Твой заказ"
                    : sheet?.type === "qr"
                      ? "Мой QR"
                      : sheet?.type === "order"
                        ? "Детали заказа"
                        : sheet?.type === "edit"
                          ? "Как тебя зовут?"
                          : sheet?.type === "switch"
                            ? "Другое заведение"
                            : sheet?.type === "notifications"
                              ? "Уведомления"
                              : "Знакомься, BONZY")}
              </Text>
              <IconButton
                icon={X}
                label="Закрыть"
                onPress={() => setSheet(null)}
              />
            </View>
            <ScrollView
              key={sheet?.type === "restaurant" ? sheet.id : sheet?.type}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 12 }}
            >
              {activeRestaurant && (
                <>
                  <ImageBackground
                    source={photo(activeRestaurant.photo)}
                    style={s.detailImage}
                  >
                    <View
                      style={{ position: "absolute", left: 20, bottom: 20 }}
                    >
                      <Tag>
                        ↗ {activeRestaurant.cashback}% возвращаются бонусами
                      </Tag>
                    </View>
                  </ImageBackground>
                  <View style={s.sheetContent}>
                    <View style={s.between}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.pageTitle}>{activeRestaurant.name}</Text>
                        <Text style={s.body}>{activeRestaurant.subtitle}</Text>
                      </View>
                      <IconButton
                        icon={Heart}
                        label="Избранное"
                        active={state.favorites.includes(activeRestaurant.id)}
                        onPress={() => toggleFavorite(activeRestaurant.id)}
                      />
                    </View>
                    <View
                      style={[
                        s.row,
                        { flexWrap: "wrap", marginTop: 18, gap: 16 },
                      ]}
                    >
                      <View style={s.row}>
                        <Star size={15} fill={C.ink} color={C.ink} />
                        <Text style={s.bold}>{activeRestaurant.rating}</Text>
                      </View>
                      <Text style={s.small}>{activeRestaurant.distance}</Text>
                      <View style={s.row}>
                        <Clock3 size={14} color={C.muted} />
                        <Text style={s.small}>{activeRestaurant.hours}</Text>
                      </View>
                    </View>
                    <View style={[s.row, { marginTop: 10 }]}>
                      <MapPin size={14} color={C.muted} />
                      <Text style={s.small}>{activeRestaurant.address}</Text>
                    </View>
                    <View style={[s.between, s.detailBalance]}>
                      <Text style={[s.bold, { color: C.green }]}>
                        На твоей карте:{" "}
                        {state.balances[activeRestaurant.id] ?? 0} б.
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Правила бонусов"
                        onPress={() => setSheet({ type: "rules" })}
                      >
                        <HelpCircle size={19} color={C.green} />
                      </Pressable>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 8, paddingBottom: 20 }}
                    >
                      {[
                        "Всё меню",
                        ...new Set(
                          dishes
                            .filter(
                              (d) => d.restaurantId === activeRestaurant.id,
                            )
                            .map((d) => d.section),
                        ),
                      ].map((section) => (
                        <Pressable
                          accessibilityRole="button"
                          key={section}
                          onPress={() => setMenuSection(section)}
                          style={[
                            s.menuTab,
                            section === menuSection && {
                              backgroundColor: C.ink,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              s.bold,
                              section === menuSection && { color: "white" },
                            ]}
                          >
                            {section}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                    {dishes
                      .filter(
                        (d) =>
                          d.restaurantId === activeRestaurant.id &&
                          (menuSection === "Всё меню" ||
                            d.section === menuSection),
                      )
                      .map((d) => (
                        <View style={s.dish} key={d.id}>
                          <Image source={photo(d.photo)} style={s.dishPhoto} />
                          <View style={{ flex: 1, gap: 7 }}>
                            <Text style={s.dishName}>{d.name}</Text>
                            <Text style={s.small}>{d.description}</Text>
                            <Text style={s.small}>{d.weight}</Text>
                            <View
                              style={{ alignSelf: "flex-start", marginTop: 5 }}
                            >
                              <Quantity dish={d} />
                            </View>
                          </View>
                        </View>
                      ))}
                    <Text style={[s.small, { marginTop: 10 }]}>
                      Демонстрационное меню. Фото иллюстрируют блюда. Состав и
                      аллергены уточняются у заведения.
                    </Text>
                  </View>
                </>
              )}
              {sheet?.type === "cart" && (
                <View style={s.sheetContent}>
                  {!cartRestaurant || !count ? (
                    <Empty
                      icon={ShoppingBag}
                      title="Твоя корзина пока пуста"
                      text="Добавь что-нибудь вкусное из меню."
                      action={() => go("discover")}
                    />
                  ) : (
                    <>
                      <View style={s.row}>
                        <Brand restaurant={cartRestaurant} />
                        <View>
                          <Text style={s.h2}>{cartRestaurant.name}</Text>
                          <Text style={s.small}>{cartRestaurant.address}</Text>
                        </View>
                      </View>
                      <View style={s.segment}>
                        {(
                          [
                            { id: "takeaway", label: "С собой" },
                            { id: "dinein", label: "В заведении" },
                          ] as const
                        ).map((m) => (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ selected: mode === m.id }}
                            key={m.id}
                            onPress={() => setMode(m.id)}
                            style={[
                              s.segmentItem,
                              mode === m.id && s.segmentActive,
                            ]}
                          >
                            <Text style={s.bold}>{m.label}</Text>
                          </Pressable>
                        ))}
                      </View>
                      {mode === "dinein" && (
                        <TextInput
                          accessibilityLabel="Номер стола"
                          value={table}
                          onChangeText={setTable}
                          keyboardType="number-pad"
                          maxLength={3}
                          placeholder="Номер стола"
                          style={s.input}
                        />
                      )}
                      <View style={[s.row, { marginBottom: 20 }]}>
                        <Clock3 size={16} color={C.green} />
                        <Text style={s.small}>
                          {mode === "takeaway"
                            ? "Примерное время: 15–25 минут"
                            : "Подадим к твоему столу · демо"}
                        </Text>
                      </View>
                      {Object.entries(state.cart.items).map(([id]) => {
                        const d = dishes.find((d) => d.id === id)!;
                        return (
                          <View style={s.cartDish} key={id}>
                            <Image
                              source={photo(d.photo)}
                              style={{
                                width: 62,
                                height: 62,
                                borderRadius: 14,
                              }}
                            />
                            <View style={{ flex: 1 }}>
                              <Text style={s.bold}>{d.name}</Text>
                              <Text style={[s.small, { marginTop: 5 }]}>
                                {money(d.price)}
                              </Text>
                            </View>
                            <Quantity dish={d} />
                          </View>
                        );
                      })}
                      <TextInput
                        accessibilityLabel="Комментарий к заказу"
                        placeholder="Пожелания к заказу"
                        value={note}
                        maxLength={250}
                        onChangeText={setNote}
                        style={[s.input, { marginTop: 20 }]}
                        multiline
                      />
                      <View style={[s.between, { paddingVertical: 20 }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.bold}>Использовать бонусы</Text>
                          <Text style={[s.small, { marginTop: 5 }]}>
                            Доступно {state.balances[cartRestaurant.id] ?? 0} б.
                            · до 30%
                          </Text>
                        </View>
                        <Switch
                          accessibilityLabel="Использовать бонусы"
                          value={useBonuses}
                          onValueChange={setUseBonuses}
                          trackColor={{ false: "#DDD", true: "#8CB79A" }}
                          thumbColor={useBonuses ? C.green : "#fff"}
                        />
                      </View>
                      <View style={s.receipt}>
                        <View style={s.between}>
                          <Text style={s.body}>Блюда</Text>
                          <Text style={s.bold}>{money(subtotal)}</Text>
                        </View>
                        <View style={s.between}>
                          <Text style={s.body}>Списание бонусов</Text>
                          <Text style={[s.bold, { color: C.green }]}>
                            −{money(discount)}
                          </Text>
                        </View>
                        <View style={s.between}>
                          <Text style={s.h2}>Итого</Text>
                          <Text style={s.h2}>{money(subtotal - discount)}</Text>
                        </View>
                        <Text style={[s.small, { color: C.green }]}>
                          +
                          {Math.floor(
                            ((subtotal - discount) * cartRestaurant.cashback) /
                              100,
                          )}{" "}
                          бонусов после демозаказа
                        </Text>
                      </View>
                      <View style={[s.infoCard, { marginVertical: 20 }]}>
                        <Text style={s.bold}>Тестовый заказ · без оплаты</Text>
                        <Text style={[s.small, { marginTop: 6 }]}>
                          Деньги не списываются. Заказ не отправляется в
                          ресторан. Бонусы изменятся только в демоверсии.
                        </Text>
                      </View>
                      <Button
                        icon={Check}
                        testID="checkout"
                        onPress={() => {
                          if (
                            update((current) =>
                              checkout(current, restaurants, dishes, {
                                useBonuses,
                                mode,
                                table,
                                note,
                              }),
                            )
                          ) {
                            setSheet({
                              type: "order",
                              id: stateRef.current.orders[0].id,
                            });
                            setNote("");
                            setTable("");
                            notify("Демозаказ создан. Приятного аппетита!");
                          }
                        }}
                      >
                        Создать демозаказ · {money(subtotal - discount)}
                      </Button>
                    </>
                  )}
                </View>
              )}
              {sheet?.type === "qr" && (
                <View style={[s.sheetContent, { alignItems: "center" }]}>
                  <View style={s.qrAvatar}>
                    <QrCode size={25} color={C.orange} />
                  </View>
                  <Text style={s.h2}>Один код. Любимые места.</Text>
                  <Text
                    style={[
                      s.body,
                      { textAlign: "center", marginTop: 12, marginBottom: 25 },
                    ]}
                  >
                    В рабочей версии покажи QR на кассе,{"\n"}чтобы получить
                    бонусы за покупку.
                  </Text>
                  <View style={s.qrFrame}>
                    <QRCode
                      value="bonzy://demo/guest/BZ-000142"
                      size={210}
                      color={C.ink}
                      backgroundColor="#fff"
                    />
                  </View>
                  <Text style={[s.bold, { letterSpacing: 3, marginTop: 23 }]}>
                    BZ · 000 142
                  </Text>
                  <Text style={[s.small, { marginTop: 8 }]}>
                    {state.name} · демоаккаунт
                  </Text>
                  <View style={[s.infoCard, { marginTop: 28 }]}>
                    <Text style={[s.small, { textAlign: "center" }]}>
                      Демонстрационный QR. Не авторизует покупку и не начисляет
                      реальные бонусы.
                    </Text>
                  </View>
                </View>
              )}
              {sheet?.type === "rules" && (
                <View style={s.sheetContent}>
                  <View style={s.emptyIcon}>
                    <Sparkles size={30} color={C.orange} />
                  </View>
                  <Text style={s.h2}>Вкусно быть вместе</Text>
                  <Text style={[s.body, { marginTop: 15 }]}>
                    Любимые рестораны, меню и бонусные карты в одном приложении.
                  </Text>
                  {[
                    [
                      "01",
                      "Каждому месту — свои бонусы",
                      "Баллы AULA можно использовать только в AULA. Общая сумма на главной помогает видеть все накопления.",
                    ],
                    [
                      "02",
                      "Заказы приносят приятности",
                      "В демоверсии 1 бонус равен 1 ₸. Бонусами можно покрыть до 30% стоимости блюд. Начисление идёт на оставшуюся сумму.",
                    ],
                    [
                      "03",
                      "Подарки вместо баллов",
                      "Обменивай бонусы на подарки заведения. Купон появится в разделе «Мои бонусы».",
                    ],
                    [
                      "04",
                      "Сейчас это демоверсия",
                      "Заведения вымышлены. Заказы, QR и купоны тестовые. Нет реальных платежей, доставки, авторизации и кассовой интеграции. Данные сохраняются на текущем устройстве.",
                    ],
                  ].map(([n, title, text]) => (
                    <View key={n} style={s.rule}>
                      <Text style={s.ruleNumber}>{n}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.bold}>{title}</Text>
                        <Text style={[s.body, { marginTop: 7 }]}>{text}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              {sheet?.type === "edit" && (
                <View style={s.sheetContent}>
                  <Text style={s.body}>
                    Так мы будем встречать тебя в приложении.
                  </Text>
                  <TextInput
                    autoFocus
                    accessibilityLabel="Имя"
                    value={editName}
                    onChangeText={setEditName}
                    maxLength={30}
                    style={[s.input, { marginTop: 24 }]}
                  />
                  <Button
                    disabled={!editName.trim()}
                    onPress={() => {
                      update((current) => ({
                        ...current,
                        name: editName.trim(),
                      }));
                      setSheet(null);
                    }}
                  >
                    Сохранить
                  </Button>
                </View>
              )}
              {sheet?.type === "notifications" && (
                <View style={s.sheetContent}>
                  <Empty
                    icon={Bell}
                    title="Пока тихо"
                    text="Здесь будут новости любимых мест и обновления заказов. В демоверсии push-уведомления не подключены."
                  />
                </View>
              )}
              {sheet?.type === "switch" && (
                <View style={s.sheetContent}>
                  <Text style={[s.body, { marginBottom: 25 }]}>
                    В корзине блюда из {cartRestaurant?.name}. Для заказа в{" "}
                    {
                      restaurants.find((r) => r.id === sheet.dish.restaurantId)
                        ?.name
                    }{" "}
                    нужно заменить корзину.
                  </Text>
                  <Button
                    onPress={() => {
                      const dish = sheet.dish;
                      update((current) => ({
                        ...current,
                        cart: addDish({ restaurantId: null, items: {} }, dish),
                      }));
                      openRestaurant(dish.restaurantId);
                    }}
                  >
                    Заменить корзину
                  </Button>
                  <View style={{ marginTop: 10 }}>
                    <Button
                      secondary
                      onPress={() =>
                        cartRestaurant
                          ? openRestaurant(cartRestaurant.id)
                          : setSheet(null)
                      }
                    >
                      Оставить текущий заказ
                    </Button>
                  </View>
                </View>
              )}
              {selectedOrder && (
                <View style={s.sheetContent}>
                  <View style={{ alignItems: "center", marginBottom: 25 }}>
                    <View style={[s.emptyIcon, { backgroundColor: "#EFF4EC" }]}>
                      <CheckCircle2 size={33} color={C.green} />
                    </View>
                    <Text style={[s.h2, { textAlign: "center" }]}>
                      {selectedOrder.status === "preparing"
                        ? "Готовим хорошее настроение"
                        : selectedOrder.status === "cancelled"
                          ? "Заказ отменён"
                          : "Спасибо за вкусную встречу"}
                    </Text>
                    <Text style={[s.small, { marginTop: 10 }]}>
                      {selectedOrder.id} · {date(selectedOrder.createdAt)}
                    </Text>
                  </View>
                  <View style={s.infoCard}>
                    <Text style={s.bold}>Демонстрационный заказ</Text>
                    <Text style={[s.small, { marginTop: 7 }]}>
                      В ресторан ничего не отправлено. Оплата не списывалась.
                    </Text>
                  </View>
                  <Text style={[s.h2, { marginTop: 22 }]}>
                    {
                      restaurants.find(
                        (r) => r.id === selectedOrder.restaurantId,
                      )?.name
                    }
                  </Text>
                  <Text style={[s.body, { marginTop: 6 }]}>
                    {selectedOrder.mode === "takeaway"
                      ? "С собой · 15–25 минут"
                      : `В заведении · стол ${selectedOrder.table}`}
                  </Text>
                  <View style={s.receipt}>
                    {selectedOrder.items.map((i) => (
                      <View key={i.dishId} style={s.between}>
                        <Text style={[s.body, { flex: 1 }]}>
                          {i.quantity} × {i.name}
                        </Text>
                        <Text style={s.bold}>
                          {money(i.price * i.quantity)}
                        </Text>
                      </View>
                    ))}
                    <View style={s.between}>
                      <Text style={s.body}>Списано бонусов</Text>
                      <Text style={s.bold}>{selectedOrder.spent} б.</Text>
                    </View>
                    <View style={s.between}>
                      <Text style={s.h2}>Итого</Text>
                      <Text style={s.h2}>{money(selectedOrder.total)}</Text>
                    </View>
                    <Text style={[s.small, { color: C.green }]}>
                      {selectedOrder.status === "cancelled"
                        ? "Бонусные операции отменены"
                        : `Начислено ${selectedOrder.earned} бонусов`}
                    </Text>
                  </View>
                  {!!selectedOrder.note && (
                    <Text style={[s.body, { marginTop: 18 }]}>
                      Комментарий: {selectedOrder.note}
                    </Text>
                  )}
                  {selectedOrder.status === "preparing" && (
                    <View style={{ gap: 12, marginTop: 22 }}>
                      <Button
                        onPress={() => {
                          update((current) => ({
                            ...current,
                            orders: current.orders.map((o) =>
                              o.id === selectedOrder.id
                                ? { ...o, status: "completed" }
                                : o,
                            ),
                          }));
                          notify("Демозаказ отмечен полученным");
                        }}
                      >
                        Отметить полученным · демо
                      </Button>
                      <Button
                        secondary
                        onPress={() => {
                          if (
                            update((current) =>
                              cancelOrder(current, selectedOrder.id),
                            )
                          )
                            notify("Демозаказ отменён. Бонусы восстановлены.");
                        }}
                      >
                        Отменить демозаказ
                      </Button>
                    </View>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => go("orders")}
                    style={{ alignSelf: "center", padding: 22 }}
                  >
                    <Text style={[s.bold, { color: C.orange }]}>
                      Все мои заказы →
                    </Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
            {activeRestaurant && count > 0 && (
              <View style={s.modalBottom}>
                <Button
                  icon={ShoppingBag}
                  onPress={() => setSheet({ type: "cart" })}
                >
                  К заказу · {count} {money(subtotal)}
                </Button>
              </View>
            )}
          </View>
        </View>
        {!!toast && (
          <View
            pointerEvents="none"
            accessibilityLiveRegion="polite"
            style={s.modalToast}
          >
            <Text style={s.toastText}>{toast}</Text>
          </View>
        )}
      </Modal>
    );
  }
  if (!ready)
    return (
      <View style={[s.root, s.empty]}>
        <ActivityIndicator color={C.orange} size="large" />
        <Text style={s.h2}>bonzy</Text>
      </View>
    );
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={s.header}>
        <View
          style={[
            s.headerInner,
            !wide && { paddingHorizontal: 20, height: 78 },
          ]}
        >
          <Pressable
            accessibilityLabel="BONZY — главная"
            accessibilityRole="button"
            onPress={() => go("discover")}
            style={s.row}
          >
            <View style={s.logoMark}>
              <Text style={s.logoMarkText}>b</Text>
            </View>
            <Text style={s.logo}>
              bonzy<Text style={{ color: C.orange }}>.</Text>
            </Text>
          </Pressable>
          {wide && <View style={s.headerDivider} />}
          <View style={[s.row, { marginLeft: wide ? 0 : "auto" }]}>
            <MapPin size={17} color={C.orange} />
            <View>
              <Text style={s.bold}>Алматы</Text>
              {wide && <Text style={s.small}>Вкусное рядом</Text>}
            </View>
          </View>
          <View style={{ flex: wide ? 1 : 0 }} />
          {wide && <Text style={s.demoPill}>ДЕМО · ГОСТЬ</Text>}
          <IconButton
            icon={Bell}
            label="Уведомления"
            onPress={() => setSheet({ type: "notifications" })}
          />
          {wide && (
            <Button icon={QrCode} onPress={() => setSheet({ type: "qr" })}>
              Мой QR
            </Button>
          )}
        </View>
      </View>
      {wide && (
        <View style={s.navWrap}>
          <View style={s.navInner}>
            {nav()}
            <View style={s.row}>
              <View style={s.dot} />
              <Text style={s.small}>Один город. Много любимых мест.</Text>
            </View>
          </View>
        </View>
      )}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: wide ? 40 : 115 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[s.main, { paddingHorizontal: wide ? 32 : 20 }]}>
          {tab === "discover" && renderdiscover()}
          {tab === "favorites" && renderfavorites()}
          {tab === "bonuses" && renderbonuses()}
          {tab === "orders" && renderorders()}
          {tab === "profile" && renderprofile()}
          <View style={s.footer}>
            <Text style={s.footerLogo}>bonzy.</Text>
            <Text style={s.small}>Вкусно быть вместе. · Алматы</Text>
            <Text style={[s.small, { marginLeft: wide ? "auto" : 0 }]}>
              Демонстрационная версия
            </Text>
          </View>
        </View>
      </ScrollView>
      {count > 0 && !sheet && (
        <View
          style={[s.floatingCart, { bottom: wide ? 24 : 82 + insets.bottom }]}
        >
          <Button icon={ShoppingBag} onPress={() => setSheet({ type: "cart" })}>
            Корзина · {count} {money(subtotal)}
          </Button>
        </View>
      )}
      {!wide && (
        <View
          style={{
            backgroundColor: C.white,
            paddingBottom: insets.bottom,
            borderTopWidth: 1,
            borderTopColor: C.line,
          }}
        >
          {nav(true)}
        </View>
      )}
      {renderModal()}
      {!!toast && !sheet && (
        <View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[s.toast, { bottom: wide ? 95 : 150 }]}
        >
          <Text style={s.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <Bonzy />
    </SafeAreaProvider>
  );
}
