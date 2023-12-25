import React,{Component} from 'react';
import {Image, ActivityIndicator, Platform, View} from 'react-native';
import RNFS, { DocumentDirectoryPath,ExternalDirectoryPath } from 'react-native-fs';
import Loading from './components/Loading';
import {getBaseUri, getCookie} from './middleware/bff';
import RNFetchBlob from 'react-native-fetch-blob'
import Colors from "../../../app/utils/const/Colors";

const dirPath = Platform.OS === 'ios' ? DocumentDirectoryPath : ExternalDirectoryPath
const pathPre = Platform.OS === 'ios' ? '' : 'file://';

export default class CacheImage extends Component {

  constructor(props) {
    super(props)
    this.imageDownloadBegin = this.imageDownloadBegin.bind(this);
    this.imageDownloadProgress = this.imageDownloadProgress.bind(this);
    this._stopDownload = this._stopDownload.bind(this);

    this.state = {
      isRemote: false,
      cachedImagePath: null,
      cacheable: true
    };

    this.networkAvailable = props.networkAvailable;
    this.downloading = false;
    this.jobId = null;
  };

  async imageDownloadBegin(info) {
    switch (info.statusCode) {
      case 404:
      case 403:
        break;
      default:
        this.downloading = true;
        this.jobId = info.jobId;
    }
  }

  async imageDownloadProgress(info) {
    if ((info.contentLength / info.bytesWritten) == 1) {
      this.downloading = false;
      this.jobId = null;
    }
  }

  async checkImageCache(cacheKey) {
    const filePath = dirPath+'/'+cacheKey;
    RNFS.exists(filePath)
      .then((res) => {
        if (res) {
          this.setState({cacheable: true, cachedImagePath: filePath});
          if(this.props.onLoad) this.props.onLoad();
        }
        else {
          throw Error("CacheableImage: Invalid file in checkImageCache()");
        }
      })
      .catch((err) => {
        RNFS.mkdir(dirPath, {NSURLIsExcludedFromBackupKey: true})
          .then(() => {
            if (this.state.cacheable && this.state.cachedImagePath) {
              let delImagePath = this.state.cachedImagePath;
              this._deleteFilePath(delImagePath);
            }
            if (this.jobId) {
              this._stopDownload();
            }
            let downUrl = getBaseUri()+'document/get?id='+cacheKey;
            // var headers={};
            // headers[TOKENHEADER]=token;
            // headers[HEADERDEVICEID]=deviceid;
            // let encodeImageUri = encodeURI(imageUri);
            let downloadOptions = {
              fromUrl: downUrl,
              toFile: filePath,
              headers:{
                Cookie:getCookie()
              }
            };

            RNFS.downloadFile(downloadOptions).promise
              .then((res) => {
                // the temp file path
                if(res.statusCode === 200) {
                  //成功了
                  if(this.props.onLoad) this.props.onLoad();
                  this.setState({cacheable: true, cachedImagePath: filePath});
                }else {
                  //失败了,删除缓存文件
                  this._deleteFilePath(filePath);
                  this.setState({cacheable: false, cachedImagePath: null});
                }
              });
          })
          .catch((err) => {
            this._deleteFilePath(filePath);
            this.setState({cacheable: false, cachedImagePath: null});
          });
      });
  }

  _deleteFilePath(filePath) {
    RNFS.exists(filePath)
      .then((res) => {
        if (res) {
          RNFS
            .unlink(filePath)
            .catch((err) => {console.warn('error _deleteFilePath...',err);});
        }
      });
  }

  _stopDownload() {
    if (!this.jobId) return;
    this.downloading = false;
    RNFS.stopDownload(this.jobId);
    this.jobId = null;
  }

  componentWillMount() {
    this.checkImageCache(this.props.imageKey).then();
  }

  componentWillUnmount() {

  }

  render() {
    if(this.state.cacheable && this.state.cachedImagePath) {
      //说明本地有缓存文件
      return (
        <View style={{borderWidth:this.props.borderWidth||0,borderColor:Colors.seBorderSplit,borderRadius:2,marginRight:this.props.space || 0,marginTop:this.props.space || 0}}>
          <Image resizeMode={this.props.mode || 'cover'} source={{uri:pathPre+this.state.cachedImagePath}} style={{width:this.props.width,height:this.props.height}}/>
        </View>
      )
    }
    return (
      <View style={{width:this.props.width,height:this.props.height}}>
        <Loading />
      </View>

    );
  }


}



