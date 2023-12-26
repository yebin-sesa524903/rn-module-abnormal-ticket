'use strict';
import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {
  Alert,
  Dimensions,
  InteractionManager,
  NativeModules,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  View,
} from 'react-native'
import Icon from './Icon.js';
import TouchFeedback from './TouchFeedback';
import Toolbar from './Toolbar';
import Text from './Text';
import Toast from 'react-native-root-toast';
import RNFetchBlob from 'react-native-fetch-blob';

import CameraRollPicker from './antd/image-picker/CameraRollPicker';
import ImageItem from './antd/image-picker/ImageItem';
import CameraRoll from "@react-native-community/cameraroll";
import Permissions, {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';
import Loading from './Loading';

var {ImagePickerManager} = NativeModules;
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {localStr} from "../utils/Localizations/localization";
import Colors from "../../../../app/utils/const/Colors";
import SndAlert from "../../../../app/utils/components/SndAlert";

export default class ImagePicker extends Component {
  // static propTypes = {
  //   onBack:PropTypes.func,
  //   done:PropTypes.func,
  //   max:PropTypes.number,
  // }
  // static defaultProps = {
  //     max:100,
  // }
  constructor(props){
    super(props);
    this.state = {chosenImages:[]};
    this.arrImages=[];
  }
  componentWillMount() {
    let { width } = Dimensions.get('window');
    var imageMargin=4;
    var imagesPerRow=3;
    this._imageSize = (width - (imagesPerRow + 1) * imageMargin) / imagesPerRow;
  }

  componentWillReceiveProps(nextProps){
    if(nextProps.groupName!==this.props.groupName){
      this.setState({
        chosenImages:[]
      })
    }
  }

  _imagePressed(image,selected){
    var ret = this.state.chosenImages;
    var index = ret.findIndex((item)=> item.uri === image.uri);
    if(index >= 0){
      ret.splice(index,1);
    }
    else {
      if(ret.length >= this.props.max){
        return;
      }
      ret.push(image);
    }
    this.setState({chosenImages:ret.slice()});
  }
  static async _takePhoto (cbDone){
      let lastClickTakePhoto = this._lastClickTakePhoto || 0;
      if(Date.now() - lastClickTakePhoto < 1500) {
        return;
      }
      this._lastClickTakePhoto = Date.now();
      let cameraPermission = Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
      try {
          let response = await check(cameraPermission);
          if (!(response === RESULTS.GRANTED || response === RESULTS.LIMITED)) {
              response = await request(cameraPermission);
              if (!(response === RESULTS.GRANTED || response === RESULTS.LIMITED)) {
                  SndAlert.alert(localStr('lang_image_picker_accept_msg'), '',
                  [
                    {text: localStr('lang_image_picker_cancel'), onPress: () => {
                      return;
                    }},
                    {text: localStr('lang_image_picker_accept'), onPress: () => {
                      if (Permissions.openSettings()) {
                        Permissions.openSettings();
                      }
                      return;
                    }}
                  ]
                )
                return;
              }
          }
          //如果是android，为了兼容低版本，还需要判断权限
        if (Platform.OS === 'android') {
          response = await check(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
          if (!(response === RESULTS.GRANTED || response === RESULTS.LIMITED)) {
            response = await request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
            if (!(response === RESULTS.GRANTED || response === RESULTS.LIMITED)) {
              SndAlert.alert(localStr('lang_image_picker_access_storage'),'',
                [
                  {text: localStr('lang_image_picker_cancel'), onPress: () => {
                      return;
                    }},
                  {text: localStr('lang_image_picker_accept'), onPress: () => {
                      if (Permissions.openSettings()) {
                        Permissions.openSettings();
                      }
                      return;
                    }}
                ]
              )
              return;
            }
          }
        }
      }catch (err) {
        return;
      }

    let options = {
      title: '', // specify null or empty string to remove the title
      cancelButtonTitle: localStr('lang_image_picker_cancel'),
      takePhotoButtonTitle: localStr('lang_image_picker_open_photos'), // specify null or empty string to remove this button
      chooseFromLibraryButtonTitle: localStr('lang_image_picker_from_photos'), // specify null or empty string to remove this button
      cameraType: 'back', // 'front' or 'back'
      mediaType: 'photo', // 'photo' or 'video'
      // aspectX: 2, // android only - aspectX:aspectY, the cropping image's ratio of width to height
      // aspectY: 1, // android only - aspectX:aspectY, the cropping image's ratio of width to height
      quality: 0.5, // 0 to 1, photos only
      angle: 0, // android only, photos only
      allowsEditing: false,
      noData: true,
      includeBase64:false,
      maxHeight:1920,
      maxWidth: 1080,
      saveToPhotos:true,
      durationLimit:10,

    };
    launchCamera(options, (response) => {
      console.log('Response = ', response);
      if (response.didCancel) {
        // console.log('User cancelled image picker');
      }
      else if (response.error || response.errorCode) {
        console.warn('ImagePickerManager Error: ', response);
      }
      else if (response.customButton) {
        // console.log('User tapped custom button: ', response.customButton);
      }
      else {
        // You can display the image using either data:
        // const source = {uri: 'data:image/jpeg;base64,' + response.data, isStatic: true};

        // var fileName=fileHelper.getFileNameFromFilePath(response.uri);
        // console.warn('fileName..',fileName);
        var fileName='';
        // uri (on iOS)
        var source;
        if(Platform.OS === 'ios'){
          source = {filename:response.fileName || `${Date.now()}.jpg`,uri: response.uri.replace('file://', ''), isStatic: true};
          CameraRoll.saveToCameraRoll(source.uri);
          // this.props.done([source]);
          cbDone([source]);
        }
        else {
          RNFetchBlob.fs.stat(response.uri).then((fileData)=>{
            source = {name:fileName,uri: response.uri, isStatic: true, filename:fileData.filename};
            CameraRoll.saveToCameraRoll(source.uri);
            // this.props.done([source]);
            cbDone([source]);
          }).catch(err=>{
              console.warn(err);
              source = {name:fileName,uri: response.uri, isStatic: true, filename:response.filename};
            cbDone([source]);
          });
        }
      }
    });
  }

  _takeFinish(imgs){
    if(this.state.chosenImages>=this.props.max){
      return;
    }
    this.props.done(imgs);
  }

  async _finishSelectImages()
  {
    if(Platform.OS !== 'ios'){
      try {
        const imagesPromise=this.state.chosenImages.map((item,index)=>{
          return RNFetchBlob.fs.stat(item.uri);
        });
        const imagesPaths=await Promise.all(imagesPromise);
        this.state.chosenImages.forEach((item,index)=>{
          const filename=imagesPaths[index].filename;
          item.filename=filename;
        });
      } catch (e) {
      } finally {
      }
    }
    this.props.done(this.state.chosenImages);
  }
  _getToolbar(){
    var title = localStr('lang_image_picker_title');//this.props.album;//'图片';
    if(this.state.chosenImages.length > 0){
      title = `${title}（${this.state.chosenImages.length}/${this.props.max}）`;
    }
    return (
      <Toolbar title={title}
        navIcon="back"
        actions={[{
          title:localStr('lang_toolbar_ok'),
          show: 'always', showWithText: true
        }]}
        // titleClick={()=>{this.props.titleClick()}}
        onIconClicked={()=>this.props.onBack()}
        onActionSelected={[()=>{
          this._finishSelectImages();
        }]}
      />
    )
  }
  componentDidMount() {
    if(Platform.OS === 'android'){
      InteractionManager.runAfterInteractions(() => {
        this.requestExternalStorageAccess();
      });
    }else {
      this.requestIOSPhotoPermission();
    }
  }

  async requestIOSPhotoPermission() {
    try{
      let res = check(PERMISSIONS.IOS.PHOTO_LIBRARY);
      if (!(res === RESULTS.GRANTED || res === RESULTS.LIMITED)) {
        res = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
        if (!(res === RESULTS.GRANTED || res === RESULTS.LIMITED)) {
          SndAlert.alert(
            localStr('lang_image_picker_access_photos'),
            '',
            [
              {text: localStr('lang_image_picker_cancel'), onPress: () => {
                }},
              {text: localStr('lang_image_picker_accept'), onPress: () => {
                if (Permissions.openSettings()) {
                    Permissions.openSettings();
                }
              }}
            ]
          )
        }
      }

    }catch (err) {
        console.warn('check ios photo:'+err);
    }

  }

  async requestExternalStorageAccess() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        this.setState({ rollPermissionExists: true })
      } else {
        SndAlert.alert(
          localStr('lang_image_picker_read_storage'),
          '',
          [
            {text: localStr('lang_image_picker_cancel'), onPress: () => {
            }},
            {text: localStr('lang_image_picker_accept'), onPress: () => {
              if (Permissions.openSettings()) {
                Permissions.openSettings();
              }
            }}
          ],
          { cancelable: false }
        )


        //this.setState({ rollPermissionExists: false })
        //直接返回
        // this.props.onBack();
      }
    } catch (err) {
      console.warn(err);
    }
  }

  renderEmptyView = () => {
    console.warn('renderEmptyView');
    const { width, height } = Dimensions.get('window');
    return (
      <View style={{
          flex:1,height: height*0.1, justifyContent: 'center', alignItems: 'center'
      }}
      >
        <Text style={{}}>
          {localStr('lang_image_picker_no_photos')}
        </Text>
      </View>
    )
  }
  renderPaginationFetchingView = () => {
    console.warn('renderPaginationFetchingView');
    const { width, height } = Dimensions.get('window');
    return (
      <View style={{
          flex:1,height: height*0.1, justifyContent: 'center', alignItems: 'center'
      }}
      >
        <Loading/>
      </View>
    )
  }
  renderPaginationWaitingView = () => {
    console.warn('renderPaginationWaitingView');
    const { width, height } = Dimensions.get('window');
    return (
      <View style={{
          flex:1,height: height*0.1, justifyContent: 'center', alignItems: 'center'
      }}
      >
        <Loading/>
      </View>
    )
  }
  renderPaginationAllLoadedView = () => {
    return null;
  }

  // _getParams(){
  //   var param = {
  //     first:50,
  //     assetType: 'Photos',
  //     // groupTypes:'All'
  //   };
  //   if (this.after) {
  //     param.after=this.after;
  //   }
  //
  //   return param;
  // }
  // onFetch = async (page = 1, startFetch, abortFetch) => {
  //   try {
  //     var params=this._getParams();
  //     params.after=this.after;
  //     console.warn('getPhotos',params);
  //     const res = await CameraRoll.getPhotos(params);
  //     if (res) {
  //       const images = res.edges;
  //       // console.warn('images size:',images.length);
  //       var hasNext=false;
  //       if (res.page_info) {
  //         hasNext=res.page_info.has_next_page;
  //         this.after = res.page_info.has_next_page
  //           ? res.page_info.end_cursor
  //           : '';
  //         if (!res.page_info.has_next_page) {
  //           console.warn('end...',res.page_info);
  //         }
  //       }else {
  //         console.warn('page_info...',res);
  //       }
  //       var size=this._getParams().first;
  //       // if (page===1) {
  //       //   images.unshift(
  //       //     {isAddPic:true}
  //       //   );
  //       //   size+=1;
  //       // }
  //
  //       console.warn('startFetch...',images.length,size);
  //       startFetch(images, size);
  //     }
  //   } catch (err) {
  //     console.warn('error...');
  //     abortFetch();
  //   }
  // }
  renderItem = (item, index, separator) => {
    if (item.isAddPic) {
      var whStyle = {width:this._imageSize,height:this._imageSize};
      return (
        <View key={'add'} style={[styles.addStyle,whStyle]}>
          <TouchFeedback onPress={()=>ImagePicker._takePhoto((imgs)=>this._takeFinish(imgs))} style={{flex:1}}>
            <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
              <Icon type="photo" color={'white'} size={whStyle.width/3} />
              <Text style={{color:'white',marginTop:6}}>{localStr('lang_image_take_photo')}</Text>
            </View>
          </TouchFeedback>
        </View>
      )
    }
    var source = item.node.image;
    // var findIndex = this.state.chosenImages.findIndex((item)=>item.uri === source.uri);
    var selected = false;
    // if(findIndex >=0 ){
    //   selected=true;
    // }
    // console.warn('ImagePickerItem',index);

    const uri = item.node.image.uri;
    return (
      <ImageItem
        key={uri}
        item={item}
        selected={selected}
        imageMargin={0}
        // selectedMarker={selectedMarker}
        imagesPerRow={3}
        // containerWidth={containerWidth}
      />
    )
  }
  render() {
    var whStyle = {width:this._imageSize,height:this._imageSize,
      margin:4,backgroundColor:Colors.seBgContainer,
      marginLeft:0,
      marginTop:0,};
    if(!this.state.rollPermissionExists&&Platform.OS==='android'){
      return (
        <View style={{flex:1,backgroundColor:Colors.seBgLayout}}>
          {this._getToolbar()}
          {this.renderPaginationWaitingView()}
        </View>
      );
    }

    return (
      <View style={{flex:1,backgroundColor:Colors.seBgLayout}}>
        {this._getToolbar()}
        <CameraRollPicker
          loadingText={{loading:localStr('lang_loading_waiting')}}
          groupName={Platform.OS==='ios'?'All Photos':undefined}
          selected={this.state.chosenImages} backgroundColor={Colors.seBgLayout}
          callback={(selected, image)=>{
            this._imagePressed(image,selected);
          }}
          getCaptureView={()=>{
            return (
              <View key={'add'} style={[styles.addStyle,whStyle]}>
                <TouchFeedback onPress={()=>ImagePicker._takePhoto((imgs)=>this._takeFinish(imgs))} style={{flex:1}}>
                  <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
                    <Icon type="photo" color={Colors.seTextTitle} size={whStyle.width/3} />
                    <Text style={{color:Colors.seTextTitle,marginTop:6}}>{localStr('lang_image_take_photo')}</Text>
                  </View>
                </TouchFeedback>
              </View>
            )
          }}
        />
      </View>
    );
  }
}

ImagePicker.propTypes = {
  onBack:PropTypes.func,
  done:PropTypes.func,
  max:PropTypes.number,
}
ImagePicker.defaultProps = {
  max:100,
}

const styles = StyleSheet.create({
  scrollView:{
    flex:1,

  },
  content:{
    flexWrap:'wrap',
    flexDirection:'row'
  },



  addStyle: {
    backgroundColor:'gray',
    justifyContent:'center',
    alignItems:'center'
  }
})
