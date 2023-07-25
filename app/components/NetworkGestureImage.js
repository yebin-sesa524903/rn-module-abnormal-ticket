'use strict';

import React,{Component} from 'react';

import {ImageBackground,View,PixelRatio} from 'react-native';
import PropTypes from 'prop-types';
// import CryptoJS from "crypto-js";
import appInfo from '../utils/appInfo.js';
import TransformableImage from './ImageComponent/TransformableImage.js';
import CacheableImage from './ImageComponent/CacheableImage.js';
import Loading from './Loading';

class NetworkImage extends Component {
  static getUri(name,width,height){
    var pWidth = PixelRatio.getPixelSizeForLayoutSize(width);
    var pHeight = PixelRatio.getPixelSizeForLayoutSize(height);


    var bucketName = appInfo.get().ossBucket;

    var uri = `http://${bucketName}/${name}@${pWidth}w_${pHeight}h.png`;
    if(!appInfo.get().prod){
      uri = `http://${bucketName}/${name}?x-oss-process=image/resize,w_${pWidth},h_${pHeight}/format,png`;
      //http://se-t-data.energymost.com/image-ticket-log-15232-301479-1523598793528-11?x-oss-process=image/resize,w_2048,h_1536
    }

    // if(this.props.useOrigin){
    //   uri = `http://${bucketName}/${name}@.jpg`
    // }

    return uri;
  }
  constructor(props){
    super(props);
    this.state = {
      loaded:false,
      defaultSourcePath:null,
      thumbUri:null,
    };

    var {name,style,width,height,imgType,useOrigin} = props;
    var thuWidth=null;
    var thuHeight=null;
    var thumbUri=null;
    console.warn('1',this.props.thumbImageInfo);
    if (this.props.thumbImageInfo) {
      thuWidth=this.props.thumbImageInfo.width;
      thuHeight=this.props.thumbImageInfo.height;
      thumbUri=this._assemlbeUri(name,thuWidth,thuHeight,'jpg',false);
      this.setState({thumbUri:thumbUri})
      console.warn('2',thumbUri);
      // CacheableImage.getFilepathFromSource({uri:thumbUri}).then((res)=>{
      //   console.warn('3',res,this.state.defaultSourcePath);
      //   this.setState({defaultSourcePath:res});
      // });

      // var a=await CacheableImage.getFilepathFromSource({uri:thumbUri});
      // console.warn('-------------------------',a);

      CacheableImage.getFilepathFromSource({uri:thumbUri}).then((res)=>{
        console.warn('3',res,this.state.defaultSourcePath);
        this.setState({defaultSourcePath:res});
      });
    }
  }
  _onLoaded(){
    this.setState({loaded:true});
  }
  _assemlbeUri(name,width,height,imgType,useOrigin){
    var pWidth = PixelRatio.getPixelSizeForLayoutSize(width);
    var pHeight = PixelRatio.getPixelSizeForLayoutSize(height);

    var bucketName = appInfo.get().ossBucket;

    var uri = `http://${bucketName}/${name}@${pWidth}w_${pHeight}h.${imgType==='jpg'?'jpg':'png'}`;
    if(useOrigin){
      uri = `http://${bucketName}/${name}@.jpg`
    }
    return uri;
  }
  componentWillMount() {
    // var {name,style,width,height,imgType,useOrigin} = this.props;
    // var thuWidth=null;
    // var thuHeight=null;
    // var thumbUri=null;
    // console.warn('1',this.props.thumbImageInfo);
    // if (this.props.thumbImageInfo) {
    //   thuWidth=this.props.thumbImageInfo.width;
    //   thuHeight=this.props.thumbImageInfo.height;
    //   thumbUri=this._assemlbeUri(name,thuWidth,thuHeight,'jpg',false);
    //   this.setState({thumbUri:thumbUri})
    //   console.warn('2',thumbUri);
    //   // CacheableImage.getFilepathFromSource({uri:thumbUri}).then((res)=>{
    //   //   console.warn('3',res,this.state.defaultSourcePath);
    //   //   this.setState({defaultSourcePath:res});
    //   // });
    //
    //   // var a=await CacheableImage.getFilepathFromSource({uri:thumbUri});
    //   // console.warn('-------------------------',a);
    //
    //   CacheableImage.getFilepathFromSource({uri:thumbUri}).then((res)=>{
    //     console.warn('3',res,this.state.defaultSourcePath);
    //     this.setState({defaultSourcePath:res});
    //   });
    // }
  }
  componentDidMount(){

  }
  shouldComponentUpdate(nextProps, nextState) {
    // console.warn('aaaa',this.state.defaultSourcePath,nextState.defaultSourcePath);
    if(nextProps.name === this.props.name
      && this.state.loaded === nextState.loaded
      && nextProps.render === this.props.render
      && this.state.defaultSourcePath === nextState.defaultSourcePath
    ){
      console.warn('f');
      return false;
    }
    console.warn('t');
    return true;
  }
  // async getPhotoPath(thumbUri)
  // {
  //   var res =await CacheableImage.getFilepathFromSource({uri:thumbUri});
  //   // console.warn('res...',res);
  //   return res;
  // }
  render () {
    var {name,style,width,height,imgType,useOrigin} = this.props;
      // console.warn(name,style,width,height);
    var styles = [];
    if(style && Array.isArray(style)){
      styles = styles.concat(style);
    }
    else if(typeof style === 'object' || typeof style === 'number'){

      styles.push(style);
    }
    styles.push({width,height});

//defaultSource={{uri: 'file://'+'./Users/SamuelMac/Library/Developer/CoreSimulator/Devices/D67EC84C-BCF6-4CBA-9882-102559D453AE/data/Containers/Data/Application/61445FB6-B500-4921-9A6E-763FA23DCCAF/Documents/se-t-data.energymost.com/ec45897176d73aba7be11f1810904c85361696c6.png'}}

    var defaultImage = null;
    var realImage = null;
    if(name){

// console.warn('4',this.state.thumbUri);
      var uri = this._assemlbeUri(name,width,height,imgType,useOrigin);
      // if (this.props.zoomAble&&this.state.thumbUri) {
      //   console.warn('5',uri);
        var obj={
          pixels:{width:this.props.width*2,height:this.props.height*2},
          ref:this.props.cusRef,
          key:{uri},
          resizeMode:this.props.resizeMode,
          source:{uri},
          thumbImageUri:{uri:this.state.thumbUri},
          onLoad:()=>this._onLoaded(),
        };
        // console.warn('localFilePath...',this.state.defaultSourcePath);
        var objDefaultSource=null;
        if (this.state.defaultSourcePath) {
          objDefaultSource={
            // defaultSource:{uri: 'file://data/user/0/com.energymost.hipdiscoing/files/se-t-data.energymost.com/200eb2a3d1b56562204d4fe87829149e9a62e759.jpg'}
            defaultSource:{
              uri: 'file://'+this.state.defaultSourcePath
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
      // }else {
      //   console.warn('6',uri);
      //   realImage = (
      //     <CacheableImage key={uri} style={[styles,{zIndex:2}]}
      //       source={{uri}}
      //       resizeMode={this.props.resizeMode}
      //       onLoad={()=>this._onLoaded()}
      //       capInsets={{left: 0.1, top: 0.1, right: 0.1, bottom: 0.1}}>
      //       {this.props.children}
      //     </CacheableImage>
      //   )
      // }

    }
    if(!this.props.render){
      return (
        <Loading />
      );
    }
    // if(this.props.zoomAble){
      return (
        realImage
      );
    // }
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
  width:PropTypes.number.isRequired,
  height:PropTypes.number.isRequired,
  zoomAble:PropTypes.bool,
  cusRef:PropTypes.any,
  other:PropTypes.any,
  thumbImageInfo:PropTypes.object,
};

NetworkImage.defaultProps = {
  resizeMode:'cover',
  render:true,
  imgType:'png',
  useOrigin:false,
}


module.exports = NetworkImage
