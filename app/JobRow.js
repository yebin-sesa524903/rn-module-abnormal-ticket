'use strict';
import React, { Component } from 'react';

import {
  View,
  Platform,
  TextInput,
  Text, TextInput as TextInput2,
  Dimensions
} from 'react-native';

import SndToast from '../../../app/utils/components/SndToast';
import CacheImage from "./CacheImage";
// import Loading from '../Loading';
import TouchFeedback from "./components/TouchFeedback";
import Colors from "../../../app/utils/const/Colors";
import PhotoShowView from "rn-module-abnormal-ticket/app/components/assets/PhotoShowView.js";
import Icon from "./components/Icon";
import { localStr } from './utils/Localizations/localization.js';
import JobRemak from 'rn-module-abnormal-ticket/app/JobRemark.js';


const CHECKEDVIEW = (
  <View style={{
    width: 22, height: 22, justifyContent: 'center', alignItems: 'center',
    borderRadius: 11, borderColor: Colors.seBrandNomarl, borderWidth: 1
  }}>
    <View style={{ width: 11, height: 11, borderRadius: 5.5, backgroundColor: Colors.seBrandNomarl }} />
  </View>
);

const UNCHECKVIEW = (
  <View style={{ width: 22, height: 22, borderColor: Colors.seTextPrimary, borderWidth: 1, borderRadius: 11 }} />
)

const width = Dimensions.get('window').width;

export default class JobRow extends Component {

  constructor(props) {
    super(props);
    this._isDestory = false;

    this.picWid = parseInt((width - 46 - 40) / 4.0);
    this.state = {
      data: this.props.data,
      enable: true
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.data !== nextProps.data) {
      this.setState({ data: nextProps.data })
    }
  }

  //抄表类别
  _renderReadingMeterRow(row, index) {
    let invalidView = null;

    let value = row.result;
    let maxValue = row.maxValue;
    let minValue = row.minValue;
    let result = value;
    if (result === null || maxValue === null || minValue === null) {
      invalidView = false;
    } else {
      result = Number(result); minValue = Number(minValue); maxValue = Number(maxValue);
      if (result > maxValue || result < minValue) {
        invalidView = true;
      }
    }
    if (invalidView) {
      invalidView = (
        <View style={{
          width: 52, height: 22, backgroundColor: Colors.seErrorBg,
          borderRadius: 2, borderWidth: 1, borderColor: Colors.seErrorBorder, marginLeft: 16,
          alignItems: 'center', justifyContent: 'center'
        }}>
          <Text style={{ fontSize: 12, color: Colors.seErrorColor }}>{localStr('lang_job_row_exception')}</Text>
        </View>
      );
    }

    let strValue = String(value).trim();
    let isNumber = true;
    if (strValue.length > 1) {
      if (strValue[0] === '.' || strValue[strValue.length - 1] === '.') isNumber = false;
    }

    let msgView = this.props.isOffline ? null : (
      <TouchFeedback style={{}} onPress={() => this._editRemark(row)}>
        <View style={{
          marginRight: -16, paddingRight: 16,
          marginLeft: 12, paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: Colors.seTextSecondary
        }}>
          <Icon type={'icon_ticket_msg'} style={{}} color={Colors.seBrandNomarl} size={17} />
        </View>
      </TouchFeedback>
    );

    let textColor = Colors.seTextSecondary;
    if (!this.props.canEdit) {
      if (value === null) {
        value = localStr('lang_job_row_no_check');
        textColor = Colors.seErrorColor;
      }
      msgView = null;
    }

    if ((this.props.canEdit && isNaN(value) && row.name !== this.state.focusTitle) || !isNumber) {
      console.log('isNumber', isNumber, 'isNaN(value)', isNaN(value))
      textColor = Colors.seErrorColor;
    }
    let remarkView = this._renderRemark(row);
    if (remarkView) {
      remarkView = (
        <View style={{ marginBottom: 12 }}>
          {remarkView}
        </View>
      )
    }
    let unit = '';
    if (row.unit) unit = `(${row.unit})`
    return (
      <View key={index} style={{
        marginLeft: 16, flex: 1, justifyContent: 'center',
        borderBottomColor: Colors.seBorderSplit, borderBottomWidth: 1, paddingLeft: 30
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text numberOfLines={1} style={{ fontSize: 17, color: Colors.seTextTitle }}>{`${row.name}${unit}`}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
            <TextInput numberOfLines={1} style={{ paddingRight: 0, fontSize: 17, textAlign: 'right', minWidth: 70, maxWidth: 120, paddingVertical: 12, color: textColor }}
              value={String(value || '')} placeholder={localStr('lang_job_row_please_input')} onFocus={() => {
                // this._onFocus(e);
                this.setState({ focusTitle: row.name })
              }}
              keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : "numeric"}
              placeholderTextColor={Colors.seTextSecondary} underlineColorAndroid="transparent" onBlur={() => this._onBlur(value)}
              returnKeyType={'done'} returnKeyLabel={localStr('lang_job_row_done')} editable={this.props.canEdit}
              onChangeText={text => this._onRowChanged(index, 'result', text)}
              enablesReturnKeyAutomatically={true} />
            {invalidView}
            {msgView}
          </View>
        </View>
        {remarkView}
      </View>
    )
  }

  _onBlur(value) {
    this.setState({ focusTitle: null });
    let strValue = String(value).trim();
    let isNumber = true;
    if (strValue.length > 1) {
      if (strValue[0] === '.' || strValue[strValue.length - 1] === '.') isNumber = false;
    }
    //如果非数字，则提示仅支持数字
    if (!isNumber || isNaN(value)) {
      SndToast.showTip(localStr('lang_job_row_only_number'));
      // if (this._toast) Toast.hide(this._toast);
      // this._toast = Toast.show(localStr('lang_job_row_only_number'), {
      //   duration: Toast.durations.LONG,
      //   position: Toast.positions.CENTER,
      // });
    }
  }

  _renderCheckItem(lable, checked, clickValue, row, index) {
    return (
      <TouchFeedback onPress={() => {
        this._onRowChanged(index, 'result', clickValue);
      }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
          paddingHorizontal: 16, marginLeft: -16, marginTop: -5, marginBottom: -5
        }}>
          {checked ? CHECKEDVIEW : UNCHECKVIEW}
          <Text style={{ fontSize: 17, color: Colors.seTextPrimary, marginLeft: 12 }}>{lable}</Text>
        </View>
      </TouchFeedback>
    )
  }

