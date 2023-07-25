'use strict'
import React,{Component} from 'react';

import {View,Text,PanResponder,UIManager,findNodeHandle} from 'react-native'

const LETTERS='#ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const OTHER=['名称','时间','类型','状态'];

export default class LettersIndexView extends Component{

  constructor(props){
    super(props);
    this.other = this.props.special || OTHER;
  }

  componentWillMount() {
    this._panGesture = PanResponder.create({
      //要求成为响应者：
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderTerminationRequest: (evt, gestureState) => true,

      onPanResponderGrant: (evt, gestureState) => {
        let {locationX,locationY,pageX,pageY} =evt.nativeEvent;
        this._letter=null;
        this._handle(pageY);
      },
      onPanResponderMove: (evt, gestureState) => {
        let {locationX,locationY,pageX,pageY} =evt.nativeEvent;
        this._handle(pageY);
      },
      onResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
      },
      onPanResponderTerminate: (evt, gestureState) => {
      },
    });
  }

  async _handle(y){
    if(!this._height){
      let size=await this.layout(this.refs.letter);
      this._height=size.height;
      this._y=size.pageY;
      this._rowHeight=this._height/(LETTERS.length+this.other.length);
    }
    let offsetY=y-this._y;
    let n=offsetY/this._rowHeight;
    let index=Number.parseInt(n);
    let letter;
    if(index<this.other.length){
      letter=this.other[index];
    }else{
      letter=LETTERS[index-this.other.length];
    }

    if(letter&&this.props.clickLetter){
      if(letter!==this._letter){
        this._letter=letter;
        this.props.clickLetter(letter);
      }
    }
  }

  layout(ref) {
    const handle = findNodeHandle(ref);
    return new Promise((resolve) => {
      UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
        resolve({
          x,
          y,
          width,
          height,
          pageX,
          pageY
        });
      });
    });
  }

  renderLetters(){
    let arr=[];//
    this.other.forEach(item=>{
      arr.push(
        <Text key={'other:'+item} style={{fontSize:11,lineHeight:13,color:'#666'}}>{item}</Text>
      )
    });
    for(let i=0;i<LETTERS.length;i++){
      arr.push(
        <Text key={LETTERS[i]} style={{fontSize:11,lineHeight:13,color:'#666'}}>{LETTERS[i]}</Text>
      )
    }
    return arr;
  }

  render() {
    return (
      <View ref="letter" style={{paddingHorizontal:3,alignItems:'center'}} onLayout={(e)=>{}}
        {...this._panGesture.panHandlers}>
        {this.renderLetters()}
      </View>
    )
  }
}

