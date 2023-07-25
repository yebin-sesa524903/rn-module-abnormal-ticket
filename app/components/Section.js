'use strict'
import React,{Component} from 'react';
import PropTypes from 'prop-types';

import {View} from 'react-native'
import {GRAY,LIST_BG,} from '../styles/color.js';
import Text from './Text.js';


export default class Section extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    if(this.props.text === nextProps.text){
      return false;
    }
    return true;
  }
  render () {
    if(!this.props.text) return null;
    return (
      <View style={{
          paddingTop:19,
          paddingLeft:16,
          paddingBottom:10,
          backgroundColor:this.props.bkgColor,
        }}>
        <Text style={{
            fontSize:14,
            color:GRAY,}}
            numberOfLines={1}
            >{this.props.text}</Text>
      </View>

    );
  }
}
Section.propTypes = {
  text:PropTypes.string,
  bkgColor:PropTypes.any,
}

Section.defaultProps = {
  bkgColor:LIST_BG,
}
