import React, { Component } from 'react';

import {
  View, Text, Image,
  StyleSheet, Keyboard,
} from 'react-native';
import { localStr } from './utils/Localizations/localization.js';
import Colors from "../../../app/utils/const/Colors";
import JobRow from './JobRow';
import TouchFeedback from './components/TouchFeedback';
import Icon from "./components/Icon";
import SndAlert from '../../../app/utils/components/SndAlert';
const TXT_JOB = '作业程序';
const TXT_EXPAND_ALL = '全部展开';
const TXT_FOLDER_ALL = '全部折叠';


export class JobView extends Component {

  constructor(props) {
    super(props);
    this.state = { job: props.job, showWarning: true, expandMap: {} }
  }

  _executeCheck = () => {
    console.log('_executeCheck', this.executePermission, this.props.status)
    if (this.props.executePermission && this.props.status === 10) {
      Keyboard.dismiss();
      setTimeout(() => {
        SndAlert.alert(
          '',
          '开始执行工单？',
          [
            { text: '取消', onPress: () => { } },
            {
              text: '开始执行', onPress: () => {
                this.props.onExecute && this.props.onExecute();
              }
            }
          ]
        )
      }, 100)
      return false;
    }
    return true;
  }

  _renderJob() {
    if (!this.state.job || !this.state.job.mainItems || this.state.job.mainItems.length === 0) { return null }
    let items = this.state.job.mainItems;
    let titleView = (
      <TouchFeedback onPress={() => {
        let showAllExpand = this.state.showAllExpand;
        let expandMap = this.state.expandMap;
        if (showAllExpand) {
          showAllExpand = false;
          items.forEach((item, i) => {
            expandMap[i] = true;
          });
        } else {
          expandMap = {};
          showAllExpand = true;
        }
        this.setState({
          expandMap: { ...expandMap },
          showAllExpand
        })
      }}>
        <View style={{ backgroundColor: Colors.seBgContainer, marginTop: 10, paddingTop: 15, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', paddingRight: 16 }}>
          <Text key={0} style={{
            fontSize: 17, color: Colors.seTextTitle, flex: 1, marginLeft: 16,
            fontWeight: '500'
          }}>{TXT_JOB}</Text>
          <Text style={{ fontSize: 15, color: Colors.seBrandNomarl }}>{this.state.showAllExpand ? TXT_EXPAND_ALL : TXT_FOLDER_ALL}</Text>
        </View>
      </TouchFeedback>
    )

    let rows = [];
    rows.push(titleView)

    for (let index = 0; index < items.length; index++) {
      let item = items[index];
      rows.push(
        <TouchFeedback key={rows.length} enabled={true} onPress={() => {
          let expandMap = this.state.expandMap;
          expandMap[index] = !expandMap[index];
          let showAllExpand = false;//this.state.showAllExpand;
          //判断是否全部都展开了
          items.forEach((_, i) => {
            if (!expandMap[i]) {
              showAllExpand = true;
            }
          });

          this.setState({
            expandMap: { ...expandMap }, showAllExpand
          })
        }}>
          <View key={index} style={{ backgroundColor: Colors.seBgContainer, paddingLeft: 16 }}>
            <View style={{
              height: 56, paddingRight: 16, backgroundColor: Colors.seBgContainer,
              alignItems: 'center', flexDirection: 'row',
              borderBottomWidth: 1, borderBottomColor: Colors.seBorderSplit
            }}>
              <Icon type={this.state.expandMap[index] ? 'icon_asset_expand' : 'icon_asset_folder'} style={{ marginRight: 10 }}
                color={Colors.seTextTitle} size={18} />
              <Text numberOfLines={1} style={{ flex: 1, fontSize: 17, color: Colors.seTextTitle, marginRight: 16 }}>{item.name}</Text>
              {this._getItemStatusView(item, index)}
            </View>
          </View>
        </TouchFeedback>
      )
      let status = this.props.status;
      let canEdit = ([10, 20, 40].includes(status)) && this.props.executePermission;
      rows.push(
        this.state.expandMap[index] ?
          <JobRow index={index} data={item} canEdit={canEdit} status={status}
            imageClick={this.props.imageClick}
            navigation={this.props.navigation}
            doExecute={this._executeCheck}
            valueChanged={item => {
              if (this._executeCheck()) {
                this.props.updateInspectionContentItems(index, item);
              }
            }}
          />
          :
          <View />
      )
    }
    return rows;
  }

  _getItemStatusView(item, index) {
    let status = this.props.status;
    let count = item.subItems.length;
    let finishCount = 0;
    for (let i = 0; i < count; i++) {
      let standard = item.subItems[i].result;
      if ((standard && String(standard).trim().length > 0) || standard === false) {
        finishCount += 1;
      }
    }
    //显示警告 默认不显示，但是修改保存巡检结果时，需要显示
    let redColor = this.state.showWarning && [10, 20, 30, 40].includes(status);//已关闭工单不显示红字
    if (finishCount === count) {
      return (
        <Text style={{ fontSize: 17, color: Colors.seTextTitle }}>已完成</Text>
      );
    } else {
      return (
        <Text style={{ fontSize: 17, color: redColor ? Colors.seErrorColor : Colors.seTextTitle }}>{`${finishCount}/${count}`}</Text>
      );
    }
  }

  render() {
    return (
      <View style={{ margin: 10, borderRadius: 12, backgroundColor: Colors.seBgContainer, paddingBottom: 12 }}>
        {this._renderJob()}
      </View>
    )
  }
}
