import { FlatList, StyleSheet, Text, View } from "react-native";

const WORKOUTS = [
  { id: "1", name: "Upper Push Focus", muscle: "Chest / Shoulders / Triceps" },
  { id: "2", name: "Lower Power Day", muscle: "Quads / Glutes" },
  { id: "3", name: "Full Body Conditioning", muscle: "Full body" },
  { id: "4", name: "Mobility Flow", muscle: "Hips / T-spine" },
];

export default function WorkoutsScreen() {
  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={WORKOUTS}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.muscle}>{item.muscle}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, gap: 12 },
  row: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  name: { fontWeight: "600", fontSize: 16, color: "#0f172a" },
  muscle: { color: "#64748b", marginTop: 4 },
});
