'use strict';
import React,{Component} from 'react';

import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import Button from './Button';
import FadeInView from './FadeInView';
import TouchFeedback from '../TouchFeedback';
import Text from '../Text';
import PropTypes from 'prop-types';

import {isPhoneX} from '../../utils';
let toBottom=0;
if(isPhoneX()) toBottom=34;

export default class SchActionSheet extends Component {
  constructor(props){
    super(props);
  }

  _getTitleView()
  {
    if (!this.props.title) {
      return;
    }
    return (
      <View style={{
          height:45,backgroundColor:'transparent',
          justifyContent:'center',alignItems:'center',
          borderBottomColor:'#4d4d4d22',borderBottomWidth:1,
        }}>
        <Text style={{fontSize:13,color:'#8e8e9c'}}>
          {this.props.title}
        </Text>
      </View>
    )
  }
  render() {
    var {arrActions}=this.props;
    var itemsView=arrActions.map((item,index)=>{
      return (
        <View key={index} style={{}}>
          <TouchFeedback onPress={()=>this.props.onSelect(item)}>
            <View style={{
                height:55,backgroundColor:'transparent',justifyContent:'center',alignItems:'center',
                borderTopColor:'#4d4d4d22',borderTopWidth:index===0?0:1,
              }}>
              <Text style={{fontSize:18,color:item.select?'#0d0d0d':'#0076ff'}}>
                {item.title}
              </Text>
            </View>
          </TouchFeedback>
        </View>
      )
    })
    return (
      <FadeInView visible={this.props.modalVisible}>
        <Modal
          animationType="slide"
          transparent={true}
          visible={this.props.modalVisible}
          onRequestClose={this.props.onCancel}>
          <View style={styles.modalContainer}>

            <TouchableOpacity style={styles.container} onPress={this.props.onCancel}></TouchableOpacity>
              <View style={{backgroundColor:'white',marginBottom:8,
              borderRadius:12,marginHorizontal:10}}>
                {this._getTitleView()}
                {itemsView}
              </View>
            <Button onPress={this.props.onCancel} text={this.props.buttonText || "取消"} />
          </View>
        </Modal>
      </FadeInView>
    );
  }
}

SchActionSheet.propTypes = {
  arrActions:PropTypes.array,
  onSelect:PropTypes.func,
  title:PropTypes.string,
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    paddingBottom: toBottom,
    justifyContent: "flex-end",
  }
});
