import {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Alert,
  Animated,
  Easing,
  Image,
  ImageBackground,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import Tts from 'react-native-tts';

import Voice from '@react-native-voice/voice';
import {useIsFocused} from '@react-navigation/native';
import {
  useCameraPermission,
  useMicrophonePermission,
  useCameraDevice,
  Camera,
} from 'react-native-vision-camera';
import Navigation from './Navigation';

const LocationWeather = ({navigation}) => {
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  //voice work
  const isFocused = useIsFocused();
  const [isListening, setIsListening] = useState(false);
  const listeningIntervalRef = useRef(null); // To store interval reference

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

  const [initialFocus, setInitialFocus] = useState(true); // Track initial focus

  useEffect(() => {
    setInitialFocus(true);
  }, [isFocused]);

  useEffect(() => {
    let intervalId;

    const takePhotoInterval = async () => {
      intervalId = setInterval(async () => {
        // await takePhoto();
        // startListening();
      }, 5000); // Call takePhoto every 5 seconds
    };

    if (!loading && cameraPermission && microphonePermission && cameraDevice) {
      takePhotoInterval();
    }

    return () => {
      clearInterval(intervalId); // Clear interval on component unmount
    };
  }, [loading, cameraPermission, microphonePermission, cameraDevice]);

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

  // Handler for speech results
  const onSpeechResults = e => {
    console.log('Speech results: ', e);
    if (e.value && e.value.length > 0) {
      const spokenText = e.value[0].toLowerCase();
      console.log('Detected speech:', spokenText);
      if (spokenText === 'scanner') {
        setWeather(null);
        setLocation(null);
        setError(null);
        fadeAnim.setValue(0);
        console.log('Navigating to Textscanner screen...');
        navigation.navigate('Textscanner');
      }
      if (spokenText === 'help') {
        setWeather(null);
        setLocation(null);
        setError(null);
        fadeAnim.setValue(0);
        console.log('Navigating to Google screen...');
        navigation.navigate('Emergencycontact');
      }
      if (spokenText === 'currency detection') {
        setWeather(null);
        setLocation(null);
        setError(null);
        fadeAnim.setValue(0);
        navigation.navigate('currency');
      }
      if (spokenText === 'location') {
        setWeather(null);
        setLocation(null);
        setError(null);
        fadeAnim.setValue(0);
        navigation.navigate('Navigation');
      }
      if (spokenText === 'object detection') {
        setWeather(null);
        setLocation(null);
        setError(null);
        fadeAnim.setValue(0);
        console.log('Navigating to Objectdetection screen...');
        navigation.navigate('Objectdetection');
      }
    }
  };

  // Handler for speech end event
  const onSpeechEnd = () => {
    setIsListening(false);
    console.log('Speech recognition ended');
  };

  useEffect(() => {
    // Function to handle permission request
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

    // Only start listening and attach listeners if the screen is focused
    if (isFocused) {
      requestPermission();

      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechError = e => console.error('Speech Error: ', e);

      // Start listening immediately
      startListening();

      // Set up interval to start listening every 5 seconds
      listeningIntervalRef.current = setInterval(() => {
        startListening();
      }, 5000);
    } else {
      // Clear the interval and stop listening when the screen is not focused
      if (listeningIntervalRef.current) {
        clearInterval(listeningIntervalRef.current);
        listeningIntervalRef.current = null;
      }
      stopListening();
      Voice.destroy().then(Voice.removeAllListeners);
    }

    // Cleanup when the component unmounts or screen is unfocused
    return () => {
      if (listeningIntervalRef.current) {
        clearInterval(listeningIntervalRef.current);
        listeningIntervalRef.current = null;
      }
      stopListening();
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [isFocused]);

  // Function to stop TTS
  const stopTTS = () => {
    Tts.stop();
  };

  // Function to start TTS
  const startTTS = weatherData => {
    if (weatherData) {
      readWeatherAloud(weatherData);
    }
  };

  // Fetch location and weather data
  const getLocationAndWeather = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        const coords = await getCurrentLocation();
        if (coords) {
          setLocation(coords);
          const weatherData = await fetchWeatherData(
            coords.latitude,
            coords.longitude,
          );
          setWeather(weatherData);
          // Start TTS reading
          startTTS(weatherData);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }).start();
        }
      } else {
        setError('Location permission denied');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (isFocused) {
      // Fetch location and weather data only when screen is focused
      getLocationAndWeather();
    } else {
      // Stop TTS when screen is unfocused
      stopTTS();
    }
  }, [isFocused]);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message:
              'This app needs access to your location to show the weather.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    // On iOS, permissions are handled at the OS level when requesting location
    return true;
  };

  const getCurrentLocation = async () => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          const userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          resolve(userLocation);
        },
        error => {
          Alert.alert('Error', 'Error getting current location');
          reject(error);
        },
        {enableHighAccuracy: false, timeout: 20000, maximumAge: 1000},
      );
    });
  };

  const fetchWeatherData = async (lat, lon) => {
    const apiKey = 'ce895223564f55a05daaaaf358992bfe';
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const getSafetyRecommendations = weather => {
    if (!weather || !weather.weather || weather.weather.length === 0) {
      return '';
    }

    const description = weather.weather[0].description.toLowerCase();
    if (description.includes('rain')) {
      return "Attention: It's rainy outside. Please carry an umbrella and drive safely to avoid any slippery roads.";
    } else if (description.includes('snow')) {
      return "Alert: It's snowy outside. Make sure to dress warmly and be extra cautious on the roads to prevent any accidents.";
    } else if (description.includes('clear')) {
      return "Good news: The weather is clear. It's a wonderful day to be outside. Enjoy!";
    } else if (description.includes('cloud')) {
      return "Notice: It's cloudy outside. Consider carrying a light jacket in case it gets chilly.";
    } else if (description.includes('wind')) {
      return "Warning: It's windy outside. Secure any loose items and dress warmly to stay comfortable.";
    }
    return 'Stay safe and check the weather conditions before heading out. Always be prepared for any sudden changes in the weather.';
  };

  // Function to read out the weather data using TTS
  const readWeatherAloud = weatherData => {
    if (!weatherData) {
      return;
    }

    const {
      name: city,
      main: {temp},
      weather: weatherDetails,
    } = weatherData;
    const description = weatherDetails[0].description;
    const recommendations = getSafetyRecommendations(weatherData);

    const speechText = `Current Location: ${city}. 
                        Weather: ${description}. 
                        Temperature: ${temp} degrees Celsius. 
                        ${recommendations}`;

    Tts.speak(speechText);
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!weather) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const {
    name: city,
    main: {temp},
    weather: weatherDetails,
  } = weather;
  const description = weatherDetails[0].description;
  const recommendations = getSafetyRecommendations(weather);

  return (
    <ImageBackground
      source={require('./Images/WeatherImg.jpg')} // Replace with your high-quality background image
      style={styles.background}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('./Images/Weatherlogo.jpg')} // Replace with your logo path
            style={styles.logo}
          />
        </View>
      </View>

      <Animated.View style={[styles.card, {opacity: fadeAnim}]}>
        <Text style={styles.cityText}>Current Location: {city}</Text>
        <Text style={styles.weatherText}>Weather: {description}</Text>
        <Text style={styles.tempText}>Temperature: {temp} °C</Text>
        <Text style={styles.recommendationsText}>{recommendations}</Text>
      </Animated.View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#87CEEB',
  },
  background: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.8,
    shadowRadius: 10,
    // No elevation property here
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Slightly more opaque for better readability
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 20},
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
    transform: [{perspective: 1000}, {rotateX: '-5deg'}, {rotateY: '-5deg'}],
  },
  loadingText: {
    fontSize: 18,
    color: '#888',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
  cityText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 3,
  },
  weatherText: {
    fontSize: 20,
    marginVertical: 8,
    color: '#555',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 3,
  },
  tempText: {
    fontSize: 20,
    marginVertical: 8,
    color: '#000',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 3,
  },
  recommendationsText: {
    fontSize: 16,
    marginTop: 16,
    color: '#555',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
});

export default LocationWeather;
