import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Objectdetection from './components/Objectdetection';
import TextScanner from './components/TextScanner';
import EmergencyCall from './components/Emergencycall';
import Registration from './components/Registration';
import Startup from './components/Startup';
import Navigation from './components/Navigation';
import Currencydetection from './components/FakeCurrency';
import AppStart from './components/AppStart';
import Instructions from './components/Instruction';
import LocationWeather from './components/LocationWeather';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="startingApp"
        screenOptions={{headerShown: false}}>

        <Stack.Screen name="startingApp" component={AppStart} />
        <Stack.Screen name="Objectdetection" component={Objectdetection} />

        <Stack.Screen name="Instruction" component={Instructions} />
        <Stack.Screen name="Start" component={Startup} />
        <Stack.Screen name="Registration" component={Registration} />
        <Stack.Screen name="Textscanner" component={TextScanner} />
        <Stack.Screen name="currency" component={Currencydetection} />
        <Stack.Screen name="Emergencycontact" component={EmergencyCall} />
        <Stack.Screen name="Navigation" component={Navigation} />
        <Stack.Screen name="LocationWeather" component={LocationWeather} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
