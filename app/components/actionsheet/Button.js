'use strict'


import React,{Component} from 'react';

import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import PropTypes from 'prop-types';
import Text from '../Text';

import TouchFeedback from '../TouchFeedback';
import Colors from "../../../../../app/utils/const/Colors";

export default class Button extends Component {
  render(){
    return (
      <View style={{paddingHorizontal:10,backgroundColor:'transparent',}}>
        <TouchFeedback style={{}} onPress={this.props.onPress}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>
              {this.props.text}
            </Text>
          </View>
        </TouchFeedback>
      </View>
    );
  }
}

var styles = global.amStyleProxy(()=>StyleSheet.create({
  buttonText: {
    color: Colors.seInfoNormal,//'#0076ff',
    alignSelf: 'center',
    fontSize: 18
  },
  button: {
    height: 55,
    backgroundColor: Colors.seBgElevated,
    borderColor: 'white',
    borderWidth: 0,
    borderRadius: 12,
    marginBottom: 9,
    alignSelf: 'stretch',
    justifyContent: 'center'
  }
}));
