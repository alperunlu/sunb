import React, { useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  Button, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  Linking 
} from "react-native";
import * as Location from "expo-location";
import { AdMobInterstitial } from "expo-ads-admob";

export default function App() {
  const [locationText, setLocationText] = useState("");
  const [sunnyCities, setSunnyCities] = useState([]);
  const [radioValue, setRadioValue] = useState(1); // 1 = only sunny, 2 = partly cloudy

  const apiKey = "437d4abaaf647b67ae0f5c70f46c4f14";
  const adUnitId = "ca-app-pub-7994669731946359/8396744976"; // Replace with your ID

  const loadAd = async () => {
    await AdMobInterstitial.setAdUnitID(adUnitId);
    await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true });
    await AdMobInterstitial.showAdAsync();
  };

  const getSunnyCities = async () => {
    setLocationText("Getting location...");
    setSunnyCities([]);

    try {
      // Request permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationText("Permission denied.");
        return;
      }

      // Get current location
      let location = await Location.getCurrentPositionAsync({});
      let lat0 = location.coords.latitude;
      let lon0 = location.coords.longitude;
      setLocationText(`Your location: ${lat0.toFixed(4)}, ${lon0.toFixed(4)}`);

      //await loadAd();

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
              data.list.forEach(city => {
                const cityName = city.name;
                const description = city.weather[0].description;
                const iconCode = city.weather[0].icon;

                if (radioValue === 1 && description === "clear sky" && !citySet.has(cityName)) {
                  cities.push({ name: cityName, icon: iconCode });
                  citySet.add(cityName);
                }

                if (radioValue === 2 && 
                    (description === "clear sky" || description === "few clouds") &&
                    !citySet.has(cityName)) {
                  cities.push({ name: cityName, icon: iconCode });
                  citySet.add(cityName);
                }
              });
            }
          } catch (err) {
            setLocationText(`Error fetching data: ${err}`);
          }
        }
      }

      if (cities.length === 0) {
        cities.push({ name: "No cities found.", icon: "50d" });
      }

      setSunnyCities(cities);
    } catch (err) {
      setLocationText(`Error: ${err.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sunbusters</Text>

      <Button title="Find sunny cities" onPress={getSunnyCities} />

      <Text style={styles.location}>{locationText}</Text>

      <View style={styles.radioContainer}>
        <TouchableOpacity onPress={() => setRadioValue(1)} style={styles.radioOption}>
          <Text style={{ color: radioValue === 1 ? "blue" : "black" }}>● Only sunny</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setRadioValue(2)} style={styles.radioOption}>
          <Text style={{ color: radioValue === 2 ? "blue" : "black" }}>● Partly cloudy</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sunnyCities}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.cityItem}
            onPress={() =>
              Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${item.name}`)
            }
          >
            <Image
              source={{ uri: `https://openweathermap.org/img/w/${item.icon}.png` }}
              style={{ width: 40, height: 40, marginRight: 10 }}
            />
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  location: { marginVertical: 10, textAlign: "center" },
  radioContainer: { flexDirection: "row", justifyContent: "center", marginVertical: 10 },
  radioOption: { marginHorizontal: 10 },
  cityItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderColor: "#ddd" },
});
