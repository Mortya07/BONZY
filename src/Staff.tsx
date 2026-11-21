import React, { useRef, useState, useEffect } from "react";
import {
  BackHandler,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { randomUUID } from "expo-crypto";
import { ArrowLeft, ScanLine } from "lucide-react-native";
import { Button, C, s, IconButton } from "./ui";
import { api, cardPrefix, guestCard, Report } from "./staffApi";
import { money } from "./domain";
type Person = { id: string; name: string };
type Auth = { token: string; name: string };
type Scan = { scan: string; guest: string };
function Field({
  label,
  value,
  onChange,
  numeric = false,
  secret = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  numeric?: boolean;
  secret?: boolean;
}) {
  return (
    <View style={{ gap: 5 }}>
      <Text style={s.bold}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        style={s.input}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secret}
        autoCapitalize="characters"
        autoCorrect={false}
        keyboardType={numeric ? "number-pad" : "default"}
        maxLength={secret ? 4 : 48}
      />
    </View>
  );
}
export function Staff({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState<
    "team" | "pin" | "desk" | "camera" | "receipt" | "history"
  >("team");
  const [code, setCode] = useState(""),
    [pin, setPin] = useState(""),
    [people, setPeople] = useState<Person[]>([]),
    [person, setPerson] = useState("");
  const [auth, setAuth] = useState<Auth>(),
    [scan, setScan] = useState<Scan>(),
    [report, setReport] = useState<Report>();
  const [receipt, setReceipt] = useState(""),
    [amount, setAmount] = useState(""),
    [manual, setManual] = useState("");
  const [feedback, setFeedback] = useState(""),
    [busy, setBusy] = useState(false);
  const locked = useRef(false),
    scanned = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const requestId = useRef("");
  const [useManual, setUseManual] = useState(false);
  const run = async (fn: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setFeedback("");
    try {
      await fn();
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Повторите попытку");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  const refresh = async (token: string) =>
    setReport(await api<Report>("report", {}, token));
  const back = () => {
    if (locked.current) return;
    if (step === "team" || step === "desk") {
      onExit();
      return;
    }
    setFeedback("");
    setStep(step === "pin" ? "team" : "desk");
  };
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      back();
      return true;
    });
    return () => sub.remove();
  }, [step, onExit]);
  const selectGuest = async (id: string, kind: "manual" | "qr") => {
    if (!auth) return;
    if (!/^[A-F0-9]{12}$/.test(id))
      throw Error("Нужен QR или номер карты гостя BONZY");
    const found = await api<Scan>(
      "scan",
      { guest: id, kind, requestId: requestId.current },
      auth.token,
    );
    setScan(found);
    setReceipt("");
    setAmount("");
    setStep("receipt");
    await refresh(auth.token);
  };
  const events = report?.events || [],
    purchases = events.filter((e) => e.kind === "purchase");
  const actions = (
    label: string,
    fn: () => Promise<void>,
    secondary = false,
  ) => (
    <Button secondary={secondary} disabled={busy} onPress={() => void run(fn)}>
      {label}
    </Button>
  );
  return (
    <SafeAreaView style={s.root}>
      <View style={s.modalHeader}>
        <IconButton icon={ArrowLeft} label="Назад" onPress={back} />
        <Text style={s.modalHeading}>
          {auth ? "AULA · " + auth.name : "Вход сотрудника"}
        </Text>
        <View style={{ width: 42 }} />
      </View>
      <ScrollView
        key={step}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          width: "100%",
          maxWidth: 570,
          alignSelf: "center",
          padding: 22,
          gap: 16,
          paddingBottom: 60,
        }}
      >
        {step === "team" && (
          <>
            <Text style={s.pageTitle}>Твоё заведение</Text>
            <Field label="Код заведения" value={code} onChange={setCode} />
            {actions("Найти заведение", async () => {
              const team = await api<{ names: Person[] }>("team", {
                code: code.trim().toUpperCase(),
              });
              setPeople(team.names);
              setPerson(team.names[0].id);
              setStep("pin");
            })}
            <Text style={s.small}>Для теста введи AULA.</Text>
          </>
        )}
        {step === "pin" && (
          <>
            <Text style={s.pageTitle}>Кто на смене?</Text>
            <View style={s.row}>
              {people.map((p) => (
                <Pressable
                  key={p.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: person === p.id }}
                  onPress={() => {
                    setPerson(p.id);
                    setPin("");
                  }}
                  style={[
                    s.category,
                    person === p.id && { backgroundColor: C.green },
                  ]}
                >
                  <Text style={[s.bold, person === p.id && { color: "white" }]}>
                    {p.name}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Field
              label="Личный PIN"
              value={pin}
              onChange={setPin}
              numeric
              secret
            />
            {actions("Войти в смену", async () => {
              const result = await api<Auth>("login", {
                code: "AULA",
                employee: person,
                pin,
              });
              await refresh(result.token);
              setAuth(result);
              setPin("");
              setStep("desk");
            })}
            <Text style={s.small}>Демо-доступ · Аяна 2468 · Тимур 1357</Text>
          </>
        )}
        {step === "desk" && auth && (
          <>
            <Text style={s.pageTitle}>Моя смена</Text>
            <View style={[s.infoCard, { backgroundColor: "#E8EFE4", gap: 10 }]}>
              <Text style={[s.h2, { color: C.green }]}>
                {money(purchases.reduce((n, e) => n + e.amount, 0))}
              </Text>
              <Text style={s.bold}>
                Подтверждённых чеков · {purchases.length}
              </Text>
              <Text style={s.body}>
                Сканирований QR · {events.filter((e) => e.kind === "qr").length}
                {"\n"}Уникальных гостей ·{" "}
                {new Set(events.map((e) => e.guest)).size}
                {"\n"}Начислено бонусов ·{" "}
                {purchases.reduce((n, e) => n + e.points, 0)}
              </Text>
            </View>
            <Button
              icon={ScanLine}
              onPress={() => {
                requestId.current = randomUUID();
                scanned.current = false;
                setManual("");
                setUseManual(false);
                setFeedback("");
                setStep("camera");
              }}
            >
              Сканировать QR гостя
            </Button>
            {actions(
              "История смены",
              async () => {
                await refresh(auth.token);
                setStep("history");
              },
              true,
            )}
            {actions(
              "Завершить смену",
              async () => {
                await api("end", {}, auth.token);
                setAuth(undefined);
                setReport(undefined);
                setStep("pin");
                setFeedback("Смена закрыта. Операции сохранены.");
              },
              true,
            )}
            <Text style={s.small}>
              Демонстрационные начисления AULA · 10% оплаченной суммы.
            </Text>
          </>
        )}
        {step === "camera" && (
          <>
            <Text style={s.h2}>Карта гостя</Text>
            {!useManual &&
              (permission?.granted ? (
                <View
                  style={{ height: 245, borderRadius: 18, overflow: "hidden" }}
                >
                  <CameraView
                    style={{ flex: 1 }}
                    barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                    onBarcodeScanned={({ data }) => {
                      if (scanned.current || locked.current) return;
                      scanned.current = true;
                      void run(async () => {
                        if (!data.startsWith(cardPrefix))
                          throw Error("Это не карта гостя BONZY");
                        await selectGuest(data.slice(cardPrefix.length), "qr");
                      });
                    }}
                  />
                </View>
              ) : (
                actions("Разрешить камеру", async () => {
                  const p = await requestPermission();
                  if (!p.granted)
                    throw Error(
                      "Разрешите камеру в настройках или введите номер карты",
                    );
                })
              ))}
            {!!feedback && !useManual && (
              <Button
                secondary
                onPress={() => {
                  scanned.current = false;
                  requestId.current = randomUUID();
                  setFeedback("");
                }}
              >
                Сканировать ещё раз
              </Button>
            )}
            <Button secondary onPress={() => setUseManual(!useManual)}>
              {useManual ? "Вернуться к камере" : "Ввести номер карты"}
            </Button>
            {useManual && (
              <>
                <Field
                  label="Номер карты гостя"
                  value={manual}
                  onChange={setManual}
                />
                {actions("Найти карту", () =>
                  selectGuest(manual.trim().toUpperCase(), "manual"),
                )}
              </>
            )}
            {actions(
              "Для теста на одном телефоне — моя карта",
              async () => {
                const c = await guestCard();
                await selectGuest(c.id, "manual");
              },
              true,
            )}
            <Text style={s.small}>
              Ручной выбор учитывается отдельно от сканирования камерой.
            </Text>
          </>
        )}
        {step === "receipt" && auth && scan && (
          <>
            <Text style={s.pageTitle}>Оплаченный чек</Text>
            <Text style={s.small}>Карта гостя · {scan.guest}</Text>
            <Field label="Номер чека" value={receipt} onChange={setReceipt} />
            <Field
              label="Оплачено, ₸"
              numeric
              value={amount}
              onChange={setAmount}
            />
            <Text style={s.h2}>
              +
              {Math.floor((/^\d{1,7}$/.test(amount) ? Number(amount) : 0) / 10)}{" "}
              бонусов
            </Text>
            {actions("Подтвердить начисление", async () => {
              if (!/^\d{1,7}$/.test(amount))
                throw Error("Введите целую сумму в тенге");
              const result = await api<{ points: number }>(
                "purchase",
                { scan: scan.scan, receipt, amount: Number(amount) },
                auth.token,
              );
              await refresh(auth.token);
              setStep("desk");
              setFeedback(
                "Чек " + receipt + " · начислено " + result.points + " бонусов",
              );
            })}
          </>
        )}
        {step === "history" && (
          <>
            <Text style={s.pageTitle}>История смены</Text>
            {!events.length && (
              <Text style={s.body}>Операции появятся после выбора гостя.</Text>
            )}
            {events.map((e) => (
              <View key={e.id} style={s.infoCard}>
                <Text style={s.bold}>
                  {e.kind === "purchase"
                    ? "Чек " +
                      e.receipt +
                      " · " +
                      money(e.amount) +
                      " · +" +
                      e.points +
                      " б."
                    : e.kind === "qr"
                      ? "QR отсканирован"
                      : "Карта выбрана вручную"}
                </Text>
                <Text style={s.small}>
                  {auth?.name} · {new Date(e.time).toLocaleTimeString("ru-RU")}{" "}
                  · {e.guest}
                </Text>
              </View>
            ))}
          </>
        )}
        {!!feedback && (
          <Text
            accessibilityLiveRegion="polite"
            style={[s.body, { color: C.ink }]}
          >
            {feedback}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
