// import { Feather } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import { Link, useRouter } from "expo-router";
// import { useState } from "react";
// import {
// 	ActivityIndicator,
// 	Alert,
// 	Linking,
// 	Platform,
// 	Pressable,
// 	StyleSheet,
// 	Switch,
// 	Text,
// 	TextInput,
// 	View,
// } from "react-native";
// import FinAICard from "../components/FinAICard";
// import { useAuth } from "../contexts/AuthContext";

// const API_BASE =
// 	Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000";

// export default function Register() {
// 	const router = useRouter();
// 	const { register } = useAuth(); // register(user, token?)
// 	const [firstName, setFirstName] = useState("");
// 	const [lastName, setLastName] = useState("");
// 	const [email, setEmail] = useState("");
// 	const [phone, setPhone] = useState("");
// 	const [password, setPassword] = useState("");
// 	const [confirmPassword, setConfirmPassword] = useState("");

// 	const [showPassword, setShowPassword] = useState(false);
// 	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
// 	const [isLoading, setIsLoading] = useState(false);
// 	const [agree, setAgree] = useState(false);

// 	const validate = () => {
// 		if (
// 			!firstName ||
// 			!lastName ||
// 			!email ||
// 			!phone ||
// 			!password ||
// 			!confirmPassword
// 		) {
// 			Alert.alert("Missing fields", "Please fill out all fields.");
// 			return false;
// 		}
// 		if (password !== confirmPassword) {
// 			Alert.alert("Passwords do not match", "Please re-enter the passwords.");
// 			return false;
// 		}
// 		if (!agree) {
// 			Alert.alert(
// 				"Terms required",
// 				"Please agree to the Terms and Privacy Policy."
// 			);
// 			return false;
// 		}
// 		return true;
// 	};

// 	const handleSubmit = async () => {
// 		if (!validate()) return;

// 		setIsLoading(true);
// 		try {
// 			const res = await fetch(`${API_BASE}/api/auth/register`, {
// 				method: "POST",
// 				headers: { "Content-Type": "application/json" },
// 				body: JSON.stringify({
// 					firstName,
// 					lastName,
// 					email,
// 					phone,
// 					password,
// 					confirmPassword,
// 				}),
// 			});

// 			const data: any = await res.json().catch(() => ({}));
// 			console.log(res);
// 			if (res.status !== 200) {
// 				const msg =
// 					data?.message ||
// 					data?.error ||
// 					(Array.isArray(data?.errors) ? data.errors.join("\n") : null) ||
// 					"Registration failed. Please try again.";
// 				throw new Error(msg);
// 			}

// 			// Adapt to your API shape; adjust if different:
// 			// expect: { user: {id,name,email}, token?: string }
// 			const apiUser = data?.user ?? {
// 				id: data?.id ?? "temp",
// 				name: `${firstName} ${lastName}`.trim(),
// 				email,
// 			};
// 			const token = data?.token ?? null;

// 			// If you kept token?: string, avoid passing null:
// 			// register(apiUser, token ?? undefined);
// 			await register(apiUser, token ?? null, true /* or your checkbox state */);

// 			router.replace("/plaid");
// 		} catch (err: any) {
// 			Alert.alert("Registration failed", err?.message ?? "Please try again.");
// 		} finally {
// 			setIsLoading(false);
// 		}
// 	};

// 	return (
// 		<LinearGradient
// 			colors={["#7c3aed", "#3b82f6", "#14b8a6"]}
// 			start={{ x: 0, y: 0 }}
// 			end={{ x: 1, y: 1 }}
// 			style={styles.gradient}
// 		>
// 			<View style={styles.wrap}>
// 				{/* Header */}
// 				<View style={styles.header}>
// 					<View style={styles.logoBox}>
// 						<Feather name="star" size={40} color="#6d28d9" />
// 					</View>
// 					<Text style={styles.title}>Create Your Account</Text>
// 					<Text style={styles.subtitle}>Start your smart finance journey</Text>
// 				</View>

// 				<FinAICard>
// 					{/* First / Last */}
// 					<View style={styles.row2}>
// 						<View style={[styles.fieldWrap, { flex: 1, marginRight: 6 }]}>
// 							<Text style={styles.label}>First Name</Text>
// 							<View style={styles.inputRow}>
// 								<Feather
// 									name="user"
// 									size={20}
// 									color="#9ca3af"
// 									style={styles.leftIcon}
// 								/>
// 								<TextInput
// 									placeholder="Alex"
// 									placeholderTextColor="#9ca3af"
// 									value={firstName}
// 									onChangeText={setFirstName}
// 									style={[styles.input, { paddingLeft: 40 }]}
// 									autoCapitalize="words"
// 									autoComplete="off"
// 								/>
// 							</View>
// 						</View>
// 						<View style={[styles.fieldWrap, { flex: 1, marginLeft: 6 }]}>
// 							<Text style={styles.label}>Last Name</Text>
// 							<View style={styles.inputRow}>
// 								<Feather
// 									name="user"
// 									size={20}
// 									color="#9ca3af"
// 									style={styles.leftIcon}
// 								/>
// 								<TextInput
// 									placeholder="Morgan"
// 									placeholderTextColor="#9ca3af"
// 									value={lastName}
// 									onChangeText={setLastName}
// 									style={[styles.input, { paddingLeft: 40 }]}
// 									autoCapitalize="words"
// 									autoComplete="off"
// 								/>
// 							</View>
// 						</View>
// 					</View>

