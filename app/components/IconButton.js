'use strict'

import React,{Component} from 'react';
import {View,ViewPropTypes} from 'react-native';
import PropTypes from 'prop-types';
import TouchFeedback from './TouchFeedback';
import Icon from './Icon.js';
import {GRAY} from '../styles/color.js';

export default class Button extends Component {
  constructor(props){
    super(props);
  }
  render () {
    var {style,iconType,normalColor,disabled,disableColor}=this.props;

    var center = {justifyContent:'center',alignItems:'center'};

    if(!disabled){
      return (
        <View style={style}>
          <TouchFeedback style={{flex:1}} onPress={this.props.onClick}>
            <View style={[{flex:1},center]}>
              <Icon type={iconType} color={normalColor} size={16} />
            </View>
          </TouchFeedback>
        </View>
      )
    }
    else {

        // <Icon type={iconType} color={disableColor} size={16} />
      return (
        <View style={[center,style,]}>
        </View>
      )
    }
  }
}

Button.propTypes = {
  color:PropTypes.string,
  style:ViewPropTypes.style,
  normalColor:PropTypes.string,
  disableColor:PropTypes.string,
  disabled:PropTypes.bool,
  iconType:PropTypes.oneOfType([PropTypes.string]).isRequired,
  onClick:PropTypes.func.isRequired
};

Button.defaultProps = {
  normalColor:GRAY,
  disableColor:'gray',
  style:{},
  disabled:false,
  iconType:''
}
