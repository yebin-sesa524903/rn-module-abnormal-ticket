
'use strict';
import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Platform,
  DatePickerAndroid,
  TextInput,
  ScrollView, Alert
} from 'react-native';

import StatableSelectorGroup from './components/StatableSelectorGroup';
import { GREEN, LIST_BG, GRAY, LINE } from './styles/color.js';
import TouchFeedback from './components/TouchFeedback';
import moment from 'moment';
import { isPhoneX } from './utils'
import DateTimePicker from 'react-native-modal-datetime-picker';
import {getLanguage, localStr} from "./utils/Localizations/localization";
import { getTicketFilter, setTicketFilter } from './store'
import Colors from "../../../app/utils/const/Colors";
import SndAlert from "../../../app/utils/components/SndAlert";

let statusBarHeight = 28;
if (Platform.OS === 'ios') {
  statusBarHeight = 20;
  if (isPhoneX()) {
    statusBarHeight = 40;
  }
}

let onLayout = undefined;
if (Platform.OS === 'android') onLayout = (e) => { };

export default class TicketFilter extends Component {
  constructor(props) {
    super(props);

    //默认查当天到1个月的
    let filter = getTicketFilter().filter;
    if (!filter.StartTime) {
      filter.StartTime = new Date();
    }
    if (!filter.EndTime) {
      filter.EndTime = moment().add(1, 'months').toDate();
    }
    this.state = { date: new Date(), filter: { ...filter } };
  }
  _renderSeparator(sectionId, rowId) {
    return (
      <View key={rowId} style={styles.sepView}></View>
    )
  }

  //安卓日期选择
  async _showPicker(type) {
    if (Platform.OS === 'android') {
      try {
        var value = undefined;
        if (type === 'StartTime') {
          value = this.state.filter.StartTime || undefined;
        } else if (type === 'EndTime') {
          value = this.state.filter.EndTime || undefined;
        }
        var date = moment(value);
        var options = { date: date.toDate(), maxDate: new Date() };
        var { action, year, month, day } = await DatePickerAndroid.open(options);
        if (action !== DatePickerAndroid.dismissedAction) {
          var date = moment({ year, month, day, hour: 8 });//from timezone
          //this.props.filterChanged(type,date.toDate());
          let filter = this.state.filter;
          filter[type] = date.toDate();
          this.setState({ filter })
        }

      } catch ({ code, message }) {
      }
    }
  }

  _renderPickerView() {
    return (
      <DateTimePicker
        is24Hour={true} locale={getLanguage()}
        titleIOS={localStr('lang_ticket_filter_select_date')}
        headerTextIOS={localStr('lang_ticket_filter_select_date')}
        titleStyle={{ fontSize: 17, color: '#333' }}
        cancelTextIOS={localStr('lang_ticket_filter_cancel')}
        confirmTextIOS={localStr('lang_ticket_filter_ok')}
        mode={'date'}
        datePickerModeAndroid={'spinner'}
        date={this.state.date}
        onDateChange={(date) => {
          this._selectDate = date;
          this.setState({ date })
        }}
        isVisible={this.state.modalVisible}
        onConfirm={(date) => {
          this.setState({ modalVisible: false });
          //this.props.filterChanged(this.state.type,date);
          let filter = this.state.filter;
          let type = this.state.type;
          filter[type] = date;
          this.setState({ filter })
        }}
        onCancel={() => {
          this.setState({ modalVisible: false })
        }}
      />
    )
  }

  _clickBeginTime(time) {
    let beginTime = null;
    if (beginTime) {
      beginTime = new Date(beginTime);
    } else {
      beginTime = new Date();
    }
    if (Platform.OS === 'android') {
      this.setState({ modalVisible: true, type: 'StartTime', date: beginTime });
    } else {
      this.setState({ modalVisible: true, type: 'StartTime', date: beginTime });
    }
  }

  _clickEndTime(time) {
    let endTime = null;
    if (endTime) {
      endTime = new Date(endTime);
    } else {
      endTime = new Date();
    }
    if (Platform.OS === 'android') {
      // this._showPicker('EndTime');
      this.setState({ modalVisible: true, type: 'EndTime', date: endTime });
    } else {
      this.setState({ modalVisible: true, type: 'EndTime', date: endTime });
    }
  }

