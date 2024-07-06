import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Text,
  Alert,
  PermissionsAndroid,
  Button,
  FlatList,
  Image,
} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import MapViewDirections from 'react-native-maps-directions';
import Geolocation from '@react-native-community/geolocation';
import {useIsFocused} from '@react-navigation/native';
import Voice from '@react-native-voice/voice';
import SQLite from 'react-native-sqlite-storage';
import RNImmediatePhoneCall from 'react-native-immediate-phone-call';
import Tts from 'react-native-tts';

const GOOGLE_MAPS_APIKEY = 'AIzaSyAbC_4_7_KFFn1n4VN36HzhoxgSpONbj8o';

const Navigation = ({navigation}) => {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [instructions, setInstructions] = useState([]);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isOffTrack, setIsOffTrack] = useState(false);
  const [offTrackNotified, setOffTrackNotified] = useState(false); // New state
  const mapRef = useRef(null);

  const isFocused = useIsFocused();
  const [isListening, setIsListening] = useState(false);
  const listeningIntervalRef = useRef(null);

  const startListening = async () => {
    try {
      console.log('Starting voice recognition...');
      await Voice.start('en-GB');
      setIsListening(true);
    } catch (err) {
      console.error('Error starting voice recognition: ', err);
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      await Voice.cancel();
      setIsListening(false);
      console.log('Stopping voice recognition...');
    } catch (err) {
      console.error('Error stopping voice recognition: ', err);
    }
  };

  const onSpeechResults = async e => {
    console.log('Speech results: ', e);
    if (e.value && e.value.length > 0) {
      const spokenText = e.value[0];
      console.log('Detected speech:', spokenText);

      // Check if the spoken text starts with "navigate"
      if (spokenText.toLowerCase().startsWith('navigate')) {
        // Remove the "navigate" keyword and trim the text
        const destinationText = spokenText.substring(8).trim();
        const apiKey = GOOGLE_MAPS_APIKEY;
        const address = destinationText;

        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address,
        )}&key=${apiKey}`;

        try {
          const response = await fetch(url);
          const data = await response.json();

          if (data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location;

            console.log('Latitude:', location.lat);
            console.log('Longitude:', location.lng);
            console.log('Location:', data.results[0].formatted_address);
            console.log('Location:', data.results[0]);
            Tts.stop(); // Ensure any ongoing TTS is stopped before starting a new one
            Tts.speak(`your selected destination is ${data.results[0].formatted_address}`);
            // Set the destination coordinates
            setDestination({
              latitude: location.lat,
              longitude: location.lng,
            });

            // Call function to set destination in Google Places Autocomplete (if needed)
            setDestinationFromVoice(destinationText);

            // Trigger function to calculate and display route
            handleGetDirections();
          } else {
            console.error('No results found');
          }
        } catch (error) {
          console.error('Error fetching coordinates:', error);
        }
      }
      if (spokenText === 'scanner') {
        setDestination(null);
        setInstructions([]);
        setRouteCoordinates([]);
        setIsOffTrack(false);
        setOffTrackNotified(false);
        console.log('Navigating to Textscanner screen...');
        navigation.navigate('Textscanner');
      }
      if (spokenText === 'help') {
        setDestination(null);
        setInstructions([]);
        setRouteCoordinates([]);
        setIsOffTrack(false);
        setOffTrackNotified(false);
        console.log('Navigating to Google screen...');
        navigation.navigate('Emergencycontact');
      }
      if (spokenText === 'currency detection') {
        setDestination(null);
        setInstructions([]);
        setRouteCoordinates([]);
        setIsOffTrack(false);
        setOffTrackNotified(false);
        navigation.navigate('currency');
      }
      if (spokenText === 'object detection') {
        setDestination(null);
        setInstructions([]);
        setRouteCoordinates([]);
        setIsOffTrack(false);
        setOffTrackNotified(false);
        console.log('Navigating to Objectdetection screen...');
        navigation.navigate('Objectdetection');
      }
      if (spokenText === 'weather') {
        setDestination(null);
        setInstructions([]);
        setRouteCoordinates([]);
        setIsOffTrack(false);
        setOffTrackNotified(false);
        navigation.navigate('LocationWeather');
      }
    }
  };

  const setDestinationFromVoice = destinationText => {
    if (googlePlacesAutocompleteRef.current) {
      googlePlacesAutocompleteRef.current.setAddressText(destinationText);
      googlePlacesAutocompleteRef.current.focus(); // Focus on the input field
    }
  };

  const googlePlacesAutocompleteRef = useRef(null);

  const onSpeechEnd = () => {
    setIsListening(false);
    console.log('Speech recognition ended');
  };

  useEffect(() => {
    const requestPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Permission to use microphone',
            message: 'We need your permission to use your microphone',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('Microphone permission denied');
        }
      }
    };

    if (isFocused) {
      requestPermission();

      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechError = e => console.error('Speech Error: ', e);

      startListening();

      listeningIntervalRef.current = setInterval(() => {
        startListening();
      }, 9000);
    } else {
      if (listeningIntervalRef.current) {
        clearInterval(listeningIntervalRef.current);
        listeningIntervalRef.current = null;
      }
      stopListening();
      Voice.destroy().then(Voice.removeAllListeners);
    }

    return () => {
      if (listeningIntervalRef.current) {
        clearInterval(listeningIntervalRef.current);
        listeningIntervalRef.current = null;
      }
      stopListening();
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [isFocused]);
  ///map work

  useEffect(() => {
    const requestPermission = async () => {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
          trackUserLocation();
        } else {
          Alert.alert('LOCATION permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    };

    requestPermission();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (origin && routeCoordinates.length > 0) {
        checkDeviation(origin);
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [origin, routeCoordinates]);

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setOrigin(userLocation);
        // Update the map region to the user's current location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            ...userLocation,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
        }
      },
      error => Alert.alert('Error', 'Error getting current location'),
      {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000},
    );
  };

  const trackUserLocation = () => {
    Geolocation.watchPosition(
      position => {
        const {latitude, longitude} = position.coords;
        const currentPosition = {latitude, longitude};
        setOrigin(currentPosition);
      },
      error => console.warn(error),
      {
        enableHighAccuracy: true,
        distanceFilter: 1,
        interval: 2000, // Check location every 2 seconds
      },
    );
  };

  const checkDeviation = currentPosition => {
    const nearestPoint = getNearestPointOnPath(
      currentPosition,
      routeCoordinates,
    );
    const distance = getDistance(currentPosition, nearestPoint);

    if (distance > 4) {
      if (!offTrackNotified) {
        // Only notify once when off-track
        const currentBearing = getBearing(currentPosition, nearestPoint);
        const routeBearing = getBearing(
          routeCoordinates[0],
          routeCoordinates[1],
        );

        let direction = '';

        if (Math.abs(currentBearing - routeBearing) < 30) {
          direction = 'straight';
        } else if (
          (currentBearing > routeBearing &&
            currentBearing - routeBearing < 180) ||
          (currentBearing < routeBearing && routeBearing - currentBearing > 180)
        ) {
          direction = 'right';
        } else {
          direction = 'left';
        }

        console.log('off path hoo gya ha');
        Tts.speak(
          ` You are off the path. Please turn ${direction} to get back on track.,`,
        );
        setIsOffTrack(true);
        setOffTrackNotified(true); // Set flag to true when notified
      }
    } else {
      if (isOffTrack) {
        console.log(' path par a gya ha');
        Tts.speak('You are back on the correct path.');
        setIsOffTrack(false);
        setOffTrackNotified(false); // Reset flag when back on track
      }
    }
  };

  const getBearing = (start, end) => {
    const startLat = start.latitude * (Math.PI / 180);
    const startLng = start.longitude * (Math.PI / 180);
    const endLat = end.latitude * (Math.PI / 180);
    const endLng = end.longitude * (Math.PI / 180);

    const dLng = endLng - startLng;
    const x = Math.sin(dLng) * Math.cos(endLat);
    const y =
      Math.cos(startLat) * Math.sin(endLat) -
      Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

    const bearing = Math.atan2(x, y) * (180 / Math.PI);
    return (bearing + 360) % 360;
  };

  const getDistance = (point1, point2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (point2.latitude - point1.latitude) * (Math.PI / 180);
    const dLng = (point2.longitude - point1.longitude) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(point1.latitude * (Math.PI / 180)) *
        Math.cos(point2.latitude * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; // Distance in meters
    return distance;
  };

  const getNearestPointOnPath = (currentPosition, path) => {
    let nearestPoint = null;
    let minDistance = Infinity;

    for (let i = 0; i < path.length - 1; i++) {
      const segmentStart = path[i];
      const segmentEnd = path[i + 1];
      const point = getClosestPointOnSegment(
        currentPosition,
        segmentStart,
        segmentEnd,
      );
      const distance = getDistance(currentPosition, point);

      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    }

    return nearestPoint;
  };

  const getClosestPointOnSegment = (point, segmentStart, segmentEnd) => {
    const x1 = segmentStart.latitude;
    const y1 = segmentStart.longitude;
    const x2 = segmentEnd.latitude;
    const y2 = segmentEnd.longitude;
    const x0 = point.latitude;
    const y0 = point.longitude;

    const dx = x2 - x1;
    const dy = y2 - y1;

    const t = ((x0 - x1) * dx + (y0 - y1) * dy) / (dx * dx + dy * dy);
    const clampedT = Math.max(0, Math.min(1, t));

    const closestX = x1 + clampedT * dx;
    const closestY = y1 + clampedT * dy;

    return {latitude: closestX, longitude: closestY};
  };

  const handleGetDirections = () => {
    if (destination) {
      setDestination(null);
      setInstructions([]);
      setRouteCoordinates([]);
      setIsOffTrack(false);
      setOffTrackNotified(false);
    }

    if (!origin || !destination) {
      console.log('Error', 'Please set destination before getting directions.');
      return;
    }

    const directionsService = new MapViewDirections({
      origin: origin,
      destination: destination,
      apikey: GOOGLE_MAPS_APIKEY,
      mode: 'WALKING',
      language: 'en',
      optimizeWaypoints: true,
      waypoints: [],
      onReady: result => {
        setInstructions(result.instructions);
        setRouteCoordinates(result.coordinates);
        // Fit the map to the route coordinates
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(result.coordinates, {
            edgePadding: {
              right: Dimensions.get('window').width / 20,
              bottom: Dimensions.get('window').height / 20,
              left: Dimensions.get('window').width / 20,
              top: Dimensions.get('window').height / 20,
            },
            animated: true,
          });
        }
      },
      onError: errorMessage => {
        console.log('MapViewDirections Error:', errorMessage);
        // Alert.alert(
        //   'Route Error',
        //   'No route found. Try a different destination.',
        // );
        console.log('No route found. Try a different destination');

      },
    });

    directionsService.render();
  };

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: origin ? origin.latitude : 33.6844, // Use origin's latitude if available
          longitude: origin ? origin.longitude : 73.0479, // Use origin's longitude if available
          latitudeDelta: 0.005, // Zoom in to show current location more clearly
          longitudeDelta: 0.005, // Zoom in to show current location more clearly
        }}>
        {origin && (
          <Marker coordinate={origin}>
            <Image
              source={require('../images/im1.jpg')}
              style={styles.customMarker}
            />
          </Marker>
        )}
        {destination && <Marker coordinate={destination} />}
        {origin && destination && (
          <MapViewDirections
            origin={origin}
            destination={destination}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={3}
            strokeColor="hotpink"
            onReady={result => {
              setRouteCoordinates(result.coordinates);
              mapRef.current.fitToCoordinates(result.coordinates, {
                edgePadding: {
                  right: Dimensions.get('window').width / 20,
                  bottom: Dimensions.get('window').height / 20,
                  left: Dimensions.get('window').width / 20,
                  top: Dimensions.get('window').height / 20,
                },
                animated: true,
              });
            }}
            onError={errorMessage => {
              console.log('MapViewDirections Error:', errorMessage);
              // Alert.alert(
              //   'Route Error',
              //   'No route found. Try a different destination.',
              // );
              console.log('No route found. Try a different destination');

            }}
          />
        )}
      </MapView>

      <View style={styles.buttonContainer}>
      <Button title={isListening ? "Listening..." : "Not Listening"} />
      
      </View>
      <View style={styles.instructionsContainer}>
        <FlatList
          data={instructions}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => (
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionText}>{item.maneuver.type}</Text>
              <Text style={styles.instructionText}>
                {item.maneuver.description}
              </Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  customMarker: {
    width: 40,
    height: 40,
  },
  autocompleteContainer: {
    width: '100%',
    position: 'absolute',
    top: 10,
  },
  textInput: {
    height: 38,
    color: 'black',
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginVertical: 5,
    padding: 5,
  },
  listView: {
    backgroundColor: '#FFFFFF',
  },
  row: {
    backgroundColor: '#FFFFFF',
    padding: 13,
    height: 44,
    flexDirection: 'row',
  },
  description: {
    color: 'black',
  },
  buttonContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 10,
    paddingHorizontal: 20,
  },
  instructionsContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 60,
    paddingHorizontal: 20,
  },
  instructionContainer: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
  },
  instructionText: {
    fontSize: 16,
    color: 'black',
  },
});

export default Navigation;
