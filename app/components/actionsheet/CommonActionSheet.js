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
    return (
      <FadeInView visible={this.props.modalVisible}>
        <Modal
          animationType="slide"
          transparent={true}
          visible={this.props.modalVisible}
          onRequestClose={this.props.onCancel}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.container} onPress={this.props.onCancel}></TouchableOpacity>
            {this.props.children}
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
    paddingBottom: 0,
    justifyContent: "flex-end",
  }
});
