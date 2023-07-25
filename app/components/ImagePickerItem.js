'use strict';

import React, { Component } from 'react'
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from './Icon.js';

import {GREEN} from '../styles/color.js';
import TouchFeedback from './TouchFeedback';

class ImagePickerItem extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    if(nextProps.source.uri === this.props.source.uri
      && nextProps.selected === this.props.selected){
      return false;
    }
    return true;
  }
  render () {
    var chooseStyle= styles.chooser;
    var {width} = Dimensions.get('window');
    var whStyle = {width:width/3,height:width/3};
    var masker = null,icon;
    if(this.props.selected){
      chooseStyle = styles.chosen;
      masker = (
        <View style={styles.masker}>
        </View>
      )
      icon = (
        <Icon type="icon_check" color={'white'} size={15} />
      );
    }

    return (
      <View  style={[styles.imageContainer,whStyle]}>
        <Image source={this.props.source} style={[styles.imageStyle,whStyle]} />
        {masker}
        <View style={styles.chooserContainer}>
          <TouchFeedback
            onPress={()=>this.props.imagePressed(this.props.source)}
            style={{flex:1,}}>
            <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
              <View style={[chooseStyle]}>
                {icon}
              </View>
            </View>

          </TouchFeedback>
        </View>

      </View>
    )
  }
}

const styles = StyleSheet.create({
  imageContainer:{
    position:'relative'
  },
  imageStyle: {
    flex: 1,
  },
  masker:{
    position:'absolute',
    top:0,
    left:0,
    right:0,
    bottom:0,
    backgroundColor:'black',
    opacity:0.4
  },
  chooserContainer:{
    width:44,
    height:44,
    position:'absolute',
    // backgroundColor:'red',
    top:0,
    right:0,
  },
  chooser:{
    borderWidth:2,
    borderColor:'white',
    width:20,
    height:20,
    borderRadius:2,
  },
  chosen:{
    backgroundColor:GREEN,
    borderWidth:1,
    borderColor:GREEN,
    width:18,
    height:18,
    borderRadius:2,
  },
});

ImagePickerItem.propTypes = {
  source:PropTypes.object,
  selected:PropTypes.bool,
  imagePressed:PropTypes.func,
}

export default ImagePickerItem;
