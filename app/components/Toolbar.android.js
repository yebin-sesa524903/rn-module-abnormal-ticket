'use strict';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { View, StyleSheet, Image, ViewPropTypes, StatusBar } from 'react-native';
import { GREEN, IOS_NAVBAR, LINE, LIGHTGRAY, GRAY } from '../styles/color.js';
import Text from './Text.js';
import TouchFeedback from './TouchFeedback';
import privilegeHelper from '../utils/privilegeHelper.js';
import Icon from './Icon';
import { IconOutline } from "@ant-design/icons-react-native";
import Colors from "../../../../app/utils/const/Colors";

const height = 56 + StatusBar.currentHeight;//80;
const statusBarHeight = StatusBar.currentHeight;//24;
const sideWidth = 38;
const navHeight = 56;

export default class Toolbar extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    var { navIcon, onIconClicked, tintColor, color, borderColor, title, titleColor, actions } = this.props;
    var navView = null;
    var width = 20;
    var navImage = null;
    if (navIcon === 'back') {
      navImage = require('../images/back_arrow/back_arrow.png');
    }
    else if (navIcon === 'close') {
      navImage = require('../images/close/close.png');
    }
    var marginLeft = 0;

    if (navImage) {
      navView = (
        <TouchFeedback style={{}} onPress={onIconClicked}>
          <View style={{ paddingHorizontal: 16, height: navHeight, marginLeft, justifyContent: 'center', }}>
            <Image style={{ tintColor: titleColor ? tintColor : Colors.seTextInverse, width, height: width }} source={navImage} />
          </View>
        </TouchFeedback>
      );
    }
    else {
      navView = (
        <View style={{ marginLeft: 16 }}>
        </View>
      );
    }
    var actionsView = null;
    if (actions) {
      actions = actions.filter((item) => {
        if (!item.code) return true;
        // console.warn('item.code',item.code);
        if (privilegeHelper.hasAuth(item.code)) return true;
        return false;
      });
      actionsView = actions.map((item, index) => {
        // console.warn('actions.map((item,index)=>{',item);
        var imageOrText = null;
        var enabled = !item.disable;
        if (item.iconType || item.icon) {
          if (item.iconType === 'add') {
            item.icon = require('../images/add/add.png');
          }
          else if (item.iconType === 'edit') {
            item.icon = require('../images/edit/edit.png');
          }
          else if (item.iconType === 'delete') {
            item.icon = require('../images/delete/delete.png');
          } else if (item.iconType === 'filter') {
            item.icon = require('../images/filter/filter.png');
          } else if (item.iconType === 'share') {
            item.icon = require('../images/share/screen_share.png');
          }
          imageOrText = (
            <Image style={{ tintColor: Colors.seTextInverse, width: 18, height: 18 }} source={item.icon} />
          );
        } else if (item.isFontIcon) {
          imageOrText = <Icon type={item.type} color={enabled ? Colors.seTextInverse : Colors.seTextDisabled} size={16} />
        } else if (item.isAntIcon) {
          imageOrText = <IconOutline name={item.type} size={20} color={Colors.seTextInverse} />
        }
        else {
          width = null;
          imageOrText = (
            <Text style={{ color: enabled ? Colors.seTextInverse : Colors.seTextDisabled, fontSize: 15, textAlign: 'right', marginRight: 8 }}>{item.title}</Text>
          );
        }
        if (!enabled) {
          return (
            <View key={index} style={{
              paddingHorizontal: 8, height: navHeight,
              justifyContent: 'center', alignItems: 'center'
            }}>
              {imageOrText}
            </View>
          )
        } else {
          return (
            <TouchFeedback key={index} style={{}} onPress={() => {
              if (enabled) {
                this.props.onActionSelected[index](item);
              }
            }}>
              <View key={index} style={{
                paddingHorizontal: 8, height: navHeight,
                justifyContent: 'center', alignItems: 'center'
              }}>
                {imageOrText}
              </View>
            </TouchFeedback>
          );
        }
      });
    }
    else {
      actionsView = (
        <View style={{ width: sideWidth }}>
        </View>
      );
    }

    var titleStyle = [styles.titleText];
    if (titleColor) {
      titleStyle.push({ color: Colors.seTextInverse });
    } else {
      titleStyle.push({ color: Colors.seTextInverse });
    }

    if (color === 'transparent') {
      borderColor = 'transparent';
    } else {
      color = '#fff';
      borderColor = '#e6e6e6';
    }
    // else if (!color) {
    //   color=GREEN;
    // }

    return (
      <View style={[styles.navSty, { backgroundColor: Colors.seBrandNomarl, borderColor: Colors.seBorderSplit }]}>
        <View style={{
          flexDirection: 'row',
          flex: 1, alignItems: "center",
          paddingLeft: this.props.switchLogo ? 46 : 0
          // alignItems:'flex-start',
          // backgroundColor:'#333a'
        }}>
          {navView}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start', overflow: 'hidden' }}>
            {/*<Text style={titleStyle} numberOfLines={1}>*/}
            {/*{title}*/}
            {/*</Text>*/}
            {this._renderClickTitle(titleStyle, title)}
          </View>
        </View>
        <View style={{ flexDirection: 'row', marginRight: 8, marginLeft: 8 }}>
          {
            actionsView
          }
        </View>
      </View>
    );
  }

  _renderTitleSuffix() {
    if (!this.props.titleSuffix) return null;
    return (
      <Text style={styles.titleSuffixText} numberOfLines={1}>
        {this.props.titleSuffix}
      </Text>
    );
  }

  _renderClickTitle(titleStyle, title) {
    if (this.props.titleClick) {
      return (
        <TouchFeedback onPress={() => {
          this.props.titleClick()
        }}>
          <View style={{ flex: 1, justifyContent: 'flex-start', flexDirection: 'row', alignItems: 'center' }}>
            <Text style={titleStyle} numberOfLines={1}>
              {title}
            </Text>
            {this._renderTitleSuffix()}
            <Icon style={{ marginLeft: 6 }} type={'icon_arrow_down'} color={'#333'} size={14} />
          </View>
        </TouchFeedback>
      );
    } else {
      return (
        <View style={{ alignItems: 'center', flexDirection: 'row' }}>
          <Text style={titleStyle} numberOfLines={1}>
            {title}
          </Text>
          {this._renderTitleSuffix()}
        </View>
      )
    }
  }
}

Toolbar.propTypes = {
  noShadow: PropTypes.bool,
  style: ViewPropTypes.style,
  opacity: PropTypes.number,
  titleColor: PropTypes.string,
  color: PropTypes.string,
  navIcon: PropTypes.string,
  onIconClicked: PropTypes.func,
  tintColor: PropTypes.string,
  title: PropTypes.string,
  actions: PropTypes.any,
  onActionSelected: PropTypes.any,
  borderColor: PropTypes.string,
}

Toolbar.defaultProps = {
  noShadow: false,
  color: GREEN,
  tintColor: GREEN,
  borderColor: LINE,
  opacity: 1
}

var styles = StyleSheet.create({
  navSty: {
    // marginTop:statusBarHeight,
    paddingTop: statusBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent:'space-between',
    // justifyContent:'center',
    height,
    backgroundColor: GREEN,
    borderBottomWidth: 1,

  },
  titleText: {
    fontSize: 17,
    fontWeight: 'bold',
    // textAlign: 'center',
    color: Colors.seTextInverse,
    flexShrink: 1
  },
  titleSuffixText: {
    fontSize: 15,
    textAlign: 'center',
    color: Colors.seTextInverse,
    marginLeft: 4
  }
});
