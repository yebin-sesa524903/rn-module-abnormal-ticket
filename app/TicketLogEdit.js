
'use strict';
import React, { Component } from 'react';

import {
  View,
  StyleSheet,
  TextInput,
  NativeModules,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
  Image, Text, TouchableWithoutFeedback
} from 'react-native';

import Toolbar from './components/Toolbar';
import Icon from './components/Icon';

import { BLACK, GRAY, LIST_BG, PICBORDERCOLOR, DOCBKGCOLOR, ADDICONCOLOR } from './styles/color.js';

import TouchFeedback from './components/TouchFeedback.js';

import ImagePicker from "./components/ImagePicker";
import RNFS, { DocumentDirectoryPath } from "react-native-fs";
import { apiCreateLog, apiDownloadFile, apiDownloadFile2, apiUploadFile } from "./middleware/bff";
import CacheImage from "./CacheImage";
import { localStr } from "./utils/Localizations/localization";
import PhotoShowView from "./components/assets/PhotoShowView";
import Loading from './components/Loading';
import Colors from "../../../app/utils/const/Colors";
import SndAlert from "../../../app/utils/components/SndAlert";

const CODE_OK = '0'

let uploadImages = [];

export default class LogEditView extends Component {
  constructor(props) {
    super(props);
    var { width } = Dimensions.get('window');
    var picWid = parseInt((width - 46) / 4.0);
    uploadImages = [];
    let log = { pictures: [] };
    if (this.props.log) {
      log = {
        ...this.props.log,
      }
      log.pictures = [].concat(log.pictures);
    }
    this.state = { imageWidth: picWid, imageHeight: picWid, autoFocus: true, log };
  }

  _logChanged(text) {
    let log = this.state.log;
    log.content = text;
    this.setState({ log })
  }
  _showAuth() {
    return this.props.checkAuth();
  }
  _openImagePicker() {
    this.props.navigation.push('PageWarpper',{
      id: 'imagePicker',
      component: ImagePicker,
      passProps: {
        max: 20 - this.state.log.pictures.length,
        onBack: () => this.props.navigator.pop(),
        done: (data) => {
          this.props.navigator.pop();
          let log = this.state.log;
          log.pictures = log.pictures.concat(data)
          this.setState({ log })
          this._uploadImages();
        }
      }
    });
  }

  _uploadImages() {
    if (this._uploading) return null;
    let upload = () => {
      let pictures = this.state.log.pictures;
      let find = pictures.find(item => item.uri && !item.key && !item.error);
      let readAndUpload = (file) => {
        // console.log('file:',file)
        RNFS.readFile(file, 'base64').then(str => {
          //这里调用接口处理
          apiUploadFile({
            content: str,
            name: find.filename
          }).then(ret => {
            if (ret.code === CODE_OK) {
              find.key = ret.data.key;
              this.setState({})
              upload();
            } else {
              //上传失败，重新上传
              find.error = true;
              this.setState({})
              upload();

            }
          })
        });
      }
      if (find) {
        //先找base64字符串
        let destFile = `${DocumentDirectoryPath}/${find.filename}`;
        if (Platform.OS === 'ios') {
          if (find.uri.startsWith('/')) {
            readAndUpload(find.uri)
          } else {
            RNFS.copyAssetsFileIOS(find.uri, destFile, 0, 0).then(() => {
              readAndUpload(destFile)
            });
          }
        } else {
          readAndUpload(find.uri)
        }
      } else {
        //说明都上传完了
        this._uploading = false;
      }
    }
    upload();
  }

