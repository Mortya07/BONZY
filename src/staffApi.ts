import { Platform, TurboModuleRegistry, type TurboModule } from "react-native";
import { randomUUID } from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";
export type Credit = {
  id: string;
  time: number;
  receipt: string;
  amount: number;
  points: number;
};
export type Card = { id: string; credits: Credit[] };
export type StaffEvent = Credit & {
  kind: "qr" | "manual" | "purchase";
  guest: string;
};
export type Report = { started: number; events: StaffEvent[] };
interface SourceCode extends TurboModule {
  getConstants(): { scriptURL: string };
}
export async function api<T>(
  route: string,
  body: object = {},
  token = "",
): Promise<T> {
  const host =
    Platform.OS === "web"
      ? window.location.origin
      : TurboModuleRegistry.get<SourceCode>("SourceCode")?.getConstants()
          .scriptURL;
  if (!host || !/^https?:/.test(host))
    throw Error("Для кабинета запустите локальный сервер BONZY");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(new URL("/bonzy-api/" + route, host).href, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok) throw Error(data.error || "Ошибка запроса");
    return data;
  } catch (error) {
    if (
      error instanceof SyntaxError ||
      error instanceof TypeError ||
      controller.signal.aborted
    )
      throw Error("Нет связи с сервером BONZY. Проверьте сеть и повторите.");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
let identity: Promise<string> | undefined;
export async function guestCard() {
  identity ??= (async () => {
    let key = await AsyncStorage.getItem("bonzy.guest.secret.v1");
    if (!key) {
      key = randomUUID();
      await AsyncStorage.setItem("bonzy.guest.secret.v1", key);
    }
    return key;
  })().catch((err) => {
    identity = undefined;
    throw err;
  });
  return api<Card>("guest", {}, await identity);
}
export const cardPrefix = "bonzy://guest/";
