'use strict'
import React from 'react';

import {View,ActivityIndicator} from 'react-native'
import {GREEN} from '../styles/color.js';


export default (props) => {
  return (
    <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
      <ActivityIndicator color={GREEN} size="large" styleAttr="Large" />
    </View>
  )
}
