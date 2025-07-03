import React from "react";
import { View, Text, Button, Alert, ScrollView } from "react-native";
import { devTestLogMeal } from "../dev/devTestLogMeal"; // ✅ make sure path is correct

export default function DevTestScreen() {
  const handleRunTest = async () => {
    try {
      await devTestLogMeal();
      Alert.alert("✅ Test Complete", "Check console for log and Supabase for changes.");
    } catch (error: any) {
      Alert.alert("❌ Error", error.message || "Unknown error.");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
        Dev Test Screen
      </Text>
      <Button title="Run devTestLogMeal" onPress={handleRunTest} />
    </ScrollView>
  );
}
