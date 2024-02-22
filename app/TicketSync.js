'use strict'

import React, { Component } from 'react';
import {
  View, Text, ScrollView
} from 'react-native';
import PropTypes from 'prop-types';
// import Text from '../Text';
import TouchFeedback from './components/TouchFeedback';
import Toolbar from './components/Toolbar';

import Icon from './components/Icon';
import { Icon as Icon2 } from '@ant-design/react-native';

import moment from 'moment';
import RingRound from './components/RingRound.js'
import { TICKET_TYPE_MAP } from "./TicketList";
import { localStr } from "./utils/Localizations/localization";
import { querySyncTask } from "./utils/offlineUtil";
import { getTicketFromCache, getTicketLogsFromCache } from "./utils/sqliteHelper";

//0为开始，1进行中 2同步失败 3覆盖或者放弃 4工单已关闭
let STATUS_TEXT = ['',
  '',
  '同步失败',
  '该工单已被其他用户执行，确认覆盖？若放弃将获取云端最新数据',
  '该工单已被其他用户关闭，将获取云端最新数据。',
  '没有层级权限',
  '工单不存在',
  '工单状态不一致',

];

export default class TicketSync extends Component {
  constructor(props) {
    super(props);
    let data = [];
    this.state = { data: data };
    this._loadSyncTasks().then();
  }



  async _loadSyncTasks() {

    try {
      let tasks = await querySyncTask();

      let ids = tasks.map(task => `"${task.id}"`).join(',');
      let tickets = await getTicketFromCache(ids, true)
      //这里还需要根据进行中的同步状态做处理
      tickets.forEach(t => {
        t.syncStatus = 1
      })
      this.setState({ data: tickets })
    } catch (e) {
      console.log('_loadSyncTasks error', e);
    }
  }

  _getToolbar() {

    let action = [];
    let actionClick = [() => { }];
    return (
      <Toolbar title={localStr('lang_offline_sync_view_title')}
        actions={action}
        navIcon="back"
        onIconClicked={() => this.props.navigation.pop()}
        onActionSelected={actionClick}
      />
    )
  }

  _getSyncStatusView(status, ticketId, isService) {
    if (status > 1) {

      let actionView = null;
      if (status === 2) {
        return null;
      }
      if (status === 3) {
        actionView = (
          <View style={{ flexDirection: 'row', marginTop: -10, marginRight: -10 }}>
            <TouchFeedback onPress={() => {
              this._onCover(ticketId).then();
            }}>
              <Text style={{ padding: 10, fontSize: 13, color: '#3dcd58', lineHeight: 18 }}>{localStr('lang_offline_sync_view_cover')}</Text>
            </TouchFeedback>
            <TouchFeedback onPress={() => {
              this._onGiveUp(ticketId).then()
            }}>
              <Text style={{ padding: 10, fontSize: 13, color: '#3dcd58', lineHeight: 18 }}>{localStr('lang_offline_sync_view_give_up')}</Text>
            </TouchFeedback>
          </View>
        )
      }
      if (status === 4) {
        actionView = (
          <View style={{ marginTop: -10, marginRight: -10 }}>
            <TouchFeedback onPress={() => {
              this._onGiveUp(ticketId).then()
            }}>
              <Text style={{ padding: 10, fontSize: 13, color: '#3dcd58', lineHeight: 18 }}>{localStr('lang_ticket_filter_ok')}</Text>
            </TouchFeedback>
          </View>
        )
      }
      if (status === 5) {
        actionView = (
          <View style={{ flexDirection: 'row', marginTop: -10, marginRight: -10 }}>
            <TouchFeedback onPress={() => {
              this._onRetry(ticketId).then();
            }}>
              <Text style={{ padding: 10, fontSize: 13, color: '#3dcd58', lineHeight: 18 }}>{localStr('lang_offline_sync_view_retry')}</Text>
            </TouchFeedback>
            <TouchFeedback onPress={() => {
              this._onGiveUp(ticketId).then()
            }}>
              <Text style={{ padding: 10, fontSize: 13, color: '#3dcd58', lineHeight: 18 }}>{localStr('lang_offline_sync_view_give_up')}</Text>
            </TouchFeedback>
          </View>
        )
      }
      if (status === 6) {
        actionView = (
          <View style={{ marginTop: -10, marginRight: -10 }}>
            <TouchFeedback onPress={() => {
              this._onGiveUp(ticketId).then()
            }}>
              <Text style={{ padding: 10, fontSize: 13, color: '#3dcd58', lineHeight: 18 }}>{localStr('lang_offline_sync_view_give_up')}</Text>
            </TouchFeedback>
          </View>
        )
      }
      if (status === 7) {
        actionView = (
          <View style={{ marginTop: -10, marginRight: -10 }}>
            <TouchFeedback onPress={() => {
              this._onGiveUp(ticketId).then()
            }}>
              <Text style={{ padding: 10, fontSize: 13, color: '#3dcd58', lineHeight: 18 }}>{localStr('lang_offline_sync_view_give_up')}</Text>
            </TouchFeedback>
          </View>
        )
      }

      return (
        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', flex: 1, marginRight: 20 }}>
            <Icon style={{ marginTop: 2 }} type="icon_info_down" color="#ff4d4d" size={14} />
            <Text style={{ marginLeft: 8, fontSize: 13, lineHeight: 18, color: '#ff4d4d' }}>{STATUS_TEXT[status]}</Text>
          </View>
          {actionView}
        </View>
      )
    } else {
      return null;
    }
  }

