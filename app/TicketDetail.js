
'use strict';
import React, { Component } from 'react';

import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  DeviceEventEmitter,
  Text, Dimensions, TouchableOpacity, TouchableWithoutFeedback, Modal
} from 'react-native';

import Toolbar from './components/Toolbar';
// import Share from "react-native-share";
import { GRAY, BLACK, TICKET_STATUS } from './styles/color';
import moment from 'moment';

import Button from './components/Button';

import MoreContent from './components/MoreContent';
import TouchFeedback from './components/TouchFeedback';
import Icon from './components/Icon.js';
import Bottom from './components/Bottom.js';
import Loading from './components/Loading';
import { isPhoneX } from './utils';
import Immutable from 'immutable';
import SchActionSheet from './components/actionsheet/SchActionSheet';
import mackTicket from './jobTicket.json'

let ViewShot = View;

const CODE_OK = '0';
const STATE_NOT_START = 10
const STATE_STARTING = 20
const STATE_PENDING_AUDIT = 30
const STATE_REJECTED = 40
const REJECT_OPERATION_TYPE = 34

import { localStr } from "./utils/Localizations/localization";
import NetworkImage from './components/NetworkImage'
import {
  apiCloseTicket,
  apiDelTicketLog,
  apiEditTicket,
  apiIgnoreTicket, apiSubmitTicket,
  apiTicketDetail,
  apiTicketExecute, apiUpdateTicketJob, customerId,
  userId
} from "./middleware/bff";
import TicketLogEdit from "./TicketLogEdit";
import CacheImage from "./CacheImage";
import TicketSelectTime from "./TicketSelectTime";
import TicketSelectExecutors from "./TicketSelectExecutors";
import PhotoShowView from "./components/assets/PhotoShowView";
import privilegeHelper, { CodeMap } from "./utils/privilegeHelper";
import Colors from "../../../app/utils/const/Colors";
import SndAlert from "../../../app/utils/components/SndAlert";
// import Share from "react-native-share";
import appPrivilegeHelper from "../../../app/utils/privilegeHelper";
import {
  cacheTicketLogOperate, cacheTicketModify,
  getTicketFromCache,
  getTicketLogsFromCache,
  TICKET_LOG_DELETE
} from "./utils/sqliteHelper";

import FileOpener from 'react-native-file-opener'
import RNFS, { DocumentDirectoryPath } from "react-native-fs";
import CreateTicket from "../../../app/containers/ticket/CreateTicket.js";
import { getImageUrlByKey } from '../../../app/containers/fmcs/plantOperation/utils/Utils';
import { JobView } from 'rn-module-abnormal-ticket/app/JobView.js';

export default class TicketDetail extends Component {
  constructor(props) {
    super(props);
    let { width } = Dimensions.get('window');
    this.picWid = parseInt((width - 46 - 40) / 4.0);
    this.state = { toolbarOpacity: 0, showToolbar: false, forceStoped: false, };
  }

  getTicketTypeLable(ticketType) {
    let localTypes = localStr('lang_ticket_filter_types')
    switch (ticketType) {
      case 2:
        return localTypes[2]
      case 9:
        return localTypes[0]
      case 10:
        return localTypes[1]
      case 4:
        return localTypes[3]
      case 6://巡检工单
        return localTypes[4]
      case 15://保养工单
        return localTypes[5]
    }
    return ''
  }

  //显示作业程序
  _renderJob() {
    //只有巡检和保养工单才有作业程序
    let rowData = this.state.rowData;
    let type = rowData.ticketType;
    if (type !== 6 && type !== 15) return null;
    let executePermission = (this.state.isExecutor && privilegeHelper.hasAuth(CodeMap.OMTicketExecute))
    if (rowData.extensionProperties && rowData.extensionProperties.jobFlow) {
      return (
        <JobView executePermission={executePermission} navigation={this.props.navigation} onExecute={this._executeTicket}
          job={rowData.extensionProperties.jobFlow} status={rowData.ticketState} rowData={rowData}
          showWarning={this.state.showWarning} changeSignInfo={this._changeSignInfo} />
      )
    }
  }

  _changeSignInfo = (signInfo) => {
    this._detail = this._detail.setIn(['extensionProperties', 'signInfo'], Immutable.fromJS(signInfo));
  }

