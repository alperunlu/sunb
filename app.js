import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";

export default function App() {
  const [locationText, setLocationText] = useState("");
  const [sunnyCities, setSunnyCities] = useState([]);
  const [radioValue, setRadioValue] = useState(1); // 1 = only sunny, 2 = partly cloudy
  const [currentCoords, setCurrentCoords] = useState({ lat: null, lon: null });

  const apiKey = "437d4abaaf647b67ae0f5c70f46c4f14";

  // Haversine formülü ile iki nokta arası mesafeyi km cinsinden hesaplar
  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Dünya yarıçapı (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // km
  }

  const getSunnyCities = async () => {
    setLocationText("Getting location...");
    setSunnyCities([]);

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationText("Permission denied.");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      let lat0 = location.coords.latitude;
      let lon0 = location.coords.longitude;

      setCurrentCoords({ lat: lat0, lon: lon0 });
      setLocationText(`Your location: ${lat0.toFixed(4)}, ${lon0.toFixed(4)}`);

      const latitudes = [lat0 - 0.6, lat0 - 0.3, lat0, lat0 + 0.3, lat0 + 0.6];
      const longitudes = [lon0 - 0.6, lon0, lon0 + 0.6];

      let citySet = new Set();
      let cities = [];

      for (let lat of latitudes) {
        for (let lon of longitudes) {
          const url = `https://api.openweathermap.org/data/2.5/find?lat=${lat}&lon=${lon}&cnt=50&appid=${apiKey}`;
          try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.list && data.list.length > 0) {
              data.list.forEach((city) => {
                const cityName = city.name;
                const description = city.weather[0].description;
                const iconCode = city.weather[0].icon;

                if (
                  radioValue === 1 &&
                  description === "clear sky" &&
                  !citySet.has(cityName)
                ) {
                  cities.push({
                    name: cityName,
                    icon: iconCode,
                    lat: city.coord.lat,
                    lon: city.coord.lon,
                  });
                  citySet.add(cityName);
                }

                if (
                  radioValue === 2 &&
                  (description === "clear sky" ||
                    description === "few clouds") &&
                  !citySet.has(cityName)
                ) {
                  cities.push({
                    name: cityName,
                    icon: iconCode,
                    lat: city.coord.lat,
                    lon: city.coord.lon,
                  });
                  citySet.add(cityName);
                }
              });
            }
          } catch (err) {
            setLocationText(`Error fetching data: ${err}`);
          }
        }
      }

      // Mesafeye göre sıralama
      if (cities.length === 0) {
        cities.push({ name: "No cities found.", icon: "50d" });
      } else {
        cities.sort((a, b) => {
          const distA = getDistance(lat0, lon0, a.lat, a.lon);
          const distB = getDistance(lat0, lon0, b.lat, b.lon);
          return distA - distB; // Yakından uzağa
        });
      }

      setSunnyCities(cities);
    } catch (err) {
      setLocationText(`Error: ${err.message}`);
    }
  };

  return (
    <LinearGradient colors={["#e0f7fa", "#ffffff"]} style={styles.container}>
      <Text style={styles.title}>☀️ Sunbusters</Text>

      <TouchableOpacity style={styles.button} onPress={getSunnyCities}>
        <Text style={styles.buttonText}>Find Sunny Cities</Text>
      </TouchableOpacity>

      <Text style={styles.location}>{locationText}</Text>

      <View style={styles.radioContainer}>
        <TouchableOpacity
          onPress={() => setRadioValue(1)}
          style={[styles.radioOption, radioValue === 1 && styles.radioActive]}
        >
          <Text style={styles.radioText}>Only Sunny</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setRadioValue(2)}
          style={[styles.radioOption, radioValue === 2 && styles.radioActive]}
        >
          <Text style={styles.radioText}>Partly Cloudy</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sunnyCities}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.cityCard}
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
            <Text style={styles.cityName}>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    color: "#00796B",
  },
  button: {
    backgroundColor: "#FF9800",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: "center",
    marginVertical: 10,
    shadowColor: "#000",
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
    color: "#444",
  },
  radioContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  radioOption: {
    backgroundColor: "#f1f1f1",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  radioActive: {
    backgroundColor: "#4CAF50",
  },
  radioText: {
    color: "#000",
    fontWeight: "bold",
  },
  cityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 12,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  cityIcon: { width: 40, height: 40, marginRight: 15 },
  cityName: { fontSize: 18, fontWeight: "600", color: "#333" },
});
