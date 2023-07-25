'use strict'

import React,{Component} from 'react';
import {
  View,Text,
  StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';
import TouchFeedback from './TouchFeedback.js';
import {GREEN,GRAY,ALARM_FILTER_BUTTON_BORDER} from '../styles/color';
export default class SelectorButton extends Component {
  constructor(props){
    super(props);
  }
  _onClick(){
    this.props.onClick();
  }
  componentWillReceiveProps(nextProps) {
  }
  shouldComponentUpdate(nextProps, nextState) {
    if(nextProps.text !== this.props.text) return true;
    if(nextProps.selected === this.props.selected){
      return false;
    }
    return true;
  }
  render () {
    if(!this.props.text){
      return (
        <View style={[styles.item]} >
        </View>
      );
    }
    var color = this.props.unCheckedBg || 'white';
    var fontColor = this.props.unCheckedFontColor || GRAY;
    var borderColor = ALARM_FILTER_BUTTON_BORDER;
    if(this.props.selected){
      color = this.props.checkedBg || GREEN;
      fontColor = this.props.checkedFontColor || 'white';
      borderColor = GREEN;
    }

    var fontSize = this.props.fontSize||15;
    var flexStart = null;
    if(this.props.text.length>10){
      fontSize = 12;
      flexStart = styles.flexStart;
    }
    return (
      <View style={[styles.item,
        {backgroundColor:color,borderColor,borderWidth:this.props.borderWidth||1,
          borderRadius:this.props.borderRadius||0},
        this.props.style]}>
        <TouchFeedback style={[styles.button,flexStart]} onPress={()=>this._onClick()}>
          <View style={[styles.button,flexStart]}>
            <Text numberOfLines={2} style={[styles.itemText,{color:fontColor,fontSize}]}>{this.props.text}</Text>
          </View>
        </TouchFeedback>
      </View>
    )
  }
}

SelectorButton.propTypes = {
  selected: PropTypes.bool,
  text:PropTypes.string,
  style:PropTypes.object,
  onClick:PropTypes.func,
};

var styles = StyleSheet.create({
  item:{
    height:32,
    // marginRight:17,
    borderRadius:2,
    flex:1,

  },
  button:{
    flex:1,
    justifyContent:'center',
    // alignItems:'center',
    overflow:'hidden'
    // backgroundColor:'red'
  },
  itemText:{
    // flex:1
    textAlign:'center'
  },
  flexStart:{
    // justifyContent:"flex-start"
  }
});
