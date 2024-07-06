import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  ImageBackground,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import {useIsFocused} from '@react-navigation/native';
import RNImmediatePhoneCall from 'react-native-immediate-phone-call';
import SQLite from 'react-native-sqlite-storage';
import {
  useCameraPermission,
  useMicrophonePermission,
  useCameraDevice,
} from 'react-native-vision-camera';
import Tts from 'react-native-tts';
const db = SQLite.openDatabase(
  {name: 'contSDB.db', createFromLocation: '~conSDB.db'},
  () => console.log('Database opened successfully.'),
  error => console.error('Error opening database: ', error),
);

function Emergencycall({navigation}) {
  const isFocused = useIsFocused();
  const [isListening, setIsListening] = useState(false);
  const [contacts, setContacts] = useState([]);
  const listeningIntervalRef = useRef(null); // To store interval reference
  const [loading, setLoading] = useState(true);
  const [initialFocus, setInitialFocus] = useState(true); // Track initial focus

  const {
    hasPermission: cameraPermission,
    requestPermission: requestCameraPermission,
  } = useCameraPermission();
  const {
    hasPermission: microphonePermission,
    requestPermission: requestMicrophonePermission,
  } = useMicrophonePermission();
  const cameraDevice = useCameraDevice('back');

  useEffect(() => {
    if (!cameraPermission) {
      requestCameraPermission();
    }
    if (!microphonePermission) {
      requestMicrophonePermission();
    }
  }, [cameraPermission, microphonePermission]);

  useEffect(() => {
    if (cameraPermission && microphonePermission) {
      setLoading(false);
    }
  }, [cameraPermission, microphonePermission]);

  useEffect(() => {
    setInitialFocus(true);
  }, [isFocused]);

  useEffect(() => {
    let intervalId;

    const takePhotoInterval = async () => {
      intervalId = setInterval(async () => {
        // await takePhoto();
        // startListening();
      }, 5000); // Call takePhoto every 2 seconds
    };

    if (!loading && cameraPermission && microphonePermission && cameraDevice) {
      takePhotoInterval();
    }

    return () => {
      clearInterval(intervalId); // Clear interval on component unmount
    };
  }, [loading, cameraPermission, microphonePermission, cameraDevice]);

  useEffect(() => {
    fetchContacts(); // Fetch contacts when the component mounts
  }, [isFocused]);

  const fetchContacts = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM contacts',
        [],
        (_, {rows}) => {
          const fetchedContacts = rows.raw();
          setContacts(fetchedContacts);
          contactArray = fetchedContacts; // Assign fetched contacts to contactArray
        },
        error => {
          console.log('Error fetching contacts: ', error.message);
        },
      );
    });
  };

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

  // Function to stop listening
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

  // Function to search for contact_number by contact_name
  function getContactNumber(contactName) {
    for (var i = 0; i < contactArray.length; i++) {
      if (contactArray[i].contact_name === contactName) {
        return contactArray[i].contact_number;
      }
    }
    return null;
  }

  // Handler for speech results
  const onSpeechResults = e => {
    console.log('i am on screen help');
    console.log('Speech results: ', e);
    if (e.value && e.value.length > 0) {
      const spokenText = e.value[0].toLowerCase();
      console.log('Detected speech:', spokenText);
      const spokenTextArray = spokenText.split(' ');

      if (spokenTextArray[0] === 'call') {
        const contactName =
          spokenTextArray[1].charAt(0).toLowerCase() +
          spokenTextArray[1].slice(1);
        const contactNumber = getContactNumber(contactName);
        if (contactNumber !== null) {
          console.log(
            'Contact number for ' + contactName + ' is: ' + contactNumber,
          );
          RNImmediatePhoneCall.immediatePhoneCall(contactNumber);
        } else {
          console.log('Contact not found for ' + contactName);
        }
      }

      if (spokenText === 'scanner') {
        console.log('Navigating to Textscanner screen...');
        navigation.navigate('Textscanner');
      }
      if (spokenText === 'object detection') {
        console.log('Navigating to Objectdetection screen...');
        navigation.navigate('Objectdetection');
      }
      if (spokenText === 'currency detection') {
        navigation.navigate('currency');
      }
      if (spokenText === 'location') {
        navigation.navigate('Navigation');
      }
      if (spokenText === 'weather') {
        navigation.navigate('LocationWeather');
      }
    }
  };

  // Handler for speech end event
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
      }, 5000);
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

  // Speak message on screen load
  useEffect(() => {
    Tts.speak('You are in SlightLess Emergency module', {
      language: 'en-GB',
      rate: 0.8,
    });
  }, []);

  // Rendering contact with custom call image button
  const renderContact = ({item}) => (
    <View style={styles.contactItem}>
      <Text style={styles.contactName}>{item.contact_name}</Text>
      <TouchableOpacity
        style={styles.callButton}
        onPress={() =>
          RNImmediatePhoneCall.immediatePhoneCall(item.contact_number)
        }>
        <Image
          source={require('./Images/Callicon.png')} // Replace with your actual image path
          style={styles.callIcon} // Applying style to the image
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <ImageBackground
      source={require('./Images/MainCall.jpg')} // Add your 3D background image here
      style={styles.background}>
      <View style={styles.container}>
        {/* Logo at the top */}
        <View style={styles.logoContainer}>
          <Image
            source={require('./Images/Callicon.png')} // Replace with your logo image path
            style={styles.logo}
          />
        </View>
        <Text style={styles.heading}>Emergency Contacts</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          <FlatList
            data={contacts}
            renderItem={renderContact}
            keyExtractor={item => item.id.toString()}
            ListEmptyComponent={
              <Text style={styles.noContactsText}>No contacts available.</Text>
            }
          />
        )}
        <View style={styles.statusContainer}>
          {isListening ? (
            <Text style={styles.listeningText}>Listening...</Text>
          ) : (
            <Text style={styles.notListeningText}>Not Listening</Text>
          )}
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(240, 244, 248, 0.9)', // Slight transparency for 3D effect
    borderRadius: 20,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  background: {
    flex: 1,
    resizeMode: 'cover', // Cover the background with the image
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 150, // Adjust the width of your logo as needed
    height: 150, // Adjust the height of your logo as needed
    resizeMode: 'contain',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginVertical: 5,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  callButton: {
    padding: 10,
  },
  callIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  listeningText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  notListeningText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  noContactsText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default Emergencycall;