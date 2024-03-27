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
import TicketSign from './TicketSign.js';
import Orientation from 'react-native-orientation';
import CacheImage from "./CacheImage";
import { apiSignTicket, apiUploadFile, userName, userId } from 'rn-module-abnormal-ticket/app/middleware/bff.js';
import moment from 'moment';

const CODE_OK = '0';

export class JobView extends Component {

  constructor(props) {
    super(props);
    this.state = { job: props.job, showWarning: true, expandMap: {}, showAllExpand: true }
  }

  _makeSignName = () => {
    return `${this.props.rowData.ticketCode}-${moment().format('YYYYMMDDHHmmss')}.jpg`;
  }

  _uploadSign = async (sign) => {
    try {
      let ret = await apiUploadFile({
        content: sign,
        name: this._makeSignName()
      });
      if (ret.code === CODE_OK) {
        let signInfo = {
          ticketId: this.props.rowData.id,
          signFilePath: ret.data.key,
          signTime: moment().format('YYYY-MM-DD HH:mm:ss'),
          signUserId: userId,
          signUserName: userName,
        }
        ret = await apiSignTicket(signInfo)
        if (ret.code === CODE_OK) {
          this.props.rowData.extensionProperties.signInfo = signInfo;
          this.props.changeSignInfo(signInfo)
          this.setState({})
          return true;
        } else {
          SndAlert.alert(
            '',
            ret.msg || localStr('lang_network_error'),
          )
        }
      } else {
        SndAlert.alert(
          '',
          ret.msg || localStr('lang_network_error'),
        )
      }
    } catch (e) {
      SndAlert.alert(
        '',
        String(e),
      )
    }
    return false;
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.job && nextProps.job !== this.state.job) {
      this.setState({ job: nextProps.job });
    }
  }

  _doSign = () => {
    Orientation.lockToLandscape();
    this.props.navigation.push('PageWarpper', {
      id: 'ticket_sign',
      component: TicketSign,
      passProps: {
        onBack: () => this.props.navigation.pop(),
        saveSign: async (sign) => {
          if (sign) {
            let ret = await this._uploadSign(sign);
            if (ret) {
              this.props.navigation.pop();
            }
          }
        }
      }
    })
  }

  _renderSignature() {
    //判断工单状态
    let status = this.props.status;
    if ([10, 60].includes(status)) {
      return null;
    }
    let signView = null;
    let signInfo = this.props.rowData.extensionProperties.signInfo;
    if (signInfo && signInfo.signFilePath) {
      //如果是base64图片开图，则是本地图片
      if (signInfo.signFilePath.indexOf('data:image/jpeg;base64,') === 0) {
        signView = (
          <Image resizeMode="contain" style={{ flex: 1, height: 80 }} source={{ uri: signInfo.signFilePath }} />
        )
      } else {
        signView = (
          <View style={{ flex: 1 }}>
            <CacheImage borderWidth={0} space={0} key={signInfo.signFilePath} imageKey={signInfo.signFilePath} height={80} />
          </View>
        )
      }
    } else {
      signView = <Text style={{ fontSize: 17, color: Colors.seBrandNomarl }}>{localStr('lang_ticket_detail_sign_tip')}</Text>;
    }

    return (
      <View style={{ padding: 16, margin: 10, borderRadius: 12, backgroundColor: Colors.seBgContainer, flexDirection: 'row', alignItems: 'center', }}>
        <Text key={0} style={{
          fontSize: 17, color: '#333',
          fontWeight: '500'
        }}>{localStr("lang_ticket_detail_customer_sign")}</Text>
        <TouchFeedback key={'key'} style={{ flex: 1 }} onPress={this._doSign}>
          {signView}
        </TouchFeedback>
      </View>
    )
  }

  _executeCheck = () => {
    console.log('_executeCheck', this.executePermission, this.props.status)
    if (this.props.executePermission && this.props.status === 10) {
      Keyboard.dismiss();
      setTimeout(() => {
        SndAlert.alert(
          '',
          localStr('lang_execute_ticket_dialog_title'),
          [
            { text: localStr('lang_execute_ticket_dialog_cancel'), onPress: () => { } },
            {
              text: localStr("lang_execute_ticket_dialog_ok"), onPress: () => {
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
          }}>{localStr('lang_ticket_job')}</Text>
          <Text style={{ fontSize: 15, color: Colors.seBrandNomarl }}>{this.state.showAllExpand ? localStr('lang_ticket_job_expand') : localStr('lang_ticket_job_fold')}</Text>
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
          let showAllExpand = this.state.showAllExpand;
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
            imageClick={this.props.imageClick} rowData={this.props.rowData}
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
    let redColor = this.props.showWarning && [10, 20, 30, 40].includes(status);//已关闭工单不显示红字
    if (finishCount === count) {
      return (
        <Text style={{ fontSize: 17, color: Colors.seTextTitle }}>{localStr("lang_status_5")}</Text>
      );
    } else {
      return (
        <Text style={{ fontSize: 17, color: redColor ? Colors.seErrorColor : Colors.seTextTitle }}>{`${finishCount}/${count}`}</Text>
      );
    }
  }

  render() {
    return (
      <>
        <View style={{ margin: 10, borderRadius: 12, backgroundColor: Colors.seBgContainer, paddingBottom: 12 }}>
          {this._renderJob()}
        </View>
        {this._renderSignature()}
      </>

    )
  }
}
