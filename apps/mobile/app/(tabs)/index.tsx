import { useUser } from "@clerk/clerk-expo";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function TodayScreen() {
  const { user } = useUser();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.hello}>
        Hi {user?.firstName ?? user?.emailAddresses[0]?.emailAddress ?? "there"} 👋
      </Text>
      <Text style={styles.sub}>Here&apos;s what&apos;s on today.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Next workout</Text>
        <Text style={styles.cardBody}>Upper Push Focus · 7 exercises</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Habits</Text>
        <Text style={styles.cardBody}>3 of 5 completed</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nutrition</Text>
        <Text style={styles.cardBody}>1,820 / 2,400 kcal</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  hello: { fontSize: 24, fontWeight: "700", color: "#0f172a" },
  sub: { color: "#64748b", marginBottom: 8 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTitle: { fontWeight: "600", color: "#0f172a", marginBottom: 4 },
  cardBody: { color: "#475569" },
});
