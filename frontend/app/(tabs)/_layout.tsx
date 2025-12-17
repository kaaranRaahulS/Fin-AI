import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import {
	ColorValue,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Custom bottom tab bar to mimic your web UI:
 * - Centered container with max width
 * - Icons + labels
 * - Active color teal; inactive slate
 * - Subtle top border; white background
 */
function CustomTabBar({ state, descriptors, navigation }: any) {
	return (
		<SafeAreaView style={styles.barWrapper} edges={["bottom"]}>
			<View style={styles.bar}>
				{state.routes.map((route: any, index: number) => {
					const { options } = descriptors[route.key];
					const label =
						options.tabBarLabel !== undefined
							? options.tabBarLabel
							: options.title !== undefined
							? options.title
							: route.name;

					const isFocused = state.index === index;

					// map route name -> Feather icon
					const iconName = (name: string): keyof typeof Feather.glyphMap => {
						switch (name) {
							case "index":
								return "home";
							case "forecast":
								return "trending-up";
							case "cards":
								return "credit-card";
							case "budget":
								return "pie-chart"; // or 'dollar-sign'
							case "settings":
								return "settings";
							default:
								return "circle";
						}
					};

					const onPress = () => {
						const event = navigation.emit({
							type: "tabPress",
							target: route.key,
							canPreventDefault: true,
						});
						if (!isFocused && !event.defaultPrevented) {
							navigation.navigate(route.name);
						}
					};

					return (
						<Pressable
							key={route.key}
							onPress={onPress}
							style={({ pressed }) => [
								styles.tabButton,
								pressed && { opacity: 0.7 },
							]}
							accessibilityRole="button"
							accessibilityState={isFocused ? { selected: true } : {}}
						>
							<Feather
								name={iconName(route.name)}
								size={22}
								color={
									(isFocused
										? stylesVars.active
										: stylesVars.inactive) as ColorValue
								}
								style={{ marginBottom: 4 }}
							/>
							<Text
								style={[
									styles.tabLabel,
									{
										color: isFocused ? stylesVars.active : stylesVars.inactive,
									},
								]}
							>
								{label as string}
							</Text>
						</Pressable>
					);
				})}
			</View>
		</SafeAreaView>
	);
}

export default function TabsLayout() {
	const { user } = useAuth();
	// Guard is handled at app level; remove Redirects to keep bar stable.

	return (
		<Tabs
			screenOptions={{
				headerTitleAlign: "center",
				// Hide default tab bar—we’ll provide our own:
				tabBarStyle: { display: "none" },
				headerShown: false,
			}}
			tabBar={(props) => <CustomTabBar {...props} />}
		>
			{/* Tab names MUST match the file names */}
			<Tabs.Screen name="index" options={{ title: "Home" }} />
			<Tabs.Screen name="forecast" options={{ title: "Forecast" }} />
			<Tabs.Screen name="cards" options={{ title: "Cards" }} />
			<Tabs.Screen name="budget" options={{ title: "Budget" }} />
			<Tabs.Screen name="settings" options={{ title: "Settings" }} />
		</Tabs>
	);
}

const stylesVars = {
	active: "#0d9488", // teal-600
	inactive: "#64748b", // slate-500
	border: "#e5e7eb", // slate-200
	bg: "#ffffff",
	maxWidth: 640,
};

const styles = StyleSheet.create({
	barWrapper: {
		backgroundColor: stylesVars.bg,
	},
	bar: {
		borderTopWidth: 1,
		borderTopColor: stylesVars.border,
		backgroundColor: stylesVars.bg,
		height: 64,
		flexDirection: "row",
		justifyContent: "space-around",
		alignItems: "center",
		paddingHorizontal: 16,
		// center + max width like your web version:
		width: "100%",
		alignSelf: "center",
		maxWidth: stylesVars.maxWidth,
	},
	tabButton: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		height: "100%",
	},
	tabLabel: {
		fontSize: 12,
		fontWeight: Platform.select({ ios: "600", android: "700", default: "600" }),
	},
});
