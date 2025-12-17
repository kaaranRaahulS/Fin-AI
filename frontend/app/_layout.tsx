// // app/_layout.tsx
// import { Stack } from "expo-router";
// import { ActivityIndicator, View } from "react-native";
// import { AuthProvider, useAuth } from "../contexts/AuthContext";

// function RootInner() {
// 	const { ready } = useAuth();
// 	if (!ready) {
// 		return (
// 			<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
// 				<ActivityIndicator />
// 			</View>
// 		);
// 	}
// 	return (
// 		<Stack screenOptions={{ headerShown: false }}>
// 			<Stack.Screen name="(tabs)" />
// 			<Stack.Screen name="login" />
// 			<Stack.Screen name="register" />
// 			<Stack.Screen name="plaid" options={{ title: "Plaid Integration" }} />
// 			<Stack.Screen name="add-card" options={{ title: "Add Card" }} />
// 			<Stack.Screen name="adjust-budget" options={{ title: "Adjust Budget" }} />

// 		</Stack>
// 	);
// }

// export default function RootLayout() {
// 	return (
// 		<AuthProvider>
// 			<RootInner />
// 		</AuthProvider>
// 	);
// }
//--------------------------//

// app/_layout.tsx
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

function RootInner() {
  const { ready } = useAuth();

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="plaid" options={{ title: "Link Bank Account" }} />
      <Stack.Screen name="add-card" options={{ title: "Add Card" }} />
      <Stack.Screen name="adjust-budget" options={{ title: "Adjust Budget" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootInner />
    </AuthProvider>
  );
}