// 					{/* Email */}
// 					<View style={styles.fieldWrap}>
// 						<Text style={styles.label}>Email Address</Text>
// 						<View style={styles.inputRow}>
// 							<Feather
// 								name="mail"
// 								size={20}
// 								color="#9ca3af"
// 								style={styles.leftIcon}
// 							/>
// 							<TextInput
// 								placeholder="your.email@example.com"
// 								placeholderTextColor="#9ca3af"
// 								value={email}
// 								onChangeText={setEmail}
// 								style={[styles.input, { paddingLeft: 40 }]}
// 								autoCapitalize="none"
// 								keyboardType="email-address"
// 								autoComplete="off"
// 							/>
// 						</View>
// 					</View>

// 					{/* Phone */}
// 					<View style={styles.fieldWrap}>
// 						<Text style={styles.label}>Phone Number</Text>
// 						<View style={styles.inputRow}>
// 							<Feather
// 								name="phone"
// 								size={20}
// 								color="#9ca3af"
// 								style={styles.leftIcon}
// 							/>
// 							<TextInput
// 								placeholder="+1 (555) 123-4567"
// 								placeholderTextColor="#9ca3af"
// 								value={phone}
// 								onChangeText={setPhone}
// 								style={[styles.input, { paddingLeft: 40 }]}
// 								keyboardType="phone-pad"
// 								autoComplete="off"
// 							/>
// 						</View>
// 					</View>

// 					{/* Password */}
// 					<View style={styles.fieldWrap}>
// 						<Text style={styles.label}>Password</Text>
// 						<View style={styles.inputRow}>
// 							<Feather
// 								name="lock"
// 								size={20}
// 								color="#9ca3af"
// 								style={styles.leftIcon}
// 							/>
// 							<TextInput
// 								placeholder="Create a strong password"
// 								placeholderTextColor="#9ca3af"
// 								secureTextEntry={!showPassword}
// 								value={password}
// 								onChangeText={setPassword}
// 								autoComplete="off"
// 								style={[styles.input, { paddingLeft: 40, paddingRight: 40 }]}
// 							/>
// 							<Pressable
// 								onPress={() => setShowPassword((s) => !s)}
// 								style={styles.rightIconBtn}
// 							>
// 								<Feather
// 									name={showPassword ? "eye-off" : "eye"}
// 									size={20}
// 									color="#6b7280"
// 								/>
// 							</Pressable>
// 						</View>
// 					</View>

// 					{/* Confirm Password */}
// 					<View style={styles.fieldWrap}>
// 						<Text style={styles.label}>Confirm Password</Text>
// 						<View style={styles.inputRow}>
// 							<Feather
// 								name="lock"
// 								size={20}
// 								color="#9ca3af"
// 								style={styles.leftIcon}
// 							/>
// 							<TextInput
// 								placeholder="Re-enter your password"
// 								placeholderTextColor="#9ca3af"
// 								secureTextEntry={!showConfirmPassword}
// 								value={confirmPassword}
// 								onChangeText={setConfirmPassword}
// 								autoComplete="off"
// 								style={[styles.input, { paddingLeft: 40, paddingRight: 40 }]}
// 							/>
// 							<Pressable
// 								onPress={() => setShowConfirmPassword((s) => !s)}
// 								style={styles.rightIconBtn}
// 							>
// 								<Feather
// 									name={showConfirmPassword ? "eye-off" : "eye"}
// 									size={20}
// 									color="#6b7280"
// 								/>
// 							</Pressable>
// 						</View>
// 					</View>

// 					{/* Terms */}
// 					<View style={styles.termsRow}>
// 						<View style={styles.termsLeft}>
// 							<Switch value={agree} onValueChange={setAgree} />
// 							<Text style={styles.termsText}>
// 								I agree to the{" "}
// 								<Text
// 									style={styles.termsLink}
// 									onPress={() => Linking.openURL("#")}
// 								>
// 									Terms of Service
// 								</Text>{" "}
// 								and{" "}
// 								<Text
// 									style={styles.termsLink}
// 									onPress={() => Linking.openURL("#")}
// 								>
// 									Privacy Policy
// 								</Text>
// 							</Text>
// 						</View>
// 					</View>

