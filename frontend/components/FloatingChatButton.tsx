// FloatingChatButton.tsx
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

interface FloatingChatButtonProps {
  onClick: () => void;
}

export function FloatingChatButton({ onClick }: FloatingChatButtonProps) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <Pressable
        onPress={onClick}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed
        ]}
      >
        <LinearGradient
          colors={["#14b8a6", "#0d9488"]} // teal gradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Feather name="message-circle" size={26} color="white" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 46, // ~ bottom-24 in tailwind (with tab bar spacing)
    right: 24,  // right-6
    zIndex: 40,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 56 / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  gradient: {
    flex: 1,
    borderRadius: 56 / 2,
    justifyContent: "center",
    alignItems: "center",
  },
});
