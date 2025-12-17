import React, { useState } from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type FormState = {
	cardNumber: string;
	cardName: string;
	expiryDate: string; // MM/YY
	cvv: string;
};

export default function AddCardScreen() {
	const router = useRouter();
	const [form, setForm] = useState<FormState>({
		cardNumber: "",
		cardName: "",
		expiryDate: "",
		cvv: "",
	});

	// group digits as #### #### #### ####
	const formatCardNumber = (val: string) =>
		val
			.replace(/\D/g, "")
			.slice(0, 16)
			.replace(/(\d{4})(?=\d)/g, "$1 ");

	const formatExpiry = (val: string) => {
		const digits = val.replace(/\D/g, "").slice(0, 4);
		if (digits.length <= 2) return digits;
		return `${digits.slice(0, 2)}/${digits.slice(2)}`;
	};

	const handleSubmit = () => {
		// very light validation
		const rawCard = form.cardNumber.replace(/\s/g, "");
		if (rawCard.length < 16)
			return Alert.alert("Invalid card", "Enter a 16-digit card number.");
		if (!form.cardName.trim())
			return Alert.alert("Missing name", "Enter the cardholder name.");
		if (!/^\d{2}\/\d{2}$/.test(form.expiryDate))
			return Alert.alert("Invalid expiry", "Use MM/YY.");
		if (form.cvv.length < 3)
			return Alert.alert("Invalid CVV", "Enter the 3-digit CVV.");

		Alert.alert("Success", "Card added successfully!", [
			{ text: "OK", onPress: () => router.back() },
		]);
	};

	return (
		<SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<ScrollView
					contentContainerStyle={styles.container}
					keyboardShouldPersistTaps="handled"
				>
					{/* Back */}
					<Pressable onPress={() => router.back()} style={styles.backBtn}>
						<Feather name="arrow-left" size={18} color="#0d9488" />
						<Text style={styles.backText}>Back</Text>
					</Pressable>

					<Text style={styles.title}>Add Credit Card</Text>

					{/* Card surface */}
					<View style={styles.card}>
						{/* Card Number */}
						<View style={styles.field}>
							<Text style={styles.label}>Card Number</Text>
							<TextInput
								placeholder="1234 5678 9012 3456"
								placeholderTextColor="#94a3b8"
								value={form.cardNumber}
								onChangeText={(t) =>
									setForm((f) => ({ ...f, cardNumber: formatCardNumber(t) }))
								}
								style={styles.input}
								keyboardType="number-pad"
								autoCapitalize="none"
								autoCorrect={false}
								autoComplete="off"
								textContentType="none"
								maxLength={19} // 16 + 3 spaces
							/>
						</View>

						{/* Cardholder Name */}
						<View style={styles.field}>
							<Text style={styles.label}>Cardholder Name</Text>
							<TextInput
								placeholder="John Doe"
								placeholderTextColor="#94a3b8"
								value={form.cardName}
								onChangeText={(t) => setForm((f) => ({ ...f, cardName: t }))}
								style={styles.input}
								autoCapitalize="words"
							/>
						</View>

						{/* Expiry + CVV */}
						<View style={styles.row2}>
							<View style={{ flex: 1 }}>
								<Text style={styles.label}>Expiry Date</Text>
								<TextInput
									placeholder="MM/YY"
									placeholderTextColor="#94a3b8"
									value={form.expiryDate}
									onChangeText={(t) =>
										setForm((f) => ({ ...f, expiryDate: formatExpiry(t) }))
									}
									style={styles.input}
									keyboardType="number-pad"
									autoCapitalize="none"
									maxLength={5}
								/>
							</View>
							<View style={{ width: 12 }} />
							<View style={{ flex: 1 }}>
								<Text style={styles.label}>CVV</Text>
								<TextInput
									placeholder="123"
									placeholderTextColor="#94a3b8"
									value={form.cvv}
									onChangeText={(t) =>
										setForm((f) => ({
											...f,
											cvv: t.replace(/\D/g, "").slice(0, 3),
										}))
									}
									style={styles.input}
									keyboardType="number-pad"
									autoCapitalize="none"
									secureTextEntry
									maxLength={3}
								/>
							</View>
						</View>

						{/* Submit */}
						<Pressable
							onPress={handleSubmit}
							style={({ pressed }) => [
								styles.ctaWrap,
								pressed && { opacity: 0.9 },
							]}
						>
							<LinearGradient
								colors={["#0f766e", "#0d9488"]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={styles.cta}
							>
								<Feather name="credit-card" size={18} color="#fff" />
								<Text style={styles.ctaText}>Add Card</Text>
							</LinearGradient>
						</Pressable>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: "#f1f5f9" }, // slate-100
	container: { padding: 20, paddingBottom: 24 },
	backBtn: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
	backText: { color: "#0d9488", marginLeft: 8, fontWeight: "600" },
	title: {
		fontSize: 22,
		fontWeight: "800",
		color: "#0f172a",
		marginBottom: 14,
	},

	card: {
		backgroundColor: "#fff",
		borderRadius: 24,
		padding: 16,
		borderWidth: 1,
		borderColor: "#e2e8f0",
		shadowColor: "#000",
		shadowOpacity: 0.08,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 4 },
		elevation: 4,
	},

	field: { marginBottom: 14 },
	label: { color: "#334155", fontSize: 13, marginBottom: 8, fontWeight: "600" },
	input: {
		height: 48,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#e5e7eb",
		backgroundColor: "#f8fafc",
		paddingHorizontal: 14,
		color: "#0f172a",
		fontSize: 16,
	},

	row2: { flexDirection: "row", alignItems: "flex-start", marginTop: 2 },

	ctaWrap: { marginTop: 10 },
	cta: {
		height: 56,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 8,
	},
	ctaText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
