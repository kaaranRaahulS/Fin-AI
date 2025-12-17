import React, { useCallback, useEffect, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
	RefreshControl,
	Alert,
} from "react-native";
import {
	CreditCard as CardIcon,
	Star,
	Sparkles,
	Plus,
	Trash2,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";

type CardItem = {
	id: string;
	name: string;
	last4: string;
	colors: [string, string];
	currentBalance: number;
	availableBalance: number;
	limit?: number;
	rewards: {
		points: number;
		cashback: string;
	};
	utilization?: number | null;
	type: string;
	subtype?: string;
	bestFor: string[];
};

type SpendingInsight = {
	topCategories: {
		category: string;
		amount: number;
		percentage: number;
	}[];
	totalSpent: number;
	startDate: string;
	endDate: string;
};

const API_BASE_URL = "http://localhost:8000/api";

export default function Cards() {
	const { user } = useAuth();
	const [cards, setCards] = useState<CardItem[]>([]);
	const [spendingInsights, setSpendingInsights] =
		useState<SpendingInsight | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const fetchCardsData = async () => {
		try {

			const USER_ID = user?.id ?? '693a0451e654cdaccbb42d26';

			setLoading(true);
			const response = await axios.get(`${API_BASE_URL}/cards`, {
				params: { userId: USER_ID },
			});

			if (response.data.success) {
				const transformedCards = response.data.accounts.map((account: any) => ({
					id: account.id,
					name: account.name,
					last4: account.last4,
					colors: getCardColors(account.name),
					currentBalance: account.currentBalance,
					availableBalance: account.availableBalance,
					limit: account.limit,
					rewards: {
						points: account.rewards?.points || 0,
						cashback: account.rewards?.cashback || "0.00",
					},
					utilization: account.utilization,
					type: account.type,
					subtype: account.subtype,
					bestFor: getBestForCategories(account.subtype || ""),
				}));

				setCards(transformedCards);
				setSpendingInsights(response.data.spendingInsights);
			}
		} catch (error) {
			console.error("Error fetching cards data:", error);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const onRefresh = () => {
		setRefreshing(true);
		fetchCardsData();
	};

	useFocusEffect(
		useCallback(() => {
			fetchCardsData();
		}, [])
	);

	const getCardColors = (cardName: string): [string, string] => {
		const colorMap: Record<string, [string, string]> = {
			chase: ["#3B82F6", "#4F46E5"],
			"american express": ["#22C55E", "#0D9488"],
			citi: ["#EC4899", "#8B5CF6"],
			"capital one": ["#06B6D4", "#3B82F6"],
			discover: ["#F59E0B", "#F97316"],
			savings: ["#8B5CF6", "#EC4899"],
			checking: ["#3B82F6", "#06B6D4"],
			investment: ["#10B981", "#22C55E"],
		};

		const lowerName = cardName.toLowerCase();
		const matchedColor = Object.entries(colorMap).find(([key]) =>
			lowerName.includes(key)
		);
		if (matchedColor) return matchedColor[1];

		const defaultColors = Object.values(colorMap);
		return defaultColors[Math.floor(Math.random() * defaultColors.length)];
	};

	const getBestForCategories = (subtype: string): string[] => {
		const categoryMap: Record<string, string[]> = {
			"cash back": ["Groceries", "Gas", "Everyday Purchases"],
			travel: ["Travel", "Dining", "Hotels"],
			airline: ["Flights", "Travel", "Dining"],
			hotel: ["Hotels", "Dining", "Travel"],
			student: ["Dining", "Entertainment", "Groceries"],
			business: ["Office Supplies", "Travel", "Advertising"],
		};

		return (
			categoryMap[subtype?.toLowerCase()] || [
				"Everyday Purchases",
				"Dining",
				"Shopping",
			]
		);
	};

	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(amount);
	};

	// ---- delete flow ----
	const handleDeleteCard = async (card: CardItem) => {
		if (!user?.id) return;

		try {
			setDeletingId(card.id);
			const USER_ID = user?.id ?? '693a0451e654cdaccbb42d26';
			// Adjust this endpoint/body if your backend uses a different route
			await axios.post(`${API_BASE_URL}/cards/delete`, {
				userId: USER_ID,
				cardId: card.id,
			});

			setCards((prev) => prev.filter((c) => c.id !== card.id));

			Alert.alert(
				"Card removed",
				`Card ending in ${card.last4} has been deleted successfully.`
			);
		} catch (err) {
			console.error("Error deleting card:", err);
			Alert.alert(
				"Unable to delete",
				"We couldn't remove this card. Please try again."
			);
		} finally {
			setDeletingId(null);
		}
	};

	const confirmDelete = (card: CardItem) => {
		Alert.alert(
			"Remove this card?",
			`Are you sure you want to remove the card ending in ${card.last4}?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: () => handleDeleteCard(card),
				},
			]
		);
	};

	if (loading && !refreshing) {
		return (
			<View style={[styles.container, styles.centerContent]}>
				<ActivityIndicator size="large" color="#0D9488" />
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.screen}>
			<View style={styles.header}>
				<Text style={styles.title}>Accounts and Cards</Text>
				<Text style={styles.subtitle}>View and manage your accounts</Text>
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						colors={["#0D9488"]}
						tintColor="#0D9488"
					/>
				}
			>
				{cards.length === 0 ? (
					<View style={styles.emptyState}>
						<Text style={styles.emptyStateText}>No cards found</Text>
						<TouchableOpacity
							onPress={() => router.push("/plaid")}
							style={styles.linkButton}
						>
							<Text style={styles.emptyStateSubtext}>
								Link your first card to get started
							</Text>
						</TouchableOpacity>
					</View>
				) : (
					<>
						{/* AI Insight banner */}
						<View style={styles.banner}>
							<Text style={styles.bannerIcon}>💡</Text>
							<Text style={styles.bannerText}>
								Using Chase Sapphire for your upcoming flight could earn you
								2,500 bonus points!
							</Text>
						</View>

						{/* Cards List */}
						<View>
							<View style={styles.sectionHeader}>
								<Text style={styles.sectionTitle}>Your Cards</Text>
								<TouchableOpacity
									style={styles.plusBtn}
									onPress={() => router.push("/plaid")}
									accessibilityRole="button"
									accessibilityLabel="Add card"
								>
									<Plus size={18} color="#0F766E" />
									<Text style={styles.plusBtnText}>Add</Text>
								</TouchableOpacity>
							</View>

							<View style={{ gap: 16 }}>
								{cards.map((card, index) => (
									<View
										key={`${card.id}-${index}`}
										style={styles.cardWrapper}
									>
										<LinearGradient
											colors={card.colors}
											start={{ x: 0, y: 0 }}
											end={{ x: 1, y: 1 }}
											style={styles.card}
										>
											<View style={styles.cardTop}>
												<View>
													<Text style={styles.cardBrand}>{card.name}</Text>
													<Text style={styles.cardNumber}>
														•••• {card.last4}
													</Text>
												</View>
												<CardIcon
													size={32}
													color="rgba(255,255,255,0.8)"
												/>
											</View>

											<View style={styles.cardStats}>
												<View>
													<Text style={styles.statLabel}>Balance</Text>
													<Text style={styles.statValue}>
														{formatCurrency(card.currentBalance)}
													</Text>
												</View>
												{card.limit ? (
													<View>
														<Text style={styles.statLabel}>Limit</Text>
														<Text style={styles.statValue}>
															{card.limit
																? formatCurrency(card.limit)
																: "N/A"}
														</Text>
													</View>
												) : (
													<></>
												)}
											</View>

											{card.utilization !== null &&
												card.utilization !== undefined && (
													<View style={styles.utilizationContainer}>
														<View style={styles.utilizationBarContainer}>
															<View
																style={[
																	styles.utilizationBar,
																	{
																		width: `${Math.min(
																			card.utilization,
																			100
																		)}%`,
																		backgroundColor:
																			card.utilization > 80
																				? "#EF4444"
																				: "#10B981",
																	},
																]}
															/>
														</View>
														<Text style={styles.utilizationText}>
															{Math.round(card.utilization)}% Utilization
														</Text>
													</View>
												)}
										</LinearGradient>

										{/* Delete button bottom-right over card */}
										<TouchableOpacity
											style={styles.deleteBtn}
											onPress={() => confirmDelete(card)}
											disabled={deletingId === card.id}
											activeOpacity={0.8}
										>
											{deletingId === card.id ? (
												<ActivityIndicator size="small" color="#FFFFFF" />
											) : (
												<Trash2 size={16} color="#FFFFFF" />
											)}
										</TouchableOpacity>
									</View>
								))}
							</View>
						</View>

						{/* AI Recommendations */}
						<View>
							<View style={[styles.rowCenter, { gap: 8, marginBottom: 12 }]}>
								<Sparkles size={20} color="#0D9488" />
								<Text style={styles.sectionTitle}>AI Recommendations</Text>
							</View>

							<View style={styles.recBox}>
								{spendingInsights?.topCategories
									?.slice(0, 4)
									.map((item, index) => (
										<View
											key={`${item.category}-${index}`}
											style={[
												styles.recRow,
												index <
												Math.min(
													3,
													(spendingInsights?.topCategories?.length ||
														0) - 1
												) && styles.recRowBorder,
											]}
										>
											<View style={{ flex: 1 }}>
												<Text style={styles.recCategory}>
													{item.category}
												</Text>
												<Text style={styles.recSub}>
													Earn {item.percentage}% more
												</Text>
											</View>
											<View style={styles.rewardPill}>
												<Star size={12} color="#16A34A" fill="#16A34A" />
												<Text style={styles.rewardPillText}>
													{"  "}
													{formatCurrency(item.amount)}
												</Text>
											</View>
										</View>
									))}
							</View>
						</View>

						{/* Total Rewards */}
						<View style={styles.totalBox}>
							<Text style={styles.totalTitle}>Total Rewards Available</Text>
							<Text style={styles.totalValue}>
								$
								{cards
									.reduce(
										(sum, card) =>
											sum + parseFloat(card.rewards.cashback || "0"),
										0
									)
									.toFixed(2)}
							</Text>
							<Text style={styles.totalSub}>
								Equivalent value across all cards
							</Text>
							<TouchableOpacity style={styles.redeemBtn}>
								<Text style={styles.redeemBtnText}>Redeem Rewards</Text>
							</TouchableOpacity>
						</View>
					</>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: "#F9FAFB" },
	container: {
		flex: 1,
		padding: 16,
	},
	centerContent: {
		justifyContent: "center",
		alignItems: "center",
	},
	header: {
		backgroundColor: "#FFFFFF",
		paddingHorizontal: 24,
		paddingTop: 16,
		paddingBottom: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
	},
	title: { fontSize: 24, fontWeight: "600", color: "#111827", marginBottom: 4 },
	subtitle: { color: "#6B7280", fontSize: 14 },
	content: {
		paddingHorizontal: 24,
		paddingTop: 16,
		paddingBottom: 24,
		gap: 24,
	},
	banner: {
		backgroundColor: "#ECFEFF",
		borderColor: "#CFFAFE",
		borderWidth: 1,
		padding: 12,
		borderRadius: 16,
		flexDirection: "row",
		gap: 8,
	},
	bannerIcon: { fontSize: 16 },
	bannerText: { flex: 1, color: "#0E7490", fontSize: 14 },
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 12,
	},
	sectionTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
	plusBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: "#ECFDF5",
		borderWidth: 1,
		borderColor: "#A7F3D0",
	},
	plusBtnText: { color: "#0F766E", fontWeight: "600", fontSize: 14 },

	// wrapper to allow absolute delete button
	cardWrapper: {
		position: "relative",
	},

	card: {
		borderRadius: 20,
		padding: 20,
		shadowColor: "#000",
		shadowOpacity: 0.15,
		shadowRadius: 8,
		marginBottom: 8,
	},
	deleteBtn: {
		position: "absolute",
		right: 16,
		bottom: 16,
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "rgba(255,255,255,0.35)",
		justifyContent: "center",
		alignItems: "center",
	},

	cardTop: {
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-between",
		marginBottom: 24,
	},
	cardBrand: { color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 4 },
	cardNumber: { color: "#fff", fontSize: 18, fontWeight: "600" },
	cardStats: { flexDirection: "row", gap: 32 },
	statLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginBottom: 4 },
	statValue: { color: "#fff", fontSize: 18, fontWeight: "600" },
	cardInfo: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		padding: 16,
		marginTop: -12,
		borderWidth: 1,
		borderColor: "#F3F4F6",
		shadowColor: "#000",
		shadowOpacity: 0.05,
		shadowRadius: 6,
	},
	rowBetween: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 10,
	},
	rowCenter: { flexDirection: "row", alignItems: "center" },
	rewardsText: { color: "#374151", fontSize: 14 },
	dueText: { color: "#4B5563", fontSize: 14 },
	chipsWrap: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginBottom: 10,
	},
	chip: {
		backgroundColor: "#F3F4F6",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 999,
	},
	chipText: { color: "#374151", fontSize: 12 },
	payBtn: {
		backgroundColor: "#0D9488",
		paddingVertical: 10,
		borderRadius: 10,
		alignItems: "center",
	},
	payBtnText: { color: "#fff", fontWeight: "600" },
	recBox: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	recRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: 16,
	},
	recRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
	recCategory: {
		fontWeight: "600",
		color: "#111827",
		marginBottom: 2,
		fontSize: 14,
	},
	recSub: { color: "#6B7280", fontSize: 12 },
	rewardPill: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 10,
		paddingVertical: 6,
		backgroundColor: "#ECFDF5",
		borderRadius: 999,
	},
	rewardPillText: { color: "#15803D", fontWeight: "600", fontSize: 12 },
	totalBox: {
		backgroundColor: "#ECFDF5",
		borderColor: "#D1FAE5",
		borderWidth: 1,
		borderRadius: 16,
		padding: 20,
	},
	totalTitle: {
		fontWeight: "600",
		color: "#111827",
		marginBottom: 6,
		fontSize: 16,
	},
	totalValue: {
		fontSize: 32,
		fontWeight: "700",
		color: "#111827",
		marginBottom: 4,
	},
	totalSub: { color: "#6B7280", marginBottom: 12, fontSize: 14 },
	redeemBtn: {
		backgroundColor: "#0D9488",
		paddingVertical: 14,
		borderRadius: 14,
		alignItems: "center",
	},
	redeemBtnText: { color: "#fff", fontWeight: "700" },
	emptyState: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		marginTop: 100,
	},
	emptyStateText: {
		fontSize: 18,
		fontWeight: "600",
		color: "#1F2937",
		marginBottom: 8,
	},
	emptyStateSubtext: {
		fontSize: 14,
		color: "#0D9488",
		textAlign: "center",
		textDecorationLine: "underline",
	},
	linkButton: {
		padding: 8,
	},
	utilizationContainer: {
		marginTop: 16,
	},
	utilizationBarContainer: {
		height: 6,
		backgroundColor: "rgba(255, 255, 255, 0.2)",
		borderRadius: 3,
		overflow: "hidden",
		marginTop: 8,
	},
	utilizationBar: {
		height: "100%",
		borderRadius: 3,
	},
	utilizationText: {
		color: "#FFFFFF",
		fontSize: 12,
		marginTop: 4,
		textAlign: "right",
	},
});
