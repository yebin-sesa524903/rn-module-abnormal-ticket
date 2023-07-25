'use strict'

import React,{Component} from 'react';

import {Text,Platform} from 'react-native';
import PropTypes from 'prop-types';
// import Platform from 'Platform';


export default class NewText extends Component {
  constructor(props){
    super(props);
  }
  render () {
    //console.log(this.props);
    var styles = [];
    var fontFamily = '';
    // var fontFamily = 'hylishu';
    // var fontFamily = 'Lantinghei';
    // // var fontFamily = '';
    // // var fontFamily = 'FZLanTingHeiS-R-GB';
    //
    // if(Platform.OS === 'ios'){
    // //   var version = Device.systemVersion;
    //   fontFamily = 'Lantinghei SC';
    // //   // console.log(parseFloat(version));
    // //   if(parseFloat(version)>=9){
    // //     fontFamily = 'PingFang SC';
    // //   }
    // }
    // else{
    //   // fontFamily = "SourceHanSansCN-Normal";
    // }

    if(this.props.style && Array.isArray(this.props.style)){
      styles = styles.concat(this.props.style);
    }
    else if(typeof this.props.style === 'object' || typeof this.props.style === 'number'){
      // console.log(Platform);

      // console.log(fontFamily);
      styles.push(this.props.style);
    }
    styles.push({backgroundColor:'transparent'});
    // console.warn('text',styles);

    // var styles = Object.assign({},this.props.style,{fontFamily:'Lantinghei SC'});
    var props = Object.assign({},this.props,{style:styles});

    // console.warn('text',props);


    return (
      <Text {...props} >{this.props.children}</Text>);
  }
}

NewText.propTypes = {
  style:PropTypes.any,
  children:PropTypes.any
};
