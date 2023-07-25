'use strict'

import React,{Component} from 'react';
import {
  View,
  ViewPropTypes,
} from 'react-native';
import PropTypes from 'prop-types';
import TouchFeedback from './TouchFeedback';
import Text from './Text';


export default class Button extends Component {
  constructor(props){
    super(props);
  }
  render () {
    var {style,text,textStyle,disabled,disabledStyle,disabledTextStyle}=this.props;

    if(!disabledStyle){
      disabledStyle = style;
    }

    if(!disabledTextStyle){
      disabledTextStyle = textStyle;
    }

    var center = {justifyContent:'center',alignItems:'center'};

    if(!disabled){
      return (
        <View style={style}>
          <TouchFeedback style={{flex:1}} onPress={this.props.onClick}>
            <View style={[{flex:1},center]}>
              <Text style={textStyle}>{text}</Text>
            </View>
          </TouchFeedback>
        </View>
      )
    }
    else {
      return (
        <View style={[center,style,disabledStyle,]}>
          <Text style={disabledTextStyle}>{text}</Text>
        </View>
      )
    }
  }
}

Button.propTypes = {
  textStyle:Text.propTypes.style,
  color:PropTypes.string,
  style:ViewPropTypes.style,
  disabledStyle:ViewPropTypes.style,
  disabledTextStyle:Text.propTypes.style,
  disabled:PropTypes.bool,
  text:PropTypes.oneOfType([PropTypes.string,PropTypes.number]).isRequired,
  onClick:PropTypes.func.isRequired
};

Button.defaultProps = {
  textStyle:{fontSize:17,color:'white'},
  color:"green",
  style:{},
  disabled:false,
  text:''
}
