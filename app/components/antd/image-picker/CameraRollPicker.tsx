import React, { Component } from 'react';
import {GetPhotosParamType, Platform, StyleSheet, View, ViewStyle,
  Dimensions, Text} from 'react-native';
import ListView from '../list-view';
import ImageItem from './ImageItem';
import CameraRoll from "@react-native-community/cameraroll";
import TouchFeedback from '../../TouchFeedback';
import Icon from '../../Icon.js';
import Loading from '../../Loading';
import ImagePickerItem from '../../ImagePickerItem.js';

export interface CameraRollPickerStyle {
  wrapper: ViewStyle;
  row: ViewStyle;
  marker: ViewStyle;
  spinner: ViewStyle;
}
const styles = StyleSheet.create<CameraRollPickerStyle>({
  wrapper: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    flex: 1,
  },
  marker: {
    position: 'absolute',
    top: 5,
    backgroundColor: 'transparent',
  },
  spinner: {},
});

export interface CameraRollPickerProps extends GetPhotosParamType {
  maximum: number;
  selectSingleItem?: boolean;
  imagesPerRow: number;
  imageMargin: number;
  containerWidth?: number;
  callback?: (...args: any[]) => any;
  selected?: any[];
  selectedMarker?: JSX.Element;
  backgroundColor?: string;
}
export type CameraRollPickerState = {
  selected: any;
  images: any[];
};
class CameraRollPicker extends Component<
  CameraRollPickerProps,
  CameraRollPickerState
  > {
  static defaultProps = {
    groupTypes: 'All',//'SavedPhotos',
    maximum: 50,
    imagesPerRow: 3,
    imageMargin: 4,
    first: 50,
    selectSingleItem: false,
    assetType: 'Photos',
    backgroundColor: 'white',
    selected: [],
    getCaptureView:function () {},
    callback: function (selectedImages: any, currentImage: any) {
      // tslint:disable-next-line:no-console
      console.log(currentImage);
      // tslint:disable-next-line:no-console
      console.log(selectedImages);
    },
  };
  after: string | undefined;
  constructor(props: CameraRollPickerProps) {
    super(props);
    this.state = {
      images: [],
      selected: this.props.selected,
    };
  }
  componentWillMount() {
    let { width } = Dimensions.get('window');
    const { imageMargin, imagesPerRow, containerWidth } = this.props;
    if (typeof containerWidth !== 'undefined') {
      width = containerWidth;
    }
    this._imageSize = (width - (imagesPerRow + 1) * imageMargin) / imagesPerRow;
  }

  componentWillUnmount(){
    this._cacheData=null;
  }

  componentWillReceiveProps(nextProps: CameraRollPickerProps) {
    this.setState({
      selected: nextProps.selected,
    });
    if(nextProps.groupName != this.props.groupName){
        this._toEnd=false;
        this._cacheData=null;
        this.setState({loading: true},()=>{
          this.after=undefined;
          this.listView.ulv.postRefresh([{changeAlbum:true}],1);
          this.listView.refresh();
        })
    }
  }

  _filterRepeat(data){
    if(data&&data.length>0){
      if(!this._cacheData){
        this._cacheData=[];
        data.forEach((item,index)=>{
          // let noRepeat=true;
          for(let i=0;i<this._cacheData.length;i++){
            let item2=this._cacheData[i];
            if(item2.node)
              if(item.node.image.uri===this._cacheData[i].node.image.uri){
                return;
              }
          }
          this._cacheData.push(item);
        });
        return this._cacheData;
      }else{
        let filterData=data.filter((item,index)=>{
          // let noRepeat=true;
          for(let i=0;i<this._cacheData.length;i++){
            let item2=this._cacheData[i];
            if(item2.node)
              if(item.node.image.uri===this._cacheData[i].node.image.uri){
                return false;
              }
          }
          return true;
        });

        this._cacheData=this._cacheData.concat(filterData);
        return filterData;
      }
    }
    return data;
  }

  onFetch = async (page= 1, startFetch: any, abortFetch: () => void) => {
    try {
      const {
        assetType,
        groupTypes,
        first,
        groupName,
        mimeTypes,
      } = this.props;

      if(this._toEnd){
        startFetch([],0);
        return;
      }

      const params: GetPhotosParamType = {
        first,
        after: this.after,
        assetType: assetType,
        groupName,
        mimeTypes,
      };
      if (Platform.OS !== 'android') {
        params.groupTypes = groupTypes;
        if (groupName !== 'All Photos')
          params.groupTypes = 'Album';
      }

      const res = await CameraRoll.getPhotos(params);
      this.setState({loading: false})
      // console.warn('res',res);
      if (res) {
        var data = res.edges;
        data=this._filterRepeat(data);
        let hasNextPage=true;
        if (res.page_info) {
          hasNextPage=res.page_info.has_next_page;
          this.after = res.page_info.has_next_page
            ? res.page_info.end_cursor
            : '';
        }
        if((!data || data.length===0)&&hasNextPage){
          //startFetch([{isEmpty:true}], 0);
          abortFetch();
          return;
        }
        var size=first;
          if (page===1) {
            data.unshift(
              {isAddPic:true}
            );
            size+=1;
          }
        startFetch(data, size);
        if(!hasNextPage){
          this._toEnd=true;
        }

      }
    } catch (err) {
      if (__DEV__) {
        // tslint:disable-next-line:no-console
        console.error(err);
      }
      abortFetch(); // manually stop the refresh or pagination if it encounters network error
      this.setState({loading: false})
    }
  };
  render() {
    const { imageMargin, backgroundColor, imagesPerRow } = this.props;
    return (
      <View
        style={[
          styles.wrapper,
          {
            padding: imageMargin,
            paddingRight: 0,
            backgroundColor: backgroundColor,
          },
        ]}
      >
        <ListView {...this.props.loadingText}
          ref={ref => this.listView = ref}
          onFetch={this.onFetch}
          refreshable={false}
          numColumns={imagesPerRow}
          paginationAllLoadedView={this.renderPaginationAllLoadedView}
          renderItem={item => this._renderImage(item)}
        />
        {
          this.state.loading ?
            (
              <View style={{position:'absolute',left:0,right:0,bottom:0,top:0}}>
                <Loading/>
              </View>
            )
            : null
        }
      </View>
    );
  }

  renderPaginationAllLoadedView = () => {
    return null;
  }
  _renderImage = (item: any) => {
    if(item.isEmpty) return null;
    if(item.changeAlbum) {
      return null;
    }
    const { selected } = this.state;
    const {
      imageMargin,
      selectedMarker,
      imagesPerRow,
      containerWidth,
      getCaptureView,
    } = this.props;

    if (item.isAddPic) {
      return getCaptureView();
      var whStyle = {width:this._imageSize,height:this._imageSize};
      return (
        <View key={'add'} style={[{
          backgroundColor:'gray',
          justifyContent:'center',
          alignItems:'center',
          margin:imageMargin,
          marginLeft:0,
          marginTop:0,
        },whStyle]}>
          <TouchFeedback onPress={()=>this._takePhoto()} style={{flex:1}}>
            <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
              <Icon type="photo" color={'white'} size={this._imageSize/3} />
              <Text style={{color:'white',marginTop:6}}>{'拍照'}</Text>
            </View>
          </TouchFeedback>
        </View>
      )
    }

    const uri = item.node.image.uri;
    const isSelected =
      this._arrayObjectIndexOf(selected, 'uri', uri) >= 0 ? true : false;

    return (
      <ImageItem
        key={uri}
        item={item}
        selected={isSelected}
        imageMargin={imageMargin}
        selectedMarker={selectedMarker}
        imagesPerRow={imagesPerRow}
        containerWidth={containerWidth}
        // tslint:disable-next-line:jsx-no-bind
        onPress={this._selectImage.bind(this)}
      />
    );
  };

  _selectImage(image: { uri: any }) {
    const { maximum, callback, selectSingleItem } = this.props;
    var selected = this.state.selected;

    // const index = this._arrayObjectIndexOf(selected, 'uri', image.uri);
    // if (index >= 0) {
    //   selected.splice(index, 1);
    // } else {
    //   if (selectSingleItem) {
    //     selected.splice(0, selected.length);
    //   }
    //   if (selected.length < maximum!) {
    //     selected.push(image);
    //   }
    // }
    //
    // this.setState({
    //   selected: selected,
    // });
    callback!(selected, image);
  }
  _nEveryRow(data: any, n: number) {
    const result = [];
    let temp = [];
    for (let i = 0; i < data.length; ++i) {
      if (i > 0 && i % n === 0) {
        result.push(temp);
        temp = [];
      }
      temp.push(data[i]);
    }
    if (temp.length > 0) {
      while (temp.length !== n) {
        temp.push(null);
      }
      result.push(temp);
    }
    return result;
  }
  _arrayObjectIndexOf(array: any, property: string, value: any) {
    return array
      .map((o: any) => {
        return o[property];
      })
      .indexOf(value);
  }
}

export default CameraRollPicker;
