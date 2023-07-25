import React,{Component} from 'react';
import {Image, ActivityIndicator, Platform, View, Dimensions} from 'react-native';
import PropTypes from 'prop-types';
import RNFS, {DocumentDirectoryPath, ExternalDirectoryPath} from 'react-native-fs';
import ResponsiveImage from './ResponsiveImage';
import NetInfo from "@react-native-community/netinfo";
import Loading from '../Loading';

const SHA1 = require("crypto-js/sha1");
const URL = require('url-parse');
import storage from '../../utils/storage.js';
import {getBaseUri} from '../../middleware/bff';
import {isLocalFile} from "../../utils/fileHelper";
import RNFetchBlob from "react-native-fetch-blob";

const dirPath = Platform.OS === 'ios' ? DocumentDirectoryPath : ExternalDirectoryPath
const pathPre = Platform.OS === 'ios' ? '' : 'file://';

export default
class CacheableImage extends Component {

    constructor(props) {
        super(props)
        this.imageDownloadBegin = this.imageDownloadBegin.bind(this);
        this.imageDownloadProgress = this.imageDownloadProgress.bind(this);
        this._handleConnectivityChange = this._handleConnectivityChange.bind(this);
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

    componentWillReceiveProps(nextProps) {
        if (this.compareSource(nextProps)|| nextProps.networkAvailable != this.props.networkAvailable) {
            this.networkAvailable = nextProps.networkAvailable;
            this._processSource(nextProps.source);
        }
    }

    compareSource(nextProps) {
      if(nextProps.source&&this.props.source&&nextProps.source.uri === this.props.source.uri) return false;
      return nextProps.source != this.props.source;
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextState === this.state && nextProps === this.props) {
            return false;
        }
        return true;
    }

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
    //const dirPath = DocumentDirectoryPath;
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
            RNFetchBlob
              .config({
                fileCache : true,
                path:filePath
              })
              .fetch('GET', getBaseUri()+'document/get?id='+cacheKey, {
                //some headers ..
              })
              .then((res) => {
                if(res.respInfo.status === 200) {
                  //成功了
                  if(this.props.onLoad) this.props.onLoad();
                  this.setState({cacheable: true, cachedImagePath: filePath});
                }else {
                  //失败了,删除缓存文件
                  this._deleteFilePath(filePath);
                  this.setState({cacheable: false, cachedImagePath: null});
                }
              });

