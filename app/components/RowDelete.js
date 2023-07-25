'use strict'

import React from 'react';

import {View,} from 'react-native'

import Text from './Text.js';
import TouchFeedback from './TouchFeedback';

export default (props) => {
  return (
    <View
      style={{
        flex:1,
        alignItems:'flex-end'
      }}>
      <TouchFeedback style={{
          flex:1,

        }} onPress={props.onPress}>
        <View style={{flex:1,
            width:80,
            backgroundColor:'red',
        justifyContent:'center',
        alignItems:'center'}}>
          <Text style={{
              color:'white'
            }}>{'删除'}</Text>
        </View>

      </TouchFeedback>
    </View>
  )
}
