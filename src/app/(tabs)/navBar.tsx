import { usePathname, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";

const NAV_ITEMS = [
  {
    label: "Home",
    route: "/pages/homepage",
    name: { ios: "house.fill", android: "home", web: "home" },
  },
  {
    label: "Journey",
    route: "/pages/journey",
    name: { ios: "map.fill", android: "map", web: "map" },
  },
  {
    label: "Exercise",
    route: "/pages/exercise",
    name: { ios: "book.fill", android: "menu_book", web: "menu_book" },
  },
  {
    label: "Profile",
    route: "/pages/profile",
    name: { ios: "person.fill", android: "person", web: "person" },
  },
  {
    label: "Settings",
    route: "/pages/setting",
    name: { ios: "gearshape.fill", android: "settings", web: "settings" },
  },
];

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === "ios" ? 20 : 12);
  const indicatorOffset = -((bottomPadding - 20) + 10);

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: bottomPadding, minHeight: 64 + bottomPadding },
      ]}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.route;

        return (
          <Pressable
            key={item.route}
            style={styles.itemContainer}
            onPress={() => router.push(item.route)}
          >
            {({ pressed }) => (
              <View
                style={[
                  styles.item,
                  isActive && styles.itemActive,
                  pressed && !isActive && styles.itemPressed,
                ]}
              >
                <View style={styles.iconWrapper}>
                  <SymbolView
                    name={item.name}
                    size={24}
                    tintColor={
                      isActive
                        ? "#15803d"
                        : Colors.light.onSurfaceVariant
                    }
                  />
                </View>
                <ThemedText
                  type="labelSm"
                  style={[styles.itemLabel, isActive && styles.itemLabelActive]}
                >
                  {item.label}
                </ThemedText>
                {isActive && <View style={[styles.activeIndicator, { bottom: indicatorOffset }]} />}
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 10,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.outlineVariant,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  itemContainer: {
    flex: 1,
    alignItems: "center",
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
    minWidth: 72,
    position: "relative",
  },
  itemActive: {
    backgroundColor: "#dcfce7",
  },
  itemPressed: {
    backgroundColor: Colors.light.surfaceContainerHigh,
    transform: [{ scale: 0.95 }],
  },
  iconWrapper: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  itemLabel: {
    color: Colors.light.onSurfaceVariant,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  itemLabelActive: {
    color: "#15803d",
    fontWeight: "700",
  },
  activeIndicator: {
    position: "absolute",
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#15803d",
  },
});