  _renderDate(rid) {
    let beginTime = localStr('lang_ticket_filter_start_time');
    let beginColor = Colors.seTextDisabled;
    let filter = this.state.filter;
    if (filter.StartTime) {
      beginColor = Colors.seTextTitle;
      beginTime = moment(filter.StartTime).format("YYYY-MM-DD")
    }
    let endTime = localStr('lang_ticket_filter_end_time');
    let endColor = Colors.seTextDisabled;
    if (filter.EndTime) {
      endColor = Colors.seTextTitle;
      endTime = moment(filter.EndTime).format("YYYY-MM-DD");
    }
    return (
      <View key={rid}>
        <Text numberOfLines={1} style={{ fontSize: 13, color: Colors.seTextSecondary }}>
          {localStr('lang_ticket_filter_time')}
        </Text>
        <View style={{ flex: 1, flexDirection: 'row', height: 30, alignItems: 'center', marginTop: 10 }}>
          <TouchFeedback style={{ flex: 1 }} onPress={() => this._clickBeginTime()}>
            <View style={{
              flex: 1, borderColor: Colors.seBorderBase, height: 30, borderWidth: 1, borderRadius: 2,
              justifyContent: 'center', alignItems: 'center'
            }}>
              <Text style={{ fontSize: 13, color: beginColor }}>{beginTime}</Text>
            </View>
          </TouchFeedback>
          <View style={{ width: 8, height: 1, backgroundColor: Colors.seTextTitle, marginHorizontal: 10 }} />
          <TouchFeedback style={{ flex: 1 }} onPress={() => this._clickEndTime()}>
            <View style={{
              flex: 1, borderColor: Colors.seBorderBase, borderWidth: 1, height: 30, borderRadius: 2,
              justifyContent: 'center', alignItems: 'center'
            }}>
              <Text style={{ fontSize: 13, color: endColor }}>{endTime}</Text>
            </View>
          </TouchFeedback>
        </View>
      </View>
    )
  }

  _renderTicketName() {
    return (
      <View key={'ticketName'}>
        <Text numberOfLines={1} style={{ fontSize: 13, color: Colors.seTextSecondary }}>
          {localStr('lang_ticket_name')}
        </Text>
        <View style={{
          flex: 1, borderColor: Colors.seBorderBase, height: 28, borderWidth: 1, borderRadius: 2,
          justifyContent: 'center', alignItems: 'center', marginVertical: 10, marginBottom: 20, flexDirection: 'row'
        }}>
          <TextInput style={{ fontSize: 13, color: Colors.seTextTitle, height: 23, padding: 0, flex: 1, paddingHorizontal: 12 }}
            placeholderTextColor={Colors.seTextDisabled}
            underlineColorAndroid={'transparent'}
            onChangeText={text => {
              let filter = this.state.filter;
              filter.ticketName = text.trim();
              this.setState({ filter })
            }}
            value={this.state.filter.ticketName || ''}
            placeholder={localStr('lang_ticket_filter_input')}
            onFocus={e => { }}
          />
        </View>
      </View>
    )
  }

  componentWillReceiveProps(nextProps) {
  }

  _doFilter = () => {
    //需要判断开始时间是否晚于结束时间
    let start = moment(moment(this.state.filter.StartTime).format('YYYY-MM-DD'))
    let end = moment(moment(this.state.filter.EndTime).format('YYYY-MM-DD'))
    if (start.isAfter(end)) {
      SndAlert.alert(localStr('lang_alert_title'), localStr('lang_ticket_select_time_invalid'))
      return;
    }
    console.log('filter', this.state.filter)
    setTicketFilter(this.state.filter)
    this.props.doFilter();
  }

  _doReset = () => {
    this.props.doReset()
  }

