import { useAuth, useUser } from "@clerk/clerk-expo";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();

  async function handleSignOut() {
    try {
      await signOut();
    } catch (err: any) {
      Alert.alert("Sign out failed", String(err));
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.email}>
          {user?.emailAddresses[0]?.emailAddress ?? "unknown"}
        </Text>
      </View>

      <Pressable style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  label: { color: "#64748b", fontSize: 12, textTransform: "uppercase" },
  email: { fontWeight: "600", fontSize: 16, color: "#0f172a", marginTop: 4 },
  button: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
