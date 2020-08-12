/* React packages */
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

class ScreenMainItinerary extends React.Component {
  constructor() {
    super();
  }

  render() {
    return (
      <View style={styles.mapStyle}>
        <Text>Itinerary Page</Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  mapStyle: {
    flexGrow: 1,
    marginHorizontal: 10,
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