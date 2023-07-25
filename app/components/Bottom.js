'use strict'
import React from 'react';

import {View,} from 'react-native'

import {TAB,TAB_BORDER} from '../styles/color';


export default (props) => {
  return (
    <View
      style={
        [{
          position:'absolute',
          left:0,
          right:0,
          bottom:0,
          flex:1,
          borderTopWidth:1,
          borderColor:props.borderColor?props.borderColor:TAB_BORDER,
          backgroundColor:props.backgroundColor?props.backgroundColor:TAB,
          height:props.height||undefined,
          flexDirection:'row',
          justifyContent:'center',
          alignItems:'center',
        },props.style]
      }>
      {props.children}
    </View>
  )
}
