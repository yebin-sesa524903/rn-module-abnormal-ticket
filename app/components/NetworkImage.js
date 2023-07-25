'use strict';

import React,{Component} from 'react';

import {ImageBackground,View,PixelRatio,Image} from 'react-native';
import PropTypes from 'prop-types';
// import CryptoJS from "crypto-js";
import appInfo from '../utils/appInfo.js';
import TransformableImage from './ImageComponent/TransformableImage.js';
import CacheableImage from './ImageComponent/CacheableImage.js';
import {isLocalFile} from "../utils/fileHelper";

class NetworkImage extends Component {

  constructor(props){
    super(props);
    this.state = {
      loaded:false,
      defaultSourcePath:null,
    };
  }
  _onLoaded(){
    if(this._unmount) return;
    this.setState({loaded:true});
  }

  componentWillUnmount() {
    this._unmount = true;
    this.setState = () => {};
  }

  componentWillMount() {
    if(this.props.render === false && this.props.name){
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    if(nextProps.name === this.props.name
      && this.state.loaded === nextState.loaded
      && nextProps.render === this.props.render
      && this.state.defaultSourcePath === nextState.defaultSourcePath){
      return false;
    }
    return true;
  }

  render () {
    var {name,style,width,height,imgType,useOrigin,isEncrypt} = this.props;
    var styles = [];
    if(style && Array.isArray(style)){
      styles = styles.concat(style);
    }
    else if(typeof style === 'object' || typeof style === 'number'){

      styles.push(style);
    }
    styles.push({width,height});

    var defaultImage = null;
    if(this.props.defaultSource && !this.state.loaded && !this.props.zoomAble){
      defaultImage = (
        <ImageBackground key={this.props.defaultSource} style={[styles,{zIndex:1}]} resizeMode={this.props.resizeMode} source={this.props.defaultSource}>
          {this.props.children}
        </ImageBackground>
      )
    }
    var realImage = null;
    if(name){
      var uri = name;
      var thuWidth=null;
      var thuHeight=null;
      var thumbUri=null;
      if (this.props.thumbImageInfo) {
        thuWidth=this.props.thumbImageInfo.width;
        thuHeight=this.props.thumbImageInfo.height;
        thumbUri=name;
      }

      if (true || this.props.zoomAble) {
        var obj={
          pixels:{width:this.props.width*2,height:this.props.height*2},
          ref:this.props.cusRef,
          key:{uri},
          resizeMode:this.props.resizeMode,
          source:{uri},
          thumbImageUri:{uri:thumbUri},
          onLoad:()=>this._onLoaded(),
        };
        var objDefaultSource=null;
        if (this.state.defaultSourcePath) {
          objDefaultSource={
            defaultSource:{
              uri: this.state.defaultSourcePath
            },
          };
        }
        var objParam={...this.props.other,...obj,...objDefaultSource};
        realImage = (
          <TransformableImage
            {...objParam}>
            {this.props.children}
          </TransformableImage>
        )
      }
    }

    // if(!this.props.render){
    //   return (
    //     <View style={[styles,{overflow:'hidden',zIndex:1}]}>
    //     </View>
    //   )
    // }
    if(this.props.zoomAble){
      return (
        realImage
      );
    }
    return (
      <View style={[styles,{overflow:'hidden',zIndex:1}]}>
        <View style={{position:'absolute',left:0,right:0,top:0,bottom:0}}>
          {realImage}
        </View>

        {defaultImage}
      </View>

    );

  }
}

NetworkImage.propTypes = {
  children:PropTypes.any,
  uri:PropTypes.string,
  onLoaded:PropTypes.func,
  render:PropTypes.bool,
  name:PropTypes.string,
  resizeMode:PropTypes.string,
  imgType:PropTypes.string,
  useOrigin:PropTypes.bool,
  defaultSource:PropTypes.any,
  style:PropTypes.any,
  width:PropTypes.number,
  height:PropTypes.number,
  zoomAble:PropTypes.bool,
  isEncrypt:PropTypes.bool,
  cusRef:PropTypes.any,
  other:PropTypes.any,
  thumbImageInfo:PropTypes.object,
};

NetworkImage.defaultProps = {
  resizeMode:'cover',
  render:true,
  imgType:'png',
  useOrigin:false,
  isEncrypt:false,
}


module.exports = NetworkImage
