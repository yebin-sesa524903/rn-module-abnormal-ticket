'use strict';

import React,{Component} from 'react';
import {
  View,
} from 'react-native';
import PropTypes from 'prop-types';
import ViewFinder from './ViewFinder.js';
import {RNCamera} from 'react-native-camera';

export default class Scanner extends Component{
  constructor(props){
    super(props);
    this.state={zoom:0}
  }

  componentWillUnmount() {
    // console.warn('unmount Scanner');
  }
  render() {
    return (
      <RNCamera
        style={{flex:1,}}
        zoom={this.props.zoom}
        onBarCodeRead={this.props.onBarCodeRead}
         >
        <View style={{flex:1,backgroundColor:'#000000',opacity:0.6,}}>

        </View>
        <View style={{flexDirection:'row',height:200}}>
          <View style={{flex:1,backgroundColor:'#000000',opacity:0.6,}}>

          </View>
          <View style={{
              width:200,
            }} >
            <ViewFinder />
          </View>
            <View style={{flex:1,backgroundColor:'#000000',opacity:0.6,}}>

            </View>
        </View>

          <View style={{flex:1,backgroundColor:'#000000',opacity:0.6,}}>

          </View>
      </RNCamera>
    );
  }
}


Scanner.propTypes = {
  onBarCodeRead:PropTypes.func.isRequired
}
