'use strict';

import React,{Component} from 'react';

import {
	Animated,
	View,
	InteractionManager,
	Platform,
	Keyboard
}  from 'react-native';
import PropTypes from 'prop-types';

export default class KeyboardSpacer extends Component {
	constructor(props) {
		super(props);

		this.state = {
			keyboardHeightAnim: new Animated.Value(0)
		};
	}
  _registerEvents(){
		this._keyboardDidShowSubscription = Keyboard.addListener('keyboardDidShow', (e) => this._keyboardDidShow(e));
		this._keyboardDidHideSubscription = Keyboard.addListener('keyboardDidHide', (e) => this._keyboardDidHide(e));
	}

	_unRegisterEvents() {
		this._keyboardDidShowSubscription && this._keyboardDidShowSubscription.remove();
		this._keyboardDidHideSubscription && this._keyboardDidHideSubscription.remove();
	}

	_keyboardDidShow(e) {
		InteractionManager.runAfterInteractions(() => {
		  // ...long-running synchronous task...
			Animated.spring(this.state.keyboardHeightAnim, {
				toValue: e.endCoordinates.height
			}).start();
		});

	}

	_keyboardDidHide() {
		Animated.spring(this.state.keyboardHeightAnim, {
			toValue: 0
		}).start();

		//防止键盘收起时，高度没有变回0，这里延迟50毫秒再执行一次动画
    setTimeout(()=>{
      Animated.spring(this.state.keyboardHeightAnim, {
        toValue: 0
      }).start();
    },50);
	}
	componentWillMount() {
		if(Platform.OS === 'ios' || this.props.force === true){
			this._registerEvents();
		}
	}

	componentWillUnmount() {
		this._unRegisterEvents();
	}



	render() {
		return <Animated.View style={{ height: this.state.keyboardHeightAnim, }} />;
	}
}

KeyboardSpacer.propTypes = {
	force:PropTypes.bool
}
