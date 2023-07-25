'use strict'

import React,{Component} from 'react';
import PropTypes from 'prop-types';

import {View} from 'react-native';

import {LINE} from '../styles/color.js';

export default class ListSeperator extends Component {
  constructor(props){
    super(props);
  }
  render () {
    var {marginWithLeft}=this.props;
    if (marginWithLeft!=='undefined') {
      return (
        <View style={{height:1,backgroundColor:'white',opacity:1}}>
          <View style={{height:1,borderTopWidth:1,backgroundColor:LINE,borderColor:LINE,marginLeft:marginWithLeft}}>
          </View>
        </View>
      )
    }else {
      return (
        <View style={{height:1,backgroundColor:LINE,borderColor:LINE}}>
        </View>
      )
    }
  }
}
ListSeperator.propTypes = {
  marginWithLeft:PropTypes.number,
}
ListSeperator.defaultProps = {
}
