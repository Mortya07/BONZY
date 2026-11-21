import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Compass } from "lucide-react-native";
import { Restaurant } from "./domain";
export const C = {
  bg: "#FAF9F6",
  ink: "#252B26",
  muted: "#85877D",
  line: "#E9E9E1",
  orange: "#EF6438",
  pale: "#FFF0E8",
  green: "#40644D",
  white: "#FFFFFF",
};
export function Button({
  children,
  onPress,
  secondary = false,
  disabled = false,
  icon: Icon,
  testID,
}: {
  children: React.ReactNode;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: any;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.buttonSecondary,
        disabled && { opacity: 0.4 },
        pressed && { opacity: 0.8 },
      ]}
    >
      {Icon && <Icon size={18} color={secondary ? C.ink : C.white} />}
      <Text style={[s.buttonText, secondary && { color: C.ink }]}>
        {children}
      </Text>
    </Pressable>
  );
}
export function IconButton({
  icon: Icon,
  onPress,
  label,
  active = false,
}: {
  icon: any;
  onPress: () => void;
  label: string;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        s.iconButton,
        active && { backgroundColor: C.pale },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Icon size={21} color={active ? C.orange : C.ink} />
    </Pressable>
  );
}
export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.tag}>
      <Text style={s.tagText}>{children}</Text>
    </View>
  );
}
export function Brand({
  restaurant: r,
  size = 44,
}: {
  restaurant: Restaurant;
  size?: number;
}) {
  return (
    <View
      style={[s.brand, { width: size, height: size, backgroundColor: r.color }]}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: size * 0.42,
          fontWeight: "800",
          letterSpacing: -2,
        }}
      >
        {r.initials}
      </Text>
    </View>
  );
}
export function Empty({
  icon: Icon = Compass,
  title,
  text,
  action,
}: {
  icon?: any;
  title: string;
  text: string;
  action?: () => void;
}) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Icon size={30} color={C.orange} />
      </View>
      <Text style={s.h2}>{title}</Text>
      <Text style={[s.body, { textAlign: "center", maxWidth: 340 }]}>
        {text}
      </Text>
      {action && <Button onPress={action}>Найти своё место</Button>}
    </View>
  );
}
export const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  header: { borderBottomWidth: 1, borderColor: C.line, backgroundColor: C.bg },
  headerInner: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingHorizontal: 32,
    height: 91,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  headerDivider: {
    width: 1,
    height: 33,
    backgroundColor: C.line,
    marginHorizontal: 15,
  },
  logo: { fontSize: 34, fontWeight: "900", letterSpacing: -2, color: C.ink },
  logoMark: {
    width: 35,
    height: 35,
    backgroundColor: C.orange,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-10deg" }],
  },
  logoMarkText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 36,
  },
  demoPill: {
    color: "#A7A89E",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginRight: 8,
  },
  navWrap: { borderBottomWidth: 1, borderColor: C.line },
  navInner: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
  },
  topNav: { flexDirection: "row", gap: 8 },
  navTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  navLabel: { color: C.muted, fontWeight: "600", fontSize: 13 },
  main: { maxWidth: 1280, width: "100%", alignSelf: "center", paddingTop: 32 },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: C.muted,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 30,
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -1,
  },
  heroRow: { flexDirection: "row", gap: 20 },
  hero: {
    flex: 1,
    minHeight: 335,
    backgroundColor: "#F5EDE0",
    borderRadius: 24,
    overflow: "hidden",
  },
  heroCopy: { width: "64%", padding: 32, paddingRight: 0, zIndex: 2 },
  heroBadge: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    marginBottom: 18,
  },
  heroBadgeText: {
    fontSize: 9,
    color: C.orange,
    fontWeight: "700",
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 41,
    lineHeight: 45,
    fontWeight: "800",
    color: C.ink,
    letterSpacing: -1.8,
  },
  heroLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 22,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  heroPhoto: {
    position: "absolute",
    right: -65,
    top: 0,
    width: "51%",
    height: "114%",
    borderTopLeftRadius: 160,
    borderBottomLeftRadius: 180,
    transform: [{ rotate: "10deg" }],
  },
  heroPhotoLabel: {
    position: "absolute",
    bottom: 21,
    right: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFCF5",
    padding: 10,
    borderRadius: 12,
    zIndex: 3,
  },
  heroCircle: {
    position: "absolute",
    top: 25,
    right: 17,
    width: 75,
    height: 75,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#F2D7A6",
    backgroundColor: "#F8E9B8",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "13deg" }],
    zIndex: 3,
  },
  heroCircleText: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
    color: "#7B744F",
    fontWeight: "600",
  },
  balanceHero: {
    width: 320,
    borderRadius: 24,
    backgroundColor: "#ECF0E5",
    padding: 27,
    minHeight: 335,
  },
  bigBalance: {
    fontSize: 43,
    fontWeight: "700",
    letterSpacing: -1.5,
    marginTop: 27,
    color: C.green,
  },
  brand: { borderRadius: 13, alignItems: "center", justifyContent: "center" },
  body: { fontSize: 14, lineHeight: 22, color: "#797D72" },
  small: { fontSize: 12, lineHeight: 18, color: C.muted },
  meta: { fontSize: 12, color: C.muted, lineHeight: 19 },
  bold: { fontSize: 13, color: C.ink, fontWeight: "700" },
  h2: { fontSize: 23, color: C.ink, fontWeight: "700", letterSpacing: -0.7 },
  pageTitle: {
    fontSize: 32,
    letterSpacing: -1,
    fontWeight: "800",
    color: C.ink,
    marginBottom: 12,
  },
  button: {
    minHeight: 48,
    backgroundColor: C.orange,
    borderRadius: 13,
    paddingHorizontal: 19,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  buttonSecondary: {
    backgroundColor: "#FFFDF7",
    borderWidth: 1,
    borderColor: C.line,
  },
  buttonText: { fontSize: 13, fontWeight: "700", color: C.white },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.white,
  },
  search: {
    flex: 1,
    minHeight: 53,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchInput: { flex: 1, fontSize: 13, color: C.ink, height: 50 },
  filterButton: {
    minHeight: 53,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    borderRadius: 14,
  },
  categories: { paddingVertical: 20, gap: 10 },
  category: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    backgroundColor: C.white,
  },
  categoryActive: { backgroundColor: C.ink, borderColor: C.ink },
  categoryText: { color: "#787D70", fontSize: 13, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 22 },
  restaurantCard: {
    backgroundColor: "white",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: C.line,
    padding: 7,
    overflow: "hidden",
  },
  restaurantImage: {
    height: 206,
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#EEE",
  },
  imageTop: { padding: 12, flexDirection: "row" },
  imageBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    paddingTop: 12,
    backgroundColor: "#00000038",
  },
  imageCaption: { color: "#fff", fontSize: 11, fontWeight: "600" },
  cardInfo: { paddingHorizontal: 12, paddingTop: 16, paddingBottom: 15 },
  cardName: {
    fontSize: 20,
    color: C.ink,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  tag: {
    backgroundColor: "#FFFDF4",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    alignSelf: "flex-start",
  },
  tagText: { fontSize: 11, fontWeight: "700", color: C.green },
  dot: { width: 6, height: 6, borderRadius: 4, backgroundColor: "#82966C" },
  editorialBanner: {
    flexDirection: "row",
    gap: 15,
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    backgroundColor: "#EDF0E6",
    padding: 24,
    marginTop: 30,
  },
  footer: {
    borderTopWidth: 1,
    borderColor: C.line,
    marginTop: 42,
    paddingTop: 23,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 16,
  },
  footerLogo: {
    color: C.ink,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -1,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 8,
    paddingBottom: 10,
  },
  bottomTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 49,
  },
  bottomLabel: { fontSize: 10, fontWeight: "600", color: C.muted },
  floatingCart: {
    position: "absolute",
    alignSelf: "center",
    minWidth: 260,
    boxShadow: "0 8px 24px #EF643840",
    borderRadius: 13,
  },
  empty: {
    paddingVertical: 45,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 15,
    width: "100%",
  },
  emptyIcon: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: C.pale,
    marginBottom: 4,
  },
  loyaltyCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 22,
    padding: 23,
    paddingBottom: 6,
  },
  progress: {
    height: 6,
    backgroundColor: "#F0F0E9",
    borderRadius: 6,
    marginTop: 25,
    marginBottom: 9,
    overflow: "hidden",
  },
  progressFill: { height: 6, borderRadius: 6 },
  walletBanner: {
    padding: 28,
    borderRadius: 23,
    backgroundColor: C.green,
    marginTop: 7,
    marginBottom: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  walletQr: { padding: 14, borderRadius: 18, backgroundColor: "#F4F4E7" },
  infoCard: {
    padding: 19,
    backgroundColor: "#F3F2EA",
    borderRadius: 15,
    marginBottom: 10,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: C.line,
  },
  profileCard: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: C.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginBottom: 25,
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 24,
    backgroundColor: C.pale,
    alignItems: "center",
    justifyContent: "center",
  },
  profileRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    padding: 22,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  overlay: {
    flex: 1,
    backgroundColor: "#17201B70",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  modal: {
    backgroundColor: C.bg,
    borderRadius: 25,
    overflow: "hidden",
    boxShadow: "0 20px 80px #00000020",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 17,
    paddingLeft: 24,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  modalHeading: { fontSize: 18, fontWeight: "700", color: C.ink },
  sheetContent: { padding: 24 },
  detailImage: { width: "100%", height: 230, backgroundColor: "#eee" },
  detailBalance: {
    backgroundColor: "#EDF1E7",
    padding: 15,
    borderRadius: 12,
    marginVertical: 22,
  },
  menuTab: {
    borderRadius: 10,
    backgroundColor: "#EFEFE7",
    paddingVertical: 12,
    paddingHorizontal: 17,
  },
  dish: {
    flexDirection: "row",
    gap: 17,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  dishPhoto: { width: 105, height: 125, borderRadius: 16 },
  dishName: { fontSize: 18, color: C.ink, fontWeight: "700" },
  addButton: {
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 12,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  quantity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#F0EFE7",
    borderRadius: 10,
  },
  quantityBtn: {
    width: 35,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBottom: {
    padding: 17,
    borderTopWidth: 1,
    borderColor: C.line,
    backgroundColor: C.bg,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "#EBECE5",
    padding: 4,
    borderRadius: 13,
    marginVertical: 23,
  },
  segmentItem: { flex: 1, alignItems: "center", padding: 12, borderRadius: 10 },
  segmentActive: { backgroundColor: "#fff" },
  input: {
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderColor: C.line,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "#fff",
    fontSize: 14,
    color: C.ink,
    marginBottom: 15,
  },
  cartDish: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  receipt: {
    gap: 15,
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: C.line,
    marginTop: 20,
  },
  qrAvatar: {
    padding: 16,
    backgroundColor: C.pale,
    borderRadius: 20,
    marginBottom: 22,
  },
  qrFrame: {
    padding: 25,
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.line,
  },
  rule: {
    flexDirection: "row",
    gap: 16,
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  ruleNumber: { fontSize: 16, color: C.orange, fontWeight: "700" },
  toast: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: C.ink,
    borderRadius: 14,
    padding: 16,
    maxWidth: "90%",
    boxShadow: "0 8px 30px #00000020",
  },
  modalToast: {
    position: "absolute",
    bottom: 35,
    alignSelf: "center",
    maxWidth: "90%",
    backgroundColor: C.ink,
    borderRadius: 14,
    padding: 16,
  },
  toastText: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});
