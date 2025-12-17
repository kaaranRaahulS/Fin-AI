// components/SpendingByCategory.tsx
import React from "react";
import {
	View,
	Text,
	StyleSheet,
	Dimensions,
	TouchableOpacity,
	FlatList,
} from "react-native";
import { PieChart } from "react-native-chart-kit";

const { width: SCREEN_W } = Dimensions.get("window");

type Cat = { name: string; value: number; color: string };

export default function SpendingByCategory({
	data,
	onPressCategory,
}: {
	data: Cat[];
	onPressCategory?: (name: string) => void;
}) {
	const total = data.reduce((s, d) => s + d.value, 0);

	// chart-kit expects data as { name, population, color, legendFontColor, legendFontSize }
	const chartData = data.map((d) => ({
		name: d.name,
		population: d.value,
		color: d.color,
		legendFontColor: "#1f2937",
		legendFontSize: 12,
	}));

	// size & layout
	const cardPadding = 16;
	const cardHorizontal = 16;
	const cardWidth = SCREEN_W - cardHorizontal * 2;
	// left pie width ~ 40% of card or 120px whichever
	const pieSize = Math.min(160, Math.floor(cardWidth * 0.42));

	const renderItem = ({ item }: { item: Cat }) => (
		<TouchableOpacity
			onPress={() => onPressCategory?.(item.name)}
			activeOpacity={0.8}
			style={styles.row}
		>
			<View style={styles.rowLeft}>
				<View style={[styles.dot, { backgroundColor: item.color }]} />
				<Text style={styles.rowLabel}>{item.name}</Text>
			</View>

			<Text style={styles.rowValue}>${item.value.toLocaleString()}</Text>
		</TouchableOpacity>
	);

	return (
		<View style={styles.card}>
			<View style={styles.cardHeader}>
				<Text style={styles.title}>Spending by Category</Text>
				<Text style={styles.total}>${total.toLocaleString()}</Text>
			</View>

			<View style={styles.innerRow}>
				<View style={[styles.pieWrap]}>
					<PieChart
						data={chartData}
						width={pieSize}
						height={pieSize}
						accessor={"population"}
						backgroundColor={"transparent"}
						paddingLeft={"0"}
						center={[0, 0]}
						hasLegend={false}
						chartConfig={{
							color: () => `rgba(0,0,0,0.75)`,
						}}
						avoidFalseZero
					/>
				</View>

				<View style={styles.listWrap}>
					<FlatList
						data={data}
						keyExtractor={(i) => i.name}
						renderItem={renderItem}
						ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
						showsVerticalScrollIndicator={false}
						contentContainerStyle={{ paddingVertical: 6 }}
					/>
				</View>
			</View>

			<Text style={styles.hint}>Tap on a category to view transactions</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		marginHorizontal: 16,
		marginTop: 12,
		backgroundColor: "#fff",
		borderRadius: 16,
		padding: 14,
		borderWidth: 1,
		borderColor: "#EEF2F6",
		// shadow
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 4 },
		elevation: 2,
	},
	cardHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 10,
	},
	title: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
	total: { color: "#475569", fontSize: 13 },

	innerRow: { gap: 12 },
	pieWrap: {
		//alignItems: "center",
		//justifyContent: "center",
		marginLeft: 120,
	},

	listWrap: {
		flex: 1,
		paddingLeft: 8,
		justifyContent: "center",
	},

	row: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FAFAFB",
		borderRadius: 12,
		paddingVertical: 14,
		paddingHorizontal: 12,
		justifyContent: "space-between",
	},
	rowLeft: { flexDirection: "row", alignItems: "center" },
	dot: { width: 12, height: 12, borderRadius: 999 },
	rowLabel: {
		marginLeft: 12,
		fontSize: 15,
		color: "#0F172A",
		fontWeight: "600",
	},
	rowValue: { fontWeight: "800", color: "#0F172A" },

	hint: { textAlign: "center", color: "#6B7280", fontSize: 12, marginTop: 12 },
});