  _getAssetView() {
    let rowData = this.state.rowData;
    var type = this.getTicketTypeLable(rowData.ticketType);//localStr('lang_ticket_diagnose')//rowData.get('TicketType');

    var startTime = moment(rowData.startTime).format('MM-DD'),
      endTime = moment(rowData.endTime).format('MM-DD');
    let displayTime = `${startTime} ${localStr('lang_ticket_to')} ${endTime}`;
    if (rowData.extensionProperties && rowData.extensionProperties.duration) {
      startTime = moment(rowData.startTime).format('YYYY-MM-DD HH:mm');
      let useTime = rowData.extensionProperties.duration;
      let duration = `${localStr('lang_ticket_use_time')} ${useTime.value}${localStr('lang_ticket_time_unit')[parseInt(useTime.unit) - 1]}`
      displayTime = `${startTime} ${duration}`
    }

    let assetNames = rowData.assets || [];
    assetNames = assetNames.map(item => item.assetName).join(',')

    let locationNames = rowData.assets.map(item => item.locationName);//.join(',')
    let filter = [];
    locationNames.forEach(l => {
      if (filter.indexOf(l) === -1) {
        filter.push(l);
      }
    })
    locationNames = filter.join(',')

    let executor = null;
    if (rowData.executors && rowData.executors.length > 0) {
      let names = rowData.executors.map(item => {
        return item.userName;
      });
      executor = (
        <View style={{ flex: 1, flexDirection: 'row', marginLeft: 0, marginTop: 8 }}>
          <View style={{ marginTop: 3, }}>
            <Icon type={'icon_person'} size={13} color={Colors.seTextPrimary} />
          </View>
          <View style={{ flex: 1, marginLeft: 4, }}>
            <Text numberOfLines={10} style={[{ fontSize: 13, color: Colors.seTextPrimary, lineHeight: 20, }]}>
              {names.join('、')}
            </Text>
          </View>
        </View>
      );
    }
    return (
      <View style={{ paddingBottom: 14, backgroundColor: Colors.seBgContainer, margin: 10, marginBottom: 0, borderRadius: 12 }}>
        <View style={{
          paddingTop: 15, paddingBottom: 12, paddingLeft: 16,
          flexDirection: 'row', alignItems: 'center', paddingRight: 16,
        }}>
          <Text numberOfLines={1} style={{ fontSize: 16, color: Colors.seTextTitle, fontWeight: '600', flexShrink: 1 }}>{rowData.title}</Text>
          <View style={{
            borderRadius: 10, paddingVertical: 2, paddingHorizontal: 8,
            borderColor: Colors.seBrandNomarl, borderWidth: 1, marginLeft: 8,
          }}>
            <Text style={{ fontSize: 11, color: Colors.seTextTitle }}>{type}</Text>
          </View>
        </View>
        <View style={styles.moreContent}>
          <Text style={{ fontSize: 15, color: Colors.seTextPrimary }}>{localStr('lang_ticket_detail_assets') + ':' + assetNames}</Text>
        </View>
        <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 13 }}>
          <Icon style={{ marginTop: 2 }} type={'arrow_location'} size={11} color={Colors.seTextPrimary} />
          <View style={{ flex: 1, marginLeft: 4, }}>
            <Text numberOfLines={1} style={[{ color: Colors.seTextPrimary, fontSize: 13 }]}>{locationNames}</Text>
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, backgroundColor: '' }}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <View style={{ minWidth: 115, flexDirection: 'row' }}>
              <Icon type={'icon_date'} size={13} color={Colors.seTextPrimary} />
              <View style={{ marginLeft: 4, }}>
                <Text numberOfLines={1} style={[{ fontSize: 13, color: Colors.seTextPrimary }]}>{displayTime}</Text>
              </View>
            </View>

          </View>
          {executor}
        </View>
      </View>
    );
  }
  _getTaskView() {
    if (this._isJobTicket()) return null;
    let rowData = this.state.rowData;
    var content = rowData.content;

    if (content) {
      content = content.replace(/(^\s*)|(\s*$)/g, "");
    }

    return (
      <View style={{ paddingBottom: 0, backgroundColor: Colors.seBgContainer, borderRadius: 12, margin: 10, marginBottom: 0 }}>
        <View style={{
          paddingTop: 16, paddingBottom: 12, paddingLeft: 16,
          flexDirection: 'row', alignItems: 'center'
        }}>
          <Text style={{ fontSize: 16, color: Colors.seTextTitle, fontWeight: '600' }}>{localStr('lang_ticket_detail_task')}</Text>
        </View>
        <MoreContent style={styles.moreContent} content={content || ''} maxLine={5} />
      </View>
    );
  }

  _getExt(name) {
    return name.substring(name.lastIndexOf('.') + 1).toLowerCase()
  }

  isImageFile(ext) {
    return ['png', 'jpg', 'jpeg', 'bmp', 'webp'].includes(ext)
  }

  _openAttachment = (item) => {
    let ext = this._getExt(item.name)
    // function isImageFile(ext) {
    //   return ['png', 'jpg', 'jpeg', 'bmp', 'webp'].includes(ext)
    // }
    if (this.isImageFile(ext)) {
      let imgs = this.state.rowData.extensionProperties.attachments.filter(a => this.isImageFile(this._getExt(a.name)));
      console.log(imgs, imgs.indexOf(item))
      this.props.navigation.push('PageWarpper', {
        id: 'ticket_attachments_preview',
        component: PhotoShowView,
        passProps: {
          index: imgs.indexOf(item),
          onBack: () => this.props.navigation.pop(),
          data: imgs
        }
      })
    } else {
      //是文件，那么按照文件处理
      this._openFile(item).then()
    }

  }

  _openFile = async (file) => {
    let name = file.name;
    let type = name.substr(name.lastIndexOf('.') + 1).toLowerCase();
    const mimetype = {
      'txt': 'text/plain',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.ms-powerpoint',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.ms-excel',
      'doc': 'application/msword',
      'docx': 'application/msword',
      'pdf': 'application/pdf',
      'dwg': 'image/vnd.dwg'
    }
    type = mimetype[type];
    //需要先下载文件，在传递文件路径
    try {
      let filePath = `${DocumentDirectoryPath}/${file.key}`;
      let ret = await RNFS.exists(filePath);
      let openFile = (filePath, type) => {
        if (Platform.OS === 'ios') {
          FileOpener.open(filePath, type, {}).then(() => {
            console.log('success!!');
          }, (e) => {
            console.log('e', e);
          });
        } else {
          FileOpener.open(filePath, type).then(() => {
            console.log('success!!');
          }, (e) => {
            console.log('e', e);
          });
        }
      }

      if (ret) {
        openFile(filePath, type);
        return;
      }
      //开始下载文件了
      await RNFS.downloadFile({
        fromUrl: getImageUrlByKey(file.key),//storage.getOssBucket()+`/lego-bff/bff/ledger/rest/downloadFile?id=${file.key}`,
        toFile: filePath,
      }).promise;
      openFile(filePath, type);
    } catch (err) {
      //文件下载失败
      console.log('download error', err);
      return false;
    }
  }

  _getDocumentsView() {
    let rowData = this.state.rowData;
    if (!rowData.extensionProperties || !rowData.extensionProperties.attachments || rowData.extensionProperties.attachments.length === 0) return;
    let attachments = rowData.extensionProperties.attachments.map((item, index) => {
      return (
        <TouchableOpacity key={index} style={{ marginBottom: 8 }} onPress={() => this._openAttachment(item)}>
          <Text style={{ fontSize: 14, color: Colors.seBrandNomarl }}>{item.name}</Text>
        </TouchableOpacity>
      )
    })
    return (
      <View style={{ paddingBottom: 0, paddingHorizontal: 16, backgroundColor: Colors.seBgContainer, borderRadius: 12, margin: 10, marginBottom: 0 }}>
        <View style={{
          paddingTop: 16, paddingBottom: 12, paddingLeft: 0,
          flexDirection: 'row', alignItems: 'center'
        }}>
          <Text style={{ fontSize: 16, color: Colors.seTextTitle, fontWeight: '600' }}>{localStr('lang_ticket_detail_attachments')}</Text>
        </View>
        {attachments}
      </View>
    )

    var documents = rowData.get('Documents').map((item) => { return { name: item.get('DocumentName'), id: item.get('DocumentId'), size: item.get('Size') } }).toArray();
    var content = [
      // {label:'执行时间',value:`${startTime} 至 ${endTime}`},
      // {label:'执行人',value:executor},
      { label: '作业文档', value: documents }
    ];
    var style = { marginHorizontal: 16, marginBottom: 16 };
    if (Platform.OS === 'ios') {
      style = { marginHorizontal: 16, marginBottom: 8, marginTop: 8 };
    }
    if (!documents || documents.length === 0) {
      return;
    }
    return (
      <View style={{ backgroundColor: 'white' }}>
        <View style={{ paddingBottom: 15, paddingHorizontal: 16, }}>
          <View style={{
            paddingTop: 16, paddingBottom: 11,
            flexDirection: 'row', alignItems: 'center',
          }}>
            <Text style={{ fontSize: 17, color: 'black', fontWeight: 'bold' }}>{'作业文档'}</Text>
          </View>
          {
            content.map((item, index) => {
              return (
                <LabelValue key={index} style={{ marginBottom: 0, }} label={item.label} value={item.value} forceStoped={this.state.forceStoped} />
              )
            })
          }
        </View>
        <ListSeperator marginWithLeft={16} />
      </View>
    )
  }
  _getIDView() {
    let rowData = this.state.rowData;
    let strId = rowData.ticketCode || '';
    let createDate = moment(rowData.createTime).format('YYYY-MM-DD HH:mm:ss');
    return (
      <View style={{
        paddingBottom: 16, paddingTop: 16, paddingLeft: 16, paddingRight: 16, backgroundColor: Colors.seBgLayout, marginTop: -2
        , alignItems: 'center'
      }}>
        <Text numberOfLines={1} style={{ fontSize: 13, color: Colors.seTextDisabled }}>
          {`${localStr('lang_ticket_detail_ticketId')}:${strId}`}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 13, color: Colors.seTextDisabled, marginTop: 6 }}>
          {`${rowData.createUserName} ${localStr('lang_ticket_detail_create_time')}${createDate}`}
        </Text>
      </View>
    )
  }

  _getTab() {
    return (
      <View style={{ height: 48, justifyContent: 'flex-end' }}>
        <Text style={{ marginBottom: 8, fontSize: 16, color: Colors.seTextTitle, fontWeight: '600' }}>{`${localStr('lang_ticket_detail_log')}(${this.state.rowData.ticketLogs.length})`}</Text>
      </View>
    )
  }

  clickLog(log, index) {

    //判断日志是否自己创建，不是的无效
    //if (log.userId !== userId) return null;
    this.setState({
      modalVisible: true,
      arrActions: [{
        title: localStr('lang_ticket_detail_edit_log'),
        click: () => {
          this.props.navigation.push('PageWarpper', {
            id: 'ticket_log_edit',
            component: TicketLogEdit,
            passProps: {
              title: localStr('lang_ticket_detail_edit_log'),
              tid: this.state.rowData.id,
              log,
              offline: this.props.offline,
              callBack: () => {
                this.props.navigation.pop();
                this._loadTicketDetail();
              },
              onBack: () => this.props.navigation.pop()
            }
          })
        }
      }, {
        title: localStr('lang_ticket_detail_del_log'),
        click: () => {
          SndAlert.alert(
            localStr('lang_ticket_log_del_confirm'),
            '',
            [
              { text: localStr('lang_ticket_filter_cancel'), onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
              {
                text: localStr('lang_ticket_log_del_ok'), onPress: async () => {
                  //处理离线删除日志
                  if (this.props.offline) {
                    try {
                      await cacheTicketLogOperate(TICKET_LOG_DELETE, log)
                    } catch (e) {
                      console.log('----->deletelog', e)
                    }

                    let rowData = this.state.rowData;
                    rowData.ticketLogs.splice(index, 1);
                    rowData.ticketLogs = [].concat(rowData.ticketLogs);
                    this.setState({ rowData })
                    return;
                  }

                  apiDelTicketLog({
                    id: log.ticketId,
                    logId: log.id
                  }).then(res => {
                    if (res.code === CODE_OK) {
                      let rowData = this.state.rowData;
                      rowData.ticketLogs.splice(index, 1);
                      rowData.ticketLogs = [].concat(rowData.ticketLogs);
                      this.setState({ rowData })
                    } else {
                      SndAlert.alert(localStr('lang_alert_title'), res.msg);
                    }
                  })
                }
              }
            ]
          )
        }
      }]
    })
  }

  _getLogMessage() {
    //如果是巡检或者保养工单，那么不显示日志
    if ([6, 15].includes(this.state.rowData.ticketType)) {
      return null;
    }
    let logs = this.state.rowData.ticketLogs;
    let arr = logs.map((log, index) => {
      let imgs = log.pictures.map((img, imgIndex) => {
        return (
          <TouchableWithoutFeedback key={imgIndex} onPress={() => {
            this.props.navigation.push('PageWarpper', {
              id: 'ticket_log_edit',
              component: PhotoShowView,
              passProps: {
                index: imgIndex,
                onBack: () => this.props.navigation.pop(),
                data: log.pictures
              }
            })
          }}>
            <View style={{ width: this.picWid + 10, height: this.picWid + 10 }}>
              <CacheImage uri={img.uri} borderWidth={1} space={10} key={img.key} imageKey={img.key} width={this.picWid - 2} height={this.picWid - 2} />
            </View>

          </TouchableWithoutFeedback>

        )
      })
      return (
        <TouchableWithoutFeedback
          onLongPress={() => {
            if (this.state.isExecutor)
              this.clickLog(log, index);
          }}>
          <View style={{ paddingTop: 10, borderBottomColor: Colors.seBorderSplit, borderBottomWidth: 1 }} key={index}>
            <Text style={{ fontSize: 15, lineHeight: 24, color: Colors.seTextTitle }}>{log.content}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {imgs}
            </View>
            <Text style={{ fontSize: 12, color: Colors.seTextPrimary, marginVertical: 10 }}>{`${log.userName}  ${log.createTime}`}</Text>
          </View>
        </TouchableWithoutFeedback>

      )
    })
    return (
      <View style={{ backgroundColor: Colors.seBgContainer, margin: 10, marginBottom: 0, borderRadius: 12 }}>
        <View style={{ marginLeft: 16 }}>
          {this._getTab()}
          <View style={{ height: 1, backgroundColor: Colors.seBorderSplit }} />
          {arr}
        </View>

      </View>
    )
  }

  _closeTicket() {
    SndAlert.alert(
      localStr('lang_ticket_close_confirm'),
      '',
      [
        { text: localStr('lang_ticket_filter_cancel'), onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
        {
          text: localStr('lang_ticket_filter_ok'), onPress: async () => {
            if (this.props.offline) {
              await cacheTicketModify(this.state.rowData.id, 1, 50);
              this.showToast(localStr('lang_ticket_close_toast'))
              this._loadTicketDetail();
              return;
            }

            //审批通过
            apiCloseTicket({ id: this.state.rowData.id }).then(ret => {
              if (ret.code === CODE_OK) {
                this.props.ticketChanged && this.props.ticketChanged();
                this.showToast(localStr('lang_ticket_close_toast'))
                this._loadTicketDetail();
              } else {
                SndAlert.alert(localStr('lang_alert_title'), ret.msg);
              }
            })
          }
        }])
  }

  _renderSubmittedButton() {
    return (
      <Bottom borderColor={Colors.seBorderSplit} height={54} backgroundColor={Colors.seBgContainer}>

        {/*<Button*/}
        {/*  style={[styles.button,{borderWidth:1,borderColor:'#888',*/}
        {/*    backgroundColor:'#fff',marginLeft:16,flex:1,marginRight:0*/}
        {/*  }]}*/}
        {/*  textStyle={{*/}
        {/*    fontSize:16,*/}
        {/*    color:'#888'*/}
        {/*  }}*/}
        {/*  text={'驳回'}*/}
        {/*  onClick={() => this._rejectTicket()} />*/}
        <Button
          style={[styles.button, {
            backgroundColor: Colors.seBrandNomarl,
            marginLeft: 16,
            flex: 1,
            borderRadius: 2,
          }]}
          textStyle={{
            fontSize: 16,
            color: Colors.seTextInverse
          }}
          text={localStr('lang_ticket_detail_approved')}
          onClick={() => this._closeTicket()} />
      </Bottom>
    )
  }

  _executeTicket = async () => {
    if (this.props.offline) {
      await cacheTicketModify(this.state.rowData.id, 3, { status: 20 });
      this.showToast(localStr('lang_ticket_execute_toast'))
      this._loadTicketDetail();
      return;
    }
    apiTicketExecute(this.state.rowData.id).then(ret => {
      if (ret.code === CODE_OK) {
        this.props.ticketChanged && this.props.ticketChanged();
        this.showToast(localStr('lang_ticket_execute_toast'))
        this._loadTicketDetail();
      } else {
        SndAlert.alert(localStr('lang_alert_title'), ret.msg);
      }
    })
  }

  _writeLog() {
    this.props.navigation.push('PageWarpper', {
      id: 'ticket_log_edit',
      component: TicketLogEdit,
      passProps: {
        title: localStr('lang_ticket_detail_add_log'),
        tid: this.state.rowData.id,
        offline: this.props.offline,
        callBack: () => {
          this.props.navigation.pop();
          this._loadTicketDetail();
        },
        onBack: () => this.props.navigation.pop()
      }
    })
  }

  _doIgnore() {
    SndAlert.alert(
      localStr('lang_ticket_detail_ignore_confirm'),
      '',
      [
        { text: localStr('lang_ticket_filter_cancel'), onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
        {
          text: localStr('lang_ticket_detail_ignore'), onPress: async () => {
            if (this.props.offline) {
              await cacheTicketModify(this.state.rowData.id, 1, 60)
              return;
            }
            apiIgnoreTicket({
              id: this.state.rowData.id
            }).then(ret => {
              if (ret.code === CODE_OK) {
                this.props.ticketChanged && this.props.ticketChanged();
                this._loadTicketDetail();
              } else {
                SndAlert.alert(localStr('lang_alert_title'), ret.msg);
              }
            })
          }
        }
      ])
  }

  async _submitTicket(forceSubmit) {
    let ticketLogs = this.state.rowData.ticketLogs;
    if (!this._isJobTicket()) {
      if (!ticketLogs || ticketLogs.length === 0) {
        SndAlert.alert(localStr('lang_alert_title'), localStr('lang_ticket_submit_invalid'));
        return;
      }
    } else {
      let check = this._checkJobInput();
      if (check.invalidNum) {
        return;
      }
      if (check.noInput && !forceSubmit) {
        SndAlert.alert(localStr('lang_alert_title'), localStr('lang_job_save_alert_tip2'), [
          { text: localStr('lang_job_save_alert_button1'), onPress: () => { } },
          {
            text: localStr("lang_toolbar_submit"), onPress: async () => {
              let ret = await this._saveJob();
              ret && this._submitTicket(true);
            }
          }
        ]);
        return;
      } else {
        if (this.state.rowData.jobChanged) {
          if (!await this._saveJob()) { return }
        }
      }
    }


    if (this.props.offline) {
      await cacheTicketModify(this.state.rowData.id, 1, 30)
      this.showToast(localStr('lang_ticket_submit_toast'))
      this._loadTicketDetail();
      return;
    }

    apiSubmitTicket({ id: this.state.rowData.id }).then(ret => {
      if (ret.code === CODE_OK) {
        this.props.ticketChanged && this.props.ticketChanged();
        this.showToast(localStr('lang_ticket_submit_toast'))
        this._loadTicketDetail();
        // //接口异步更新，重新获取详情可能状态还没变，这里手动更新状态
        // let rowData = this.state.rowData;
        // rowData.ticketState = STATE_PENDING_AUDIT;
        // this.setState({rowData})
      } else {
        SndAlert.alert(localStr('lang_alert_title'), ret.msg);
      }
    })
  }

  _checkJobInput() {
    this.setState({ showWarning: true })
    //如果有非法输入，给出提示
    let tasks = this.state.rowData.extensionProperties.jobFlow.mainItems;
    let findNoInupt = false;
    let find = tasks.find(task => {
      return task.subItems.find(sub => {
        let rowType = sub.valueType || sub.typeValue;
        if (rowType === 2) {
          if (sub.result === null || sub.result === undefined || String(sub.result).trim() === '') {
            findNoInupt = true;
          } else {
            let num = Number(sub.result.trim());
            if (isNaN(num)) {
              SndAlert.alert(sub.name || '', localStr('lang_job_row_only_number'));
              return true;
            }
          }
        } else {
          if (sub.result === null || sub.result === undefined || String(sub.result).trim() === '') {
            findNoInupt = true;
          }
        }
        return false;
      })
    })
    return {
      invalidNum: find,
      noInput: findNoInupt
    }
  }

  _saveJob = async () => {
    try {
      let ret = await apiUpdateTicketJob({
        ticketId: this.state.rowData.id,
        ...this.state.rowData.extensionProperties.jobFlow
      });
      if (ret.code === CODE_OK) {
        this._loadTicketDetail();//重新加载最新的数据
        return true;
      } else {
        //这里报错
        SndAlert.alert(localStr('lang_alert_title'), ret.msg);
        return false;
      }
    } catch (e) {
      console.log('saveJob error', e);
      return false;
    }
  }

  _checkAndSaveJob = async () => {
    let check = this._checkJobInput();
    if (check.invalidNum) {
      return;
    }
    if (check.noInput) {
      SndAlert.alert(localStr('lang_alert_title'), localStr('lang_job_save_alert_tip1'), [
        { text: localStr('lang_job_save_alert_button1'), onPress: () => { } },
        { text: localStr("lang_ticket_job_save"), onPress: this._saveJob }
      ]);
    } else {
      await this._saveJob();
    }
  }

  _getJobSaveButton() {
    return (
      <TouchableOpacity onPress={this._checkAndSaveJob} style={{
        height: 40, borderColor: Colors.seBrandNomarl, borderWidth: 1, borderRadius: 2, marginHorizontal: 16,
        justifyContent: 'center', alignItems: 'center'
      }}>
        <Text style={{ fontSize: 15, color: Colors.seBrandNomarl }}>{localStr('lang_ticket_job_save')}</Text>
      </TouchableOpacity>
    )
  }

  _isJobTicket() {
    return [6, 15].includes(this.state.rowData.ticketType);
  }

  _getButton(isScollView) {
    let status = this.state.rowData.ticketState;
    // status = STATE_NOT_START
    let logButton = (
      <TouchFeedback style={{}}
        onPress={() => {
          this._writeLog();
        }}>
        <View style={{ minWidth: 50, minHeight: 50, justifyContent: 'center', alignItems: 'center' }}>
          <Icon type='icon_ticket_log' size={16} color={Colors.seTextTitle} />
          <Text style={{ fontSize: 10, color: Colors.seTextTitle, marginTop: 3 }}>{localStr('lang_ticket_detail_write_log')}</Text>
        </View>
      </TouchFeedback>
    );
    if ((this.state.isExecutor && status === STATE_NOT_START && privilegeHelper.hasAuth(CodeMap.OMTicketExecute)) && !isScollView) {
      let btnLabel = localStr('lang_ticket_detail_begin_execute');
      //还需要判断是否是创建者和有工单执行权限
      return (
        <Bottom borderColor={Colors.seBorderSplit} height={54} backgroundColor={Colors.seBgContainer}>
          <Button
            style={[styles.button, {
              borderWidth: 1, borderColor: Colors.seBorderSplit,
              backgroundColor: Colors.seBgColor, marginLeft: 16, flex: 1, marginRight: 0
            }]}
            textStyle={{
              fontSize: 16,
              color: Colors.seTextTitle
            }}
            text={localStr('lang_ticket_detail_ignore')}
            onClick={() => this._doIgnore()} />
          <Button
            style={[styles.button, {
              backgroundColor: Colors.seBrandNomarl, marginLeft: 16, flex: 2
            }]}
            textStyle={{
              fontSize: 16,
              color: Colors.seTextInverse
            }}
            text={btnLabel} onClick={this._executeTicket} />
        </Bottom>
      );
    }

    if (status === STATE_PENDING_AUDIT && privilegeHelper.hasAuth(CodeMap.OMTicketFull)) {//表示已提交工单
      return this._renderSubmittedButton();
    }

    //执行中和已驳回操作一样
    if (this.state.isExecutor && (status === STATE_STARTING || status === STATE_REJECTED) && privilegeHelper.hasAuth(CodeMap.OMTicketExecute) && !isScollView) {
      return (
        <Bottom borderColor={Colors.seBorderSplit} height={54} backgroundColor={Colors.seBgContainer}>
          <View style={{ flexDirection: 'row', flex: 1 }}>
            <View style={{ flex: 1 }}>
              {this._isJobTicket() ? this._getJobSaveButton() : logButton}
            </View>
          </View>
          <Button
            style={[styles.button, {
              backgroundColor: Colors.seBrandNomarl,
              marginLeft: 0,
              flex: this._isJobTicket() ? 1 : 3,
            }]}
            textStyle={{
              fontSize: 16,
              color: Colors.seTextInverse
            }}
            text={localStr('lang_ticket_detail_submit_ticket')}
            onClick={() => this._submitTicket()} />
        </Bottom>
      );
    }
    return null;
  }

  _editTicket = () => {
    this.props.navigation.push('PageWarpper', {
      id: 'ticket_edit',
      component: CreateTicket,
      passProps: {
        ticketInfo: this._isJobTicket() ? this._detail : Immutable.fromJS(this.state.rowData),
        onPostingCallback: (type) => {
          if (type !== 'delete') {
            this.props.navigation.pop();
            this._loadTicketDetail();
          } else {
            setTimeout(() => {
              this.props.navigation.pop(2);
              this.props.ticketChanged && this.props.ticketChanged();
            }, 100);

          }

        },
        onBack: () => this.props.navigation.pop()
      }
    })
  }

  _getToolbar(data) {
    this._actions = [];
    let actionSelected = [];
    if (data) {
      var status = data.ticketState;
      //如果有错误信息，不显示分享按钮
      if (!this.props.errorMessage) {
      }
      if ((status === STATE_NOT_START || status === STATE_STARTING || status === STATE_REJECTED)
        && (privilegeHelper.hasAuth(CodeMap.OMTicketFull))) {
        this._actions.push({
          title: localStr('lang_ticket_detail_edit'),
          iconType: 'edit',
          show: 'always', showWithText: false
        });
        actionSelected.push(() => {
          this.setState({
            modalVisible: true,
            arrActions: [{
              title: localStr('lang_ticket_detail_change_executors'),
              click: () => {
                this.props.navigation.push('PageWarpper', {
                  id: 'ticket_select_executors',
                  component: TicketSelectExecutors,
                  passProps: {
                    executors: this.state.rowData.executors,
                    title: localStr('lang_ticket_detail_change_executors'),
                    assets: {
                      customerId: customerId,
                      filterHierarchy: false,
                      privilegeCode: appPrivilegeHelper.CodeMap.OMTicketExecute,
                    },
                    onChangeExecutors: (users) => {
                      let data = users;//[].concat(users).concat(this.state.rowData.executors);
                      apiEditTicket({
                        id: this.state.rowData.id,
                        executors: data,
                      }).then(ret => {
                        if (ret.code === CODE_OK) {
                          this.props.ticketChanged && this.props.ticketChanged();
                          this._loadTicketDetail();
                        } else {
                          //出错信息
                          SndAlert.alert(localStr('lang_alert_title'), ret.msg)
                        }
                      })
                    },
                    onBack: () => this.props.navigation.pop()
                  }
                })
              }
            }, {
              title: localStr('lang_ticket_detail_change_time'),
              click: () => {
                this.props.navigation.push('PageWarpper', {
                  id: 'ticket_select_time',
                  component: TicketSelectTime,
                  passProps: {
                    title: localStr('lang_ticket_detail_change_time'),
                    startTime: this.state.rowData.startTime,
                    endTime: this.state.rowData.endTime,
                    canEditStart: status === STATE_NOT_START,
                    onChangeDate: (startTime, endTime) => {
                      let data = {
                        endTime,
                        id: this.state.rowData.id
                      }
                      if (status === STATE_NOT_START) {
                        data.startTime = startTime
                      }
                      apiEditTicket(data).then(res => {
                        if (res.code === CODE_OK) {
                          this.props.ticketChanged && this.props.ticketChanged();
                          this._loadTicketDetail();
                        } else {
                          SndAlert.alert(localStr('lang_alert_title'), res.msg)
                        }
                      })
                    },
                    onBack: () => this.props.navigation.pop()
                  }
                })
              }
            }]
          })
        });
      }
    }
    let _clicks = null;
    if (this.state.rowData && this.state.rowData.ticketType) {
      if ([2, 4].includes(this.state.rowData.ticketType)) {
        _clicks = [this._editTicket]
      } else {
        _clicks = actionSelected;
      }
    }
    _clicks = [this._editTicket]

    return (
      <Toolbar
        title={localStr('lang_ticket_detail')}
        navIcon="back"
        onIconClicked={() => {
          this.props.navigation.pop()
        }}
        actions={this.props.offline ? [] : this._actions}
        onActionSelected={_clicks}
      />
    );
  }

  componentDidMount() {
    this._msgLongPress = DeviceEventEmitter.addListener('msgLongPress', menu => {
      this._showMenu(menu);
    });
    this._logLongPress = DeviceEventEmitter.addListener('logLongPress', menu => {
      this._showMenu(menu);
    });
    this._loadTicketDetail();
  }

  async _loadOfflineData() {
    let cacheData = await getTicketFromCache(this.props.ticketId);
    if (cacheData) {
      //还需要读取日志表里面的内容
      let logs = await getTicketLogsFromCache(this.props.ticketId);
      cacheData.ticketLogs = logs;
      this._processData({ data: cacheData })
    } else {
      this.setState({
        errorMessage: localStr('lang_http_no_content'), isFetching: false
      })
    }
  }

  _processData(data) {
    let isCreateUser = data.data.createUser === userId;
    let isExecutor = false;//data.data.executors.incl
    if (data.data.executors) {
      let find = data.data.executors.find(item => item.userId === userId);
      if (find) isExecutor = true;
    }
    //如果是工单创建者也能执行，后面记得删除
    // if (!isExecutor && isCreateUser) isExecutor = true;

    let rejectData = null
    if (data.data.ticketState === STATE_REJECTED) {
      rejectData = data.data.ticketOperateLogs.filter(item => item.operationType === REJECT_OPERATION_TYPE)
        .sort((a, b) => {
          return moment(b.createTime).toDate().getTime() - moment(a.createTime).toDate().getTime()
        })[0];
    }
    this.setState({
      rowData: data.data,
      isCreateUser,
      rejectData,
      isFetching: false,
      isExecutor
    })
  }

  _loadTicketDetail = async () => {
    if (this.props.offline) {
      this._loadOfflineData();
      return;
    }
    //获取工单详情
    this.setState({ isFetching: true })
    try {
      let data = await apiTicketDetail(this.props.ticketId);
      if (data.code === CODE_OK) {
        //获取详情ok
        this._processData(data);
        if (this._isJobTicket()) {
          this._detail = Immutable.fromJS(data.data);
        }
      } else {
        this.setState({
          errorMessage: data.msg, isFetching: false
        })
      }
    } catch (e) {
      this.setState({
        errorMessage: e, isFetching: false
      })
    }

    // apiTicketDetail(this.props.ticketId).then(data => {
    //   // data = mackTicket;
    //   if (data.code === CODE_OK) {
    //     //获取详情ok
    //     this._processData(data)
    //   } else {
    //     this.setState({
    //       errorMessage: data.msg, isFetching: false
    //     })
    //   }
    // })
  }

  componentWillUnmount() {
    this._msgLongPress.remove();
    this._logLongPress.remove();
  }

  _showMenu(menu) {
    this.setState({ 'modalVisible': true, arrActions: menu, title: '' });
  }

  _getActionSheet() {
    var arrActions = this.state.arrActions;
    if (!arrActions) {
      return;
    }
    if (this.state.modalVisible) {
      return (
        <SchActionSheet title={this.state.title} arrActions={arrActions} modalVisible={this.state.modalVisible}
          onCancel={() => {
            this.setState({ 'modalVisible': false });
          }}
          onSelect={item => {
            this.setState({ modalVisible: false }, () => {
              setTimeout(() => {
                item.click();
              }, 200);
            });
          }}
        >
        </SchActionSheet>
      )
    }
  }

  _renderRejection() {
    //只有驳回状态，才显示驳回原因，驳回状态是23
    let status = this.state.rowData.ticketState;
    if (status !== STATE_REJECTED) return null;
    let reason = this.state.rejectData.content
    let RejectUser = this.state.rejectData.userName
    let rejectTime = moment(this.state.rejectData.createTime).format('YYYY-MM-DD HH:mm:ss');
    return (
      <View style={{ backgroundColor: Colors.seWarningBg, padding: 16, }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: Colors.seTextTitle, fontWeight: '600' }}>{localStr('lang_ticket_detail_reject_reason')}</Text>
        </View>
        <View style={{ height: 1, backgroundColor: Colors.seBorderSplit, marginRight: -16, marginTop: 16, marginBottom: 12 }} />
        <Text style={{ fontSize: 16, color: Colors.seTextPrimary, lineHeight: 28 }}>{reason}</Text>
        <Text style={{ fontSize: 12, color: Colors.seTextPrimary, marginTop: 10 }}>{`${RejectUser}  ${rejectTime}`}</Text>
      </View>
    )
  }

  showToast(msg) {
    this.setState({
      showToast: true,
      toastMessage: msg
    });
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this.setState({
        showToast: false,
        toastMessage: ''
      });
    }, 1500);
  }

  _renderToast() {
    if (!this.state.showToast) return null;
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={this.state.showToast}
        onRequestClose={() => { }}>
        <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
          <View style={{ borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#00000099', marginBottom: 120 }}>
            <Text style={{ fontSize: 15, color: '#fff' }}>{this.state.toastMessage}</Text>
          </View>
        </View>
      </Modal>
    )
  }

  render() {
    if (!this.state.isFetching && this.state.errorMessage) {
      return (
        <View style={{ flex: 1, backgroundColor: Colors.seBgLayout }}>
          {this._getToolbar(this.props.rowData)}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 17, color: GRAY }}>{this.state.errorMessage}</Text>
          </View>
        </View>
      )
    }
    if (this.state.isFetching || !this.state.rowData) {
      return (
        <View style={{ flex: 1, backgroundColor: Colors.seBgLayout }}>
          {this._getToolbar(this.state.rowData)}
          <Loading />
        </View>
      )
    }

    var marginBottom = { marginBottom: bottomHeight };

    //已提交工单没有按钮，已开始按钮，在scrollview内，如果没有权限，按钮也不显示
    var bottomButton = this._getButton(false);
    if (!bottomButton) {
      marginBottom = null;
    }

    if (bottomButton) {
      if (Platform.OS === 'ios') {
        bottomButton = (
          <View style={{ backgroundColor: Colors.seBgContainer }}>
            <View style={{ marginBottom: (isPhoneX() ? 34 : 0) }}>
              {bottomButton}
            </View>
          </View>
        );
      } else {
        bottomButton = (
          <View style={{ marginBottom: (isPhoneX() ? 34 : 0) }}>
            {bottomButton}
          </View>
        );
      }
    }

    return (
      <View style={{ flex: 1, backgroundColor: Colors.seBgLayout }}>
        {this._getToolbar(this.state.rowData)}
        <ScrollView showsVerticalScrollIndicator={false} style={[styles.wrapper, marginBottom]}>
          <ViewShot style={{ flex: 1, backgroundColor: Colors.seBgLayout }} ref="viewShot" options={{ format: "jpg", quality: 0.9 }}>
            {this._renderRejection()}
            {this._getAssetView()}
            {this._getTaskView()}
            {this._getDocumentsView()}
            {this._renderJob()}
            {this._getLogMessage()}
            {this._getIDView()}
            <View style={{ height: 10, flex: 1, }}>
            </View>
          </ViewShot>
        </ScrollView>
        {bottomButton}
        {this._getActionSheet()}
        {this._renderToast()}
      </View>
    );
  }
}

var bottomHeight = 54;

var styles = StyleSheet.create({
  statusRow: {
    height: 69,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: TICKET_STATUS
  },
  statusText: {
    fontSize: 17,
    color: BLACK
  },
  moreContent: {
    margin: 16,
    marginTop: 0,
    marginBottom: 13,
    //backgroundColor: 'white'
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    height: bottomHeight,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    height: 40,
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 2,

  },
  wrapper: {
    flex: 1,
    //backgroundColor: 'transparent',
  },
});
