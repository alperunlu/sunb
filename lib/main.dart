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

    LocationData locationData;
    var location = new Location();

    try {
      locationData = await location.getLocation();
    } catch (e) {
      print('Error: ${e.toString()}');
      setState(() {
        _location = 'Error getting location.';
      });
      return;
    }

    var lat = locationData.latitude;
    var lon = locationData.longitude;
    var apiKey = 'MY_API_KEY';

    var url;

    if (_radioValue == 1) {
      url =
      'https://api.openweathermap.org/data/2.5/find?lat=$lat&lon=$lon&cnt=10&appid=$apiKey&weather=clear';
    } else {
      url =
      'https://api.openweathermap.org/data/2.5/find?lat=$lat&lon=$lon&cnt=10&appid=$apiKey&weather=clear,clouds';
    }

    try {
      var response = await http.get(Uri.parse(url));

      if (response.statusCode == 200) {
        var data = jsonDecode(response.body);
        if (data['list'] != null && data['list'].isNotEmpty) {
          for (var city in data['list']) {
            var weather = city['weather'][0];
            if (weather['main'] == 'Clear' || weather['main'] == 'Clouds') {
              setState(() {
                _sunnyCities.add(city['name']);
              });
            }
          }
          setState(() {
            _location = 'Your location: ${data['list'][0]['name']}';
          });
        } else {
          setState(() {
            _location = 'No sunny cities found.';
          });
        }
      } else {
        print('Error: ${response.statusCode}');
        setState(() {
          _location = 'Error: ${response.statusCode}';
        });
      }
    } catch (e) {
      print('Error: ${e.toString()}');
      setState(() {
        _location = 'Error: ${e.toString()}';
      });
    }
  } // function end


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
            RadioListTile(
              title: Text('Only Sunny'),
              value: 1,
              groupValue: _radioValue,
              onChanged: _onRadioSelected,
            ),
            RadioListTile(
              title: Text('Sunny or Partly Cloudy'),
              value: 2,
              groupValue: _radioValue,
              onChanged: _onRadioSelected,
            ),
            ElevatedButton(
              child: Text('Get Sunny Cities'),
              onPressed: _getSunnyCities,
            ),
            SizedBox(height: 20),
            Text(_location),
            SizedBox(height: 20),
            Expanded(
              child: ListView.builder(
                itemCount: _sunnyCities.length,
                itemBuilder: (context, index) {
                  return ListTile(
                    title: Text(_sunnyCities[index]),
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
