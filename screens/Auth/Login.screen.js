/* React packages */
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

/* Expo packages */
import { Entypo } from '@expo/vector-icons';

/* Community packages */
import _ from 'lodash';
import { observable, action } from "mobx";
import { observer, inject } from "mobx-react";

/* App library */
import form from '../../lib/form';

/* App components */
import { Input, StyledButton, StyledLink } from '../../components';

@inject('store')
@observer
class ScreenAuthLogin extends React.Component {
  @observable fields = {
    email: { icon: <Entypo name="mail" />, label: "EMAIL", placeholder: 'Sign in with email' },
    password: { icon: <Entypo name="lock" />, label: "PASSWORD", secured: true, placeholder: 'Password' },
  }

  constructor(props) {
    super(props);
  }

  @action.bound
  authenticate() {
    form.submit(this.fields, this.props.store.UserStore.authenticate);
  }

  render() {
    const navigation = this.props.navigation;
    const fields = _.map(this.fields, (field, key) => {
      return <Input key={key} model={text => this.fields[key].value = text} value={field.value} {...field} outerStyle={{ marginVertical: 20 }} />
    });
    return (
      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.logo}>Tripity</Text>
        {/* Form */}
        <View style={styles.form}>
          {fields}
          <StyledButton throttle={2.5} style={{ marginVertical: 40 }} icon={<Entypo name="chevron-right" />} onPress={this.authenticate}>Sign In</StyledButton>
          <StyledButton icon={<Entypo name="bug" />} onPress={() => navigation.replace('Screen.Main', { screen: 'Itinerary' })}>Dev Login</StyledButton>
        </View>
        {/* Extra */}
        <View style={styles.extra}>
          <StyledLink onPress={() => 'forgot'}>Forgot Password?</StyledLink>
          <Text style={styles.extraText}>Don't have an account? <StyledLink onPress={() => navigation.replace('Screen.Auth', { screen: 'Register' })}>Sign Up</StyledLink></Text>
        </View>
      </View>
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
    flex: 1,
    alignItems: 'center',
  },
  form: {
    flex: 1,
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

export default ScreenAuthLogin;
