import React, { useEffect, useState, useCallback } from "react";
import {
	SafeAreaView,
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	TextInput,
	Platform,
	ActivityIndicator,
	Alert,
} from "react-native";
import {
	ArrowLeft,
	Sparkles,
	Home,
	Car,
	ShoppingBag,
	Utensils,
	Zap,
	Film,
	Heart,
	Repeat,
	DollarSign,
	Target,
	TrendingUp,
} from "lucide-react-native";
import { router } from "expo-router";
import { SavingsCategory, SpendingCategory } from "@/enums/categories";
import { useAuth } from "@/contexts/AuthContext";

/**
 * CONFIG - update these for your environment
 */
const API_BASE = "http://localhost:8000";
const CATEGORY_CONFIG: Record<string, { icon?: any; color?: string }> = {
	[SpendingCategory.Housing]: { icon: Home, color: "#3B82F6" },
	[SpendingCategory.Transportation]: { icon: Car, color: "#6366F1" },
	[SpendingCategory.Groceries]: { icon: ShoppingBag, color: "#10B981" },
	[SpendingCategory.Dining]: { icon: Utensils, color: "#F97316" },
	[SpendingCategory.Utilities]: { icon: Zap, color: "#F59E0B" },
	[SpendingCategory.Entertainment]: { icon: Film, color: "#8B5CF6" },
	[SpendingCategory.Shopping]: { icon: ShoppingBag, color: "#EC4899" },
	[SpendingCategory.Healthcare]: { icon: Heart, color: "#EF4444" },
	[SpendingCategory.Subscriptions]: { icon: Repeat, color: "#14B8A6" },

	[SavingsCategory.EmergencyFund]: { icon: Target, color: "#2563EB" },
	[SavingsCategory.Investments]: { icon: TrendingUp, color: "#059669" },
	[SavingsCategory.Goals]: { icon: Target, color: "#7C3AED" },
	[SavingsCategory.OtherSavings]: { icon: DollarSign, color: "#D97706" },
};

type SpendingState = Record<SpendingCategory, string>;
type SavingsState = Record<SavingsCategory, string>;

type Props = {
	onBack?: () => void;
};

