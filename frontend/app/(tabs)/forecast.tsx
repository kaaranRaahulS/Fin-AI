import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import AIInsightBanner from "../../components/AIInsigntBanner";
import SpendingByCategory from "../../components/SpendingByCategory";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
	onCategorySelect?: (category: string) => void;
	onAdjustSavings?: () => void;
	onPlanExpense?: () => void;
};

type CategoryDatum = {
	name: string;
	value: number;
	color: string;
};

type UpcomingExpense = {
	name: string;
	amount: number;
	date: string;
	category: string;
};

type UpcomingIncome = {
	name: string;
	amount: number;
	date: string;
};

// ---- DEFAULT (fallback) DATA ----
const defaultCategoryData: CategoryDatum[] = [
	{ name: "Transportation", value: 850, color: "#3B82F6" },
	{ name: "Groceries", value: 650, color: "#10B981" },
	{ name: "Bills", value: 1200, color: "#F59E0B" },
	{ name: "Subscriptions", value: 245, color: "#8B5CF6" },
	{ name: "Shopping", value: 300, color: "#EC4899" },
];

const lineData = [
	{ date: "Nov 5", balance: 24582 },
	{ date: "Nov 10", balance: 23400 },
	{ date: "Nov 15", balance: 22100 },
	{ date: "Nov 20", balance: 24800 },
	{ date: "Nov 25", balance: 25200 },
	{ date: "Nov 30", balance: 26400 },
];

const defaultUpcomingExpenses: UpcomingExpense[] = [
	{ name: "Rent Payment", amount: 2400, date: "Nov 15", category: "Housing" },
	{ name: "Car Insurance", amount: 180, date: "Nov 18", category: "Insurance" },
	{
		name: "Credit Card Payment",
		amount: 1240,
		date: "Nov 20",
		category: "Debt",
	},
];

const defaultUpcomingIncome: UpcomingIncome[] = [
	{ name: "Salary", amount: 4500, date: "Nov 30" },
	{ name: "Freelance Project", amount: 1200, date: "Dec 5" },
];

