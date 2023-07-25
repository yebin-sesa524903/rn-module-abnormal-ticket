'use strict';

import React, { Component } from 'react'
import {
  View,
  Text,
  Image,
  Platform
} from 'react-native';
import ListView from 'deprecated-react-native-listview';
import {connect} from 'react-redux';
import CameraRoll from '@react-native-community/cameraroll';
import PropTypes from 'prop-types';
import Toolbar from './Toolbar';
import List from './List';
import _ from "lodash";
import Loading from './Loading';
import TouchFeedback from './TouchFeedback';
import {refreshAlbum,cacheAlbum} from '../actions/myAction';
import backHelper from '../utils/backHelper';
import DeviceInfo from 'react-native-device-info';

const IS_IOS=Platform.OS=='ios';

class ImageCategory extends Component {

  constructor(props){
    super(props);
    this.ds = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2
    });
    this.state={
      hasPhoto:true,
      data:this.ds.cloneWithRows(this.props.albums.toJS()),
      fetching:true
    }
  }

  componentDidMount() {
    this.getPhotoTypes();
    backHelper.init(this.props.navigator,this.props.route.id);
  }

  componentWillUnmount() {
    backHelper.destroy(this.props.route.id);
  }

  componentWillReceiveProps(nextProps){
    this.setState({
      data:this.ds.cloneWithRows(nextProps.albums.toJS()),
      fetching:false
    });
  }

  getPhotoTypes = async() => {
    let groupTypes='All';
    if(!IS_IOS){
      // groupTypes=undefined;
    }
    //获取相册
    let albums = await CameraRoll.getAlbums({assetType:'Photos'});
    //过滤为0的相册
    albums = albums.filter(ab => ab.count > 0);
    for (let i=0;i<albums.length;i++) {
      let first = await CameraRoll.getPhotos({ first: 1, groupTypes: 'Album', groupName: albums[i].title, assetType:'Photos'});
      if (first && first.edges.length > 0) {
        albums[i].demoImage = first.edges[0].node.image;
        console.log('<<<',i,first.edges[0]);
      }
    }

    const data = await CameraRoll.getPhotos({ first: 100000,include:[],groupTypes,assetType:'Photos'}); //得到10000条相片
    //去重复
    if(data&&data.edges&&data.edges.length>0){
      albums=albums.map(al=>{
        return {
          name: al.title,
          displayName: al.title,
          demoImage: al.demoImage,
          count: al.count
        }
      });
      albums.unshift({
        name: Platform.OS === 'android' ? undefined: 'All Photos',
        displayName: '所有照片',
        demoImage: data.edges[0].node.image,
        count: data.edges.length
      })
      this.props.cacheAlbum(albums);
      return;
    }
    this.setState({
      hasPhoto:false
    })
  }

  _getToolbar(){
    return (
      <Toolbar
        title='请选择相册'
        navIcon="close"
        onIconClicked={this.props.onClose}
      />
    )
  }

  _renderRow(rowData,sid,rid){
    return(
      <View key={rid} style={{backgroundColor:'white',flex:1,paddingHorizontal:16}}>
        <TouchFeedback onPress={()=>this.props.changeAlbum(rowData.displayName,rowData.name)}>
          <View style={{paddingVertical:12,flexDirection:'row',borderBottomColor:'#e6e6e6',
            borderBottomWidth:1}}>
            <Image style={{width:70,height:70}} source={{uri:rowData.demoImage.uri}}/>
            <View style={{justifyContent:'space-around',marginLeft:16,flex:1}}>
              <Text numberOfLines={1} style={{fontSize:18,color:'#333'}}>{rowData.displayName?rowData.displayName:rowData.name}</Text>
              <Text style={{fontSize:16,color:'#999'}}>{rowData.count}</Text>
            </View>
          </View>
        </TouchFeedback>
      </View>
    )
  }

  render () {
    return(
      <View style={{flex:1,backgroundColor:'white'}}>
        {this._getToolbar()}
        {(this.state.hasPhoto&&(!this.props.albums || (this.props.albums.size==0)))?
          <Loading/>
          :
          <List listStyle={{backgroundColor:"white"}}
                isFetching={false}
                listData={this.state.data}
                hasFilter={false}
                currentPage={1}
                emptyText={'暂无相册'}
                renderSeperator={()=>null}
                totalPage={1}
                onRefresh={null}
                renderRow={(rowData,sectionId,rowId)=>this._renderRow(rowData,sectionId,rowId)}
          />
        }

      </View>
    )
  }
}

function mapStateToProps(state) {
  return {
    albums:state.feedBack.get('Albums')
  };
}

export default connect(mapStateToProps,{refreshAlbum,cacheAlbum})(ImageCategory);