  _getBottom() {
    let toBottom = isPhoneX() ? 34 : 0;
    return (
      <View style={{ flexDirection: 'row', height: 57, borderTopColor: Colors.seBorderSplit, borderTopWidth: 1, marginBottom: 0 }}>
        <TouchFeedback style={{ flex: 1 }} onPress={this._doReset}>
          <View style={{ backgroundColor: Colors.seBgElevated, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: Colors.seTextPrimary, fontSize: 16 }}>{localStr('lang_ticket_filter_reset')}</Text>
          </View>
        </TouchFeedback>
        <TouchFeedback style={{ flex: 1 }} onPress={this._doFilter}>
          <View style={{ backgroundColor: Colors.seBrandNomarl, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: Colors.seTextTitle, fontSize: 16 }}>{localStr('lang_ticket_filter_ok')}</Text>
          </View>
        </TouchFeedback>
      </View>
    );
  }

  render() {
    let status = localStr('lang_ticket_status_type')
    let ticket_types = localStr('lang_ticket_filter_types');//localStr('lang_ticket_status_type')
    let list = (
      <View style={{ flex: 1, backgroundColor:Colors.seBgElevated }}>
        <ScrollView ref="sv" style={{ flex: 1 }} onScroll={(event) => {
          this._y = event.nativeEvent.contentOffset.y;
        }}>
          <View style={{ padding: 16, paddingRight: 16, paddingTop: 8 }}>
            <View ref="名称" onLayout={onLayout}>
              {this._renderTicketName()}
            </View>
            <View ref="时间" onLayout={onLayout}>
              {this._renderDate(0)}
            </View>
            <View style={{ height: 20 }} />
            <View ref="类型" onLayout={onLayout}>
              <StatableSelectorGroup
                title={localStr('lang_ticket_filter_show_type')}
                key={2}
                data={ticket_types}
                titleColor={Colors.seTextSecondary}
                titleFontSize={13}
                fontSize={13}
                checkedBg={Colors.seBrandBg}
                borderWidth={-1}
                unCheckedBg={Colors.seFill3}
                checkedFontColor={Colors.seBrandNomarl}
                borderRadius={2}
                unCheckedFontColor={Colors.seTextTitle}
                selectedIndexes={this.state.filter.selectTypes || []}
                onChanged={sel => {
                  let arr = this.state.filter.selectTypes || []
                  let findIndex = arr.findIndex(item => item === sel.index)
                  if (findIndex >= 0) {
                    arr.splice(findIndex, 1);
                  } else {
                    arr.push(sel.index)
                  }
                  let filter = this.state.filter;
                  filter.selectTypes = [...arr];
                  this.setState({ filter })
                  //this.props.filterChanged('status',index.index);
                }} />
            </View>
            <View style={{ height: 20 }} />
            <View ref="状态" onLayout={onLayout}>
              <StatableSelectorGroup
                title={localStr('lang_ticket_filter_status')}
                key={2}
                data={status}
                titleColor={Colors.seTextSecondary}
                titleFontSize={13}
                fontSize={13}
                checkedBg={Colors.seBrandBg}
                borderWidth={-1}
                unCheckedBg={Colors.seFill3}
                checkedFontColor={Colors.seBrandNomarl}
                borderRadius={2}
                unCheckedFontColor={Colors.seTextTitle}
                selectedIndexes={this.state.filter.selectStatus || []}
                onChanged={sel => {
                  let arr = this.state.filter.selectStatus || []
                  let findIndex = arr.findIndex(item => item === sel.index)
                  if (findIndex >= 0) {
                    arr.splice(findIndex, 1);
                  } else {
                    arr.push(sel.index)
                  }
                  let filter = this.state.filter;
                  filter.selectStatus = [...arr];
                  this.setState({ filter })
                  //this.props.filterChanged('status',index.index);
                }} />
            </View>

          </View>
        </ScrollView>
        {this._getBottom()}
      </View>
    )
    return (
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        {list}
        {this._renderPickerView()}
      </View>
    );
  }
}

var bottomHeight = 72;

var styles = StyleSheet.create({
  sepView: {
    height: 16,
    backgroundColor: 'transparent'
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
    backgroundColor: 'white'
  },
  button: {
    // marginTop:20,
    height: 43,
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 6,
  }
});
