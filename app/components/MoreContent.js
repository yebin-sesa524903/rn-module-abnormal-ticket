'use strict'
import React,{Component} from 'react';

import {
  View,Text,
  ViewPropTypes,Linking,
} from 'react-native';
import PropTypes from 'prop-types';
// import Text from '../Text.js';
import {BLACK,GREEN} from '../styles/color.js';
import TouchFeedback from './TouchFeedback';
import Icon from './Icon.js';
import Colors from "../../../../app/utils/const/Colors";

//匹配url的正则表达式
const REG=/https?:\/\/[A-Za-z0-9-_%&\?\/.=]+/g;

export default class MoreContent extends Component {
  constructor(props){
    super(props);
    var needMoreButton = false;
    var lines = props.content.split('\n');
    if(lines.length > props.maxLine){
      needMoreButton = true;
    }
    this.state = {needMoreButton,lines:props.maxLine+1};
    // console.warn(props.title,needMoreButton,props.content.length);
  }
  _checkHeight(e){
    if(!this.state.lines) return;

    var {nativeEvent:{layout:{height}}} = e;
    var maxHeight=72.5+5;
    if (this.props.maxLine===5) {
      maxHeight=120+5;
    }
    // console.warn('hhhh',this.props.maxLine,maxHeight,height);
    if(height > maxHeight){
      this.setState({lines:this.props.maxLine});
      if(!this.state.needMoreButton){
        this.setState({needMoreButton:true});
      }
    }
  }
  _getMoreButton(){
    if(this.state.needMoreButton){
      return (
        <View style={{flex:1,marginTop:10,backgroundColor:Colors.seBgContainer}}>
          <TouchFeedback onPress={()=>{
              this.setState({lines:null,needMoreButton:false})
            }} style={{flex:1,}} >
            <View style={{flex:1,
                alignItems:'center',justifyContent:'center',height:24,}}>
              <Icon type={'icon_arrow_down'} size={16} color={Colors.seBrandNomarl} />
            </View>
          </TouchFeedback>
        </View>

      );
    }
    return null;
  }

  _showLinkText(content){
    if(content&&content.length>0){
      let links=content.match(REG);
      if(links&&links.length>0){
        let items=content.split(REG);
        let arr=[];
        links.forEach((item,index)=>{
          arr.push(<Text key={index*100+1}>{items[index]}</Text>);
          arr.push(<Text key={index*100+2} onPress={()=>Linking.openURL(item)} style={{color:'#219bfd'}}>{item}</Text>);
        });
        arr.push(<Text key={items.length}>{items[items.length-1]}</Text>);
        return arr;
      }else{
        return content;
      }
    }else{
      return null;
    }
  }

  render () {
    var {content,title} = this.props;

    // var {width} = Dimensions.get('window');
    // var lineCount = 1, chars = width - ;
    // lines.forEach((item)=>{
    //   if(item.length >
    // });
    var marginBottom = 0;
    var marginRight = 0;
    if(this.state.needMoreButton){
      marginBottom = 0;
      marginRight = 0;
    }
    return (
      <View style={this.props.style}>
        <View style={{flex:1,marginBottom,position:'relative'}}>
          <Text
            style={[{fontSize:15,color:Colors.seTextPrimary,lineHeight:24,marginRight},this.props.titleStyle]}
            numberOfLines={this.state.lines}
            onLayout={(e)=>{this._checkHeight(e)}}>
            <Text>
            {/*{content}*/}
              {this._showLinkText(content)}
            </Text>
            </Text>
          {this._getMoreButton()}
        </View>
      </View>
    )
  }
}

MoreContent.propTypes = {
  title:PropTypes.string,
  titleStyle:ViewPropTypes.style,
  content:PropTypes.string.isRequired,
  style:ViewPropTypes.style,
  maxLine:PropTypes.number,
}
