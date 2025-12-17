import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	StyleSheet,
	Switch,
	Text,
	TextInput,
	View,
} from "react-native";
import FinAICard from "../components/FinAICard";
import { useAuth } from "../contexts/AuthContext";

// Optional: persist token securely
// import * as SecureStore from "expo-secure-store";

const API_BASE = "http://localhost:8000"; // iOS simulator

export default function Login() {
	const { login } = useAuth(); // this sets your in-memory auth state
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [remember, setRemember] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async () => {
		console.log(email, password);
		if (!email || !password) {
			Alert.alert("Missing fields", "Please enter email and password.");
			return;
		}

		setIsLoading(true);
		try {
			console.log("before fetch", email, password);
			const res = await fetch(`${API_BASE}/api/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			const data: any = await res.json().catch(() => ({}));
			console.log("response:", data);

			if (res.status !== 200) {
				const msg =
					data?.message ||
					data?.error ||
					(Array.isArray(data?.errors) ? data.errors.join("\n") : null) ||
					"Invalid credentials. Please try again.";
				throw new Error(msg);
			}

			// ✅ Extract user and token (if any)
			const user = data?.user;
			const token = data?.token || null;

			if (!user) throw new Error("Login response missing user info.");

			await login(user, token ?? null, remember);

			// Navigation happens automatically since _layout checks `user`
			router.replace("/(tabs)");
		} catch (err: any) {
			Alert.alert("Sign in failed", err?.message ?? "Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<LinearGradient
			colors={["#14b8a6", "#3b82f6", "#7c3aed"]}
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
			style={styles.gradient}
		>
			<View style={styles.wrap}>
				{/* Logo & Heading */}
				<View style={styles.header}>
					<View style={styles.logoBox}>
						{/* <Image source={require("../assets/images/logo.png")} style={styles.logoImg} /> */}
						<Feather name="star" size={40} color="#0f766e" />
					</View>
					<Text style={styles.title}>Welcome to Fin-AI</Text>
					<Text style={styles.subtitle}>
						Your AI Personal Finance Assistant
					</Text>
				</View>

				{/* Login form */}
				<FinAICard>
					{/* Email */}
					<View style={styles.fieldWrap}>
						<Text style={styles.label}>Email Address</Text>
						<View style={styles.inputRow}>
							<Feather
								name="mail"
								size={20}
								color="#9ca3af"
								style={styles.leftIcon}
							/>
							<TextInput
								placeholder="your.email@example.com"
								placeholderTextColor="#9ca3af"
								autoCapitalize="none"
								keyboardType="email-address"
								value={email}
								onChangeText={setEmail}
								style={[styles.input, { paddingLeft: 40 }]}
							/>
						</View>
					</View>

					{/* Password */}
					<View style={styles.fieldWrap}>
						<Text style={styles.label}>Password</Text>
						<View style={styles.inputRow}>
							<Feather
								name="lock"
								size={20}
								color="#9ca3af"
								style={styles.leftIcon}
							/>
							<TextInput
								placeholder="Enter your password"
								placeholderTextColor="#9ca3af"
								secureTextEntry={!showPassword}
								value={password}
								onChangeText={setPassword}
								style={[styles.input, { paddingLeft: 40, paddingRight: 40 }]}
							/>
							<Pressable
								accessibilityLabel={
									showPassword ? "Hide password" : "Show password"
								}
								onPress={() => setShowPassword((s) => !s)}
								style={styles.rightIconBtn}
							>
								<Feather
									name={showPassword ? "eye-off" : "eye"}
									size={20}
									color="#6b7280"
								/>
							</Pressable>
						</View>
					</View>

					{/* Helpers */}
					<View style={styles.helpersRow}>
						<View style={styles.rememberRow}>
							<Switch value={remember} onValueChange={setRemember} />
							<Text style={styles.rememberText}>Remember me</Text>
						</View>

						<Pressable
							onPress={() =>
								Alert.alert("Forgot password", "Hook up your flow here.")
							}
						>
							<Text style={styles.forgot}>Forgot password?</Text>
						</Pressable>
					</View>

					{/* Submit */}
					<Pressable
						onPress={handleSubmit}
						disabled={isLoading}
						style={({ pressed }) => [
							styles.submitBtn,
							pressed && { opacity: 0.85 },
							isLoading && { opacity: 0.7 },
						]}
					>
						{isLoading ? (
							<ActivityIndicator />
						) : (
							<Text style={styles.submitText}>Sign In</Text>
						)}
					</Pressable>
				</FinAICard>

				{/* Register */}
				<View style={styles.registerWrap}>
					<Text style={styles.registerText}>
						Don&apos;t have an account?{" "}
						<Link href="/register" style={styles.registerLink}>
							Create Account
						</Link>
					</Text>
				</View>

				{/* Features card */}
				<FinAICard variant="glass">
					<View style={styles.features}>
						<Text style={styles.featureLine}>✓ Bank-level encryption</Text>
						<Text style={styles.featureLine}>✓ AI-powered insights</Text>
						<Text style={styles.featureLine}>✓ Smart budget tracking</Text>
						<Text style={styles.featureLine}>✓ Family finance management</Text>
					</View>
				</FinAICard>
			</View>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	gradient: { flex: 1 },
	wrap: { flex: 1, padding: 24, justifyContent: "center" },

	header: { alignItems: "center", marginBottom: 18 },
	logoBox: {
		width: 80,
		height: 80,
		borderRadius: 24,
		backgroundColor: "white",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
		shadowColor: "#000",
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	logoImg: { width: 44, height: 44, resizeMode: "contain" },
	title: { color: "white", fontSize: 26, fontWeight: "700" },
	subtitle: { color: "rgba(255,255,255,0.85)", marginTop: 6 },

	fieldWrap: { marginBottom: 14 },
	label: { color: "#0f172a", fontWeight: "600", marginBottom: 6, opacity: 0.9 },
	inputRow: { position: "relative" },
	input: {
		height: 48,
		borderWidth: 1,
		borderColor: "#e5e7eb",
		borderRadius: 12,
		backgroundColor: "white",
		paddingHorizontal: 12,
		fontSize: 16,
	},
	leftIcon: { position: "absolute", left: 12, top: 14 },
	rightIconBtn: { position: "absolute", right: 12, top: 14, padding: 4 },

	helpersRow: {
		marginTop: 4,
		marginBottom: 14,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	rememberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
	rememberText: { color: "#475569", marginLeft: 8 },
	forgot: { color: "#0ea5e9", fontWeight: "600" },

	submitBtn: {
		height: 52,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#2563eb",
	},
	submitText: { color: "white", fontWeight: "700", fontSize: 16 },

	registerWrap: { alignItems: "center", marginTop: 14 },
	registerText: { color: "rgba(255,255,255,0.95)" },
	registerLink: { color: "white", textDecorationLine: "underline" },

	features: { gap: 4 },
	featureLine: { color: "white", opacity: 0.95 },
});
//------------------------------------------------------//

// import React, { useState, useCallback } from "react";
// import {
//   View,
//   Text,
//   Button,
//   Alert,
//   ScrollView,
//   StyleSheet,
// } from "react-native";
// import {
//   create,
//   open,
//   dismissLink,
//   usePlaidEmitter,
//   LinkOpenProps,
//   LinkSuccess,
//   LinkExit,
//   LinkLogLevel,
//   LinkIOSPresentationStyle,
// } from "react-native-plaid-link-sdk";
// import axios from "axios";
// import { useRouter } from "expo-router";

// const API_BASE_URL = "http://10.0.2.2:3333"; // Your backend

// export default function PlaidIntegrationScreen() {
//   const router = useRouter();

//   const [linkToken, setLinkToken] = useState<string | null>(null);
//   const [accessToken, setAccessToken] = useState<string | null>(null);
//   const [transactions, setTransactions] = useState<string>(
//     "No transactions fetched."
//   );

//   // --- 1. Create Link Token ---
//   const createLinkToken = useCallback(async () => {
//     try {
//       const resp = await axios.post(`${API_BASE_URL}/create_link_token`);
//       const lt = resp.data.link_token;
//       setLinkToken(lt);

//       // Preload Link UI for better performance
//       create({ token: lt, noLoadingState: false });
//     } catch (error) {
//       console.error("Error creating link token", error);
//       Alert.alert("Error", "Could not get Plaid link token.");
//     }
//   }, []);

//   // --- 2. Exchange Public Token for Access Token ---
//   const exchangePublicToken = useCallback(
//     async (publicToken: string) => {
//       try {
//         const resp = await axios.post(`${API_BASE_URL}/get_access_token`, {
//           publicToken,
//         });
//         const token = resp.data.accessToken;
//         setAccessToken(token);
//         Alert.alert("Success", "Bank account linked!");
//       } catch (error) {
//         console.error("Error exchanging public token", error);
//         Alert.alert("Error", "Could not exchange public token.");
//       }
//     },
//     []
//   );

//   // --- 3. Fetch Transactions ---
//   const fetchTransactions = useCallback(async () => {
//     if (!accessToken) {
//       Alert.alert("Error", "You must link an account first.");
//       return;
//     }
//     try {
//       const resp = await axios.post(`${API_BASE_URL}/get_transactions`, {
//         token: accessToken,
//       });
//       setTransactions(JSON.stringify(resp.data.transactions, null, 2));
//     } catch (error) {
//       console.error("Error fetching transactions", error);
//       setTransactions("Error fetching transactions.");
//     }
//   }, [accessToken]);

//   // --- 4. Plaid Event Listener (Optional) ---
//   usePlaidEmitter((event) => {
//     console.log("Plaid event:", event);
//   });

//   // --- 5. Open Plaid Link ---
//   const handleOpen = useCallback(() => {
//     if (!linkToken) {
//       Alert.alert("Error", "Link token is not set. Generate it first.");
//       return;
//     }

//     const openProps: LinkOpenProps = {
//       onSuccess: (success: LinkSuccess) => {
//         exchangePublicToken(success.publicToken);
//       },
//       onExit: (exit: LinkExit) => {
//         if (exit.error) {
//           console.error("Link exit error", exit.error);
//           Alert.alert(
//             "Link Exit",
//             exit.error.displayMessage ?? exit.error.errorType ?? "Unknown error"
//           );
//         }
//         dismissLink();
//       },
//       logLevel: LinkLogLevel.ERROR,
//       iOSPresentationStyle: LinkIOSPresentationStyle.MODAL,
//     };

//     open(openProps);
//   }, [linkToken, exchangePublicToken]);

//   // --- 6. Example Navigation Button ---
//   const goBackHome = () => {
//     router.push("/"); // navigate to home or any route
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.header}>Plaid Integration (SDK 12.7.0)</Text>

//       <Button title="1. Create Link Token" onPress={createLinkToken} />
//       <Text style={styles.status}>
//         Link Token: {linkToken ? "✅ Ready" : "❌ Not Ready"}
//       </Text>

//       <Button title="2. Open Plaid Link" onPress={handleOpen} disabled={!linkToken} />

//       <View style={styles.separator} />

//       <Button
//         title="3. Fetch Transactions"
//         onPress={fetchTransactions}
//         disabled={!accessToken}
//       />
//       <Text style={styles.status}>
//         Access Token: {accessToken ? "✅ Set" : "❌ Not Set"}
//       </Text>

//       <View style={styles.separator} />

//       <Button title="Go Home" onPress={goBackHome} color="#2563eb" />

//       <Text style={styles.transactionsHeader}>Transactions:</Text>
//       <ScrollView style={styles.transactionsContainer}>
//         <Text style={styles.transactionsText}>{transactions}</Text>
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 20, backgroundColor: "#F5F5F5" },
//   header: { fontSize: 24, fontWeight: "700", marginBottom: 30, textAlign: "center" },
//   status: { marginVertical: 10, textAlign: "center", color: "#333" },
//   separator: { height: 1, backgroundColor: "#ccc", marginVertical: 20 },
//   transactionsHeader: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
//   transactionsContainer: {
//     flex: 1,
//     backgroundColor: "#FFF",
//     padding: 10,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "#DDD",
//   },
//   transactionsText: { fontSize: 12, fontFamily: "Courier" },
// });
