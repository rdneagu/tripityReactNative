/* React packages */
import React from 'react';
import { StyleSheet, ScrollView, View, Text } from 'react-native';

/* Expo packages */
import { Entypo, Ionicons } from '@expo/vector-icons';

/* Community packages */
import _ from 'lodash';
import { observable, action } from "mobx"
import { observer, inject } from "mobx-react"

/* App library */
import form from '../../lib/form';

/* App components */
import { INPUT_TYPE } from '../../components/Input';
import { Input, StyledButton, StyledText } from '../../components';

const countries = [ 'France', 'Scotland', 'Italy' ];
const cities = {
  France: [ 'City-France-1', 'City-France-2', 'City-France-3' ],
  Scotland: [ 'City-Scotland-1', 'City-Scotland-2', 'City-Scotland-3' ],
  Italy: [ 'City-Italy-1', 'City-Italy-2', 'City-Italy-3' ],
}

@inject('store')
@observer
class ScreenAuthCountry extends React.Component {
  @observable fields = {
    homeCountry: { icon: <Ionicons name="ios-pin" />, label: 'COUNTRY', placeholder: 'Select your home country', type: INPUT_TYPE.SELECT, select: { options: countries }, model: this.OnCountryChange, value: this.props.store.UserStore.user.homeCountry },
    homeCity: { icon: <Ionicons name="ios-pin" />, label: 'CITY', placeholder: 'Select your home city', type: INPUT_TYPE.SELECT, select: { options: [] }, value: this.props.store.UserStore.user.homeCity },
    postCode: { icon: <Ionicons name="ios-pin" />, label: 'POSTCODE', placeholder: 'Post code', value: this.props.store.UserStore.user.postCode },
  }

  constructor(props) {
    super(props);
  }

  @action.bound
  OnCountryChange(option) {
    if (option === this.fields.homeCountry.value) return;
    
    this.fields.homeCountry.value = option;
    this.fields.homeCity.value = null;
    this.fields.homeCity.select.options = cities[option];
  }

  @action.bound
  confirm() {
    form.submit(this.fields, this.props.store.UserStore.setHome);
  }

  render() {
    const fields = _.map(this.fields, (field, key) => {
      return <Input key={key} model={text => this.fields[key].value = text} value={field.value} {...field} />
    });
    return (
      <ScrollView contentContainerStyle={styles.content} automaticallyAdjustContentInsets={false} bounces={false}>
        {/* Header */}
        <Text style={styles.logo}>Tripity</Text>
        <View style={{ marginBottom: 40, alignItems: 'center' }}>
          <StyledText>In order to provide the best experience</StyledText>
          <StyledText>we require you to set your home location</StyledText>
        </View>
        {/* Form */}
        <View style={styles.form}>
          {fields}
          <StyledButton throttle={2.5} style={{ marginVertical: 40 }} icon={<Entypo name="chevron-right" />} onPress={this.confirm}>Confirm</StyledButton>
        </View>
        <View style={{ marginBottom: 40, alignItems: 'center' }}>
          <StyledText>By setting your home location</StyledText>
          <StyledText>we are able to group your trips easier</StyledText>
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

export default ScreenAuthCountry;
