/* React packages */
import React from 'react';
import { StyleSheet, Image, PixelRatio, View, Text } from 'react-native';

export default function Picture({ uri, location }) {
  return (
    <View style={{ width: '100%', flex: 1 }}>
      <Image source={{ uri }} style={[ styles.image, !location ? styles.disabled : null ]} />
      {!location && <View style={styles.location}>
        <Text style={styles.locationText}>LOCATION DISABLED</Text>
      </View>}
    </View>
  )
}

const styles = StyleSheet.create({
  image: {
    flex: 1,
    width: PixelRatio.getPixelSizeForLayoutSize(56),
    height: PixelRatio.getPixelSizeForLayoutSize(56),
    marginTop: 4,
    marginBottom: 4,
  },
  disabled: {
    borderColor: '#ff6347',
    borderWidth: 2,
    borderRadius: 2,
  },
  location: {
    position: 'absolute',
    backgroundColor: '#ff6347',
    left: 0,
    right: 0,
    top: 4,
    borderRadius: 2,
  },
  locationText: {
    fontSize: 10,
    fontFamily: 'Nunito-Bold',
    textAlign: 'center',
  },
});
