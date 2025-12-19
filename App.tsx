/**
 * SIGHTA-AI Mobile App
 * Main application entry point
 *
 * @format
 */

import React from "react";
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  SafeAreaView,
} from "react-native";
import WebSocketExample from "./src/components/WebSocketExample";

function App() {
  const isDarkMode = useColorScheme() === "dark";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />
      <WebSocketExample />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});

export default App;
