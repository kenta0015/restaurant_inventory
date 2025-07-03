// app/index.tsx

import { Redirect } from "expo-router";
import { Platform, View, Text } from "react-native";

export default function Index() {
  // ✅ Redirect to /inventory on web and mobile
  if (Platform.OS === "web") {
    return <Redirect href="/inventory" />;
  }

  // ✅ Optionally show a fallback UI while redirecting on native (optional)
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Redirecting to Inventory...</Text>
    </View>
  );
}
