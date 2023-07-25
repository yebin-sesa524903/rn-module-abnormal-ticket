'use strict';

import React,{Component,PropTypes} from 'react';

import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';

var {width,height} = Dimensions.get('window');

export default class FadeInView extends Component {
  constructor(props){
    super(props);
    this.state={fadeAnim:new Animated.Value(0)};
  }

  componentDidMount() {
    this._animate(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this._animate(nextProps);
  }

  _animate(newProps){
    return Animated.timing(this.state.fadeAnim, {
      toValue: newProps.visible ? 1.0 : 0,useNativeDriver:true,
      duration: 300
    }).start();
  }

  render(){
    return (
      <Animated.View style={[styles.overlay,
          {opacity: this.state.fadeAnim},
          {backgroundColor:'#00000066'}
        ]}>
        {this.props.children}
      </Animated.View>
    );
  }
}

var styles = StyleSheet.create({
  overlay: {
    width: '100%',zIndex: 999,height: '100%',
    position: 'absolute'
  }
});
