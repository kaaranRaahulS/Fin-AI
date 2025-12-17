// app/(tabs)/budget.tsx
import React from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Pressable,
	Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

type FamilyMember = {
	name: string;
	avatar: string;
	spending: number;
	income: number;
	trend: "up" | "down";
	trendValue: string;
};

type BudgetGoal = {
	category: string;
	spent: number;
	budget: number;
	color: "teal" | "blue" | "purple" | "orange";
};

/** Small ProgressBar component */
function ProgressBar({
	value,
	height = 8,
}: {
	value: number;
	height?: number;
}) {
	const pct = Math.max(0, Math.min(100, value));
	return (
		<View style={[pbStyles.track, { height }]}>
			<View style={[pbStyles.fill, { width: `${pct}%` }]} />
		</View>
	);
}

const pbStyles = StyleSheet.create({
	track: {
		backgroundColor: "#eef2f6",
		borderRadius: 999,
		overflow: "hidden",
	},
	fill: {
		backgroundColor: "#10b981", // default green fill
		height: "100%",
	},
});

export default function Budget({ onBack }: { onBack?: () => void }) {
	const router = useRouter();

	const familyMembers: FamilyMember[] = [
		{
			name: "Sarah (You)",
			avatar: "👩",
			spending: 1240.5,
			income: 4500,
			trend: "down",
			trendValue: "8%",
		},
		{
			name: "John",
			avatar: "👨",
			spending: 980.3,
			income: 5000,
			trend: "down",
			trendValue: "12%",
		},
		// {
		// 	name: "Emma",
		// 	avatar: "👧",
		// 	spending: 145.2,
		// 	income: 0,
		// 	trend: "up",
		// 	trendValue: "5%",
		// },
		// {
		// 	name: "Luke",
		// 	avatar: "👦",
		// 	spending: 89.4,
		// 	income: 0,
		// 	trend: "down",
		// 	trendValue: "3%",
		// },
	];

	const budgetGoals: BudgetGoal[] = [
		{ category: "Groceries", spent: 450, budget: 600, color: "teal" },
		{ category: "Utilities", spent: 280, budget: 300, color: "blue" },
		{ category: "Entertainment", spent: 320, budget: 400, color: "purple" },
		{ category: "Education", spent: 500, budget: 500, color: "orange" },
	];

	const totalSpending = familyMembers.reduce((s, m) => s + m.spending, 0);
	const totalIncome = familyMembers.reduce((s, m) => s + m.income, 0);

	const colorMap: Record<BudgetGoal["color"], string> = {
		teal: "#14b8a6",
		blue: "#3b82f6",
		purple: "#7c3aed",
		orange: "#f97316",
	};

	return (
		<SafeAreaView
			style={styles.safe}
			edges={["top", "left", "right", "bottom"]}
		>
			<ScrollView
				contentContainerStyle={styles.container}
				showsVerticalScrollIndicator={false}
			>
				{/* Header */}
				<LinearGradient
					colors={["#7c3aed", "#4f46e5"]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={styles.header}
				>
					<View style={styles.headerTop}>
						<View style={styles.headerLeft}>
							<View style={styles.iconCircle}>
								<Feather name="users" size={18} color="#fff" />
							</View>
							<View style={{ marginLeft: 10 }}>
								<Text style={styles.headerTitle}>Family Finance</Text>
								<Text style={styles.headerSubtitle}>
									{familyMembers.length} members
								</Text>
							</View>
						</View>

						{/* optional back — use router.back if onBack not provided */}
						<Pressable
							onPress={() => {
								if (onBack) onBack();
								else router.back();
							}}
							style={({ pressed }) => [
								styles.backButton,
								pressed && { opacity: 0.75 },
							]}
						>
							<Feather
								name="arrow-left"
								size={18}
								color="rgba(255,255,255,0.9)"
							/>
						</Pressable>
					</View>

					<View style={styles.headerStatsCard}>
						<View style={styles.statsCol}>
							<Text style={styles.statsLabel}>Total Income</Text>
							<Text style={styles.statsValue}>
								${totalIncome.toLocaleString()}
							</Text>
						</View>
						<View style={styles.statsCol}>
							<Text style={styles.statsLabel}>Total Spending</Text>
							<Text style={styles.statsValue}>
								${totalSpending.toLocaleString()}
							</Text>
						</View>
					</View>
				</LinearGradient>

				{/* Spending by Member */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Spending by Member</Text>
					<View style={styles.card}>
						{familyMembers.map((member, i) => {
							const ratio =
								member.income > 0
									? (member.spending / member.income) * 100
									: Math.min(30, (member.spending / 1000) * 100);
							const isDown = member.trend === "down";
							return (
								<View
									key={i}
									style={[
										styles.memberRow,
										i < familyMembers.length - 1 ? styles.rowDivider : null,
									]}
								>
									<View style={styles.memberLeft}>
										<View style={styles.avatarCircle}>
											<Text style={{ fontSize: 20 }}>{member.avatar}</Text>
										</View>
										<View style={{ marginLeft: 12, minWidth: 0, flex: 1 }}>
											<View style={styles.memberRowTop}>
												<Text style={styles.memberName}>{member.name}</Text>
												<Text style={styles.memberSpend}>
													${member.spending.toFixed(2)}
												</Text>
											</View>
											{member.income > 0 && (
												<Text style={styles.memberIncome}>
													Income: ${member.income.toLocaleString()}
												</Text>
											)}
										</View>
									</View>

									<View style={styles.memberRight}>
										<View style={styles.progressRow}>
											<View style={styles.progressTrack}>
												<View
													style={[
														styles.progressFill,
														{
															width: `${Math.min(100, Math.round(ratio))}%`,
															backgroundColor: isDown ? "#16a34a" : "#f97316",
														},
													]}
												/>
											</View>
											<View style={styles.trendWrap}>
												<Feather
													name={isDown ? "trending-down" : "trending-up"}
													size={14}
													color={isDown ? "#16a34a" : "#f97316"}
												/>
												<Text
													style={[
														styles.trendText,
														{ color: isDown ? "#16a34a" : "#f97316" },
													]}
												>
													{member.trendValue}
												</Text>
											</View>
										</View>
									</View>
								</View>
							);
						})}
					</View>
				</View>

				{/* Budget Goals */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Budget Goals</Text>

					<View style={{ gap: 12 }}>
						{budgetGoals.map((g, idx) => {
							const percentage = (g.spent / g.budget) * 100;
							const isOverBudget = percentage >= 100;
							const theme = colorMap[g.color];
							return (
								<View key={idx} style={styles.card}>
									<View style={styles.goalRow}>
										<View style={styles.goalLeft}>
											<View
												style={[
													styles.goalIcon,
													{ backgroundColor: `${theme}22` },
												]}
											>
												<Feather name="target" size={18} color={theme} />
											</View>
											<View style={{ marginLeft: 12, flex: 1 }}>
												<View style={styles.goalTop}>
													<Text style={styles.goalTitle}>{g.category}</Text>
													<Text
														style={[
															styles.goalAmount,
															isOverBudget ? { color: "#dc2626" } : {},
														]}
													>
														${g.spent} / ${g.budget}
													</Text>
												</View>
												<View style={{ marginTop: 8 }}>
													<ProgressBar value={Math.min(percentage, 100)} />
												</View>
												<Text style={styles.goalSub}>
													{isOverBudget
														? `Over budget by $${g.spent - g.budget}`
														: `$${g.budget - g.spent} remaining`}
												</Text>
											</View>
										</View>
									</View>
								</View>
							);
						})}
					</View>
				</View>

				{/* Family Savings Goal */}
				<View style={styles.section}>
					<View
						style={[
							styles.card,
							{ backgroundColor: "#f5f3ff", borderColor: "#e9d5ff" },
						]}
					>
						<Text style={styles.sectionTitle}>Family Savings Goal</Text>

						<View style={styles.savingsRow}>
							<Text style={styles.savingsPrimary}>$8,450</Text>
							<Text style={styles.savingsSub}>of $12,000</Text>
						</View>

						<View style={{ marginTop: 10 }}>
							<ProgressBar value={70.4} height={12} />
						</View>

						<Text style={[styles.goalSub, { marginTop: 8 }]}>
							70% complete • On track for December target
						</Text>

						<Pressable
							style={({ pressed }) => [
								styles.primaryBtn,
								pressed && { opacity: 0.9 },
							]}
							onPress={() => {
								router.push("../adjust-budget")
							}}
						>
							<Text style={styles.primaryBtnText}>Adjust Savings Plan</Text>
						</Pressable>
					</View>
				</View>

				<View style={{ height: 48 }} />
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: "#f8fafc" },
	container: { paddingBottom: 28 },

	/* Header */
	header: {
		paddingHorizontal: 16,
		paddingTop: 18,
		paddingBottom: 18,
		borderBottomLeftRadius: 24,
		borderBottomRightRadius: 24,
	},
	headerTop: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	headerLeft: { flexDirection: "row", alignItems: "center" },
	iconCircle: {
		width: 44,
		height: 44,
		borderRadius: 12,
		backgroundColor: "rgba(255,255,255,0.16)",
		alignItems: "center",
		justifyContent: "center",
	},
	headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
	headerSubtitle: { color: "rgba(255,255,255,0.9)", marginTop: 2 },

	backButton: { padding: 8, borderRadius: 8 },

	headerStatsCard: {
		marginTop: 12,
		backgroundColor: "rgba(255,255,255,0.08)",
		borderRadius: 14,
		padding: 12,
		flexDirection: "row",
		justifyContent: "space-between",
	},
	statsCol: { flex: 1 },
	statsLabel: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
	statsValue: { color: "#fff", fontSize: 20, fontWeight: "800" },

	section: { paddingHorizontal: 16, paddingTop: 18, gap: 12 },
	sectionTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: "#0f172a",
		marginBottom: 8,
	},

	card: {
		backgroundColor: "#fff",
		borderRadius: 16,
		padding: 14,
		borderWidth: 1,
		borderColor: "#eef2f6",
		marginBottom: 8,
		marginTop: 4,
		marginHorizontal: 0,
		// shadow
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 4 },
		elevation: 3,
	},

	memberRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		justifyContent: "space-between",
	},
	rowDivider: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
	memberLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
	avatarCircle: {
		width: 52,
		height: 52,
		borderRadius: 12,
		backgroundColor: "#f3f4f6",
		alignItems: "center",
		justifyContent: "center",
	},
	memberRowTop: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	memberName: { color: "#0f172a", fontWeight: "700" },
	memberSpend: { color: "#0f172a", fontWeight: "700" },
	memberIncome: { color: "#64748b", fontSize: 12, marginTop: 4 },

	memberRight: { width: 110, alignItems: "flex-end" },
	progressRow: { width: "100%", alignItems: "center" },
	progressTrack: {
		height: 8,
		backgroundColor: "#eef2f6",
		borderRadius: 999,
		width: "100%",
		overflow: "hidden",
		marginBottom: 6,
	},
	progressFill: { height: "100%", backgroundColor: "#16a34a" },
	trendWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
	trendText: { marginLeft: 6, fontWeight: "700" },

	goalRow: { flexDirection: "row", alignItems: "center" },
	goalLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
	goalIcon: {
		width: 44,
		height: 44,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	goalTop: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	goalTitle: { fontWeight: "700", color: "#0f172a" },
	goalAmount: { color: "#64748b" },
	goalSub: { color: "#64748b", fontSize: 12, marginTop: 6 },

	savingsRow: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: 8,
		marginTop: 8,
	},
	savingsPrimary: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
	savingsSub: { color: "#64748b", fontSize: 12 },

	primaryBtn: {
		marginTop: 12,
		backgroundColor: "#7c3aed",
		paddingVertical: 12,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	primaryBtnText: { color: "#fff", fontWeight: "800" },
});
