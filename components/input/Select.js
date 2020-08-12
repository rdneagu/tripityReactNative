/* React packages */
import React, { Component } from 'react';
import { 
  StyleSheet, TextInput, TouchableWithoutFeedback, View, FlatList, Text, Modal,
  Animated, Easing,
} from 'react-native';

/* Expo packages */
import { Ionicons } from '@expo/vector-icons'; 

/* Community packages */
import { observable, action, computed } from "mobx"
import { observer } from "mobx-react"

/* App components */
import StyledButton from '../StyledButton';

@observer
class Select extends Component {
  @observable visible = false;
  @observable offset = { };

  constructor(props) {
    super(props);
    this.animation = {
      opacity: new Animated.Value(0),
    }
    this.selectRef = React.createRef();
  }

  @computed
  get arrowDirection() {
    return (this.visible) ? 'ios-arrow-up' : 'ios-arrow-down';
  }

  @action.bound
  show() {
    if (!this.props.options.length) return;

    this.selectRef.current.measure((fx, fy, width, height, px, py) => {
      this.offset.top = py + height;
      this.offset.left = px - 4;
      this.offset.width = width + 8;
      this.visible = true;

      Animated.timing(this.animation.opacity, { 
        toValue: 1,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    })
  }

  @action.bound
  hide() {
    const setVisibleToFalse = () => {
      this.visible = false;
    }

    Animated.timing(this.animation.opacity, { 
      toValue: 0,
      duration: 100,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start(setVisibleToFalse);
  }

  @action.bound 
  onSelectChange(option) {
    this.props.model(option);
    this.hide();
  }

  @action.bound
  renderOption({ item }) {
    return (
      <TouchableWithoutFeedback onPress={() => this.onSelectChange(item)}>
        <View style={styles.dropdownOption}>
          <Text>{item}</Text>
        </View>
      </TouchableWithoutFeedback>
    )
  }

  render() {
    return (
      <>
        <TextInput style={this.props.style} value={this.props.value} editable={false} placeholder={this.props.placeholder} placeholderTextColor={this.props.placeholderTextColor} />
        <Ionicons name={this.arrowDirection} style={{ marginLeft: 10 }} size={12} color="#eee" />
        <TouchableWithoutFeedback onPress={this.show}>
          <View style={styles.selectTouch} ref={this.selectRef}>
            <Modal visible={this.visible} transparent={true}>
              <TouchableWithoutFeedback onPress={this.hide}>
                <Animated.View style={{ ...styles.dropdownOverlay, opacity: this.animation.opacity }} />
              </TouchableWithoutFeedback>
              <Animated.View style={{ ...styles.dropdownOuter, ...this.offset, opacity: this.animation.opacity }}>
                <FlatList data={this.props.options} renderItem={this.renderOption} style={styles.dropdownList} keyExtractor={item => item} />
                <View style={styles.control}>
                  <StyledButton type="bordered" icon={<Ionicons name="md-close" />} inversed={true} fill={true} onPress={this.hide}>Cancel</StyledButton>
                </View>
              </Animated.View>
            </Modal>
          </View>
        </TouchableWithoutFeedback>
      </>
    );
  }
}

const styles = StyleSheet.create({
  selectTouch: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  dropdownOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, .3)',
    width: '100%',
    height: '100%',
  },
  dropdownOuter: {
    position: 'absolute',
    maxHeight: 300,
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 8,
  },
  dropdownList: {
    borderColor: '#d3d3d3',
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  dropdownOption: {
    padding: 8,
  },
  control: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  }
});

export default Select;
