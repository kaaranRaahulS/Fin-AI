import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
	Alert,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";

type Item = {
	icon: keyof typeof Feather.glyphMap;
	label: string;
	value?: string;
	onPress?: () => void;
};

// If you have an env var for your API, swap this:
const API_BASE_URL = "http://localhost:8000";

export default function SettingsScreen() {
	const { user, logout } = useAuth();
	const router = useRouter();

	const confirmLogout = () => {
		Alert.alert(
			"Sign Out",
			"Are you sure you want to sign out?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Yes, Sign Out",
					style: "destructive",
					onPress: async () => {
						await logout(); // clears storage + context
						router.replace("/login"); // jump out of tabs
					},
				},
			],
			{ cancelable: true }
		);
	};

	const handleDeleteData = async () => {
		try {
			let USER_ID = user?.id ?? '693a0451e654cdaccbb42d26';
			const res = await axios.post(`${API_BASE_URL}/api/settings/delete-data`, { userId: USER_ID })
			if (res.status != 200) {
				const text = await res.data.message;
				throw new Error(text || "Failed to delete data");
			}

			Alert.alert("Success", "Account data deleted successfully");
		} catch (err: any) {
			Alert.alert("Error", "Failed to delete data!! Please try again");

		}
	};

	const confirmDeleteData = () => {
		Alert.alert(
			"Delete all data",
			"This will permanently delete all your data. This action cannot be undone.\n\nAre you sure?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Yes, delete everything",
					style: "destructive",
					onPress: handleDeleteData,
				},
			],
			{ cancelable: true }
		);
	};

	const handleDeleteAccount = async () => {
		try {
			let USER_ID = user?.id ?? '693a0451e654cdaccbb42d26';
			const res = await axios.post(`${API_BASE_URL}/api/settings/delete-account`, { userId: USER_ID })
			if (res.status != 200) {
				const text = await res.data.message;
				throw new Error(text || "Failed to delete account");
			}
			Alert.alert("Success", "Account deleted and navigate to login");

			// Clear local auth + go to login
			await logout();
			router.replace("/login");
		} catch (err: any) {
			Alert.alert("Error", "Failed to delete account!! Please try again");

		}
	};

	const confirmDeleteAccount = () => {
		Alert.alert(
			"Delete Account",
			"This will permanently delete your account and all associated data. This action cannot be undone.\n\nAre you absolutely sure?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Yes, delete my account",
					style: "destructive",
					onPress: handleDeleteAccount,
				},
			],
			{ cancelable: true }
		);
	};

	const sections: { title: string; items: Item[] }[] = [
		{
			title: "Account",
			items: [
				{
					icon: "user",
					label: "Profile Information",
					value: user?.name ?? "—",
				},
				{
					icon: "credit-card",
					label: "Linked Accounts",
					value: "12 banks connected",
				},
				{ icon: "bell", label: "Notifications", value: "Enabled" },
			],
		},
		{
			title: "Security",
			items: [
				{ icon: "lock", label: "Change Password" },
				{
					icon: "trash-2", // Feather doesn't have "delete"
					label: "Delete all the data",
					onPress: confirmDeleteData,
				},
				{
					icon: "trash-2",
					label: "Delete Account",
					onPress: confirmDeleteAccount,
				},
			],
		},
		{
			title: "Support",
			items: [
				{ icon: "help-circle", label: "Help Center" },
				{ icon: "shield", label: "Privacy Policy" },
				{ icon: "file-text", label: "Terms of Service" },
			],
		},
	];

	return (
		<SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
			{/* Header */}
			<View style={styles.headerWrap}>
				<Text style={styles.headerTitle}>Settings</Text>
				<Text style={styles.headerSubtitle}>
					Manage your account and preferences
				</Text>
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{/* Profile Card */}
				<LinearGradient
					colors={["#14b8a6", "#0ea5e9"]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={styles.profileCard}
				>
					<View style={styles.profileRow}>
						<View style={styles.avatar}>
							<Text style={{ fontSize: 28 }}>👩</Text>
						</View>
						<View style={{ flex: 1 }}>
							<Text style={styles.profileName}>{user?.name ?? "Sarah T"}</Text>
							<Text style={styles.profileEmail}>{user?.email ?? "saraht@gmail.com"}</Text>
						</View>
					</View>

					<Pressable
						style={({ pressed }) => [
							styles.profileBtn,
							pressed && { opacity: 0.9 },
						]}
					>
						<Text style={styles.profileBtnText}>View Profile</Text>
					</Pressable>
				</LinearGradient>

				{/* Settings Sections */}
				{sections.map((section, sIdx) => (
					<View key={sIdx} style={{ marginBottom: 18 }}>
						<Text style={styles.sectionTitle}>{section.title}</Text>

						<View style={styles.sectionCard}>
							{section.items.map((item, iIdx) => {
								const isLast = iIdx === section.items.length - 1;
								return (
									<Pressable
										key={`${section.title}-${iIdx}`}
										style={({ pressed }) => [
											styles.row,
											!isLast && styles.rowDivider,
											pressed && { backgroundColor: "#f8fafc" },
										]}
										onPress={item.onPress}
									>
										<View style={styles.rowIconWrap}>
											<Feather name={item.icon} size={20} color="#475569" />
										</View>

										<View style={styles.rowTextWrap}>
											<Text style={styles.rowLabel}>{item.label}</Text>
											{!!item.value && (
												<Text style={styles.rowValue}>{item.value}</Text>
											)}
										</View>

										<Feather name="chevron-right" size={20} color="#94a3b8" />
									</Pressable>
								);
							})}
						</View>
					</View>
				))}

				{/* Security Notice */}
				<View style={styles.noticeCard}>
					<View style={styles.noticeIconWrap}>
						<Feather name="shield" size={20} color="#fff" />
					</View>
					<View style={{ flex: 1 }}>
						<Text style={styles.noticeTitle}>Security Notice</Text>
						<Text style={styles.noticeBody}>
							Your data is encrypted with bank-level security. We never store
							your login credentials.
						</Text>
						<Text style={styles.noticeLink}>Learn More →</Text>
					</View>
				</View>

				{/* Logout with confirmation */}
				<Pressable
					onPress={confirmLogout}
					style={({ pressed }) => [
						styles.logoutBtn,
						pressed && { opacity: 0.9 },
					]}
				>
					<Feather name="log-out" size={18} color="#dc2626" />
					<Text style={styles.logoutText}>Sign Out</Text>
				</Pressable>

				{/* Footer */}
				<View style={styles.footer}>
					<Text style={styles.footerText}>Fin-AI v1.0.0</Text>
					<Text style={styles.footerText}>
						© 2024 Fin-AI. All rights reserved.
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: "#f8fafc" },
	headerWrap: {
		backgroundColor: "#fff",
		paddingHorizontal: 20,
		paddingTop: 12,
		paddingBottom: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#f1f5f9",
	},
	headerTitle: { fontSize: 22, fontWeight: "700", color: "#0f172a" },
	headerSubtitle: { color: "#475569", marginTop: 2 },
	content: { padding: 20, paddingBottom: 28 },
	profileCard: {
		borderRadius: 18,
		padding: 16,
		marginBottom: 18,
	},
	profileRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
	avatar: {
		width: 64,
		height: 64,
		borderRadius: 9999,
		backgroundColor: "rgba(255,255,255,0.25)",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	profileName: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "700",
		marginBottom: 2,
	},
	profileEmail: { color: "rgba(255,255,255,0.85)" },
	profileBtn: {
		backgroundColor: "rgba(255,255,255,0.25)",
		height: 44,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	profileBtnText: { color: "#fff", fontWeight: "700" },
	sectionTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: "#0f172a",
		marginBottom: 8,
	},
	sectionCard: {
		backgroundColor: "#fff",
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#f1f5f9",
		overflow: "hidden",
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 14,
		paddingHorizontal: 14,
	},
	rowDivider: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
	rowIconWrap: {
		width: 40,
		height: 40,
		borderRadius: 12,
		backgroundColor: "#f1f5f9",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	rowTextWrap: { flex: 1 },
	rowLabel: {
		color: "#0f172a",
		marginBottom: 2,
		fontWeight: Platform.select({
			ios: "600",
			android: "700",
			default: "600",
		}),
	},
	rowValue: { color: "#64748b", fontSize: 12 },
	noticeCard: {
		backgroundColor: "#eff6ff",
		borderColor: "#dbeafe",
		borderWidth: 1,
		borderRadius: 16,
		padding: 14,
		flexDirection: "row",
		gap: 12,
		alignItems: "flex-start",
		marginTop: 4,
	},
	noticeIconWrap: {
		width: 40,
		height: 40,
		borderRadius: 12,
		backgroundColor: "#3b82f6",
		alignItems: "center",
		justifyContent: "center",
	},
	noticeTitle: { color: "#0f172a", fontWeight: "700", marginBottom: 4 },
	noticeBody: { color: "#475569", lineHeight: 20, marginBottom: 8 },
	noticeLink: { color: "#2563eb", fontWeight: "600" },
	logoutBtn: {
		marginTop: 16,
		backgroundColor: "#fef2f2",
		borderColor: "#fee2e2",
		borderWidth: 1,
		borderRadius: 14,
		height: 52,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 8,
	},
	logoutText: { color: "#dc2626", fontWeight: "700" },
	footer: { alignItems: "center", marginTop: 18, gap: 2, marginBottom: 12 },
	footerText: { color: "#94a3b8", fontSize: 12 },
});