            // var headers={};
            // let downloadOptions = {
            //   fromUrl: getBaseUri()+'document/get?id='+cacheKey,
            //   toFile: filePath,
            //   background: this.props.downloadInBackground,
            //   begin: this.imageDownloadBegin,
            //   progress: this.imageDownloadProgress,
            //   headers
            // };
            // let download = RNFS.downloadFile(downloadOptions);
            // this.downloading = true;
            // this.jobId = download.jobId;
            // download.promise
            //   .then((res) => {
            //     this.downloading = false;
            //     this.jobId = null;
            //     switch (res.statusCode) {
            //       case 404:
            //       case 403:
            //         this.setState({cacheable: false, cachedImagePath: null});
            //         break;
            //       default:
            //         if(this.props.onLoad) this.props.onLoad();
            //         this.setState({cacheable: true, cachedImagePath: filePath});
            //     }
            //   })
            //   .catch((err) => {
            //     this._deleteFilePath(filePath);
            //     if (this.downloading) {
            //       this.downloading = false;
            //       this.jobId = null;
            //       this.setState({cacheable: false, cachedImagePath: null});
            //     }
            //   });
          })
          .catch((err) => {
            this._deleteFilePath(filePath);
            this.setState({cacheable: false, cachedImagePath: null});
          });
      });
  }

    _deleteFilePath(filePath) {
        RNFS
        .exists(filePath)
        .then((res) => {
            if (res) {
                RNFS
                .unlink(filePath)
                .catch((err) => {console.warn('error _deleteFilePath...',err);});
            }
        });
    }

    _processSource(source, skipSourceCheck) {
        if(source&&isLocalFile(source.uri)){
          this.setState({isRemote: false});
          return;
        }
        if (source !== null
            && source != ''
            && typeof source === "object"
            && source.hasOwnProperty('uri')
            && (
                skipSourceCheck ||
                typeof skipSourceCheck === 'undefined' ||
                (!skipSourceCheck && source != this.props.source)
           )
        )
        { // remote
            if (this.jobId) { // sanity
                this._stopDownload();
            }
            this.checkImageCache(source.uri);
            this.setState({isRemote: true});
        }
        else {
            this.setState({isRemote: false});
        }
    }

    _stopDownload() {
        if (!this.jobId) return;
        this.downloading = false;
        RNFS.stopDownload(this.jobId);
        this.jobId = null;
    }

    componentWillMount() {
        if (this.props.checkNetwork) {
            this._netInfoEvent=NetInfo.addEventListener( this._handleConnectivityChange);
            // componentWillUnmount unsets this._handleConnectivityChange in case the component unmounts before this fetch resolves
            NetInfo.fetch().done(this._handleConnectivityChange);
        }

        this._processSource(this.props.source, true);
    }

    componentWillUnmount() {
      this.setState=()=>{};
        if (this.props.checkNetwork) {
            //NetInfo.removeEventListener('connectionChange', this._handleConnectivityChange);
          if(this._netInfoEvent){this._netInfoEvent()}
            this._handleConnectivityChange = null;
        }
        if (this.downloading && this.jobId) {
            this._stopDownload();
        }
    }

    async _handleConnectivityChange(isConnected) {
        this.networkAvailable = isConnected;
    };

    render() {
      if(!this.state.isRemote&&this.props.defaultSource&&isLocalFile(this.props.defaultSource.uri)){
        return this.renderDefaultSource(false);
      }
      if (!this.state.isRemote && !this.props.defaultSource) {
        return this.renderLocal();
      }

      if (this.state.cacheable && this.state.cachedImagePath) {
          return this.renderCache();
      }

      if (this.props.defaultSource) {
          return this.renderDefaultSource();
      }

      return (
          <Loading />
      );
    }

    renderCache() {
        const { children, defaultSource, checkNetwork, networkAvailable, downloadInBackground, activityIndicatorProps, ...props } = this.props;
        return (
            <ResponsiveImage {...props} source={{uri: 'file://'+this.state.cachedImagePath}}>
            {children}
            </ResponsiveImage>
        );
    }

    renderLocal() {
        const { children, defaultSource, checkNetwork, networkAvailable, downloadInBackground, activityIndicatorProps, ...props } = this.props;
        return (
            <ResponsiveImage {...props}>
            {children}
            </ResponsiveImage>
        );
    }

    renderDefaultSource(showLoading=true) {
        const { children, defaultSource, checkNetwork, networkAvailable,resizeMode, ...props } = this.props;
        return (
            <ResponsiveImage {...props} source={defaultSource} resizeMode={resizeMode}>
              {showLoading?<Loading />:null}
            </ResponsiveImage>
        );
    }
}

CacheableImage.propTypes = {
    activityIndicatorProps: PropTypes.object,
    defaultSource: Image.propTypes.source,
    source: Image.propTypes.source,
    resizeMode: PropTypes.string,
    useQueryParamsInCacheKey: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.array
    ]),
    checkNetwork: PropTypes.bool,
    networkAvailable: PropTypes.bool,
    downloadInBackground: PropTypes.bool,
};

CacheableImage.defaultProps = {
    style: { backgroundColor: 'transparent' },
    activityIndicatorProps: {
        style: { backgroundColor: 'transparent', flex: 1 }
    },
    resizeMode:'cover',
    useQueryParamsInCacheKey: false, // bc
    checkNetwork: true,
    networkAvailable: true,
    downloadInBackground: (Platform.OS === 'ios') ? false : true
};