export default function AdjustSavingsPlanScreen({ onBack }: Props) {
	// INITIAL STATES: default to "0"
	const initialSpending: SpendingState = {
		[SpendingCategory.Housing]: "0",
		[SpendingCategory.Transportation]: "0",
		[SpendingCategory.Groceries]: "0",
		[SpendingCategory.Dining]: "0",
		[SpendingCategory.Utilities]: "0",
		[SpendingCategory.Entertainment]: "0",
		[SpendingCategory.Shopping]: "0",
		[SpendingCategory.Healthcare]: "0",
		[SpendingCategory.Subscriptions]: "0",
	};
	const { user } = useAuth();

	const initialSavings: SavingsState = {
		[SavingsCategory.EmergencyFund]: "0",
		[SavingsCategory.Investments]: "0",
		[SavingsCategory.Goals]: "0",
		[SavingsCategory.OtherSavings]: "0",
	};

	const [spendingAmounts, setSpendingAmounts] =
		useState<SpendingState>(initialSpending);
	const [savingsAmounts, setSavingsAmounts] =
		useState<SavingsState>(initialSavings);

	// monthly income default 0 until API returns
	const [monthlyIncomeState, setMonthlyIncomeState] = useState<number>(0);

	// ui & network
	const [loading, setLoading] = useState(true);
	const [saving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const toNum = (s: string) => parseFloat(s) || 0;

	// derived totals
	const totalSpending = Object.values(spendingAmounts).reduce(
		(s, v) => s + toNum(v),
		0
	);
	const totalSavings = Object.values(savingsAmounts).reduce(
		(s, v) => s + toNum(v),
		0
	);
	const totalBudget = totalSpending + totalSavings;
	const remaining = monthlyIncomeState - totalBudget;

	const spendingPercent =
		monthlyIncomeState > 0
			? ((totalSpending / monthlyIncomeState) * 100).toFixed(1)
			: "0";
	const savingsPercent =
		monthlyIncomeState > 0
			? ((totalSavings / monthlyIncomeState) * 100).toFixed(1)
			: "0";
	const totalPercent =
		monthlyIncomeState > 0
			? ((totalBudget / monthlyIncomeState) * 100).toFixed(1)
			: "0";

	const isValid = totalBudget <= monthlyIncomeState && totalBudget > 0;

	// setters
	const setSpending = (key: SpendingCategory, value: string) =>
		setSpendingAmounts((p) => ({ ...p, [key]: value }));
	const updateSavingAmount = (key: SavingsCategory, value: string) =>
		setSavingsAmounts((p) => ({ ...p, [key]: value }));

	// build arrays for API payload (no 'key', only 'name' + amount)
	const buildSpendingArray = useCallback(() => {
		return (Object.values(SpendingCategory) as SpendingCategory[]).map(
			(name) => ({
				name,
				amount: toNum(spendingAmounts[name]),
			})
		);
	}, [spendingAmounts]);

	const buildSavingsArray = useCallback(() => {
		return (Object.values(SavingsCategory) as SavingsCategory[]).map(
			(name) => ({
				name,
				amount: toNum(savingsAmounts[name]),
			})
		);
	}, [savingsAmounts]);

	const USER_ID = user?.id ?? '693a0451e654cdaccbb42d26';

	// fetch latest income + budget if present
	useEffect(() => {
		let mounted = true;
		async function load() {
			setLoading(true);
			setError(null);
			try {
				// try income
				try {
					const incomeRes = await fetch(`${API_BASE}/api/income/${USER_ID}`);
					if (incomeRes.ok) {
						const json = await incomeRes.json();
						console.log("income fetch response", json);
						if (json?.ok && json.data?.amount && mounted) {
							setMonthlyIncomeState(Number(json.data.amount));
						}
					}
				} catch (e) {
					// ignore income fetch failure (keep 0)
					console.warn("income fetch error", e);
				}

				// try budget
				try {
					const budgetRes = await fetch(`${API_BASE}/api/budgets/${USER_ID}`);
					if (budgetRes.ok) {
						const json = await budgetRes.json();
						if (json?.ok && json.data && mounted) {
							const b = json.data;
							// populate spending fields
							(b.spendingCategories || []).forEach((c: any) => {
								// only set if category name matches enum
								if (Object.values(SpendingCategory).includes(c.name)) {
									setSpendingAmounts((prev) => ({
										...prev,
										[c.name]: String(c.amount || 0),
									}));
								}
							});
							// populate savings fields
							(b.savingsCategories || []).forEach((c: any) => {
								if (Object.values(SavingsCategory).includes(c.name)) {
									setSavingsAmounts((prev) => ({
										...prev,
										[c.name]: String(c.amount || 0),
									}));
								}
							});

							if (b.monthlyIncomeSnapshot) {
								setMonthlyIncomeState(Number(b.monthlyIncomeSnapshot));
							}
						}
					}
				} catch (e) {
					console.warn("budget fetch error", e);
				}
			} catch (err) {
				console.warn("load error", err);
				if (mounted) setError("Failed to load data");
			} finally {
				if (mounted) setLoading(false);
			}
		}

		load();
		return () => {
			mounted = false;
		};
	}, []);

	// Save to backend
	async function onSaveBudget() {
		if (!isValid) {
			Alert.alert(
				"Invalid budget",
				"Your allocations exceed monthly income or are zero."
			);
			return;
		}

		setIsSaving(true);
		setError(null);

		const payload = {
			monthlyIncomeSnapshot: monthlyIncomeState,
			spendingCategories: buildSpendingArray(),
			savingsCategories: buildSavingsArray(),
			notes: "Saved from mobile app",
		};

		try {
			const res = await fetch(`${API_BASE}/api/budgets/${USER_ID}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const json = await res.json();
			if (!res.ok || !json.ok) {
				const msg = json?.message || `Server ${res.status}`;
				setError(msg);
				Alert.alert("Save failed", msg);
			} else {
				Alert.alert("Saved", "Budget saved successfully.");
			}
		} catch (err) {
			console.warn("save error", err);
			setError("Failed to save. Check connection.");
			Alert.alert("Save failed", "Failed to save. Check connection.");
		} finally {
			setIsSaving(false);
		}
	}

	// back handler
	const handleBack = () => {
		if (onBack) onBack();
		else router.back();
	};

	// UI while loading
	if (loading) {
		return (
			<SafeAreaView style={styles.safe}>
				<View style={[styles.center, { flex: 1 }]}>
					<ActivityIndicator size="large" color="#0D9488" />
					<Text style={{ marginTop: 12 }}>Loading budget...</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safe}>
			<ScrollView
				contentContainerStyle={styles.container}
				keyboardShouldPersistTaps="handled"
			>
				<View style={styles.headerArea}>
					<View style={styles.headerTop}>
						<TouchableOpacity onPress={handleBack} style={styles.backBtn}>
							<ArrowLeft size={20} color="#FFFFFF" />
						</TouchableOpacity>

						<View style={styles.headerTitleRow}>
							<View style={styles.iconCircle}>
								<DollarSign size={18} color="#fff" />
							</View>
							<View style={{ marginLeft: 12 }}>
								<Text style={styles.headerTitle}>Monthly Budget</Text>
								<Text style={styles.headerSubtitle}>
									Set your spending & savings plan
								</Text>
							</View>
						</View>
					</View>
				</View>

				<View style={styles.content}>
					<View style={styles.incomeCard}>
						<Text style={styles.smallLabel}>Monthly Income</Text>
						<Text style={styles.incomeAmount}>
							${monthlyIncomeState.toLocaleString()}
						</Text>

						<View style={styles.incomeRow}>
							<View style={styles.incomeCol}>
								<Text style={styles.smallLabel}>Spending</Text>
								<Text style={styles.colValue}>
									${totalSpending.toLocaleString()}
								</Text>
								<Text style={styles.muted}>{spendingPercent}%</Text>
							</View>
							<View style={styles.incomeCol}>
								<Text style={styles.smallLabel}>Savings</Text>
								<Text style={[styles.colValue, { color: "#0F766E" }]}>
									${totalSavings.toLocaleString()}
								</Text>
								<Text style={[styles.muted, { color: "#0F766E" }]}>
									{savingsPercent}%
								</Text>
							</View>
						</View>
					</View>

					<View style={styles.aiBanner}>
						<Sparkles size={16} color="#0E7490" />
						<Text style={styles.aiText}>
							Your savings rate of {savingsPercent}% is great! Financial experts
							recommend saving at least 20%.
						</Text>
					</View>

					{/* Spending */}
					<View style={styles.card}>
						<View style={styles.cardHeader}>
							<Text style={styles.cardTitle}>Spending Categories</Text>
							<View style={{ alignItems: "flex-end" }}>
								<Text style={styles.totalBold}>
									${totalSpending.toLocaleString()}
								</Text>
								<Text style={styles.muted}>{spendingPercent}% of income</Text>
							</View>
						</View>

						<Text style={styles.helperText}>
							Set your monthly budget for each spending category
						</Text>

						<View style={{ marginTop: 8 }}>
							{(Object.values(SpendingCategory) as SpendingCategory[]).map(
								(name) => {
									const cfg = CATEGORY_CONFIG[name] || {};
									const Icon = cfg.icon;
									const color = cfg.color || "#E5E7EB";
									const value = spendingAmounts[name] ?? "0";
									const percent =
										monthlyIncomeState > 0
											? ((toNum(value) / monthlyIncomeState) * 100).toFixed(1)
											: "0";

									return (
										<View key={name} style={styles.inputRow}>
											<View style={styles.rowLeft}>
												<View
													style={[styles.iconBox, { backgroundColor: color }]}
												>
													{Icon ? <Icon size={14} color="#fff" /> : null}
												</View>
												<Text style={styles.label}>{name}</Text>
											</View>

											<View style={{ width: 120 }}>
												<Text style={styles.percentText}>{percent}%</Text>
												<View style={styles.inputWrapper}>
													<TextInput
														value={String(value)}
														keyboardType={
															Platform.OS === "ios"
																? "numbers-and-punctuation"
																: "numeric"
														}
														onChangeText={(t) =>
															setSpending(name as SpendingCategory, t)
														}
														placeholder="0.00"
														style={styles.input}
														returnKeyType="done"
													/>
												</View>
											</View>
										</View>
									);
								}
							)}
						</View>
					</View>

					{/* Savings */}
					<View style={styles.card}>
						<View style={styles.cardHeader}>
							<Text style={styles.cardTitle}>Savings Categories</Text>
							<View style={{ alignItems: "flex-end" }}>
								<Text style={[styles.totalBold, { color: "#0F766E" }]}>
									${totalSavings.toLocaleString()}
								</Text>
								<Text style={[styles.muted, { color: "#0F766E" }]}>
									{savingsPercent}% of income
								</Text>
							</View>
						</View>

						<Text style={styles.helperText}>
							Allocate your monthly savings across different goals
						</Text>

						<View style={{ marginTop: 8 }}>
							{(Object.values(SavingsCategory) as SavingsCategory[]).map(
								(name) => {
									const cfg = CATEGORY_CONFIG[name] || {};
									const Icon = cfg.icon;
									const color = cfg.color || "#E5E7EB";
									const value = savingsAmounts[name] ?? "0";
									const percent =
										monthlyIncomeState > 0
											? ((toNum(value) / monthlyIncomeState) * 100).toFixed(1)
											: "0";

									return (
										<View key={name} style={styles.inputRow}>
											<View style={styles.rowLeft}>
												<View
													style={[styles.iconBox, { backgroundColor: color }]}
												>
													{Icon ? <Icon size={14} color="#fff" /> : null}
												</View>
												<Text style={styles.label}>{name}</Text>
											</View>

											<View style={{ width: 120 }}>
												<Text
													style={[styles.percentText, { color: "#0F766E" }]}
												>
													{percent}%
												</Text>
												<View style={styles.inputWrapper}>
													<TextInput
														value={String(value)}
														keyboardType={
															Platform.OS === "ios"
																? "numbers-and-punctuation"
																: "numeric"
														}
														onChangeText={(t) =>
															updateSavingAmount(name as SavingsCategory, t)
														}
														placeholder="0.00"
														style={styles.input}
														returnKeyType="done"
													/>
												</View>
											</View>
										</View>
									);
								}
							)}
						</View>
					</View>

					{/* Summary */}
					<View
						style={[
							styles.summary,
							totalBudget > monthlyIncomeState
								? styles.summaryRed
								: isValid && totalBudget === monthlyIncomeState
									? styles.summaryGreen
									: styles.summaryAmber,
						]}
					>
						<Text style={styles.cardTitle}>Budget Summary</Text>

						<View style={styles.summaryRow}>
							<Text style={styles.smallLabel}>Monthly Income</Text>
							<Text style={styles.boldText}>
								${monthlyIncomeState.toLocaleString()}
							</Text>
						</View>

						<View style={styles.summaryRow}>
							<Text style={styles.smallLabel}>Total Spending</Text>
							<Text style={styles.boldText}>
								-${totalSpending.toLocaleString()}
							</Text>
						</View>

						<View style={styles.summaryRow}>
							<Text style={styles.smallLabel}>Total Savings</Text>
							<Text style={[styles.boldText, { color: "#0F766E" }]}>
								-${totalSavings.toLocaleString()}
							</Text>
						</View>

						<View style={styles.summaryRow}>
							<Text style={styles.boldText}>
								{remaining >= 0 ? "Remaining" : "Over Budget"}
							</Text>
							<Text
								style={[
									styles.boldText,
									remaining < 0 ? { color: "#DC2626" } : {},
								]}
							>
								${Math.abs(remaining).toLocaleString()}
							</Text>
						</View>

						<View style={styles.summaryRow}>
							<Text style={styles.smallLabel}>Total Allocated</Text>
							<View style={{ alignItems: "flex-end" }}>
								<Text
									style={[
										styles.boldText,
										totalBudget > monthlyIncomeState
											? { color: "#DC2626" }
											: isValid && totalBudget === monthlyIncomeState
												? { color: "#059669" }
												: { color: "#D97706" },
									]}
								>
									${totalBudget.toLocaleString()}
								</Text>
								<Text style={styles.muted}>{totalPercent}%</Text>
							</View>
						</View>

						{totalBudget > monthlyIncomeState && (
							<Text style={styles.alertText}>
								Your budget exceeds your monthly income by $
								{(totalBudget - monthlyIncomeState).toLocaleString()}. Please
								reduce allocations.
							</Text>
						)}
						{totalBudget < monthlyIncomeState && remaining > 0 && (
							<Text
								style={[
									styles.alertText,
									{ backgroundColor: "#FEF3C7", color: "#92400E" },
								]}
							>
								You have ${remaining.toLocaleString()} unallocated. Consider
								saving more or adjusting categories.
							</Text>
						)}
						{isValid && totalBudget === monthlyIncomeState && (
							<Text
								style={[
									styles.alertText,
									{ backgroundColor: "#ECFDF5", color: "#064E3B" },
								]}
							>
								Perfect! Your budget is fully allocated with {savingsPercent}%
								going to savings.
							</Text>
						)}
					</View>

					<TouchableOpacity
						disabled={!isValid || totalBudget === 0 || saving}
						onPress={onSaveBudget}
						style={[
							styles.saveBtn,
							(!isValid || totalBudget === 0 || saving) &&
							styles.saveBtnDisabled,
						]}
					>
						<Text
							style={[
								styles.saveBtnText,
								(!isValid || totalBudget === 0 || saving) &&
								styles.saveBtnTextDisabled,
							]}
						>
							{saving
								? "Saving..."
								: !isValid || totalBudget > monthlyIncomeState
									? "Adjust Budget to Save"
									: totalBudget === 0
										? "Enter Amounts to Create Budget"
										: "Save Budget Plan"}
						</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

/**
 * Styles (kept from your previous screen)
 */
const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: "#F9FAFB" },
	container: { paddingBottom: 40 },
	headerArea: {
		backgroundColor: "#0D9488",
		paddingBottom: 18,
		paddingTop: 18,
		paddingHorizontal: 16,
	},
	headerTop: { marginBottom: 6 },
	backBtn: {
		padding: 8,
		borderRadius: 999,
		marginBottom: 8,
		alignSelf: "flex-start",
	},
	headerTitleRow: { flexDirection: "row", alignItems: "center" },
	iconCircle: {
		width: 44,
		height: 44,
		borderRadius: 12,
		backgroundColor: "rgba(255,255,255,0.18)",
		alignItems: "center",
		justifyContent: "center",
	},
	headerTitle: { color: "#fff", fontSize: 20, fontWeight: "600" },
	headerSubtitle: { color: "rgba(255,255,255,0.85)" },

	content: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },

	incomeCard: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		marginTop: -36,
		marginHorizontal: 16,
		shadowColor: "#000",
		shadowOpacity: 0.05,
		shadowRadius: 6,
		elevation: 2,
	},
	smallLabel: { fontSize: 12, color: "#6B7280" },
	incomeAmount: {
		fontSize: 28,
		fontWeight: "700",
		color: "#111827",
		marginVertical: 6,
	},
	incomeRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 8,
	},
	incomeCol: { flex: 1 },

	aiBanner: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: "#ECFEFF",
		borderRadius: 12,
		padding: 12,
		marginTop: 8,
	},
	aiText: { color: "#0E7490", flex: 1 },

	card: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 12,
		marginTop: 8,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	cardHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	cardTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
	helperText: { color: "#6B7280", marginTop: 8 },

	inputRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 10,
	},
	rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
	iconBox: {
		width: 36,
		height: 36,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
	},
	label: { fontSize: 14, color: "#111827" },

	percentText: {
		textAlign: "right",
		fontSize: 12,
		color: "#6B7280",
		marginBottom: 4,
	},
	inputWrapper: {
		backgroundColor: "#F3F4F6",
		borderRadius: 8,
		paddingHorizontal: 8,
	},
	input: {
		height: 38,
		minWidth: 80,
		paddingHorizontal: 6,
		fontSize: 14,
		color: "#111827",
	},

	totalBold: { fontWeight: "700", fontSize: 14 },

	summary: { borderRadius: 12, padding: 12, marginTop: 12, borderWidth: 1 },
	summaryGreen: { backgroundColor: "#ECFDF5", borderColor: "#BBF7D0" },
	summaryRed: { backgroundColor: "#FEE2E2", borderColor: "#FECACA" },
	summaryAmber: { backgroundColor: "#FFFBEB", borderColor: "#FEF3C7" },

	summaryRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 8,
		borderBottomWidth: 0.5,
		borderBottomColor: "#F3F4F6",
	},
	boldText: { fontWeight: "700", color: "#111827" },
	muted: { color: "#6B7280", fontSize: 12 },

	alertText: {
		marginTop: 10,
		padding: 10,
		borderRadius: 8,
		backgroundColor: "#FEE2E2",
		color: "#991B1B",
		fontSize: 13,
	},

	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginTop: 12,
	},
	sectionTitle: { fontSize: 16, fontWeight: "600" },

	goalCard: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 12,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	goalIcon: {
		width: 44,
		height: 44,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	goalTitle: { fontSize: 15, fontWeight: "600" },

	progressBar: {
		height: 8,
		backgroundColor: "#F3F4F6",
		borderRadius: 999,
		marginVertical: 8,
		overflow: "hidden",
	},
	progressFill: { height: 8 },

	projCard: {
		backgroundColor: "#ECFDF5",
		borderRadius: 12,
		padding: 12,
		borderWidth: 1,
		borderColor: "#D1FAE5",
		marginTop: 8,
	},

	projIcon: {
		width: 44,
		height: 44,
		borderRadius: 12,
		backgroundColor: "#0D9488",
		alignItems: "center",
		justifyContent: "center",
	},

	saveBtn: {
		backgroundColor: "#0D9488",
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: "center",
		marginTop: 14,
		marginHorizontal: 0,
	},
	saveBtnDisabled: { backgroundColor: "#94D3CC", opacity: 0.7 },
	saveBtnText: { color: "#fff", fontWeight: "700" },
	saveBtnTextDisabled: { color: "#F0FDF4" },
	colValue: { fontSize: 16, fontWeight: "700", color: "#111827" },

	center: { alignItems: "center", justifyContent: "center" },
});