  _goToDetail(index) {
    //查看照片详情
    this.props.navigation.push('PageWarpper',{
      id: 'ticket_log_edit',
      component: PhotoShowView,
      passProps: {
        index: index,
        onBack: () => this.props.navigator.pop(),
        data: this.state.log.pictures
      }
    })
  }
  _deleteImage(item, index) {
    SndAlert.alert(
      localStr('lang_ticket_log_del_img_confirm'),
      '',
      [
        { text: localStr('lang_ticket_filter_cancel'), onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
        {
          text: localStr('lang_ticket_log_del_ok'), onPress: async () => {
            let log = this.state.log;
            this.state.log.pictures.splice(index, 1)
            log.pictures = [].concat(this.state.log.pictures);
            this.setState({ log })
          }
        }
      ])
  }
  _imageLoadComplete(item) {
    this.props.dataChanged('image', 'uploaded', item);
  }
  _saveLog() {
    let data = {
      id: this.props.tid,
      content: this.state.log.content,
      pictures: this.state.log.pictures.map(item => {
        return {
          key: item.key,
          name: item.filename || item.name
        }
      })
    }
    if (this.state.log.id) {
      data.logId = this.state.log.id;
    }
    apiCreateLog(data, !this.state.log.id).then(res => {
      if (res.code === CODE_OK) {
        this.props.callBack();
      } else {
        //失败了
        Alert.alert(localStr('lang_alert_title'), res.msg)
      }
    });
  }


  _getAddButton(index) {
    if (this.state.log.pictures.length >= 20) return null;
    return (
      <View key={index} style={{ padding: 3 }}>
        <View style={{ borderWidth: 1, borderColor: Colors.seTextDisabled }}
          width={this.state.imageWidth}
          height={this.state.imageHeight}>
          <TouchFeedback
            style={{ flex: 1, backgroundColor: 'transparent' }}
            key={index}
            onPress={() => this._openImagePicker()}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Icon type='icon_add' size={36} color={Colors.seTextSecondary} />
            </View>
          </TouchFeedback>
        </View>
      </View>
    );
  }
  _getImageView() {
    var images = this.state.log.pictures.map((item, index) => {
      //判断是相册选中的图片，还是服务端缓存图片
      let child = null;
      if (item.uri) {
        //说明是本地图片
        child = (
          <Image key={index} style={{
            width: this.state.imageWidth - 2,
            height: this.state.imageHeight - 2
          }} source={{ uri: item.uri }} />
        )
        //如果还没上传完，则给一个loading
        if (!item.key) {
          if (item.error) {
            //说明上传失败，给一个提示重试
            child = (
              <View style={{
                width: this.state.imageWidth - 2,
                height: this.state.imageHeight - 2
              }}>
                {child}
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                  <TouchableWithoutFeedback onPress={() => {
                    item.error = null;
                    this.setState({})
                    this._uploadImages()
                  }}>
                    <View style={{ padding: 6, backgroundColor: '#333333aa', borderRadius: 6 }}>
                      <Icon type={'icon_sync'} color={'#fff'} size={16} />
                    </View>
                  </TouchableWithoutFeedback>


                </View>
              </View>
            )
          } else {
            child = (
              <View style={{
                width: this.state.imageWidth - 2,
                height: this.state.imageHeight - 2
              }}>
                {child}
                <View style={{ position: 'absolute', top: (this.state.imageHeight - 2) / 2 - 10, right: (this.state.imageWidth - 2) / 2 - 10, width: 10, height: 10 }}>
                  <Loading />
                </View>
              </View>
            )
          }

        }

      } else {
        //没有url,需要下载图片
        child = (
          <CacheImage key={item.key} imageKey={item.key} width={this.state.imageWidth - 2} height={this.state.imageWidth - 2} />
        )
      }
      return (

        <TouchFeedback
          //style={{flex:1,backgroundColor:'transparent'}}
          key={String(index)}
          onPress={() => this._goToDetail(index)}
          onLongPress={() => this._deleteImage(item, index)}>
          <View key={index} style={{
            margin: 3,
            borderWidth: 1,
            borderColor: Colors.seBorderSplit,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'gray',
            width: this.state.imageWidth,
            height: this.state.imageHeight
          }}>
            {child}
          </View>
        </TouchFeedback>

      );
    });
    images.push(this._getAddButton('add'));
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 3 }}>
        {images}
      </View>
    );
  }

  _canEnable() {
    if (!this.state.log.content || this.state.log.content.trim().length === 0) return false;
    let pic = this.state.log.pictures;
    if (!pic || pic.length === 0) return true;
    return !pic.find(item => item.uri && !item.key);
  }

  _getToolbar() {
    let actions = [{ title: localStr('lang_toolbar_submit'), show: 'always', disable: !this._canEnable() }];
    return (
      <Toolbar
        title={this.props.title}
        navIcon="back"
        actions={actions}
        onIconClicked={this.props.onBack}
        onActionSelected={[() => {
          this._saveLog();
        }]} />
    );
  }
  _getTextEditView(lines, content, inputStyle) {
    return (
      <TextInput
        key={lines}
        ref={(input) => this._input = input}
        style={[styles.input, inputStyle]}
        autoFocus={this.state.autoFocus}
        underlineColorAndroid={'transparent'}
        textAlign={'left'}
        editable={Platform.OS === 'ios' ? this.props.canEdit : true}
        multiline={true}
        placeholderTextColor={Colors.seTextPrimary}
        textAlignVertical={'top'}
        placeholder={localStr('lang_ticket_filter_input')}
        onChangeText={(text) => this._logChanged(text)}
        value={content} />
    );
  }
  render() {
    var lines = 0;
    var content = this.state.log.content || ''
    var imagesView = this._getImageView();
    var contentContainerStyle = {};
    var inputStyle = {};
    if (!imagesView) {
      contentContainerStyle = { flex: 1 };
      inputStyle = { flex: 1 }
    }
    else {
      inputStyle = { height: 142 }
    }
    return (
      <View style={{ flex: 1, backgroundColor: Colors.seBgLayout }}>
        {this._getToolbar()}
        <ScrollView
          style={{ flex: 1, }}
          contentContainerStyle={[contentContainerStyle, { backgroundColor: Colors.seBgContainer }]}>
          <View style={{}}>
            {this._getTextEditView(lines, content)}
          </View>

          <View style={{ marginHorizontal: 8 }}>
            {imagesView}
          </View>
        </ScrollView>
      </View>
    );
  }
}




var styles = global.amStyleProxy(()=>StyleSheet.create({
  input: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    textAlignVertical: 'top',
    fontSize: 14,
    color: Colors.seTextTitle,
    padding: 0,
    margin: 16,
    // backgroundColor:'gray'
  },
  button: {
    // marginTop:20,
    height: 48,
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 6,

  },
}));
