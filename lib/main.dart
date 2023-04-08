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
  String _location = '';
  List<dynamic> _sunnyCities = [];

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
    var apiKey = '437d4abaaf647b67ae0f5c70f46c4f14';

    var url =
        'https://api.openweathermap.org/data/2.5/find?lat=$lat&lon=$lon&cnt=50&appid=$apiKey';

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