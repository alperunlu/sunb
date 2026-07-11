import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  Linking,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Appearance,
} from "react-native";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";

const theme = {
  light: {
    bg: ["#e0f7fa", "#ffffff"],
    title: "#00796B",
    text: "#444",
    cityName: "#333",
    cardBg: "#ffffff",
    radioBg: "#f1f1f1",
    radioActive: "#4CAF50",
    radioText: "#000",
    statusBar: "dark-content",
    statusBarBg: "#e0f7fa",
    shadow: "#000",
  },
  dark: {
    bg: ["#0d1b2a", "#1b2838"],
    title: "#80cbc4",
    text: "#aaa",
    cityName: "#e0e0e0",
    cardBg: "#1e2a3a",
    radioBg: "#2a3a4a",
    radioActive: "#388E3C",
    radioText: "#e0e0e0",
    statusBar: "light-content",
    statusBarBg: "#0d1b2a",
    shadow: "#000",
  },
};

export default function App() {
  const [locationText, setLocationText] = useState("");
  const [sunnyCities, setSunnyCities] = useState([]);
  const [radioValue, setRadioValue] = useState(1);
  const [currentCoords, setCurrentCoords] = useState({ lat: null, lon: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isDark, setIsDark] = useState(Appearance.getColorScheme() === "dark");

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === "dark");
    });
    return () => sub.remove();
  }, []);

  const t = isDark ? theme.dark : theme.light;

  const apiKey = process.env.EXPO_PUBLIC_WEATHER_API_KEY;

  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const searchAtPoint = async (lat, lon, citySet) => {
    const url = `https://api.openweathermap.org/data/2.5/find?lat=${lat}&lon=${lon}&cnt=50&appid=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.list) return [];

    const results = [];
    for (const city of data.list) {
      const cityName = city.name;
      if (citySet.has(cityName)) continue;

      const description = city.weather[0].description;
      const matches =
        radioValue === 1
          ? description === "clear sky"
          : description === "clear sky" || description === "few clouds";

      if (matches) {
        results.push({
          name: cityName,
          icon: city.weather[0].icon,
          lat: city.coord.lat,
          lon: city.coord.lon,
        });
        citySet.add(cityName);
      }
    }
    return results;
  };

  const sortByDistance = (arr, lat0, lon0) =>
    arr.sort(
      (a, b) =>
        getDistance(lat0, lon0, a.lat, a.lon) -
        getDistance(lat0, lon0, b.lat, b.lon)
    );

  const getSunnyCities = async () => {
    if (!apiKey) {
      setLocationText("Error: API key not configured.");
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
    setSunnyCities([]);

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationText("Permission denied. Enable location in Settings.");
        setError(true);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      let lat0 = location.coords.latitude;
      let lon0 = location.coords.longitude;
      setCurrentCoords({ lat: lat0, lon: lon0 });

      const citySet = new Set();
      const stopAt = 10;

      // Stage 1: nearest 50 cities
      setLocationText("Searching nearby...");
      let cities = await searchAtPoint(lat0, lon0, citySet);

      if (cities.length > 0) {
        const sorted = sortByDistance(cities, lat0, lon0);
        setSunnyCities(sorted);
        setLocationText(
          `Your location: ${lat0.toFixed(4)}, ${lon0.toFixed(4)}`
        );
        return;
      }

      // Stage 2: wider grid (8 points around user, ~50-100km apart)
      setLocationText("No sunny cities nearby. Searching wider area...");
      const offsets2 = [
        [0.5, 0.5], [-0.5, 0.5],
        [0.5, -0.5], [-0.5, -0.5],
        [1.0, 0], [-1.0, 0],
        [0, 1.0], [0, -1.0],
      ];

      for (let i = 0; i < offsets2.length; i++) {
        const [dLat, dLon] = offsets2[i];
        const more = await searchAtPoint(
          lat0 + dLat,
          lon0 + dLon,
          citySet
        );
        if (more.length > 0) {
          cities = [...cities, ...more];
          const sorted = sortByDistance(cities, lat0, lon0);
          setSunnyCities(sorted);
          setLocationText(
            `Found ${cities.length} sunny cities... (searching wider)`
          );
        }
        if (cities.length >= stopAt) break;
      }

      // Stage 3: even wider grid (8 points, ~150-220km apart)
      if (cities.length < stopAt) {
        setLocationText("Still searching... Expanding range...");
        const offsets3 = [
          [1.5, 1.5], [-1.5, 1.5],
          [1.5, -1.5], [-1.5, -1.5],
          [2.0, 0], [-2.0, 0],
          [0, 2.0], [0, -2.0],
        ];

        for (let i = 0; i < offsets3.length; i++) {
          const [dLat, dLon] = offsets3[i];
          const more = await searchAtPoint(
            lat0 + dLat,
            lon0 + dLon,
            citySet
          );
          if (more.length > 0) {
            cities = [...cities, ...more];
            const sorted = sortByDistance(cities, lat0, lon0);
            setSunnyCities(sorted);
            setLocationText(
              `Found ${cities.length} sunny cities... (expanded range)`
            );
          }
          if (cities.length >= stopAt) break;
        }
      }

      if (cities.length === 0) {
        setSunnyCities([{ name: "No cities found.", icon: "50d" }]);
      }
      setLocationText(`Your location: ${lat0.toFixed(4)}, ${lon0.toFixed(4)}`);
    } catch (err) {
      setLocationText(`Error: ${err.message}`);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg[0] }}>
      <StatusBar barStyle={t.statusBar} backgroundColor={t.statusBarBg} />
      <LinearGradient key={isDark ? "dark" : "light"} colors={t.bg} style={styles.container}>
        <Text style={[styles.title, { color: t.title }]}>☀️ Sunbusters</Text>

        <TouchableOpacity style={styles.button} onPress={getSunnyCities} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Searching..." : "Find Sunny Cities"}</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator size="small" color="#FF9800" style={{ marginVertical: 10 }} />}

        <Text style={[styles.location, { color: t.text }]}>{locationText}</Text>

        {sunnyCities.length === 0 && !loading && !error && !locationText && (
          <Text style={[styles.welcome, { color: t.text }]}>
            Tap the button above to find sunny cities!
          </Text>
        )}

        <View style={styles.radioContainer}>
          <TouchableOpacity
            onPress={() => setRadioValue(1)}
            accessibilityLabel="Filter: Only Sunny"
            accessibilityRole="button"
            accessibilityState={{ selected: radioValue === 1 }}
            style={[styles.radioOption, { backgroundColor: t.radioBg }, radioValue === 1 && { backgroundColor: t.radioActive }]}
          >
            <Text style={[styles.radioText, { color: t.radioText }]}>Only Sunny</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setRadioValue(2)}
            accessibilityLabel="Filter: Partly Cloudy"
            accessibilityRole="button"
            accessibilityState={{ selected: radioValue === 2 }}
            style={[styles.radioOption, { backgroundColor: t.radioBg }, radioValue === 2 && { backgroundColor: t.radioActive }]}
          >
            <Text style={[styles.radioText, { color: t.radioText }]}>Partly Sunny</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={sunnyCities}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.cityCard, { backgroundColor: t.cardBg, shadowColor: t.shadow }]}
              disabled={item.name === "No cities found."}
              onPress={() =>
                Linking.openURL(
                  `https://www.google.com/maps/search/?api=1&query=${item.name}`
                )
              }
            >
              <Image
                source={{
                  uri: `https://openweathermap.org/img/w/${item.icon}.png`,
                }}
                style={styles.cityIcon}
              />
              <Text style={[styles.cityName, { color: t.cityName }]}>
                {item.name}
                {item.lat && currentCoords.lat
                  ? ` (${getDistance(
                      currentCoords.lat,
                      currentCoords.lon,
                      item.lat,
                      item.lon
                    ).toFixed(1)} km)`
                  : ""}
              </Text>
            </TouchableOpacity>
          )}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
  },
  button: {
    backgroundColor: "#FF9800",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: "center",
    marginVertical: 10,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  location: {
    marginVertical: 10,
    textAlign: "center",
    fontSize: 16,
  },
  radioContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  radioOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  radioText: {
    fontWeight: "bold",
  },
  cityCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    marginVertical: 6,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  cityIcon: { width: 40, height: 40, marginRight: 15 },
  cityName: { fontSize: 18, fontWeight: "600" },
  welcome: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
});
