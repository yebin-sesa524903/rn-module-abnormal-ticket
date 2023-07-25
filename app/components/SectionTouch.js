'use strict'
import React,{Component} from 'react';

import {
  View,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';

import Text from './Text';
import TouchFeedback from './TouchFeedback';
import {BLACK,GRAY,LIST_BG} from '../styles/color.js';
import Icon from './Icon.js';

export default class SectionTouch extends Component{
  constructor(props){
    super(props);
  }
  render(){
    var {rowData} = this.props;
    var isExpanded = rowData.isExpanded;
    var sCount = rowData.sCount|0;
    var count = rowData.allHierars.length;//.size;
    var arrow = null;
    var margin={marginBottom:0}
    if(isExpanded){
      arrow = (
        <Icon type="icon_asset_folder" color={GRAY} size={16} />
      )
    }
    else {
      arrow = (
        <Icon type="icon_asset_expand" color={GRAY} size={16} />
      )
      margin.marginBottom=-1;
    }
    return (
      <View style={{flex:1,backgroundColor:'#fff',...margin}}>
        <TouchFeedback style={{flex:1}} onPress={()=>{
              this.props.onSectionClick(rowData);
            }}>
          <View style={[styles.row,styles.rowHeight]}>
            {arrow}
            <View style={{flex:1,marginLeft:10,flexDirection:'row',alignItems:'center'}}>
              <View style={{flex:1}}>
                <Text numberOfLines={1} style={styles.titleText}>
                  {rowData.Name}
                </Text>
              </View>
              <View style={{}}>
                <Text numberOfLines={1} style={styles.valueText}>
                  {'已选'}{sCount+'/'+count}
                </Text>
              </View>
            </View>
          </View>
        </TouchFeedback>
      </View>
    );
  }
}

SectionTouch.propTypes = {
  onSectionClick:PropTypes.func.isRequired,
  rowData:PropTypes.object.isRequired,
}
var styles = StyleSheet.create({
  rowHeight:{
    height:55,
  },
  row:{
    flexDirection:'row',
    alignItems:'center',
    flex:1,
    // backgroundColor:'red',
    justifyContent:'space-between',
    paddingHorizontal:16,
    paddingTop:15,
    paddingBottom:15,
  },
  titleText:{
    fontSize:17,
    color:'#333'//BLACK,
    // flex:1,
    // backgroundColor:'white',
  },
  valueText:{
    textAlign:'right',
    marginLeft:10,
    fontSize:15,
    color:'#888',//GRAY
  }
});