  //放弃修改的工单
  _onGiveUp = async (ticketId) => {

  }

  _onRetry = async (ticketId) => {

  }

  _onCover = async (ticketId) => {

  }

  _getDateDisplay(rowData) {
    let mStart = moment(rowData.startTime);
    let mEnd = moment(rowData.endTime);
    let showHour = false;
    let isSameDay = false;
    //判断是否要显示小数
    if (mStart.hours() > 0 || mStart.minutes() > 0 || mEnd.hours() > 0 || mEnd.minutes() > 0) {
      //需要显示的格式带小数
      showHour = true;
      if (mStart.format('HH:mm') === '00:00' && mEnd.format('HH:mm') === '23:59') {
        showHour = false;
      }
    }
    //判断开始结束日期是否同一天
    if (mStart.format('YYYY-MM-DD') === mEnd.format('YYYY-MM-DD')) {
      isSameDay = true;
    }
    if (isSameDay && showHour) {//同一天，显示小时
      return `${mStart.format('MM-DD HH:mm')} / ${mEnd.format('HH:mm')}`;
    } else if (showHour) {//不是同一天，要显示小时
      return `${mStart.format('MM-DD HH:mm')} / ${mEnd.format('MM-DD HH:mm')}`;
    } else {//不显示小时
      return `${mStart.format('MM-DD')} / ${mEnd.format('MM-DD')}`;
    }
  }

  _renderRow(row, index) {
    let date = this._getDateDisplay(row);
    let ticketStatus = TICKET_TYPE_MAP[row.ticketState];
    let statusView = null;
    switch (row.syncStatus) {
      case -1:
        return null;
      case 0:
        statusView = (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon2 name="pause-circle" size='13' color="#fbb325" />
            <Text style={{ fontSize: 13, color: '#888', marginLeft: 3 }}>{localStr('lang_offline_sync_status_waiting')}</Text>
          </View>
        );
        break;
      case 1://进行中
        statusView = (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <RingRound>
              <Icon2 name="sync" size='13' color="#3dcd58" />
            </RingRound>
            <Text style={{ fontSize: 13, color: '#888', marginLeft: 3 }}>{localStr('lang_offline_sync_status_doing')}</Text>
          </View>
        );
        break;
      case 2://同步失败
        statusView = (
          <View style={{ flexDirection: 'row' }}>
            <Icon2 style={{ alignSelf: 'center', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }} name="close-circle" size='13' color="#ff4d4d" />
            <Text style={{ fontSize: 13, color: '#888', marginLeft: 3 }}>{localStr('lang_offline_sync_status_fail')}</Text>
            <View style={{ marginTop: -10, marginRight: -10 }}>
              <TouchFeedback onPress={() => {
                this._onRetry(row.Id).then()
              }}>
                <Text style={{ paddingHorizontal: 10, paddingTop: 10, fontSize: 13, color: '#3dcd58' }}>{localStr('lang_offline_sync_view_retry')}</Text>
              </TouchFeedback>
            </View>
          </View>
        );
        break;
      case 3://覆盖放弃
        statusView = (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon2 name="pause-circle" size="13" color="#fbb325" />
            <Text style={{ fontSize: 13, color: '#888', marginLeft: 3 }}>{localStr('lang_offline_sync_status_waiting')}</Text>
          </View>
        );
        break;
      case 4://工单已关闭
        statusView = (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon2 name="close-circle" size="13" color="#ff4d4d" />
            <Text style={{ fontSize: 13, color: '#888', marginLeft: 3 }}>{localStr('lang_offline_sync_status_fail')}</Text>
          </View>
        );
        break;
    }
    return (
      <View key={index}>
        <View style={{ marginBottom: 10, backgroundColor: '#fff', padding: 10, paddingHorizontal: 16, borderRadius: 2 }}>
          <View style={{
            flexDirection: 'row', backgroundColor: '#fafafa', margin: -16, marginTop: -10,
            padding: 10, paddingVertical: 12, borderTopLeftRadius: 2, borderTopRightRadius: 2
          }}>
            <Text numberOfLines={1} style={{ fontSize: 13, flex: 1, color: '#888', marginRight: 8 }}>{`${date} | ${ticketStatus}`}</Text>
            {statusView}
          </View>

          <View style={{ marginTop: 32 }}>
            <Text numberOfLines={1} style={{ fontSize: 17, fontWeight: '500', color: '#333' }}>
              {row.assets ? row.assets.map(a => a.assetName).join('、') : ''}
            </Text>
          </View>
          <View style={{ marginTop: 12 }}>
            <Text numberOfLines={2} style={{ fontSize: 15, lineHeight: 23, color: '#888' }}>
              {row.content || ''}
            </Text>
          </View>
          <View style={{ flex: 1, height: 1, backgroundColor: '#f2f2f2', marginVertical: 10 }}></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Icon type="arrow_location" color="#b2b2b2" size={12} />
            <Text numberOfLines={1} style={{ fontSize: 13, color: "#b2b2b2", marginLeft: 4 }}>
              {row.locationInfo || ''}
            </Text>
          </View>
        </View>
        {this._getSyncStatusView(row.syncStatus, row.Id, row.isService)}
      </View>
    )
  }

  render() {
    let rows = this.state.data.map((item, index) => {
      return this._renderRow(item, index);
    });
    return (
      <View style={{ flex: 1, backgroundColor: '#f2f2f2' }}>
        {this._getToolbar()}
        <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 10 }}>
          {rows}
        </ScrollView>
      </View>
    )
  }
}
