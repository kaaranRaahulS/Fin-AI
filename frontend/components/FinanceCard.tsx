import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

type Trend = "up" | "down" | "neutral";

interface FinanceCardProps {
	title: string;
	value: string;
	subtitle?: string;
	icon?: React.ReactNode; // pass <Feather ... /> (or any RN node)
	trend?: Trend;
	trendValue?: string;
	onPress?: () => void;
	style?: ViewStyle;
}

export default function FinanceCard({
	title,
	value,
	subtitle,
	icon,
	trend,
	trendValue,
	onPress,
	style,
}: FinanceCardProps) {
	const Wrapper: React.ElementType = onPress ? Pressable : View;

	const trendColor =
		trend === "up"
			? styles.trendUp
			: trend === "down"
			? styles.trendDown
			: styles.trendNeutral;

	const trendGlyph = trend === "up" ? "↑" : trend === "down" ? "↓" : "•";

	return (
		<Wrapper
			onPress={onPress}
			style={({ pressed }: any) => [
				styles.card,
				onPress && styles.cardPressable,
				pressed && onPress
					? { shadowOpacity: 0.12, transform: [{ scale: 0.998 }] }
					: null,
				style,
			]}
		>
			<View style={styles.topRow}>
				<Text style={styles.title}>{title}</Text>
				{icon ? (
					<View style={styles.iconWrap}>{icon}</View>
				) : (
					<View style={{ width: 24 }} />
				)}
			</View>

			<View style={{ gap: 4 }}>
				<Text style={styles.value}>{value}</Text>

				{subtitle || trendValue ? (
					<View style={styles.subRow}>
						{trendValue ? (
							<Text style={[styles.trend, trendColor]}>
								{trendGlyph} {trendValue}
							</Text>
						) : null}
						{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
					</View>
				) : null}
			</View>
		</Wrapper>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: "#fff",
		borderRadius: 16,
		padding: 20,
		borderWidth: 1,
		borderColor: "#e5e7eb", // slate-200
		// ✅ better shadow on iOS + Android
		shadowColor: "#000",
		shadowOpacity: 0.08,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 4 },
		elevation: 4,
	},

	cardPressable: {
		// mimic hover:shadow-md / transition
	},
	topRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-between",
		marginBottom: 12,
	},
	title: { fontSize: 13, color: "#475569" }, // text-gray-600
	iconWrap: { alignItems: "center", justifyContent: "center" }, // text-teal-600 comes from icon itself
	value: { fontSize: 22, fontWeight: "700", color: "#0f172a" }, // text-gray-900
	subRow: { flexDirection: "row", alignItems: "center", gap: 8 },
	trend: { fontSize: 13, fontWeight: "600" },
	trendUp: { color: "#16a34a" }, // green-600
	trendDown: { color: "#dc2626" }, // red-600
	trendNeutral: { color: "#64748b" }, // slate-500
	subtitle: { fontSize: 13, color: "#64748b" }, // text-gray-600
});
