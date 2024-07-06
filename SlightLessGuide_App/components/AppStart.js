import React from 'react';
import {
  StatusBar,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  Pressable,
} from 'react-native';

const AppStart = ({navigation}) => {
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
      <StatusBar translucent backgroundColor={'rgba(0,0,0,0)'} />

      <Image
        source={require('../components/Images/Img1.jpg')}
        style={style.image}
      />

      <View style={style.indicatorContainer}>
        <View style={style.indicator} />
        <View style={style.indicator} />
        <View style={[style.indicator, style.indicatorActive]} />
      </View>

      <View style={{paddingHorizontal: 20, paddingTop: 20}}>
        <View>
          <Text style={style.title}>Welcome to SlightLessGuide</Text>
          <Text style={style.title}>Your Ultimate Life Companion</Text>
        </View>

        {/* <View style={{marginTop: 10}}>
          <Text style={style.textStyle}>
            Schedule visits in just a few clicks
          </Text>
          <Text style={style.textStyle}>visit in just a few clicks</Text>
        </View> */}

        <View style={{marginTop: 10}}>
          <Text style={style.textStyle}>
            Before pressing next read instruction below
          </Text>
          <Text style={style.textStyle}>
            Before starting the app, please read all instructions carefully on
            next page the guide for the visually impaired
          </Text>
        </View>
      </View>

      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          paddingBottom: 40,
        }}>
        <Pressable onPress={() => navigation.navigate('Instruction')}>
          <View style={style.btn}>
            <Text style={{color: 'white'}}>Next </Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const style = StyleSheet.create({
  image: {
    height: 420,
    width: '100%',
    borderBottomLeftRadius: 100,
  },
  indicatorContainer: {
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  indicator: {
    height: 3,
    width: 30,
    backgroundColor: '#A9A9A9',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  indicatorActive: {
    backgroundColor: '#000',
  },
  btn: {
    height: 60,
    marginHorizontal: 20,
    backgroundColor: 'black',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {fontSize: 24, fontWeight: 'bold', color: 'black', marginTop: 10},
  textStyle: {fontSize: 16, color: '#A9A9A9', marginTop: 5},
});
export default AppStart;
