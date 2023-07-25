'use strict'

import React,{Component} from 'react';
import PropTypes from 'prop-types';

import {View,StyleSheet,ViewPropTypes,TextInput} from 'react-native';
import TouchFeedback from './TouchFeedback';
import Text from './Text';
import Icon from './Icon';
import {GREEN,GRAY,TAB_BORDER} from '../styles/color.js';


export default class SearchBar extends Component {
  constructor(props){
    super(props);
    this.state={text:''}
  }
  render () {
    var {showCancel,cancelText,cancelStyle,onCancel,onClear,onChangeText,
      hint,value,hintColor,style} = this.props;
    let cancelButton=null;
    if(showCancel){
      cancelButton=(
        <TouchFeedback onPress={()=>onCancel&&onCancel()}>
          <View>
            <Text style={[{fontSize:16,color:GREEN,paddingHorizontal:16,paddingVertical:3,marginRight:-16},cancelStyle]}>
              {cancelText||'取消'}
            </Text>
          </View>
        </TouchFeedback>
      );
    }

    let searchIcon=null,clearIcon=null;
    searchIcon=(
      <Icon type="icon_search" color={'#bbb'} size={15}/>
    );
    if(value&&value.length>0){
      clearIcon=(
        <TouchFeedback onPress={()=>{
          // this.refs.input.setNativeProps({ text: '' });
          onClear&&onClear();
          this.refs.input.focus();
        }}>
          <View>
          <Icon type="icon_unselect" color={'#ccc'} size={15}/>
          </View>
        </TouchFeedback>
      )
    }

    return (
      <View style={[{flexDirection:'row',alignItems:'center',paddingVertical:8,paddingHorizontal:16},style]}>
        <View style={{flexDirection:'row',flex:1,alignItems:'center',height:32,backgroundColor:this.props.inputBg||'#f2f2f2',
          borderRadius:6,paddingHorizontal:8}}>
          {searchIcon}
          <TextInput ref={'input'} style={[{fontSize:15,color:'#333',flex:1,marginHorizontal:6,padding:0}]}
            numberOfLines={1} value={value} placeholder={hint}
            placeholderTextColor={hintColor||'#bbb'} onChangeText={onChangeText}
          />
          {clearIcon}
        </View>
        {cancelButton}
      </View>
    )

  }
}

SearchBar.propTypes = {
  showCancel:PropTypes.bool,
  cancelText:PropTypes.string,
  cancelStyle:ViewPropTypes.style,
  onCancel:PropTypes.func,
  onClear:PropTypes.func,
  onChangeText:PropTypes.func,
  hint:PropTypes.string,
  value:PropTypes.string,
  hintColor:PropTypes.string,
  style:ViewPropTypes.style
};

var styles = StyleSheet.create({

});