// 					{/* Submit */}
// 					<Pressable
// 						onPress={handleSubmit}
// 						disabled={isLoading}
// 						style={({ pressed }) => [
// 							styles.submitBtn,
// 							pressed && { opacity: 0.85 },
// 							isLoading && { opacity: 0.7 },
// 						]}
// 					>
// 						{isLoading ? (
// 							<ActivityIndicator />
// 						) : (
// 							<Text style={styles.submitText}>Create Account</Text>
// 						)}
// 					</Pressable>
// 				</FinAICard>

// 				{/* Login link */}
// 				<View style={styles.loginWrap}>
// 					<Text style={styles.loginText}>
// 						Already have an account?{" "}
// 						<Link href="/login" style={styles.loginLink}>
// 							Sign In
// 						</Link>
// 					</Text>
// 				</View>
// 			</View>
// 		</LinearGradient>
// 	);
// }

// const styles = StyleSheet.create({
// 	gradient: { flex: 1 },
// 	wrap: { flex: 1, padding: 24, justifyContent: "center" },
// 	header: { alignItems: "center", marginBottom: 18 },
// 	logoBox: {
// 		width: 80,
// 		height: 80,
// 		borderRadius: 24,
// 		backgroundColor: "white",
// 		alignItems: "center",
// 		justifyContent: "center",
// 		marginBottom: 12,
// 		shadowColor: "#000",
// 		shadowOpacity: 0.1,
// 		shadowRadius: 8,
// 		elevation: 4,
// 	},
// 	title: { color: "white", fontSize: 26, fontWeight: "700" },
// 	subtitle: { color: "rgba(255,255,255,0.85)", marginTop: 6 },

// 	row2: { flexDirection: "row" },
// 	fieldWrap: { marginBottom: 14 },
// 	label: { color: "#0f172a", fontWeight: "600", marginBottom: 6, opacity: 0.9 },
// 	inputRow: { position: "relative" },
// 	input: {
// 		height: 48,
// 		borderWidth: 1,
// 		borderColor: "#e5e7eb",
// 		borderRadius: 12,
// 		backgroundColor: "white",
// 		paddingHorizontal: 12,
// 		fontSize: 16,
// 	},
// 	leftIcon: { position: "absolute", left: 12, top: 14 },
// 	rightIconBtn: { position: "absolute", right: 12, top: 14, padding: 4 },

// 	termsRow: { marginTop: 6, marginBottom: 14 },
// 	termsLeft: { flexDirection: "row", alignItems: "center" },
// 	termsText: { marginLeft: 10, color: "#475569", flexShrink: 1 },
// 	termsLink: { color: "#0ea5e9", fontWeight: "600" },

// 	submitBtn: {
// 		height: 52,
// 		borderRadius: 14,
// 		alignItems: "center",
// 		justifyContent: "center",
// 		backgroundColor: "#6d28d9",
// 	},
// 	submitText: { color: "white", fontWeight: "700", fontSize: 16 },

// 	loginWrap: { alignItems: "center", marginTop: 14 },
// 	loginText: { color: "rgba(255,255,255,0.95)" },
// 	loginLink: { color: "white", textDecorationLine: "underline" },
// });
//-----------------------------//

// app/register.tsx
// app/register.tsx
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import FinAICard from "../components/FinAICard";
import { useAuth } from "../contexts/AuthContext";

