import 'package:flutter/material.dart';
import 'package:location/location.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() => runApp(SunnyCitiesApp());

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
  int _radioValue = 1; // default is only sunny
  String _location = '';
  List<dynamic> _sunnyCities = [];
  Set<String> _cityNames = Set<String>();

  void _onRadioSelected(int? value) {
    setState(() {
      _radioValue = value ?? 1;
    });
  }

  Future<void> _getSunnyCities() async {
    setState(() {
      _location = 'Getting location...';
      _sunnyCities = [];
    });

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
    var latitudes = [lat!-0.5, lat!-0.25, lat, lat!+0.25, lat+0.5];
    var longitudes = [lon!-0.5, lon, lon+0.5];

    var apiKey = 'MY_API_KEY';

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
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