  _editRemark(row) {
    this.props.navigation.push('PageWarpper', {
      id: 'ticket_job_remark',
      component: JobRemak,
      passProps: {
        title: localStr('lang_job_remark'),
        subItem: row,
        saveRemark: (data) => {
          this.props.navigation.pop();
          row.comment = data.content;
          row.pictures = data.pictures.map(p => {
            return { pictureId: p.key, fileName: p.filename, uploadUser: p.uploadUser, uploadTime: p.uploadTime };
          });
          this.setState({})
        },
        onBack: () => this.props.navigation.pop()
      }
    })
  }


  //预览图片
  _imagePreview(row, index) {
    this.props.navigation.push('PageWarpper', {
      id: 'ticket_log_edit',
      component: PhotoShowView,
      passProps: {
        index: index,
        onBack: () => this.props.navigation.pop(),
        data: row.pictures.map((item) => {
          return {
            uri: item.uri,
            key: item.pictureId,
            name: item.fileName
          }
        })
      }
    })
  }

  //判断类别
  _renderJudgeRow(row, index) {
    let value = row.result;
    if (!this.props.canEdit) {
      let txtColor = Colors.seTextPrimary;
      let invalidView = null;
      if (value === null || value === undefined) {
        value = localStr('lang_job_row_no_check');
        txtColor = Colors.seErrorColor;
      } else if (!value || value === 'false') {
        value = localStr('lang_job_row_exception');
        invalidView = (
          <View style={{
            width: 52, height: 22, backgroundColor: Colors.seErrorBg,
            borderRadius: 2, borderWidth: 1, borderColor: Colors.seErrorBorder, marginLeft: 8,
            alignItems: 'center', justifyContent: 'center'
          }}>
            <Text style={{ fontSize: 12, color: Colors.seErrorColor }}>{localStr('lang_job_row_exception')}</Text>
          </View>
        );

      } else {
        value = localStr('lang_job_row_well');
      }
      return (

        <View key={index} style={{
          marginLeft: 16, paddingVertical: 16,
          paddingRight: 16, borderBottomColor: Colors.seBorderSplit, borderBottomWidth: 1, paddingLeft: 30
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', }}>
            <View style={{ flex: 1, marginRight: 32 }}>
              <Text style={{ fontSize: 17, color: Colors.seTextTitle, lineHeight: 25 }}>{`${row.name}：${row.content}`}</Text>
            </View>
            <Text numberOfLines={1} style={{ fontSize: 17, color: txtColor }}>
              {value}
            </Text>
            {invalidView}
          </View>
          {this._renderRemark(row)}
        </View>
      )
    }
    let msgView = this.props.isOffline ? null : (
      <TouchFeedback onPress={() => this._editRemark(row)}>
        <View style={{
          marginRight: -16, paddingRight: 16, marginTop: -5, paddingTop: 5,
          marginLeft: 24, paddingLeft: 24
        }}>
          <Icon type={'icon_ticket_msg'} style={{ marginTop: 5 }} color={Colors.seBrandNomarl} size={17} />
        </View>
      </TouchFeedback>
    );

    let result = row.result;
    return (
      <View key={index} style={{
        marginLeft: 16, paddingTop: 16, paddingBottom: 16,
        borderBottomColor: Colors.seBorderSplit, borderBottomWidth: 1, paddingLeft: 30
      }}>
        <View style={{ flex: 1, paddingRight: 16, flexDirection: 'row', alignItems: 'flex-start' }}>
          <Text style={{ fontSize: 17, color: Colors.seTextTitle, lineHeight: 25, flex: 1 }}>{`${row.name}：${row.content}`}</Text>
          {msgView}
        </View>
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          {this._renderCheckItem(localStr('lang_job_row_well'), (result === 'true' || result === true), true, row, index)}
          <View style={{ width: 60 }} />
          {this._renderCheckItem(localStr('lang_job_row_exception'), (result === 'false' || result === false), false, row, index)}
        </View>
        {this._renderRemark(row)}
      </View>
    )
  }

  _getTextInput(row, index) {
    if (Platform.OS === 'ios') {
      return (
        <View style={{
          borderColor: Colors.seBorderColor, borderRadius: 2, flex: 1,
          borderWidth: 1, marginTop: 20, paddingTop: 4, paddingBottom: 8, paddingHorizontal: 12
        }}>
          <TextInput2 style={{ fontSize: 15, height: 69, color: Colors.seTextPrimary, lineHeight: 23, padding: 0, marginTop: -4 }}
            textAlign={'left'}
            autoFocus={false}
            maxLength={1000} multiline={true}
            placeholderStyle={{ fontSize: 15, marginTop: 4, top: 0, lineHeight: 23 }}
            placeholderTextColor={Colors.seTextSecondary}
            underlineColorAndroid={'transparent'}
            textAlignVertical={'top'}
            onChangeText={text => this._onRowChanged(index, 'comment', text)}
            value={row.comment} placeholder={localStr('lang_job_row_input_tip')}
          />
        </View>
      )
    } else {
      return (
        <View style={{
          borderColor: Colors.seBorderColor, borderRadius: 2, height: 90, flex: 1,
          borderWidth: 1, marginTop: 20, paddingTop: 8, paddingBottom: 8, paddingHorizontal: 12
        }}>
          <TextInput style={{ fontSize: 15, height: 69, flex: 1, lineHeight: 23, paddingVertical: 0, color: Colors.seTextPrimary }}
            value={String(row.comment || '')} placeholder={localStr('lang_job_row_input_tip')}
            textAlignVertical={'top'} textAlign={'left'} multiline={true}
            placeholderTextColor={Colors.seTextSecondary} underlineColorAndroid="transparent"
            returnKeyLabel={localStr('lang_job_row_done')} editable={this.props.canEdit}
            maxLength={1000}
            onChangeText={text => this._onRowChanged(index, 'comment', text)}
          />
        </View>
      );
    }
  }

  _renderRemark(remark) {
    if (!remark || this.props.isOffline) return;
    let pics = remark.pictures;
    let content = remark.comment;
    let arr = [];
    if (content && content.trim && content.trim().length > 0) {
      arr.push(
        <Text key={0} style={{ fontSize: 15, lineHeight: 23, color: Colors.seTextPrimary, marginTop: 10 }}>{content}</Text>
      )
    }

    if (pics && pics.length > 0) {
      let imgs = pics.map((img, imgIndex) => {
        return (
          <TouchFeedback key={imgIndex} onPress={() => {
            this._imagePreview(remark, imgIndex)
          }}>
            <View style={{ width: this.picWid + 10, height: this.picWid + 10 }}>
              <CacheImage uri={img.uri} borderWidth={1} space={10} key={img.pictureId} imageKey={img.pictureId} width={this.picWid - 2} height={this.picWid - 2} />
            </View>

          </TouchFeedback>

        )
      })
      let imgViews = (
        <View key={1} style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {imgs}
        </View>
      )
      arr.push(imgViews)
    }
    if (arr.length > 0) return (
      <View style={{}}>
        {arr}
      </View>
    )
    return null;
  }

  _showItems(row, index) {
    let type = row.valueType || row.typeValue;//1:判断 2：查表
    if (type === 2) return this._renderReadingMeterRow(row, index);
    if (type === 1) return this._renderJudgeRow(row, index);
  }

  _checkException(row, isMax, newValue) {
    let value = isMax ? row.maxValue : row.minValue;
    if (value === null || value === undefined) return;
    value = Number(value);
    if (isNaN(value)) return;
    if (isMax) {
      if (newValue > value) row.exception = true;
    } else {
      if (newValue < value) row.exception = true;
    }
  }

  _onRowChanged(index, type, value) {
    if (this.props.status === 10) {
      this.props.doExecute();
      return;
    }
    let row = this.state.data.subItems[index];
    let type2 = row.valueType || row.typeValue;
    if (type2 === 1) {
      //判断类
      if (value === false || value === 'false') row.exception = true;
    } else {
      //抄表类
      this._checkException(row, false, value);
      this._checkException(row, true, value);
    }
    this.props.rowData.jobChanged = true;
    row[type] = value;
    this.setState({})
  }

  render() {
    let rows = this.state.data.subItems.map((item, index) => this._showItems(item, index));
    return (
      <View style={{ flex: 1, backgroundColor: Colors.seBgContainer }}>
        {rows}
      </View>
    );
  }
}
