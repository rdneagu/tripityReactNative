/* React packages */
import React, { Component } from 'react';
import { StyleSheet, Image, View, Text } from 'react-native';

/* Expo packages */
import { Entypo } from '@expo/vector-icons';

/* Community packages */
import { observable, action } from "mobx"
import { observer, inject } from "mobx-react"

/* App components */
import { StyledButton, StyledLink, IndeterminateLoading } from '../../components';

@inject('store')
@observer
class ScreenMainSplash extends Component {
  @observable isLoading = true;

  async componentDidMount() {
    try {
      await this.props.store.UserStore.getUserSession();
    } catch (e) {
      console.warn(e);
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    const { navigation } = this.props;
    const memo = ['Track', 'Discover', 'Go', 'Give back'];
    const load = (this.isLoading)
      ? 
        <View style={{ flexGrow: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <IndeterminateLoading />
        </View>
      : 
        <>
          <View style={styles.memo}>
            {memo.map((m, i) => (
              <View key={i} style={styles.memo}>
                {i !== 0 && <View style={styles.memoBulletWrapper}><View style={styles.memoBullet}></View></View>}
                <Text style={styles.memoText}>{m}</Text>
              </View>
            ))}
          </View>
          <StyledButton style={{ marginVertical: 60 }} icon={<Entypo name="chevron-right" />} onPress={() => navigation.replace('Screen.Auth', { screen: 'Register' })}>Get Started</StyledButton>
          <View style={styles.extra}>
            <Text style={styles.extraText}>Already have an account? <StyledLink onPress={() => navigation.replace('Screen.Auth', { screen: 'Login' })}>Sign In</StyledLink></Text>
          </View>
        </>
    return (
      <View style={styles.content}>
        <Text style={styles.name}>Tripity</Text>
        {/* TODO: Logo */}
        <Image source={require('../../assets/images/placeholder.png')} style={styles.logo} />
        {load}        
      </View>
    )
  }
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: 'center',
  },
  name: {
    marginTop: 80,
    fontSize: 40,
    fontFamily: 'Nunito-Bold',
    color: '#eee'
  },
  logo: {
    height: 300,
  },
  memo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memoBulletWrapper: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoBullet: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  memoText: {
    color: '#eee',
    fontFamily: 'Nunito-Regular',
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

export default ScreenMainSplash;
