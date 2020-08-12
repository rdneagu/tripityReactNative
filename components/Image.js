/* React packages */
import React from 'react';
import { StyleSheet, Image, View, Text } from 'react-native';

export default function Picture({ src, location }) {
  return (
    <View>
      <React.Fragment>
        <Image source={{ uri: src }} style={[styles.image, !location ? styles.disabled : null]} />
      </React.Fragment>
      {!location && <View style={styles.location}>
        <Text style={styles.locationText}>LOCATION DISABLED</Text>
      </View>}
    </View>
  )
}

const styles = StyleSheet.create({
  image: {
    width: 128,
    height: 128,
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
