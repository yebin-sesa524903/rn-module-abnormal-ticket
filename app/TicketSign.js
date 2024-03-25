import React, { Component } from 'react';

import { View, Image, Text } from 'react-native';
import SignatureCapture from 'react-native-signature-capture';
import Toolbar from './components/Toolbar';
import TouchFeedback from './components/TouchFeedback';
import Icon from './components/Icon';
import Orientation from 'react-native-orientation';
import { isPhoneX } from '../../../app/utils';
import { localStr } from 'rn-module-abnormal-ticket/app/utils/Localizations/localization';
export default class SignView extends Component {

  constructor() {
    super();
    this.state = {
      signature: null,
      showTip: true,
      delayLoad: false
    };
  }

  _getToolbar() {
    return (
      <Toolbar
        title={localStr('lang_sign_title')}
        navIcon="back"
        isLandscape={true}
        onIconClicked={this.props.onBack} />
    )
  }

  componentDidMount() {
    Orientation.lockToLandscape();
    setTimeout(() => {
      this.setState({ delayLoad: true })
      Orientation.lockToLandscape();
    }, 200);
  }

  componentWillUnmount() {
    Orientation.lockToPortrait();
  }

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {this._getToolbar()}
        <View style={[{ flex: 1 }]}>
          {this.state.delayLoad ?
            <SignatureCapture
              style={[{ flex: 1 }]}
              ref="sign"
              square={true}
              showBorder={false}
              onSaveEvent={this._onSaveEvent.bind(this)}
              onDragEvent={this._onDragEvent.bind(this)}
              saveImageFileInExtStorage={false}
              showNativeButtons={false}
              showTitleLabel={false}
              viewMode={"landscape"} />
            : null
          }

          <View pointerEvents="box-none"
            style={{ position: 'absolute', left: 0, bottom: 0, right: 0, top: 0, backgroundColor: '#d9d9d966' }}
            onStartShouldSetResponder={(e) => true}>
            <View style={{ margin: 12, flexDirection: 'row' }}>
              <Icon type="icon_info" color="#fbb325" size={16} />
              <Text style={{ fontSize: 16, color: '#888', marginLeft: 8 }}>{localStr('lang_sign_tip')}</Text>
            </View>
            <View pointerEvents="none" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 25, color: '#b2b2b2' }}>{this.state.showTip ? localStr('lang_sign_tip2') : ''}</Text>
            </View>

            <View style={{
              flexDirection: 'row', margin: 24, marginBottom: 24 + isPhoneX() ? 34 : 0,
              justifyContent: 'space-between'
            }}>
              {this._getButton(localStr('lang_sign_reset'), () => this.resetSign())}
              {this._getButton(localStr('lang_sign_ok'), () => this.saveSign())}
            </View>
          </View>
        </View>
      </View>
    )
  }

  _getButton(title, click) {
    return (
      <TouchFeedback onPress={() => click()}>
        <View style={{
          width: 80, height: 32, borderColor: '#3dcd58', borderWidth: 1, borderRadius: 2,
          justifyContent: 'center', alignItems: 'center'
        }}>
          <Text style={{ fontSize: 16, color: '#3dcd58', }}>{title}</Text>
        </View>
      </TouchFeedback>
    )
  }

  saveSign() {
    if (this.state.showTip) {
      this.props.saveSign(null);
      return;
    }
    this.refs["sign"].saveImage();
  }

  resetSign() {
    this.refs["sign"].resetImage();
    this.setState({ showTip: true })
  }

  _onSaveEvent(result) {
    if (this.props.saveSign) {
      this.props.saveSign(result.encoded);
    }
  }
  _onDragEvent() {
    this.setState({ showTip: false })
  }
}
