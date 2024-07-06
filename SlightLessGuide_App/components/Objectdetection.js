import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import Tts from 'react-native-tts';
import SQLite from 'react-native-sqlite-storage';
import {
  useCameraPermission,
  useMicrophonePermission,
  useCameraDevice,
  Camera,
} from 'react-native-vision-camera';

const db = SQLite.openDatabase(
  { name: 'contSDB.db', createFromLocation: '~conSDB.db' },
  () => console.log('Database opened successfully.'),
  error => console.error('Error opening database: ', error),
);

function Objectdetection({ navigation }) {
  const isFocused = useIsFocused();
  const [isListening, setIsListening] = useState(false);
  const listeningIntervalRef = useRef(null); // To store interval reference
  const photoIntervalRef = useRef(null); // To store photo-taking interval reference
  const cameraRef = useRef(null);
  const {
    hasPermission: cameraPermission,
    requestPermission: requestCameraPermission,
  } = useCameraPermission();
  const {
    hasPermission: microphonePermission,
    requestPermission: requestMicrophonePermission,
  } = useMicrophonePermission();
  const cameraDevice = useCameraDevice('back');
  const [loading, setLoading] = useState(true);
  var check;
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

  const onSpeechResults = e => {
    console.log('i am on screen1 object');
    console.log('Speech results: ', e);
    if (e.value && e.value.length > 0) {
      const spokenText = e.value[0].toLowerCase();
      console.log('Detected speech:', spokenText);

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
      if (spokenText === 'weather') {
        navigation.navigate('LocationWeather');
      }
      

    }
  };

  const onSpeechEnd = () => {
    setIsListening(false);
    console.log('Speech recognition ended');
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'speed',
        flash: 'off',
        enableShutterSound: false,
      });

      const imageUri = `file://${photo.path}`;
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        name: 'image.jpg',
        type: 'image/jpg',
      });

      try {
        const response = await axios.post(
          'http://192.168.99.199:5000/predict',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        console.log('Predictions:', response.data.predictions);
        const res = response.data.predictions.toString();        
        if (res !== check) {
          check=res;

          Tts.speak(res);
        } else {
          console.log('Response is the same as the previous one. No need to speak.');
        }
      } catch (error) {
        console.log('Error uploading image:', error);
      }
    }
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

      photoIntervalRef.current = setInterval(() => {
        takePhoto();
      }, 5000);
    } else {
      if (listeningIntervalRef.current) {
        clearInterval(listeningIntervalRef.current);
        listeningIntervalRef.current = null;
      }
      if (photoIntervalRef.current) {
        clearInterval(photoIntervalRef.current);
        photoIntervalRef.current = null;
      }
      stopListening();
      Voice.destroy().then(Voice.removeAllListeners);
    }

    return () => {
      if (listeningIntervalRef.current) {
        clearInterval(listeningIntervalRef.current);
        listeningIntervalRef.current = null;
      }
      if (photoIntervalRef.current) {
        clearInterval(photoIntervalRef.current);
        photoIntervalRef.current = null;
      }
      stopListening();
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [isFocused]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Voice Recognition Test object</Text>
      {isListening ? <Text>Listening...</Text> : <Text>Not Listening</Text>}
      {loading ? (
        <Text>Loading...</Text>
      ) : !cameraPermission || !microphonePermission ? (
        <Text>
          Please grant camera and microphone permissions to use the app.
        </Text>
      ) : !cameraDevice ? (
        <Text>No camera device available.</Text>
      ) : (
        <Camera
          ref={cameraRef}
          photo={true}
          style={styles.camera}
          device={cameraDevice}
          isActive={true}
          // torch="on"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
});

export default Objectdetection;
