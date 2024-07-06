import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  View,
  StyleSheet,
  Text,
  Image,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import { useIsFocused } from '@react-navigation/native';
import Tts from 'react-native-tts';
import {
  useCameraPermission,
  useMicrophonePermission,
  useCameraDevice,
  Camera,
} from 'react-native-vision-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';

function TextScanner({ navigation }) {
  const isFocused = useIsFocused();
  const [isListening, setIsListening] = useState(false);
  const [contacts, setContacts] = useState([]);
  const listeningIntervalRef = useRef(null);
  const [imag, setImag] = useState(null);
  const camera = useRef(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const cameraDevice = useCameraDevice('back');

  const {
    hasPermission: cameraPermission,
    requestPermission: requestCameraPermission,
  } = useCameraPermission();

  const {
    hasPermission: microphonePermission,
    requestPermission: requestMicrophonePermission,
  } = useMicrophonePermission();

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
    console.log('Speech results: ', e);
    if (e.value && e.value.length > 0) {
      const spokenText = e.value[0].toLowerCase();
      console.log('Detected speech: ', spokenText);
      if (spokenText === 'currency detection') {
        console.log('Navigating to currency screen...');

        navigation.navigate('currency');
      }
      if (spokenText === 'help') {
        console.log('Navigating to Google screen...');
        navigation.navigate('Emergencycontact');
      }
      if (spokenText === 'object detection') {
        console.log('Navigating to Objectdetection screen...');
        navigation.navigate('Objectdetection');
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
      Tts.stop(); // Ensure any ongoing TTS is stopped before starting a new one
      Tts.speak("Double tap to read the text ......... Double tap to read the text");
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
      Tts.stop(); // Stop TTS when screen loses focus
      Voice.destroy().then(Voice.removeAllListeners);
    }

    return () => {
      if (listeningIntervalRef.current) {
        clearInterval(listeningIntervalRef.current);
        listeningIntervalRef.current = null;
      }
      stopListening();
      Tts.stop(); // Stop TTS when component unmounts
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [isFocused]);

  const onDoubleTap = () => {
    takePhoto();
  };

  const takePhoto = async () => {
    if (camera.current != null) {
      // Clear previous result before taking a new photo
      setResult(null);
      Tts.stop(); // Stop any ongoing TTS

      const file = await camera.current.takePhoto({
        qualityPrioritization: 'speed',
        flash: 'off',
        enableShutterSound: false,
      });
      const image = `file://${file.path}`;
      setImag(image);

      const _result = await TextRecognition.recognize(image);
      setResult(_result);
    }
  };

  useEffect(() => {
    speakText();
  }, [result]);

  const speakText = async () => {
    if (result?.text && !isSpeaking) {
      setIsSpeaking(true);

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Tts.stop(); // Ensure any ongoing TTS is stopped before starting a new one
        Tts.speak(result?.text);
        setIsSpeaking(false);
      } else {
        Alert.alert('Text-to-speech is not supported on this platform.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Voice Recognition TextScanner</Text>
      {isListening ? <Text>Listening...</Text> : <Text>Not Listening</Text>}
      {imag && <Image source={{ uri: imag }} style={{ width: 200, height: 200 }} />}
      {loading ? (
        <Text style={styles.text}>Loading...</Text>
      ) : !cameraPermission || !microphonePermission ? (
        <Text style={styles.text}>
          Please grant camera and microphone permissions to use the app.
        </Text>
      ) : !cameraDevice ? (
        <Text style={styles.text}>No camera device available.</Text>
      ) : (
        <TouchableOpacity style={styles.cameraContainer} onPress={onDoubleTap}>
          <Camera
            ref={camera}
            photo={true}
            style={styles.camera}
            device={cameraDevice}
            isActive={true}
          />
        </TouchableOpacity>
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
  cameraContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default TextScanner;
