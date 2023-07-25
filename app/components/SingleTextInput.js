'use strict'
import React,{Component} from 'react';
import {
  View,
  TextInput,
  StyleSheet,

} from 'react-native';
import PropTypes from 'prop-types';

import {BLACK,GRAY,ENV_EDIT_LINE,LIST_BG} from '../styles/color';
import Icon from './Icon.js';
import TouchFeedback from './TouchFeedback';

export default class SingleTextInput extends Component{
  constructor(props){
    super(props);
  }
  _getClearView(props)
  {
    if (props.value) {
      return (
        <TouchFeedback style={{}} onPress={()=>{
            if (props.onChangeText) {
              props.onChangeText('');
            }
          }}>
          <View style={{width:30,height:30,alignItems:'center',justifyContent:'center'}}>
            <Icon type={'icon_unselect'} size={14} color={props.clearColor||GRAY} />
          </View>
        </TouchFeedback>
      )
    }
  }
  render(){
    const {...props} = this.props;
    var style=this.props.style;
    props.clearButtonMode='never';
    return (
      <View style={[style,{flexDirection:'row',alignItems:'center',justifyContent:'center'}]}>
        <TextInput {...props} ref={(input)=>{
            if (this.props.cusRef) {
              this.props.cusRef(input)}
            }
          }/>
        {this._getClearView(props)}
      </View>
    );
  }
}

SingleTextInput.propTypes = {
  style:PropTypes.any,
  cusRef:PropTypes.func,
}

var styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor:LIST_BG,
  },
  inputContainer:{
    // flex:1,
    paddingHorizontal:15,
    flexDirection:'row',
    alignItems:'center',
    // justifyContent:'center',
    // paddingBottom:7,
    height:48,
    borderBottomWidth:1,
    backgroundColor:'white',
    borderColor:ENV_EDIT_LINE
  },
  input:{
    fontSize:17,
    color:BLACK,
    // backgroundColor:'white',
    flex:1,
    // padding:0,
    height:48,
    marginTop:0,marginBottom:0,
  }
});
