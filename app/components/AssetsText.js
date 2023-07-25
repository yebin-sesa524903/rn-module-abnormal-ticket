'use strict'

import React, {Component} from 'react';

import {Text, Platform} from 'react-native';
import PropTypes from 'prop-types';
import Icon from './Icon';

export default class AssetsText extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    let count = this.props.assets.length;
    if (count === 0 && !this.props.emptyText) return null;
    if (count === 0 && this.props.emptyText) {
      return (
        <Text style={{fontSize: this.props.textSize, color: this.props.textColor}}>
          {this.props.emptyText}
        </Text>
      )
    }
    let _index = 0;
    let arr = [];
    this.props.assets.forEach((item, index) => {
      arr.push(<Icon type={this.props.assetIcons[index]} key={_index}
                     color={this.props.iconColor} size={this.props.iconSize}/>);
      _index++;
      arr.push(<Text key={_index}>{' ' + item + (index===this.props.assets.length-1?'':this.props.separator)}</Text>);
      _index++;
    });

    return (
      <Text numberOfLines={this.props.lineNumber}
            style={{fontSize: this.props.textSize, color: this.props.textColor,lineHeight:this.props.textSize+8}}>
        {arr}
      </Text>
    );
  }
}

AssetsText.propTypes = {
  assetIcons: PropTypes.array,
  lineNumber: PropTypes.number,
  assets: PropTypes.array,
  textSize: PropTypes.number,
  iconSize: PropTypes.number,
  textColor: PropTypes.string,
  iconColor: PropTypes.string,
  separator: PropTypes.string,
  children: PropTypes.any,
  emptyText: PropTypes.string,
};

AssetsText.defaultProps = {
  assets: [],
  emptyText: null,
  lineNumber: 10000,
  assetIcons: [],
  textSize: 14,
  iconSize: 14,
  separator: '，',
  textColor: '#333',
  iconColor: '#333',
};
