import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

export default function RouteMapCanvas({ points, region, accent, fallback = null }) {
  if (!Array.isArray(points) || points.length < 2 || !region) {
    return fallback;
  }

  return (
    <View style={styles.mapWrap}>
      <MapView style={styles.map} initialRegion={region}>
        <Polyline coordinates={points} strokeColor={accent} strokeWidth={4} />
        <Marker coordinate={points[0]} title="Start" pinColor="#2f855a" />
        <Marker coordinate={points[points.length - 1]} title="Ziel" pinColor="#a8003c" />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    height: 210,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f2c78f",
    backgroundColor: "#fdf0e8",
  },
  map: {
    flex: 1,
  },
});
