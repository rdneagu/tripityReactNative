/* React packages */
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

/* Expo packages */
import { Entypo } from '@expo/vector-icons';

/* Community packages */
import { MapView, Camera } from '@react-native-mapbox-gl/maps';

/* App components */
import { NavigationHeader } from '../../components';

class ScreenMainItinerary extends React.Component {
  
  constructor() {
    super();

    this.map = React.createRef();
    this.camera = React.createRef();
  }

  render() {
    const cameraConfig = {
      defaultSettings: {
        centerCoordinate: [-4.251433, 55.860916],
        zoomLevel: 5,
      }
    }
    const mapConfig = {
      styleURL: 'mapbox://styles/davidpag/ck3q3ljmw1ohp1cqir2wuqplz',
      // zoomEnabled: false,
      rotateEnabled: false,
      // scrollEnabled: false,
      maxZoomLevel: 18,
      pitchEnabled: false,
      logoEnabled: false,
    }
    return (
      <View style={styles.mapStyle}>
        <NavigationHeader icon={<Entypo name="map" size={18} color="white" />}>ITINERARY</NavigationHeader>
        <MapView ref={this.map} style={styles.mapStyle} {...mapConfig}>
          <Camera ref={this.camera} {...cameraConfig} /> 
        </MapView>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  mapStyle: {
    flexGrow: 1,
  },
  pingStyle: {
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#00aaff',
    borderWidth: 2,
  },
  markerStart: {
    borderColor: 'lime',
  },
  markerEnd: {
    borderColor: '#ff6347',
  },
})

export default ScreenMainItinerary;