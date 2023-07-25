'use strict'

import React,{Component} from 'react';

import {View,StyleSheet,Image,Platform,Dimensions} from 'react-native';
import PropTypes from 'prop-types';
import TouchFeedback from './TouchFeedback';
import Text from './Text';
// import Icon from './Icon.js';
import {TAB,TAB_BORDER,GREEN,TAB_TEXT} from '../styles/color';
import { isPhoneX } from '../utils';
const PADDING_BOTTOM=Platform.select(
  {
    ios:isPhoneX()?34:0,
    android:0,
  }
);

export default class TabBar extends Component {
  constructor(props){
    super(props);
  }
  _getNewVersionIcon(text)
  {
    if (text==='我的'&&this.props.needUpdate) {
      return (
        <View style={{backgroundColor:'red',width:10,height:10,borderRadius:20,
          position:'absolute',right:-8,top:7,
          }}>
        </View>
      );
    }
    if (text==='报警'&&this.props.continUnresolvedAlarm) {
      return (
        <View style={{backgroundColor:'red',width:10,height:10,borderRadius:20,
          position:'absolute',right:-8,top:7,
          }}>
        </View>
      );
    }
    return null;
  }
  _getIconAndTextWith(image,item,selectedColor)
  {
    var itemText=(
      <Text style={[styles.tabText,{color:selectedColor}]}>{item.text}</Text>
    );
    let imgSize=24;
    if (!item.text) {
      itemText=null;
      imgSize=48;
      return (
        <View style={{marginTop:-20,width:imgSize}}>

        </View>
      )
    }
    return (
      <View style={styles.tabText}>
        <Image
          source={image}
          style={{width:imgSize,height:imgSize}}/>
        {itemText}
      </View>
    );
  }
  render () {
    var items = [];
    this.props.arrTabConfig.forEach((item)=>{
      if (item.type==='ticket') {
        items.push(
          {text:'工单',
            normal:require('../images/tab_tickets_normal/tickets_normal.png'),
            selected:require('../images/tab_tickets_selected/tickets_selected.png')}
        )
      }else if (item.type==='alarm') {
        items.push(
          {text:'报警',
            normal:require('../images/tab_alarm_normal/alarm_normal.png'),
            selected:require('../images/tab_alarm_selected/alarm_selected.png')}
        )
      }else if (item.type==='assets') {
        items.push(
          {text:'资产',
            normal:require('../images/tab_assets_normal/assets_normal.png'),
            selected:require('../images/tab_assets_selected/assets_selected.png')}
        )
      }else if (item.type==='my') {
        items.push(
          {text:'我的',
            normal:require('../images/tab_user_normal/user_normal.png'),
            selected:require('../images/tab_user_selected/user_selected.png'),}
        )
      }

    })
    var content = items.map((item,key) => {
      var selectedColor = TAB_TEXT,image = item.normal;
      if(key === this.props.selectedIndex){
        selectedColor = GREEN;
        image = item.selected;
      }
      return (
        <TouchFeedback style={styles.tab} key={key} onPress={()=>this.props.onSelectedChanged(key)}>
          <View style={[styles.tab,{flexDirection:'column'}]}>
            <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
              {
                this._getNewVersionIcon(item.text)
              }
              {
                this._getIconAndTextWith(image,item,selectedColor)
              }
            </View>
          </View>
        </TouchFeedback>
      );
    })

    return (
      <View style={{marginTop:0}}>
      <View style={styles.bottom}>
        {content}
      </View>
      </View>
    );
  }
}

TabBar.propTypes = {
  selectedIndex:PropTypes.number,
  onSelectedChanged:PropTypes.func.isRequired,
  needUpdate:PropTypes.bool,
  continUnresolvedAlarm:PropTypes.bool,
  arrTabConfig:PropTypes.array,
};

TabBar.defaultProps = {
  selectedIndex:0,
};

const NEW_TAB='#fafafa';
const NEW_TAB_BORDER='#e6e6e6';

var styles = StyleSheet.create({
  bottom:{
    // marginTop:-40,
    // flex:1,
    // position:'absolute',
    backgroundColor:NEW_TAB,
    // left:0,
    // right:0,
    // bottom:0,
    height:56+PADDING_BOTTOM,
    borderTopWidth:1,
    borderColor:NEW_TAB_BORDER,
    flexDirection:'row',
    justifyContent:'space-between',
    paddingBottom:PADDING_BOTTOM,
    // marginTop:24
    // alignItems:'center'
  },
  tab:{
    flex:1,
    justifyContent:'center',
    alignItems:'center',
    // backgroundColor:'red'
  },
  tabText:{
    color:TAB_TEXT,
    fontSize:10,
    marginTop:4,
    flexDirection:'column',
    justifyContent:'center',
    alignItems:'center'
  }
});