const API_BASE =
  Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000";

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agree, setAgree] = useState(false);

  const validate = () => {
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      Alert.alert("Missing fields", "Please fill out all fields.");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match", "Please re-enter the passwords.");
      return false;
    }
    if (!agree) {
      Alert.alert("Terms required", "Please agree to the Terms and Privacy Policy.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, phone, password, confirmPassword }),
      });

      const data: any = await res.json().catch(() => ({}));
      if (res.status !== 200) {
        const msg =
          data?.message ||
          data?.error ||
          (Array.isArray(data?.errors) ? data.errors.join("\n") : null) ||
          "Registration failed. Please try again.";
        throw new Error(msg);
      }

      const apiUser = data?.user ?? {
        id: data?.id ?? "temp",
        name: `${firstName} ${lastName}`.trim(),
        email,
      };
      const token = data?.token ?? null;

      await register(apiUser, token ?? null, true);

      router.push("/");
    } catch (err: any) {
      Alert.alert("Registration failed", err?.message ?? "Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#7c3aed", "#3b82f6", "#14b8a6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.wrap}>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Feather name="star" size={40} color="#6d28d9" />
          </View>
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>Start your smart finance journey</Text>
        </View>

        <FinAICard>
          {/* First + Last */}
          <View style={styles.row2}>
            <View style={[styles.fieldWrap, { flex: 1, marginRight: 6 }]}>
              <Text style={styles.label}>First Name</Text>
              <View style={styles.inputRow}>
                <Feather name="user" size={20} color="#9ca3af" style={styles.leftIcon} />
                <TextInput
                  placeholder="Alex"
                  placeholderTextColor="#9ca3af"
                  value={firstName}
                  onChangeText={setFirstName}
                  style={[styles.input, { paddingLeft: 40 }]}
                  autoCapitalize="words"
                  autoComplete="off"
                />
              </View>
            </View>
            <View style={[styles.fieldWrap, { flex: 1, marginLeft: 6 }]}>
              <Text style={styles.label}>Last Name</Text>
              <View style={styles.inputRow}>
                <Feather name="user" size={20} color="#9ca3af" style={styles.leftIcon} />
                <TextInput
                  placeholder="Morgan"
                  placeholderTextColor="#9ca3af"
                  value={lastName}
                  onChangeText={setLastName}
                  style={[styles.input, { paddingLeft: 40 }]}
                  autoCapitalize="words"
                  autoComplete="off"
                />
              </View>
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputRow}>
              <Feather name="mail" size={20} color="#9ca3af" style={styles.leftIcon} />
              <TextInput
                placeholder="your.email@example.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                style={[styles.input, { paddingLeft: 40 }]}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="off"
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputRow}>
              <Feather name="phone" size={20} color="#9ca3af" style={styles.leftIcon} />
              <TextInput
                placeholder="+1 (555) 123-4567"
                placeholderTextColor="#9ca3af"
                value={phone}
                onChangeText={setPhone}
                style={[styles.input, { paddingLeft: 40 }]}
                keyboardType="phone-pad"
                autoComplete="off"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <Feather name="lock" size={20} color="#9ca3af" style={styles.leftIcon} />
              <TextInput
                placeholder="Create a strong password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoComplete="off"
                style={[styles.input, { paddingLeft: 40, paddingRight: 40 }]}
              />
              <Pressable onPress={() => setShowPassword((s) => !s)} style={styles.rightIconBtn}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#6b7280" />
              </Pressable>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputRow}>
              <Feather name="lock" size={20} color="#9ca3af" style={styles.leftIcon} />
              <TextInput
                placeholder="Re-enter your password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoComplete="off"
                style={[styles.input, { paddingLeft: 40, paddingRight: 40 }]}
              />
              <Pressable
                onPress={() => setShowConfirmPassword((s) => !s)}
                style={styles.rightIconBtn}
              >
                <Feather name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#6b7280" />
              </Pressable>
            </View>
          </View>

          {/* Terms */}
          <View style={styles.termsRow}>
            <View style={styles.termsLeft}>
              <Switch value={agree} onValueChange={setAgree} />
              <Text style={styles.termsText}>
                I agree to the{" "}
                <Text style={styles.termsLink} onPress={() => Linking.openURL("#")}>
                  Terms of Service
                </Text>{" "}
                and{" "}
                <Text style={styles.termsLink} onPress={() => Linking.openURL("#")}>
                  Privacy Policy
                </Text>
              </Text>
            </View>
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
            {isLoading ? <ActivityIndicator /> : <Text style={styles.submitText}>Create Account</Text>}
          </Pressable>
        </FinAICard>

        <View style={styles.loginWrap}>
          <Text style={styles.loginText}>
            Already have an account? <Link href="/login" style={styles.loginLink}>Sign In</Link>
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  wrap: { flex: 1, padding: 24, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 18 },
  logoBox: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: "white",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  title: { color: "white", fontSize: 26, fontWeight: "700" },
  subtitle: { color: "rgba(255,255,255,0.85)", marginTop: 6 },
  row2: { flexDirection: "row" },
  fieldWrap: { marginBottom: 14 },
  label: { color: "#0f172a", fontWeight: "600", marginBottom: 6, opacity: 0.9 },
  inputRow: { position: "relative" },
  input: { height: 48, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, backgroundColor: "white", paddingHorizontal: 12, fontSize: 16 },
  leftIcon: { position: "absolute", left: 12, top: 14 },
  rightIconBtn: { position: "absolute", right: 12, top: 14, padding: 4 },
  termsRow: { marginTop: 6, marginBottom: 14 },
  termsLeft: { flexDirection: "row", alignItems: "center" },
  termsText: { marginLeft: 10, color: "#475569", flexShrink: 1 },
  termsLink: { color: "#0ea5e9", fontWeight: "600" },
  submitBtn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#6d28d9" },
  submitText: { color: "white", fontWeight: "700", fontSize: 16 },
  loginWrap: { alignItems: "center", marginTop: 14 },
  loginText: { color: "rgba(255,255,255,0.95)" },
  loginLink: { color: "white", textDecorationLine: "underline" },
});