export default function Forecast({
	onCategorySelect,
	onAdjustSavings,
	onPlanExpense,
}: Props) {
	// ---- STATE FROM API ----
	const [categoryData, setCategoryData] =
		useState<CategoryDatum[]>(defaultCategoryData);
	const [upcomingExpenses, setUpcomingExpenses] =
		useState<UpcomingExpense[]>(defaultUpcomingExpenses);
	const [upcomingIncome, setUpcomingIncome] =
		useState<UpcomingIncome[]>(defaultUpcomingIncome);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { user } = useAuth();

	// TODO: replace with your real values or config
	const USER_ID = user?.id ?? "693a0451e654cdaccbb42d26";
	const API_BASE_URL = "http://localhost:8000"; // or from env

	useEffect(() => {
		const fetchForecast = async () => {
			try {
				setLoading(true);
				setError(null);

				const res = await fetch(
					`${API_BASE_URL}/api/forecast?userId=${USER_ID}`
				);
				if (!res.ok) {
					throw new Error(`HTTP ${res.status}`);
				}

				const json = await res.json();

				if (Array.isArray(json.spendingByCategory)) {
					setCategoryData(json.spendingByCategory);
				}
				if (Array.isArray(json.upcomingExpenses)) {
					setUpcomingExpenses(json.upcomingExpenses);
				}
				if (Array.isArray(json.upcomingIncome)) {
					setUpcomingIncome(json.upcomingIncome);
				}
			} catch (e: any) {
				console.error("Failed to load forecast", e);
				setError("Failed to load forecast");
				// fallback data stays in state
			} finally {
				setLoading(false);
			}
		};

		fetchForecast();
	}, []);

	const totalSpending = categoryData.reduce((s, c) => s + c.value, 0);

	return (
		<SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
			<ScrollView contentContainerStyle={styles.container} bounces={true}>
				{/* Header */}
				<LinearGradient
					colors={["#6366F1", "#7C3AED"]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={styles.header}
				>
					<View style={styles.headerRow}>
						<View style={styles.headerLeft}>
							<View style={styles.iconCircle}>
								<Feather name="trending-up" size={20} color="#fff" />
							</View>
							<View style={{ marginLeft: 10 }}>
								<Text style={styles.headerTitle}>Financial Forecast</Text>
								{/* <Text style={styles.headerSubtitle}>Next 45 days</Text> */}
							</View>
						</View>
					</View>
				</LinearGradient>

				{/* AI Banner */}
				<View style={styles.sectionSpacing}>
					<AIInsightBanner
						message="Based on your spending patterns, you'll likely have $2,400 extra by Dec 15. Consider increasing your savings goal."
						type="success"
					/>
				</View>

				{/* --- Spending by Category --- */}
				<SpendingByCategory
					data={categoryData}
					onPressCategory={(name) => onCategorySelect?.(name)}
				/>

				{/* Upcoming Expenses */}
				<View style={styles.sectionSpacing}>
					<View style={styles.rowBetween}>
						<Text style={styles.sectionTitle}>Upcoming Expenses</Text>
						<Text style={styles.sectionRight}>
							$
							{upcomingExpenses
								.reduce((s, e) => s + e.amount, 0)
								.toLocaleString()}
						</Text>
					</View>

					<View style={{ gap: 8 }}>
						{upcomingExpenses.map((exp, i) => (
							<View key={i} style={styles.rowCard}>
								<View style={[styles.iconBox, { backgroundColor: "#FEE2E2" }]}>
									<Feather name="dollar-sign" size={18} color="#DC2626" />
								</View>
								<View style={{ flex: 1 }}>
									<View style={styles.rowBetween}>
										<Text
											style={styles.rowTitle}
											numberOfLines={1}
											ellipsizeMode="tail"
										>
											{exp.name}
										</Text>
										<Text style={styles.rowAmount}>
											-${exp.amount.toLocaleString()}
										</Text>
									</View>
									<View style={styles.smallRow}>
										<Text style={styles.smallMeta}>{exp.category}</Text>
										<View style={styles.dotSep} />
										<Feather name="calendar" size={12} color="#6B7280" />
										<Text style={[styles.smallMeta, { marginLeft: 6 }]}>
											{exp.date}
										</Text>
									</View>
								</View>
							</View>
						))}
					</View>
				</View>

				{/* Upcoming Income */}
				<View style={styles.sectionSpacing}>
					<View style={styles.rowBetween}>
						<Text style={styles.sectionTitle}>Expected Income</Text>
						<Text style={[styles.sectionRight, { color: "#16A34A" }]}>
							+
							{upcomingIncome
								.reduce((s, i) => s + i.amount, 0)
								.toLocaleString(undefined, {
									style: "currency",
									currency: "USD",
								})
								.replace("$", "$")}
						</Text>
					</View>

					<View style={{ gap: 8 }}>
						{upcomingIncome.map((inc, i) => (
							<View key={i} style={styles.rowCard}>
								<View style={[styles.iconBox, { backgroundColor: "#ECFDF5" }]}>
									<Feather name="trending-up" size={18} color="#16A34A" />
								</View>
								<View style={{ flex: 1 }}>
									<View style={styles.rowBetween}>
										<Text style={styles.rowTitle}>{inc.name}</Text>
										<Text style={[styles.rowAmount, { color: "#16A34A" }]}>
											+${inc.amount.toLocaleString()}
										</Text>
									</View>
									<View style={styles.smallRow}>
										<Feather name="calendar" size={12} color="#6B7280" />
										<Text style={[styles.smallMeta, { marginLeft: 6 }]}>
											{inc.date}
										</Text>
									</View>
								</View>
							</View>
						))}
					</View>
				</View>

				{/* Action buttons */}
				<View style={[styles.twoCols]}>
					<Pressable
						onPress={() => onAdjustSavings?.()}
						style={({ pressed }) => [
							styles.primaryBtn,
							pressed && { opacity: 0.9 },
						]}
					>
						<Text style={styles.primaryBtnText}>Adjust Savings</Text>
					</Pressable>

					<Pressable
						onPress={() => onPlanExpense?.()}
						style={({ pressed }) => [
							styles.secondaryBtn,
							pressed && { opacity: 0.9 },
						]}
					>
						<Text style={styles.secondaryBtnText}>Plan Expense</Text>
					</Pressable>
				</View>

				<View style={{ height: 36 }} />
			</ScrollView>
		</SafeAreaView>
	);
}

// ---- styles unchanged ----
const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: "#F8FAFC" },
	container: { paddingBottom: 28 },

	header: {
		paddingHorizontal: 16,
		paddingTop: 18,
		paddingBottom: 18,
		borderBottomLeftRadius: 20,
		borderBottomRightRadius: 20,
	},
	headerRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	headerLeft: { flexDirection: "row", alignItems: "center" },
	iconCircle: {
		width: 46,
		height: 46,
		borderRadius: 12,
		backgroundColor: "rgba(255,255,255,0.18)",
		alignItems: "center",
		justifyContent: "center",
	},
	headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
	headerSubtitle: { color: "rgba(255,255,255,0.95)", marginTop: 4 },

	projectionCard: {
		marginTop: 12,
		backgroundColor: "rgba(255,255,255,0.06)",
		padding: 12,
		borderRadius: 12,
	},
	projLabel: { color: "rgba(255,255,255,0.9)", fontSize: 13 },
	projValue: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 6 },
	projDeltaRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
	projDeltaText: { color: "rgba(255,255,255,0.9)", marginLeft: 6 },

	sectionSpacing: { paddingHorizontal: 16, marginTop: 12 },

	card: {
		marginHorizontal: 16,
		marginTop: 12,
		backgroundColor: "#fff",
		borderRadius: 14,
		padding: 12,
		borderWidth: 1,
		borderColor: "#EEF2F6",
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 4 },
		elevation: 2,
	},

	cardTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: "#0F172A",
		marginBottom: 8,
	},
	cardSub: { color: "#475569" },

	lineChartPlaceholder: {
		backgroundColor: "#fff",
		borderRadius: 10,
		padding: 10,
	},
	sparklineRow: {
		flexDirection: "row",
		alignItems: "flex-end",
		height: 100,
		gap: 6,
		justifyContent: "center",
	},
	sparkBar: {
		width: 10,
		backgroundColor: "#14B8A6",
		borderRadius: 6,
		marginHorizontal: 4,
	},
	legendRow: {
		flexDirection: "row",
		justifyContent: "center",
		gap: 16,
		marginTop: 10,
	},
	legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
	legendSwatch: { width: 14, height: 8, borderRadius: 4 },
	legendText: { color: "#6B7280", fontSize: 12 },

	pieAndListRow: { flexDirection: "row", alignItems: "center" },
	piePlaceholder: {
		width: 120,
		height: 120,
		borderRadius: 999,
		backgroundColor: "#FAFAFA",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 8,
		borderColor: "#F3F4F6",
	},
	pieCenter: { alignItems: "center", justifyContent: "center" },
	pieCenterText: { color: "#6B7280", fontWeight: "700" },

	categoryRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 10,
		paddingHorizontal: 8,
		justifyContent: "space-between",
	},
	catDot: { width: 10, height: 10, borderRadius: 999, marginRight: 8 },
	catLabel: { flex: 1, color: "#0F172A", marginLeft: 8 },
	catValue: { fontWeight: "700", color: "#0F172A" },

	smallNote: {
		fontSize: 12,
		color: "#6B7280",
		textAlign: "center",
		marginTop: 8,
	},

	sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
	sectionRight: { color: "#6B7280", fontSize: 13 },

	rowCard: {
		flexDirection: "row",
		alignItems: "center",
		padding: 10,
		backgroundColor: "#fff",
		borderRadius: 12,
	},
	iconBox: {
		width: 46,
		height: 46,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	rowTitle: {
		flex: 1,
		fontWeight: "700",
		color: "#0F172A",
		marginRight: 8,       // space before the amount
	},
	rowAmount: {
		fontWeight: "800",
		color: "#0F172A",
		flexShrink: 0,        // don't let the amount get squished
	},
	smallRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
	smallMeta: { color: "#6B7280", fontSize: 12 },
	dotSep: { width: 6 },

	rowBetween: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},

	twoCols: {
		flexDirection: "row",
		gap: 12,
		paddingHorizontal: 16,
		marginTop: 16,
	},
	primaryBtn: {
		flex: 1,
		backgroundColor: "#14B8A6",
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	primaryBtnText: { color: "#fff", fontWeight: "700" },
	secondaryBtn: {
		flex: 1,
		backgroundColor: "#F3F4F6",
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	secondaryBtnText: { color: "#0F172A", fontWeight: "700" },

	rowCardContainer: { gap: 8 },

	cardHeaderRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
});
