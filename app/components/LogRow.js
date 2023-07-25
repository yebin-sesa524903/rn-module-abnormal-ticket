'use strict'

import React,{Component} from 'react';

import {
  View,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';

import Text from './Text';
import TouchFeedback from './TouchFeedback';
import NetworkImage from './NetworkImage';
import {BLACK,ASSET_IMG_BORDER} from '../styles/color';
import moment from 'moment';

export default class LogRow extends Component{
  constructor(props){
    super(props);
  }
  _getContentImageView(){
    var {rowData} = this.props;
    var time = moment(rowData.get('UpdateTime')).format("YYYY-MM-DD HH:mm");
    var content = rowData.get('Content') || '无附加文本';
    return (
      <View style={[styles.row,styles.rowHeight,{flexDirection:'row',justifyContent:'space-between'}]}>
        <View style={{flex:1,marginTop:16,marginRight:16}}>
          <Text style={styles.nameText} numberOfLines={1} lineBreakModel='charWrapping'>{rowData.get('CreateUserName')}
          </Text>
          <Text style={styles.contentText} numberOfLines={1} lineBreakModel='charWrapping'>{`${time} ${content}`}
          </Text>
        </View>
        <View style={{paddingTop:10}}>
          <NetworkImage
            style={{borderWidth:0.3,borderColor:ASSET_IMG_BORDER}}
            key={rowData.getIn(['Pictures',0,'PictureId'])}
            defaultSource = {require('../images/building_default/building.png')}
            width={70} height={55}
            name={rowData.getIn(['Pictures',0,'PictureId'])} />
        </View>

      </View>
    )
  }
  _getContentView(){
    var {rowData} = this.props;
    var time = moment(rowData.get('UpdateTime')).format("YYYY-MM-DD HH:mm");
    var content = rowData.get('Content') || '无附加文本';
    // console.warn('contentview',time,content);
    var conText = time.toString() + ' ' + content.toString();
    return (
      <View style={[styles.row,styles.rowHeight,{paddingTop:16}]}>
        <Text style={styles.nameText} numberOfLines={1} lineBreakModel='charWrapping'>{rowData.get('CreateUserName')}
        </Text>
        <View style={{flex:1}}>
          <Text  style={styles.contentText} numberOfLines={1} lineBreakModel='charWrapping'>{conText}
          </Text>
        </View>
      </View>
    )
  }

  render(){
    var {rowData} = this.props;
    return (
      <View style={{flex:1,backgroundColor:'white'}}>
        <TouchFeedback onLongPress={()=>this.props.onRowLongPress(rowData)} onPress={()=>{this.props.onRowClick(rowData)}}>
          {rowData.get('Pictures').size > 0 ?
              this._getContentImageView() : this._getContentView()}
        </TouchFeedback>
      </View>

    );
  }
}

LogRow.propTypes = {
  user:PropTypes.object,
  onRowClick:PropTypes.func.isRequired,
  onRowLongPress:PropTypes.func.isRequired,
  rowData:PropTypes.object.isRequired,
}

var styles = StyleSheet.create({
  rowHeight:{
    height:74
  },
  row:{
    backgroundColor:'white',
    paddingHorizontal:16,
  },
  titleRow:{
    flexDirection:'row',
    // backgroundColor:'red',
    alignItems:'flex-start',
    justifyContent:'space-between',
  },
  nameText:{
    color:BLACK,
    fontSize:17
  },
  contentText:{
    color:BLACK,
    fontSize:12,
    marginTop:13
  },



});
