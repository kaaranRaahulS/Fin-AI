import { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

type Props = {
	children: ReactNode;
	onPress?: () => void;
	/** variant="glass" gives the translucent features card */
	variant?: "default" | "glass";
};

export default function FinAICard({
	children,
	onPress,
	variant = "default",
}: Props) {
	const content = (
		<View
			style={[styles.base, variant === "glass" ? styles.glass : styles.solid]}
		>
			{children}
		</View>
	);
	if (onPress) return <Pressable onPress={onPress}>{content}</Pressable>;
	return content;
}

const styles = StyleSheet.create({
	base: {
		padding: 16,
		borderRadius: 16,
		marginBottom: 12,
	},
	solid: {
		backgroundColor: "white",
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 3,
	},
	glass: {
		backgroundColor: "rgba(255,255,255,0.12)",
		borderWidth: 2,
		borderColor: "rgba(255,255,255,0.25)",
	},
});
