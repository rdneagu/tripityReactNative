/* React packages */
import React from 'react';
import { StyleSheet, ScrollView, View, Text } from 'react-native';

/* Expo packages */
import { Entypo, Ionicons } from '@expo/vector-icons';
import * as Permissions from 'expo-permissions';

/* Community packages */
import _ from 'lodash';
import { observable, action, computed } from "mobx"
import { observer, inject } from "mobx-react"

/* App components */
import { StyledButton, StyledText } from '../../components';

@inject('store')
@observer
class ScreenAuthPermissions extends React.Component {
  @observable permissions = {
    location: { text: 'location access', type: Permissions.LOCATION },
    cameraRoll: { text: 'media access', type: Permissions.CAMERA_ROLL },
  }

  constructor(props) {
    super(props);
  }

  async componentDidMount() {
    const result = await Permissions.getAsync(Permissions.LOCATION, Permissions.CAMERA_ROLL);
    _.forEach(result.permissions, (permission, key) => {
      this.permissions[key].granted = (permission.status === 'granted');
      this.permissions[key].denied = (permission.status === 'denied');
    })
  }

  @action.bound
  async grantPermission(key) {
    const { status } = await Permissions.askAsync(this.permissions[key].type);
    if (status === 'granted') {
      this.permissions[key].granted = true;
    } else if (status === 'denied') {
      this.permissions[key].denied = true;
    }
  }

  @computed
  get permissionGranted() {
    let granted = true;
    for (let permission in this.permissions) {
      if (!this.permissions[permission].granted) {
        granted = false;
        break;
      }
    }
    return granted;
  }

  @action.bound
  finish() {
    this.props.store.User.setPermissions();
  }

  render() {
    const buttons = _.map(this.permissions, (permission, key) => {
      let icon, text, colors;
      if (permission.granted) {
        icon = <Ionicons name="md-checkmark" />;
        text = `Granted ${permission.text}`;
        colors = [ '#259925', '#218921' ];
      } else if (permission.denied) {
        icon = <Ionicons name="md-close" />;
        text = `${permission.text} denied`;
        colors = [ '#fe4726', '#fd2e08' ]
      } else {
        text = `Allow ${permission.text}`;
      }
      const onPress = (!permission.granted && !permission.denied) ? this.grantPermission.bind(this, key) : undefined;
      return <StyledButton key={key} style={styles.permissionButton} icon={icon} inversed={true} colors={colors} onPress={onPress}>{text}</StyledButton>
    });
    return (
      <ScrollView contentContainerStyle={styles.content} automaticallyAdjustContentInsets={false} bounces={false}>
        {/* Header */}
        <Text style={styles.logo}>Tripity</Text>
        <View style={{ marginBottom: 40, alignItems: 'center' }}>
          <StyledText>We would also require you to grant us</StyledText>
          <StyledText>permission to the following services</StyledText>
        </View>
        {/* Form */}
        <View style={styles.form}>
          {buttons}
          {this.permissionGranted && <StyledButton style={{ marginVertical: 40 }} icon={<Entypo name="chevron-right" />} onPress={this.finish}>Finish</StyledButton>}
        </View>
        <View style={{ marginBottom: 40, alignItems: 'center' }}>
          <StyledText>Make sure that your camera saves</StyledText>
          <StyledText>the GPS location when taking pictures</StyledText>
        </View>
      </ScrollView>
    )
  }
}

const styles = StyleSheet.create({
  logo: {
    marginVertical: 40,
    fontSize: 40,
    fontFamily: 'Nunito-Bold',
    color: '#eee'
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
  },
  permissionButton: {
    marginVertical: 10,
  },
  form: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extra: {
    alignItems: 'center',
    marginBottom: 20,
  },
  extraText: {
    color: '#eee',
    fontFamily: 'Nunito-Light',
    fontSize: 16,
  },
});

export default ScreenAuthPermissions;
