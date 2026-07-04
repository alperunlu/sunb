import 'package:flutter/material.dart';
import 'package:location/location.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:google_mobile_ads/google_mobile_ads.dart';

//void main() => runApp(SunnyCitiesApp());


void main() {
  WidgetsFlutterBinding.ensureInitialized();
  MobileAds.instance.initialize();
  runApp(MaterialApp(
    home: SunnyCitiesApp(),
    ),
  );
}


class SunnyCitiesApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Sunbusters',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  InterstitialAd? _interstitialAd;
  int _radioValue = 1; // default is only sunny
  String _location = '';
  List<dynamic> _sunnyCities = [];
  Set<String> _cityNames = Set<String>();
  // TODO: replace this test ad unit with your own ad unit.
  final adUnitId = "ca-app-pub-7994669731946359/8396744976";

  void _onRadioSelected(int? value) {
    setState(() {
      _radioValue = value ?? 1;
    });
  }

  void launchURL(String url) async {
    if (await canLaunch(url)) {
      await launch(url);
    } else {
      throw 'Could not launch $url';
    }
  }

  /// Loads an interstitial ad.
  void _loadAd() {
    InterstitialAd.load(
        adUnitId: adUnitId,
        request: const AdRequest(),
        adLoadCallback: InterstitialAdLoadCallback(
          // Called when an ad is successfully received.
          onAdLoaded: (InterstitialAd ad) {
            ad.fullScreenContentCallback = FullScreenContentCallback(
              // Called when the ad showed the full screen content.
                onAdShowedFullScreenContent: (ad) {},
                // Called when an impression occurs on the ad.
                onAdImpression: (ad) {},
                // Called when the ad failed to show full screen content.
                onAdFailedToShowFullScreenContent: (ad, err) {
                  ad.dispose();
                },
                // Called when the ad dismissed full screen content.
                onAdDismissedFullScreenContent: (ad) {
                  ad.dispose();
                },
                // Called when a click is recorded for an ad.
                onAdClicked: (ad) {});

            // Keep a reference to the ad so you can show it later.
            _interstitialAd = ad;
          },
          // Called when an ad request failed.
          onAdFailedToLoad: (LoadAdError error) {
            // ignore: avoid_print
            print('InterstitialAd failed to load: $error');
          },
        ));
  }

  //

  Future<void> _getSunnyCities() async {

    setState(() {
      _location = 'Getting location...';
      _sunnyCities = [];
    });

    _loadAd(); //
    //_showAlert(context);
    _interstitialAd?.show();
    // Clearing the lists
    _sunnyCities.clear();
    _cityNames.clear();

    LocationData locationData;
    var location = new Location();

    try {
      locationData = await location.getLocation();
    } catch (e) {
      setState(() {
        _location = 'Error: ${e.toString()}';
      });
      return;
    }

    var lat0 = locationData.latitude;
    var lon0 = locationData.longitude;
    var lat = lat0;
    var lon = lon0;
    var latitudes = [lat!-0.6, lat!-0.30, lat, lat!+0.3, lat+0.6];
    var longitudes = [lon!-0.6, lon, lon+0.6];

    var apiKey = '437d4abaaf647b67ae0f5c70f46c4f14';

    for (var lat in latitudes) {
      for (var lon in longitudes) {
        var url =
            'https://api.openweathermap.org/data/2.5/find?lat=$lat&lon=$lon&cnt=50&appid=$apiKey';

        try {
          var response = await http.get(Uri.parse(url));

          if (response.statusCode == 200) {
            var data = jsonDecode(response.body);
            if (data['list'] != null && data['list'].isNotEmpty) {
              for (var city in data['list']) {
                var cityName = city['name'];
                var weather = city['weather'][0];
                var iconcode = weather['icon'];
                if (_radioValue == 1) {
                  if (weather['description'] == 'clear sky' && !_cityNames.contains(cityName)) {
                    setState(() {
                      _sunnyCities.add([cityName, iconcode]);
                      _cityNames.add(cityName);
                    });
                  }
                }
                if (_radioValue == 2) {
                  if ((weather['description'] == 'clear sky' || weather['description'] == 'few clouds') && !_cityNames.contains(cityName)) {
                    setState(() {
                      _sunnyCities.add([cityName, iconcode]);
                      _cityNames.add(cityName);
                    });
                  }
                }
              }
            }
          } else {
            setState(() {
              _location = 'Error: ${response.statusCode}';
            });
            return;
          }
        } catch (e) {
          setState(() {
            _location = 'Error: ${e.toString()}';
          });
          return;
        }
      }
    }
    setState(() {
      _location = 'Your location: $lat0, $lon0';
    });
    if (_sunnyCities.isEmpty) {
      _sunnyCities.add(["No cities found.", "50d"]);
    }
    //_sunnyCities = _sunnyCities.toSet().toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Sunbusters'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            ElevatedButton(
              onPressed: () {
                _getSunnyCities();
              },
              child: Text('Find sunny cities'),
            ),
            SizedBox(height: 20.0),
            Text(_location),
            SizedBox(height: 20.0),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Radio(
                  value: 1,
                  groupValue: _radioValue,
                  onChanged: _onRadioSelected,
                ),
                Text('Only sunny'),
                Radio(
                  value: 2,
                  groupValue: _radioValue,
                  onChanged: _onRadioSelected,
                ),
                Text('Partly cloudy'),
              ],
            ),
            SizedBox(height: 20.0),
            Expanded(
              child: ListView.builder(
                itemCount: _sunnyCities.length,
                itemBuilder: (context, index) {
                  var city = _sunnyCities[index][0];
                  var iconcode = _sunnyCities[index][1];
                  var iconurl =
                      'https://openweathermap.org/img/w/$iconcode.png';
                  return ListTile(
                    leading: Image.network(iconurl),
                    title: Text(city),
                    onTap: () async {
                      var city = _sunnyCities[index][0];
                      var mapsUrl = 'https://www.google.com/maps/search/?api=1&query=$city';
                      launchURL(mapsUrl);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAlert(BuildContext context) {
    showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Sunbusters'),
          content: Text('You are using a beta version of Sunbusters.'),
          actions: <Widget>[
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                _interstitialAd?.show();
              },
              child: const Text('OK'),
            )
          ],
        ));
  }

  @override
  void dispose() {
    _interstitialAd?.dispose();
    super.dispose();
  }

}
