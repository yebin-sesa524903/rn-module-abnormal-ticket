'use strict'
import React,{Component} from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import PropTypes from 'prop-types';

import Text from '../Text';
// import TouchFeedback from '../TouchFeedback';
import NetworkImage from '../NetworkImage';

export default class PhotoRow extends Component{
  constructor(props){
    super(props);
  }
  render(){
    var {rowData} = this.props;
    var {width,height} = Dimensions.get('window');
    var imgKey = this.props.type!=='singlePhoto'?'PictureId':'ImageId';
    var contentKey = this.props.type!=='singlePhoto'?'Content':'Description';
    var name = rowData.get(imgKey);
    var context = rowData.get(contentKey);
    // console.warn('contentKey',imgKey,contentKey,rowData);
    if (!name) {
      name = rowData.get('uri');
    }
    var imageWidth = width;
    var imageHeight = parseInt(imageWidth * 2 / 3);
    imageHeight = height - 80;
    /*

    <ZoomableImage
      imageHeight={imageHeight}
      imageWidth={imageWidth}
      source={name}
      style={{flex:1,width:imageWidth}}
      isNetworkImage={true}
    />
    */
    console.warn('context',context);
    return (
      <View style={[styles.rowStyle,{width,height:height-80}]}>
        <View style={{flex:1,backgroundColor:'black',justifyContent:'center'}}>
          <NetworkImage
            resizeMode='contain'
            width={imageWidth}
            height={imageHeight}
            zoomAble={true}
            render={this.props.render}
            name={name}>

          </NetworkImage>
          <View style={styles.bottom}>
            <Text style={{fontSize:15,color:'white'}} >
              {context}
            </Text>
          </View>
        </View>
      </View>
    );
  }
}

PhotoRow.propTypes = {
  user:PropTypes.object,
  rowId:PropTypes.string,
  type:PropTypes.string,
  render:PropTypes.bool,
  onRowClick:PropTypes.func.isRequired,
  rowData:PropTypes.object.isRequired,
}

var styles = StyleSheet.create({
  rowStyle: {
    // flex:1,
    justifyContent: 'center',
    // padding: 10,
    // marginTop:5,
    // marginLeft:3,
    // width: 85,
    // height: 85,
    backgroundColor: 'black',
    alignItems: 'center',
    borderWidth: 1,
    // borderColor: 'gray'
  },
  bottom:{
    position:'absolute',
    bottom:0,
    left:0,
    right:0,
    flex:1,
    backgroundColor:'rgba(0,0,0,.6)',
    justifyContent:'center',
    paddingHorizontal:10,
    paddingVertical:5,
  },
});
