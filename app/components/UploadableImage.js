'use strict';

import React,{Component} from 'react';

import {
  View,
  ImageBackground,
} from 'react-native';
import PropTypes from 'prop-types';

import Text from './Text.js';
import {getBaseUri} from '../middleware/api.js';
import {TOKENHEADER,HEADERDEVICEID} from '../middleware/api.js';
import storage from '../utils/storage.js';

class UploadableImage extends Component {
  constructor(props){
    super(props);
    this.state = {percent:0,loaded:false};
    if(props.loaded){
      this.state.loaded = true;
    }
  }

  async _uploadImage() {
    // console.warn('UploadableImage');
    var xhr = new XMLHttpRequest();
    var postUri = `${getBaseUri()}images/upload/${this.props.name}`;
    if(this.props.postUri){
      postUri = `${getBaseUri()}${this.props.postUri}`;
    }
    xhr.open('POST', postUri);
    xhr.setRequestHeader(TOKENHEADER,await storage.getToken());
    xhr.setRequestHeader(HEADERDEVICEID,await storage.getDeviceId());

    xhr.onload = () => {
      if (xhr.status !== 200) {
        console.warn(
          'Upload failed',
          'Expected HTTP 200 OK response, got ' + xhr.status,
          this.props.name,
          this.props.uri
        );
        return;
      }
      if (!xhr.responseText) {
        console.warn(
          'Upload failed',
          'No response payload.'
        );
        return;
      }
      // console.warn('xhr.responseText',xhr.responseText);
      this.setState({loaded:true});
      this.props.loadComplete(xhr.responseText);
    };
    var formdata = new FormData();
    // console.warn('uri',this.props.uri);
    // console.warn('name',this.props.name);
    formdata.append('filename',{uri:this.props.uri,name:this.props.name,type:'image/jpg',});

    if (xhr.upload) {
      xhr.upload.onprogress = (event) => {
        // console.warn('upload onprogress', event);
        if (event.lengthComputable) {
          // console.warn('uploadProgress',{uploadProgress: event.loaded / event.total});
          this._uploadProgress({currentSize:event.loaded,totalSize:event.total})
        }
      };
    }
    xhr.send(formdata);


    return;

	}
  _uploadProgress(obj){
    var {currentSize,totalSize} = obj;
    // console.warn('uri',this.props.uri);
    this.setState({percent:currentSize/totalSize});
  }
  componentDidMount() {
    this._uploadImage();
  }
  componentWillReceiveProps(nextProps) {
    if(nextProps.uri !== this.props.uri && !nextProps.loaded){
      this.setState({percent:0,loaded:false});
      this._uploadImage();
    }
  }
  render () {
    var {resizeMode} = this.props;


    var progress = parseInt(this.state.percent*100);
    var text = null;
    if(progress !== 100){
      text = (
        <Text style={{
            textAlign: 'center',
            color: 'white',
            backgroundColor: 'transparent'
          }}>{progress+'%'}</Text>
      )
    }

    var overlay = (
      <View style={
        {
          height: this.props.height*(1-this.state.percent),
          width: this.props.width,
          position:'absolute',
          left:0,
          bottom:0,
          right:0,
          backgroundColor:'black',
          opacity:0.4
        }
      }>

    </View>);
    var children = null;
    var imageStyle = {
      height: this.props.height,
      width: this.props.width,
      margin: 0,
      padding: 0,
      justifyContent:'center',
      alignItems:'center',
    };
    if(this.state.loaded){

      // return (
      //   <Image
      //     source={{uri:this.props.uri}}
      //     resizeMode={resizeMode} style={{width:this.props.width,height:this.props.height}}>
      //     {this.props.children}
      //   </Image>
      // );
      text = null;
      overlay = null;
      children = this.props.children;
      imageStyle = {
        height: this.props.height,
        width: this.props.width,
        margin: 0,
        padding: 0,
      };
    }

    return (
      <View style={[{
        overflow: 'hidden',
        height: this.props.height,
        width: this.props.width,
        padding: 0,
      },this.props.style]}>
        <ImageBackground
          source={{uri:this.props.uri}}
          resizeMode={resizeMode}
          style={imageStyle} >
          {overlay}
          {text}
          {children}
        </ImageBackground>
      </View>
    );

  }
}

UploadableImage.propTypes = {
  uri:PropTypes.string,
  children:PropTypes.object,
  name:PropTypes.string,
  resizeMode:PropTypes.string,
  loaded:PropTypes.bool,
  style:PropTypes.object,
  height:PropTypes.number,
  width:PropTypes.number,
  postUri:PropTypes.string,
  loadComplete:PropTypes.func,
  onLongPress:PropTypes.func
};

UploadableImage.defaultProps = {
  resizeMode:'cover',
  postUri:''
}


module.exports = UploadableImage
