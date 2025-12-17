import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useEffect, useState, useCallback } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AIInsightBanner from "../../components/AIInsigntBanner";
import FinanceCard from "../../components/FinanceCard";
import { useAuth } from "../../contexts/AuthContext";
import { useFocusEffect, useRouter } from "expo-router";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { ArrowUpRight } from "lucide-react-native";

type HomeData = {
	hasLinkedAccounts: boolean;
	totalBalance?: number;
	monthlyIncome?: number;
	monthlyExpenses?: number;
	monthlyDelta?: number;
	monthlyDeltaPercentage?: number;
	upcomingBillsAmount?: number;
	upcomingBillsCount?: number;
	activeSubscriptionsCount?: number;
	activeSubscriptionsTotal?: number;
	availableRewards?: number;
	recentTransactions?: Array<{
		id: string;
		title: string;
		subtitle: string;
		amount: number;
		icon: string;
		date: string;
	}>;
	activeSubscriptionsNames?: string[]
};

export default function HomeScreen() {
	const { user } = useAuth();
	const router = useRouter();
	const [homeData, setHomeData] = useState<HomeData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const fetchHomeData = async () => {
		let USER_ID = user?.id ?? '693a0451e654cdaccbb42d26';

		try {
			setLoading(true);
			const response = await fetch(`http://localhost:8000/api/home?userId=${USER_ID}`);

			if (!response.ok) {
				console.log('Failed to fetch home data');
			}

			const data = await response.json();

			// Transform the data to match our frontend types
			const transformedData: HomeData = {
				hasLinkedAccounts: data.hasLinkedAccounts,

				// balances & monthly stats from backend
				totalBalance: data.totalBalance ?? 0,
				monthlyIncome: data.monthlyIncome ?? 0,
				monthlyExpenses: data.monthlyExpenses ?? 0,
				monthlyDelta: data.monthlyDelta ?? 0,
				monthlyDeltaPercentage: data.monthlyDeltaPercentage ?? 0,

				// recent transactions
				recentTransactions: data.recentTransactions?.map((txn: any) => ({
					id: txn._id,
					title: txn.name || "Transaction",
					subtitle: txn.account?.name || "Account",
					amount: txn.amount || 0,
					icon: getTransactionIcon(txn.category?.[0] || "other"),
					date: txn.date,
				})),

				// upcoming bills – prefer backend aggregate if present
				upcomingBillsAmount:
					data.upcomingBillsAmount ??
					(data.upcomingBills?.reduce(
						(sum: number, bill: any) => sum + (bill.amount || 0),
						0
					) ?? 0),
				upcomingBillsCount: data.upcomingBillsCount ?? data.upcomingBills?.length ?? 0,

				// 👇 subscriptions & rewards from backend
				activeSubscriptionsCount: data.activeSubscriptionsCount ?? 0,
				activeSubscriptionsTotal: data.activeSubscriptionsTotal ?? 0,
				activeSubscriptionsNames: data.activeSubscriptionsNames ?? [],
				availableRewards: data.availableRewards ?? 0,
			};

			setHomeData(transformedData);
		} catch (err) {
			console.error('Error fetching home data:', err);
			setError('Failed to load data. Please try again later.');
		} finally {
			setLoading(false);
		}
	};
	useFocusEffect(
		useCallback(() => {
			fetchHomeData();
		}, [])
	);
	// useEffect(() => {

	// 	fetchHomeData();
	// }, []);

	// Helper function to get icon based on transaction category
	const getTransactionIcon = (category: string): keyof typeof Feather.glyphMap => {
		const categoryIcons: Record<string, keyof typeof Feather.glyphMap> = {
			'food': 'coffee',
			'restaurant': 'coffee', // Using coffee as fallback for utensils
			'grocery': 'shopping-cart',
			'transport': 'truck', // Using truck as fallback for car
			'shopping': 'shopping-bag',
			'entertainment': 'film',
			'bills': 'file-text',
			'salary': 'dollar-sign',
			'transfer': 'refresh-cw',
			'other': 'tag'
		};

		return categoryIcons[category.toLowerCase()] || 'tag';
	};

	const greeting = useMemo(() => {
		const hr = new Date().getHours();
		if (hr < 12) return "Good Morning";
		if (hr < 18) return "Good Afternoon";
		return "Good Evening";
	}, []);

	const formatCurrency = (amount?: number) => {
		if (amount === undefined) return '---';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(amount);
	};

	return (
		<SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
			{/* Gradient header with large rounded bottom corners */}
			<LinearGradient
				colors={["#14b8a6", "#0d9488"]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={styles.header}
			>
				<View style={styles.headerRow}>
					<View>
						<Text style={styles.greeting}>{greeting}</Text>
						<Text style={styles.name}>{user?.name ?? "Sarah"}</Text>
					</View>
					<View style={styles.helloBubble}>
						<Text style={{ fontSize: 22 }}>👋</Text>
					</View>
				</View>

				<AIInsightBanner
					message="You saved $40 this week by switching to your Cashback card!"
					type="success"
				/>
			</LinearGradient>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{/* Total Balance */}
				<View style={[styles.card, styles.totalCard]}>
					<View style={styles.totalRow}>
						<Text style={styles.totalLabel}>Total Balance</Text>
						{homeData?.monthlyDelta !== undefined && (
							<Feather
								name={homeData.monthlyDelta >= 0 ? "trending-up" : "trending-down"}
								size={20}
								color={homeData.monthlyDelta >= 0 ? "#22c55e" : "#ef4444"}
							/>
						)}
					</View>
					<Text style={styles.totalValue}>
						{homeData?.hasLinkedAccounts ? formatCurrency(homeData.totalBalance) : '---'}
					</Text>
					{homeData?.hasLinkedAccounts && homeData.monthlyDelta ?
						<Text style={[
							styles.totalDelta,
							{ color: homeData.monthlyDelta >= 0 ? "#22c55e" : "#ef4444" }
						]}>
							{homeData.monthlyDelta >= 0 ? '+' : ''}{formatCurrency(homeData.monthlyDelta)} this month
						</Text>
						: <></>}
				</View>

				{/* Income / Expenses grid */}
				<View style={styles.grid2}>
					<View style={{ flex: 1, backgroundColor: "#fff", padding: 15, borderRadius: 12 }}>
						<FinanceCard
							title="Credit"
							value={homeData?.hasLinkedAccounts ? formatCurrency(homeData.monthlyIncome) : '---'}
							subtitle="This month"
							icon={<Feather name="briefcase" size={20} color="#0d9488" />}
							trend={homeData?.monthlyDeltaPercentage && homeData.monthlyDeltaPercentage >= 0 ? "up" : "down"}
							trendValue={
								homeData?.hasLinkedAccounts && homeData.monthlyDeltaPercentage
									? `${homeData.monthlyDeltaPercentage >= 0 ? '+' : ''}${homeData.monthlyDeltaPercentage}%`
									: ''
							}
						/>
					</View>
					<View style={{ flex: 1, backgroundColor: "#fff", padding: 15, borderRadius: 12 }}>
						<FinanceCard
							title="Debit"
							value={homeData?.hasLinkedAccounts ? formatCurrency(homeData.monthlyExpenses) : '---'}
							subtitle="This month"
							icon={<Feather name="calendar" size={20} color="#0d9488" />}
							trend={homeData?.monthlyDeltaPercentage && homeData.monthlyDeltaPercentage < 0 ? "up" : "down"}
							trendValue={
								homeData?.hasLinkedAccounts && homeData.monthlyDeltaPercentage
									? `${homeData.monthlyDeltaPercentage < 0 ? '+' : ''}${-homeData.monthlyDeltaPercentage}%`
									: ''
							}
						/>
					</View>
				</View>



				{homeData?.hasLinkedAccounts ? (
					<>
						{/* Quick Actions */}
						<View style={{ gap: 12 }}>
							<Text style={styles.sectionTitle}>Quick Actions</Text>
						</View>
						<View style={[styles.card]}>
							<View style={styles.rowHeader}>
								<Text style={styles.rowHeaderTitle}>Upcoming Bills</Text>
								<Feather name="calendar" size={18} color="#0d9488" />
							</View>
							<Text style={styles.rowPrimaryValue}>
								{formatCurrency(homeData.upcomingBillsAmount)}
							</Text>
							<Text style={styles.rowSub}>
								{homeData.upcomingBillsCount} {homeData.upcomingBillsCount === 1 ? 'bill' : 'bills'} due this week
							</Text>
						</View>

						<View style={[styles.card]}>
							<View style={styles.rowHeader}>
								<Text style={styles.rowHeaderTitle}>Active Subscriptions</Text>
								<Feather name="repeat" size={18} color="#0d9488" />
							</View>
							<Text style={styles.rowPrimaryValue}>
								{homeData.activeSubscriptionsCount} {homeData.activeSubscriptionsCount === 1 ? 'service' : 'services'}
							</Text>
							<Text style={styles.rowSub}>
								{formatCurrency(homeData.activeSubscriptionsTotal)}/month total
							</Text>
							{homeData.activeSubscriptionsNames?.length ? (
								<Text
									style={{
										marginTop: 6,
										fontSize: 12,
										color: "#64748b",
									}}
									numberOfLines={2}
								>
									{homeData.activeSubscriptionsNames.join(", ")}
								</Text>
							) : null}
						</View>

						<View style={[styles.card]}>
							<View style={styles.rowHeader}>
								<Text style={styles.rowHeaderTitle}>Rewards Available</Text>
								<Feather name="gift" size={18} color="#0d9488" />
							</View>
							<Text style={styles.rowPrimaryValue}>
								{formatCurrency(homeData.availableRewards)}
							</Text>
							<Text style={styles.rowSub}>From credit cards</Text>
						</View>
					</>
				) : <></>}


				{/* Recent Transactions */}
				<View style={{ gap: 12 }}>
					<View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
						<Text style={styles.sectionTitle}>Recent Transactions</Text>
						{homeData?.hasLinkedAccounts ?
							<>
								<Pressable
									onPress={() => {
										setTimeout(() => {
											Alert.alert("Success", "Fetched transactions successfully");
										}, 1000); // 1 second
									}}
									style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
								>
									<Text style={{ fontSize: 14, color: "#0d9488", fontWeight: "500" }}>
										Sync
									</Text>
									<Feather name="refresh-cw" size={16} color="#0d9488" />

								</Pressable>
								<Pressable
									onPress={() => router.push("/alltransactions" as any)}
									style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
								>
									<Text style={{ fontSize: 14, color: "#0d9488", fontWeight: "500" }}>
										Show All
									</Text>
									<ArrowUpRight size={16} color="#0d9488" />
								</Pressable></>
							: <></>}
					</View>

					{homeData?.hasLinkedAccounts ? (
						<View style={styles.card}>
							{homeData.recentTransactions && homeData.recentTransactions.length > 0 ? (
								homeData.recentTransactions.map((t, idx) => {
									const isLast = idx === homeData.recentTransactions!.length - 1;
									const amountStr = formatCurrency(t.amount);

									return (
										<View
											key={t.id}
											style={[styles.txnRow, !isLast && styles.txnDivider]}
										>
											<View style={styles.txnIconWrap}>
												<Feather
													name={t.icon in Feather.glyphMap ? t.icon as any : "tag"}
													size={18}
													color="#0f766e"
												/>
											</View>

											<View style={{ flex: 1 }}>
												<Text style={styles.txnTitle}>{t.title}</Text>
												<Text style={styles.txnSub}>{t.subtitle}</Text>
											</View>

											<Text
												style={[
													styles.txnAmount,
													{ color: t.amount > 0 ? "#dc2626" : "#16a34a" },
												]}
											>
												{t.amount > 0 ? '-' : '+'}{formatCurrency(Math.abs(t.amount))}
											</Text>
										</View>
									);
								})
							) : (
								<View style={{ padding: 16, alignItems: 'center' }}>
									<Feather name="file-text" size={24} color="#94a3b8" style={{ marginBottom: 8 }} />
									<Text style={[styles.rowSub, { textAlign: 'center' }]}>
										No recent transactions found
									</Text>
								</View>
							)}
						</View>
					) : (
						<Pressable
							style={[styles.card, { alignItems: 'center', padding: 16 }]}
							onPress={() => {
								router.push('/plaid');
							}}
						>
							<Feather name="link" size={24} color="#0d9488" style={{ marginBottom: 8 }} />
							<Text style={[styles.rowHeaderTitle, { textAlign: 'center', marginBottom: 4 }]}>
								Link Bank Accounts
							</Text>
							<Text style={[styles.rowSub, { textAlign: 'center' }]}>
								Connect your bank accounts to view all transactions
							</Text>
						</Pressable>
					)}
				</View>

				{/* Forecast info card */}
				<View style={[styles.card, styles.infoCard]}>
					<View style={styles.infoIconWrap}>
						<Feather name="trending-up" size={20} color="#fff" />
					</View>
					<View style={{ flex: 1 }}>
						<Text style={styles.infoTitle}>Financial Forecast</Text>
						<Text style={styles.infoBody}>
							Based on your spending, you&#39;ll have $2,400 extra by Dec 15
						</Text>
						<Text style={styles.infoLink}>View Forecast →</Text>
					</View>
				</View>
				{/* bottom spacer so content never hides behind the tab bar */}
				<View style={{ height: 28 }} />
			</ScrollView>
			<FloatingChatButton onClick={() => router.push("/chat" as any)} />
		</SafeAreaView>
	);
}

const R = 28; // big radius for header & top card corners

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: "#f1f5f9" }, // slate-100 background like mock

	/* Header */
	header: {
		paddingHorizontal: 20,
		paddingTop: 10,
		paddingBottom: 22, // a bit more space
		borderBottomLeftRadius: 28,
		borderBottomRightRadius: 28,
		overflow: "hidden", // ✅ keeps the banner inside the rounded header
	},

	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 12,
	},
	greeting: { color: "rgba(255,255,255,0.9)", fontSize: 14, marginBottom: 6 },
	name: { color: "#fff", fontSize: 28, fontWeight: "800" },
	helloBubble: {
		width: 44,
		height: 44,
		borderRadius: 9999,
		backgroundColor: "rgba(255,255,255,0.25)",
		alignItems: "center",
		justifyContent: "center",
	},

	/* Main content spacing: pull the first card up like your mock */
	content: {
		paddingHorizontal: 18,
		paddingTop: -R, // not supported; simulate with negative margin on first card
		paddingBottom: 24,
		gap: 16,
	},

	/* Generic card surface */
	card: {
		backgroundColor: "#fff",
		borderRadius: 18,
		padding: 16,
		borderWidth: 1,
		borderColor: "#e2e8f0", // slate-200
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 2,
	},

	/* Total balance card sits under header with overlap */
	totalCard: {
		marginTop: 18, // was bigger; this is a subtle overlap
		borderRadius: 22,
		shadowColor: "#000",
		shadowOpacity: 0.08,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 4 },
		elevation: 4,
	},
	totalRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	totalLabel: { color: "#475569", fontSize: 14 },
	totalValue: {
		color: "#0f172a",
		fontSize: 34,
		fontWeight: "800",
		marginBottom: 4,
	},
	totalDelta: { color: "#16a34a", fontSize: 13, fontWeight: "600" },

	/* Two-column cards */
	grid2: { flexDirection: "row", gap: 12 },

	sectionTitle: { color: "#0f172a", fontSize: 18, fontWeight: "700" },

	/* Quick action rows inside cards */
	rowHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	rowHeaderTitle: { color: "#0f172a", fontWeight: "700" },
	rowPrimaryValue: {
		color: "#0f172a",
		fontSize: 24,
		fontWeight: "800",
		marginTop: 6,
	},
	rowSub: { color: "#64748b", marginTop: 4 },

	/* Recent transactions */
	txnRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
	},
	txnDivider: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
	txnIconWrap: {
		width: 42,
		height: 42,
		borderRadius: 12,
		backgroundColor: "#ecfeff", // teal-50-ish
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	txnTitle: { color: "#0f172a", fontWeight: "700" },
	txnSub: { color: "#64748b", marginTop: 2, fontSize: 12 },
	txnAmount: { fontWeight: "800", fontSize: 16 },

	/* Info card */
	infoCard: {
		flexDirection: "row",
		gap: 12,
		alignItems: "flex-start",
	},
	infoIconWrap: {
		width: 42,
		height: 42,
		borderRadius: 12,
		backgroundColor: "#3b82f6",
		alignItems: "center",
		justifyContent: "center",
	},
	infoTitle: { color: "#0f172a", fontWeight: "800", marginBottom: 4 },
	infoBody: { color: "#475569", lineHeight: 20, marginBottom: 8 },
	infoLink: { color: "#2563eb", fontWeight: "700" },
});
