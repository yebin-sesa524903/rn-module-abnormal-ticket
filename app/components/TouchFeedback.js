'use strict'

import React,{Component} from 'react';


import {
  View,
  TouchableNativeFeedback,
  TouchableHighlight,
  TouchableOpacity,
  Platform
} from 'react-native';
import PropTypes from 'prop-types';

export default class TouchFeedback extends Component {
  render() {
    if (!this.props.enabled) {
      return (
        <View {...this.props}>
          {this.props.children}
        </View>
      )
    }
    if (Platform.OS === "android" && Platform.Version >= 21) {//LOLLIPOP
      if(Platform.Version >= 21){
        return (
          <TouchableNativeFeedback {...this.props} background={TouchableNativeFeedback.Ripple(this.props.pressColor, this.props.borderless)}>
            {this.props.children}
          </TouchableNativeFeedback>
        );
      }
      else {
        return (
            <TouchableHighlight {...this.props} underlayColor={this.props.pressColor}>
                {this.props.children}
            </TouchableHighlight>
        );
      }

    } else {
      return (
          <TouchableOpacity {...this.props} activeOpacity={0.6}>
              {this.props.children}
          </TouchableOpacity>
      );
    }
  }
}

TouchFeedback.defaultProps = { pressColor: 'rgba(0, 0, 0, .12)',enabled:true};


TouchFeedback.propTypes = {
    pressColor: PropTypes.string,
    borderless:PropTypes.bool,
    children: PropTypes.node.isRequired,
    enabled:PropTypes.bool,
};
