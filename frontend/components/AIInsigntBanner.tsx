import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type BannerType = "success" | "info" | "warning";

interface AIInsightBannerProps {
	message: string;
	type?: BannerType;
}

const BG: Record<BannerType, string> = {
	success: "#ecfdf5", // emerald-50
	info: "#eff6ff", // blue-50
	warning: "#fffbeb", // amber-50
};

const ICON_BG: Record<BannerType, string> = {
	success: "#10b981", // emerald-500
	info: "#3b82f6", // blue-500
	warning: "#f59e0b", // amber-500
};

export default function AIInsightBanner({
	message,
	type = "success",
}: AIInsightBannerProps) {
	return (
		<View style={[styles.wrap, { backgroundColor: BG[type] }]}>
			<View style={[styles.iconWrap, { backgroundColor: ICON_BG[type] }]}>
				<Feather name="zap" size={16} color="#fff" />
			</View>
			<Text style={styles.text}>{message}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		borderRadius: 16,
		paddingVertical: 12,
		paddingHorizontal: 14,
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 10,
		flexWrap: "wrap",
		wordWrap: "break-word",
	},
	iconWrap: {
		width: 26,
		height: 26,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 2,
	},
	text: { color: "#334155", lineHeight: 20, fontSize: 14 }, // text-gray-700
});
