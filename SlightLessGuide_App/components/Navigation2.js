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
} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import MapViewDirections from 'react-native-maps-directions';
import Geolocation from '@react-native-community/geolocation';
import {useIsFocused} from '@react-navigation/native';
import Voice from '@react-native-voice/voice';
import SQLite from 'react-native-sqlite-storage';
import RNImmediatePhoneCall from 'react-native-immediate-phone-call';

const db = SQLite.openDatabase(
  {name: 'contSDB.db', createFromLocation: '~conSDB.db'},
  () => {
    console.log('Database opened successfully.');
  },
  error => {
    console.error('Error opening database: ');
  },
);

const GOOGLE_MAPS_APIKEY = 'AIzaSyAbC_4_7_KFFn1n4VN36HzhoxgSpONbj8o';

const Navigation = ({navigation}) => {
  var contactArray;
  const isFocused = useIsFocused();

  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [instructions, setInstructions] = useState([]);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isOffTrack, setIsOffTrack] = useState(false);
  const mapRef = useRef(null);

  const [isListening, setIsListening] = useState(false);
  const [reloadIntervalId, setReloadIntervalId] = useState(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!navigation.isFocused()) {
        clearInterval(intervalId); // Stop listening if navigation is done
        return;
      }
      startListening();
    }, 10000); // Listen every 5 seconds

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, [navigation, isFocused]);

  useEffect(() => {
    const requestPermission = async () => {
      try {
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

          console.log('Permission result:', granted);

          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            // startListening();
          } else {
            console.warn('Permission denied');
          }
        }
      } catch (err) {
        console.error('Permission error: ', err);
      }
    };

    requestPermission();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
      clearInterval(reloadIntervalId);
    };
  }, []);

  const startListening = async () => {
    try {
      console.log(
        'Starting voice recognition... in Navigation detection module',
      );
      await Voice.start('en-GB');
      setIsListening(true);
    } catch (err) {
      console.error('Error starting voice recognition: ', err);
      setIsListening(false);
    }
  };

  function getContactNumber(contactName) {
    // Iterate through each contact in the array
    for (var i = 0; i < contactArray.length; i++) {
      // Check if the contact_name matches
      if (contactArray[i].contact_name == contactName) {
        return contactArray[i].contact_number;
      }
    }
    return null;
  }

  const onSpeechResults = e => {
    const spokenText = e.value[0].toLowerCase();
    fetchContacts();

    console.log('call Spoken Text:', spokenText);
    const spokenTextArray = spokenText.split(' ');

    console.log('Split Spoken Text:', spokenTextArray);

    if (spokenTextArray[0] == 'call') {
      var contactNumber = getContactNumber(
        spokenTextArray[1].charAt(0).toUpperCase() +
          spokenTextArray[1].slice(1),
      );
      if (contactNumber !== null) {
        console.log('Contact number for ' + ' is: ' + contactNumber);
        RNImmediatePhoneCall.immediatePhoneCall(contactNumber);
      } else {
        console.log('Contact not found for ' + spokenTextArray[1]);
      }
    }

    if (spokenText === 'object detection') {
      console.log('Navigating to Objectdetection screen...');
      navigation.navigate('Objectdetection');
    }

    if (spokenText === 'scanner') {
      console.log('Navigating to Textscanner screen...');
      navigation.navigate('Textscanner');
    }
    if (spokenText === 'help') {
      console.log('Navigating to Google screen...');
      navigation.navigate('Emergencycontact');
    }
    if (spokenText === 'currency detection') {
      navigation.navigate('currency');
    }
    if (spokenText === 'location') {
      navigation.navigate('Navigation');
    }

    setIsListening(false);
  };

  const onSpeechEnd = () => {
    setIsListening(false);
  };

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechEnd = onSpeechEnd;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);



//   useEffect(() => {
//     Permission();
//   }, []);

  /**fetching */

  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    fetchContacts();
  }, [isFocused]);

  const fetchContacts = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM contacts',
        [],
        (_, {rows}) => {
          const fetchedContacts = rows.raw();
          setContacts(fetchedContacts);
          // console.log(fetchedContacts);
          contactArray = fetchedContacts;
        },
        error => {
          console.log('Error fetching contacts: ', error.message);
        },
      );
    });
  };

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
    }, 4000); // Check every 4 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [origin, routeCoordinates]);

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        setOrigin({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
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
        interval: 5000, // Check location every 5 seconds
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
      if (!isOffTrack) {
        Alert.alert(
          'Warning',
          'You are off the path. Please make a turn to get back on track.',
        );
        setIsOffTrack(true);
      }
      console.log(
        'You are off the path. Please make a turn to get back on track.',
      );
    } else {
      if (isOffTrack) {
        Alert.alert('Success', 'You are back on the correct path.');
        setIsOffTrack(false);
      } else {
        console.log('You are on the correct path.');
      }
    }
  };

  const getNearestPointOnPath = (point, path) => {
    let nearestPoint = path[0];
    let minDistance = getDistance(point, nearestPoint);
    for (let i = 1; i < path.length; i++) {
      const distance = getDistance(point, path[i]);
      if (distance < minDistance) {
        nearestPoint = path[i];
        minDistance = distance;
      }
    }
    return nearestPoint;
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

  const handleGetDirections = () => {
    if (!origin || !destination) {
      Alert.alert('Error', 'Please set destination before getting directions.');
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
        mapRef.current.fitToCoordinates(result.coordinates, {
          edgePadding: {
            right: Dimensions.get('window').width / 20,
            bottom: Dimensions.get('window').height / 20,
            left: Dimensions.get('window').width / 20,
            top: Dimensions.get('window').height / 20,
          },
          animated: true,
        });
      },
      onError: errorMessage => {
        console.warn('MapViewDirections Error:', errorMessage);
        Alert.alert(
          'Route Error',
          'No route found. Try a different destination.',
        );
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
          latitude: origin ? origin.latitude : 33.6844,
          longitude: origin ? origin.longitude : 73.0479,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}>
        {origin && (
          <Marker coordinate={origin}>
            <Image
              source={require('./images/im1.jpg')}
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
              console.warn('MapViewDirections Error:', errorMessage);
              Alert.alert(
                'Route Error',
                'No route found. Try a different destination.',
              );
            }}
          />
        )}
      </MapView>

      <View style={styles.autocompleteContainer}>
        <GooglePlacesAutocomplete
          placeholder="Enter destination"
          onPress={(data, details = null) => {
            setDestination({
              latitude: details.geometry.location.lat,
              longitude: details.geometry.location.lng,
            });
          }}
          query={{
            key: GOOGLE_MAPS_APIKEY,
            language: 'en',
          }}
          fetchDetails={true}
          styles={{
            textInput: styles.textInput,
            listView: styles.listView,
            row: styles.row,
            description: styles.description,
          }}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Get Directions" onPress={handleGetDirections} />
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
