import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

const Startup = () => {
  const navigation = useNavigation();
  const handlePress = () => {
    navigation.navigate('Registration');
  };

  return (
    <View style={{flex: 1}}>
      <StatusBar translucent backgroundColor="rgba(0,0,0,0)" />
      <ImageBackground
        source={require('../components/Images/Img1.jpg')}
        style={styles.background}>
        <View style={styles.overlay} />

        <View style={styles.details}>
          <Text style={styles.title}>Readed Instructions carefully</Text>

          <Text style={styles.description}>
            If yex Then press Get Started and Enjoy our App. If not read press
            back button and read all instruction how to use this app
          </Text>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.8}
            onPress={handlePress}>
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    width: '100%',
    height: '100%',
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  details: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
  },
  description: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    lineHeight: 24,
  },
  button: {
    marginTop: 30,
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 5,
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Startup;
