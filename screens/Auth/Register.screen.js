/* React packages */
import React from 'react';
import { StyleSheet, ScrollView, View, Text } from 'react-native';

/* Expo packages */
import { Entypo, Ionicons } from '@expo/vector-icons';

/* Community packages */
import _ from 'lodash';
import form from '../../lib/form';
import { observable, action } from "mobx"
import { observer, inject } from "mobx-react"

/* App components */
import { INPUT_TYPE } from '../../components/Input';
import { Input, StyledButton, StyledLink } from '../../components';

@inject('store')
@observer
class ScreenAuthRegister extends React.Component {
  @observable fields = {
    email: { icon: <Ionicons name="md-mail" />, label: 'EMAIL', placeholder: 'Email Address' },
    password: { icon: <Ionicons name="ios-lock" />, label: 'PASSWORD', secured: true, placeholder: 'Password' },
    confirmPassword: { icon: <Ionicons name="ios-lock" />, label: 'CONFIRM PASSWORD', secured: true, placeholder: 'Password' },
    fullName: { icon: <Ionicons name="md-person" />, label: 'FULL NAME', placeholder: 'Full name' },
    birthDay: { icon: <Ionicons name="md-calendar" />, label: 'BIRTHDAY', placeholder: 'DD/MM/YYYY', type: INPUT_TYPE.DATEPICKER },
  }
  @observable pending = false;

  constructor(props) {
    super(props);
  }

  /**
   * Cleans the active form of errors
   */
  @action.bound
  clean() {
    _.forEach(this.fields, (field, key) => {
      delete this.fields[key].error;
    });
  }

  @action.bound
  register() {
    form.submit(this.fields, this.props.store.UserStore.register);
  }

  render() {
    const navigation = this.props.navigation;
    const fields = _.map(this.fields, (field, key) => {
      return <Input key={key} model={text => this.fields[key].value = text} value={field.value} {...field} />
    });
    return (
      <ScrollView contentContainerStyle={styles.content} automaticallyAdjustContentInsets={false} bounces={false}>
        {/* Header */}
        <Text style={styles.logo}>Tripity</Text>
        {/* Form */}
        <View style={styles.form}>
          {fields}
          <StyledButton throttle={2.5} style={{ marginVertical: 40 }} icon={<Entypo name="chevron-right" />} onPress={this.register}>Register</StyledButton>
        </View>
        {/* Extra */}
        <View style={styles.extra}>
          <Text style={styles.extraText}>Already have an account? <StyledLink onPress={() => navigation.replace('Screen.Auth', { screen: 'Login' })}>Sign In</StyledLink></Text>
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

export default ScreenAuthRegister;
