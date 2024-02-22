import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  DeviceEventEmitter,
  Image, InteractionManager,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  SectionList,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import CalendarStrip from "./components/SlideableCalendar/CalendarStrip";
import Icon2 from "./components/Icon";

import { Icon } from '@ant-design/react-native';
import { LIST_BG, CLEAN_FILTER_BG, CLEAN_FILTER_BORDER, GREEN } from "./styles/color";
import TouchFeedback from "./components/TouchFeedback";
import TicketRow from "./TicketRow";
import { getTicketFilter, getTicketList, setTicketFilter } from "./store";
import { getLanguage, localFormatStr, localStr } from "./utils/Localizations/localization";
import TicketFilter from "./TicketFilter";
import TicketDetail from "./TicketDetail";
import {
  apiDownloadTicketList,
  apiQueryTicketList,
  apiTicketCount,
  apiTicketList, customerId,
} from "./middleware/bff";
import moment from "moment";

import SndAlert from "../../../app/utils/components/SndAlert";

import { isPhoneX } from "./utils";
import privilegeHelper, { CodeMap } from "./utils/privilegeHelper";
import Loading from "rn-module-abnormal-ticket/app/components/Loading";
import { apiHierarchyList } from "./middleware/bff";
import Colors, { isDarkMode } from "../../../app/utils/const/Colors";
import { checkDisk, downloadTickets, getTicketsData } from "./utils/offlineUtil";
import RingRound from "./components/RingRound";
import NetInfo from "@react-native-community/netinfo";
import { getCacheDays, getCacheTicketByDate } from "./utils/sqliteHelper";
import TicketSync from "./TicketSync";
const MP = Platform.OS === 'ios' ? (isPhoneX() ? 0 : 10) : 0;
const CODE_OK = '0';
const DAY_FORMAT = 'YYYY-MM-DD';

export const TICKET_TYPE_MAP = {
  10: localStr('lang_status_1'),
  20: localStr('lang_status_2'),
  30: localStr('lang_status_3'),
  40: localStr('lang_status_4'),
  50: localStr('lang_status_5'),
  60: localStr('lang_status_6')
}

export default class TicketList extends Component {

  constructor(props) {
    super(props);
    this.state = {
      refreshing: true,
      hasPermission: (privilegeHelper.hasAuth(CodeMap.OMTicketExecute) ||
        privilegeHelper.hasAuth(CodeMap.OMTicketFull) ||
        privilegeHelper.hasAuth(CodeMap.OMTicketRead))
    }
  }

  static contextTypes = {
    showSpinner: PropTypes.func,
    hideHud: PropTypes.func
  };

  componentDidMount() {
    InteractionManager.runAfterInteractions((() => {
      if (privilegeHelper.hasCodes()) {
        this.loadTicketList(new Date(), 1);
        let start = moment().add(-1, 'months').format(DAY_FORMAT);
        let end = moment().add(1, 'months').format(DAY_FORMAT);
        this.loadTicketCount(start, end);
      } else {
        this.setState({ refreshing: true, hasPermission: true })
      }
      this._initListener = DeviceEventEmitter.addListener('TICKET_ABNORMAL_INIT_OK', () => {
        this.setState({
          hasPermission: (privilegeHelper.hasAuth(CodeMap.OMTicketExecute) ||
            privilegeHelper.hasAuth(CodeMap.OMTicketFull) ||
            privilegeHelper.hasAuth(CodeMap.OMTicketRead))
        })
        this.loadTicketList(new Date(), 1);
      })
    }))

    this._netChangeListener = NetInfo.addEventListener(
      (isConnected) => {
        this._clearFilter()
      }
    );

  }

  componentWillUnmount() {
    this._initListener && this._initListener.remove();
    this._netChangeListener && this._netChangeListener()
  }

  loadTicketCount(start, end) {
    apiTicketCount(start, end).then(data => {
      if (data.code === CODE_OK) {
        //这里更新有点的日期
        let markedDate = this.state.markedDate || [];
        data.data.forEach(item => {
          let date = moment(item.date).format(DAY_FORMAT);
          let findIndex = markedDate.findIndex(sel => sel === date);
          if (item.count === 0) {
            //移除
            if (findIndex >= 0) markedDate.splice(findIndex, 1);
          } else {
            //添加
            if (findIndex < 0) markedDate.push(date);
          }
          this.setState({ markedDate })
        });
      }
    });
  }

  _renderEmpty() {
    if (!this.state.refreshing && this.state.error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.seBgContainer }}>
          <Text style={{ fontSize: 15, color: Colors.seTextDisabled, marginTop: 8 }}>{this.state.error}</Text>
        </View>
      )
    }
    if (this.state.refreshing) return null;
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.seBgContainer }}>
        <Image resizeMode={'contain'} source={isDarkMode() ? require('./images/empty_box/empty_box_dark.png') : require('./images/empty_box/empty_box.png')} style={{ width: 128 * 0.5, height: 80 * 0.5 }} />
        <Text style={{ fontSize: 14, color: Colors.seTextDisabled, marginTop: 8 }}>{localStr('lang_empty_data')}</Text>
      </View>
    )
  }

  queryTicketList(filter) {
    if (!filter.pageNo) filter.pageNo = 1;
    this.setState({ refreshing: true, showEmpty: false, ticketData: [], error: null });
    apiQueryTicketList(filter).then(data => {
      this.setState({ refreshing: false })
      if (data.code === CODE_OK) {
        if (!data.data || data.data.length === 0) {
          this.setState({ showEmpty: true })
          return;
        }
        //组装数据
        let section = [];
        let hasMore = false;
        //这里假设已经根据状态排序了
        // if(data.pageTotal > filter.pageNo) {
        //   //说明还有下一页
        //   hasMore = true;
        // }
        if (filter.pageNo > 1) {
          section = this.state.ticketData;
        }

        data.data.forEach(item => {
          let group = section.find(g => g.state === item.ticketState);
          if (group) {
            group.data.push(item);
          } else {
            group = {
              state: item.ticketState,
              stateName: item.ticketStateLabel,
              title: TICKET_TYPE_MAP[item.ticketState],//item.ticketStateLabel,
              isFolder: false,
              data: [item]
            }
            section.push(group);
          }
        })
        this.setState({ ticketData: section, hasMore }, () => this._loadApiHierarchyList())
      } else {
        //请求失败
        this.setState({ ticketData: [], error: data.msg })
      }
    })
  }

  _loadApiHierarchyList() {
    apiHierarchyList({
      customerId: customerId,
      treeType: 'fmhc',
      type: '1'
    }).then((res) => {
      this._hierarchyList = res.data;
      let ticketData = this.state.ticketData;
      for (const ticketDatum of ticketData) {
        for (const dataObj of ticketDatum.data) {
          for (const re of res.data) {
            if (re.id == dataObj.objectId) {
              dataObj.locationInfo = this._getLocationInfo(res.data, re.id);
            }
          }
        }
      }
      this.setState({
        ticketData: this.state.ticketData
      })
    }).catch((reason) => {

    })
  }

  _getLocationInfo(hierarchies, locationId) {
    let locations = [];
    let findParent = function (id) {
      for (let hierarchy of hierarchies) {
        if (hierarchy.id === id) {
          locations.push(hierarchy.name);
          if (hierarchy.parentId !== undefined) {
            findParent(hierarchy.parentId);
          }
          break
        }
      }
    }
    if (locationId) {
      findParent(locationId);
    }
    return locations.reverse().join('/');
  }

  loadTicketList = async (date, pageNo) => {
    date = moment(date).format(DAY_FORMAT);
    //处理离线显示
    if (!global.isConnected()) {
      //读取离线数据并显示
      console.log('offline date', date);
      let cacheData = await getCacheTicketByDate(date) || [];
      let markedDate = await getCacheDays();
      console.log(JSON.stringify(cacheData), JSON.stringify(markedDate))
      let section = [];
      //这里假设已经根据状态排序了
      cacheData.forEach(item => {
        let group = section.find(g => g.state === item.ticketState);
        if (group) {
          group.data.push(item);
        } else {
          group = {
            state: item.ticketState,
            stateName: item.ticketStateLabel,
            title: TICKET_TYPE_MAP[item.ticketState],//item.ticketStateLabel,
            isFolder: false,
            data: [item]
          }
          section.push(group);
        }
      })
      this.setState({ ticketData: section, markedDate, error: null, showEmpty: cacheData.length === 0, refreshing: false })
      return;
    }
    this.setState({ refreshing: true, showEmpty: false, ticketData: [], error: null })

    //处理加载中等。。。
    apiTicketList(date, pageNo).then(data => {
      this.setState({ refreshing: false })
      if (data.code === CODE_OK) {

        if (!data.data || data.data.length === 0) {
          this.setState({ showEmpty: true })
          return;
        }
        let markedDate = this.state.markedDate || [];
        markedDate.push(date);
        markedDate = [].concat(markedDate);
        //组装数据
        let section = [];
        //这里假设已经根据状态排序了
        data.data.forEach(item => {
          let group = section.find(g => g.state === item.ticketState);
          if (group) {
            group.data.push(item);
          } else {
            group = {
              state: item.ticketState,
              stateName: item.ticketStateLabel,
              title: TICKET_TYPE_MAP[item.ticketState],//item.ticketStateLabel,
              isFolder: false,
              data: [item]
            }
            section.push(group);
          }
        })
        this.setState({ ticketData: section, markedDate, error: null }, () => this._loadApiHierarchyList())
      } else {
        let udpate = { ticketData: [], error: data.msg, }
        if (data.code === '401') udpate.hasPermission = false;
        this.setState(udpate)
      }
    });
  }

  _clickFilter = () => {
    this.setState({ openFilter: true })
  }

  _renderRightButton() {
    let disableDownload = !global.isConnected() || !this.state.ticketData || this.state.ticketData.length === 0;
    return (
      <View style={{ position: 'absolute', marginTop: -10, right: 14 + (this.props.paddingRight || 0), padding: 6, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', marginRight: -6 }}>
          {global.isConnected() &&
            <TouchableOpacity style={{ padding: 6 }} onPress={this._clickFilter}>
              <Icon name="filter" size={24} color={'#fff'} />
            </TouchableOpacity>
          }
          {
            <TouchableOpacity disabled={disableDownload} style={{ padding: 6 }} onPress={this._downloadTickets}>
              <Icon name="download" size="sm" color={!disableDownload ? "#fff" : '#ffffff88'} />
            </TouchableOpacity>
          }
          {false &&
            <TouchableOpacity style={{ padding: 6 }} onPress={() => {
              if (this.props.onCreateTicket) this.props.onCreateTicket();
            }}>
              <Icon name="plus" size='sm' color="#fff" />
            </TouchableOpacity>
          }
        </View>
      </View>
    );
  }

  _renderSection = (info) => {

    let { title, isFold } = info.section;
    let count = info.section.data.length;
    if (isFold) {
      count = info.section.data1.length;
    }
    return (
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, backgroundColor: LIST_BG, }}>
          <Text style={{ fontSize: 14, color: '#888', backgroundColor: LIST_BG, paddingVertical: 10, flex: 1 }}>
            {`${title}  (${count})`}
          </Text>
          <TouchFeedback onPress={() => {
            info.section.isFold = !isFold;
            if (info.section.isFold) {
              info.section.data1 = [...info.section.data];
              info.section.data = [];
            } else {
              info.section.data = [...info.section.data1];
              info.section.data1 = [];
            }
            this.setState({})
          }}>
            <View style={{ height: 30, width: 30, justifyContent: 'center', alignItems: 'center' }}>
              <Icon2 type={isFold ? "icon_arrow_up" : 'icon_arrow_down'} color="#888" size={13} />
            </View>
          </TouchFeedback>
        </View>
      </View>
    )
  }
  _renderRow = (info) => {
    let rowData = info.item;
    return (
      <TicketRow rowData={rowData} onRowClick={this._gotoDetail} />
    );
  }

  _gotoDetail = (rowData) => {
    console.log('rowData', rowData)
    this.props.navigation.push('PageWarpper', {
      id: 'service_ticket_detail',
      component: TicketDetail,
      passProps: {
        ticketId: rowData.id,
        offline: !global.isConnected(),//进入详情之前就要决定详情是显示在线还是离线内容
        ticketChanged: () => this._onRefresh()
      }
    })
  }

  _renderFooterView = () => {
    if (!this.state.showFilterResult || !this.state.hasMore) return null;
    return (
      <View style={{ height: 40, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'black' }}>{localStr('lang_load_more')}</Text>
      </View>
    )
  }

  _onRefresh = () => {
    if (!this.state.refreshing) {
      //没有刷新就做
      if (this.state.showFilterResult) {
        let filter = getTicketFilter().filter;
        filter.pageNo = 1;
        this.queryTicketList(filter)
      } else {
        this.loadTicketList(this.state.selectedDate, 1)
      }
    }
  }

  _loadMore = () => {
    if (!this.state.refreshing && this.state.hasMore) {
      //没有刷新就做
      let filter = getTicketFilter().filter;
      let pageNo = filter.pageNo || 1;
      pageNo++;
      filter.pageNo = pageNo;
      this.queryTicketList(filter);
    }
  }

  _getView() {
    if (this.state.showEmpty) return this._renderEmpty();
    if (!this.state.ticketData || this.state.ticketData.length === 0)
      return (
        <View style={{ flex: 1, backgroundColor: Colors.seBgContainer }}>
          <Loading />
        </View>
      )
    return (
      <SectionList style={{ flex: 1, paddingHorizontal: 16, backgroundColor: Colors.seBgLayout }} sections={this.state.ticketData}
        contentContainerStyle={{ flex: (this.state.ticketData && this.state.ticketData.length > 0) ? undefined : 1 }}
        refreshControl={
          <RefreshControl
            refreshing={this.state.refreshing}
            onRefresh={this._onRefresh}
            tintColor={GREEN}
            title={localStr('lang_load_more')}
            colors={[GREEN]}
            progressBackgroundColor={'white'}
          />
        }
        stickySectionHeadersEnabled={true}
        // renderSectionHeader={this._renderSection}
        renderItem={this._renderRow}
        ListEmptyComponent={() => this._renderEmpty()}
        refreshing={this.state.refreshing}
        onRefresh={this._onRefresh}
        onEndReachedThreshold={0.1}
        onEndReached={this._loadMore}
        ListFooterComponent={this._renderFooterView}
      />
    )
  }

  _closeFilter = () => {
    this.setState({ openFilter: false })
  }

  _doReset = () => {
    this._clearFilter();
  }

  _doFilter = () => {
    let resFilter = getTicketFilter().filter;
    this.setState({
      openFilter: false,
      showFilterResult: true
    })
    this.queryTicketList(getTicketFilter().filter)
  }

  _clearFilter = () => {
    this.setState({
      showFilterResult: false,
      openFilter: false,
    })
    setTicketFilter({})
    this.loadTicketList(this.state.selectedDate, 1)
  }

  _downloadTickets = async () => {
    if (!await checkDisk()) {
      SndAlert.alert(localStr('lang_alert_title'), localStr('lang_offline_disk_not_enough'));
      return;
    }
    let date = moment(this.state.selectedDate).format(DAY_FORMAT);
    this.context.showSpinner();
    try {
      let data = await apiDownloadTicketList(date)
      //这里需要根据获取的层级数据，补齐层级信息
      data = getTicketsData();
      console.log(data, this._hierarchyList)
      for (const dataObj of data) {
        for (const re of this._hierarchyList) {
          if (re.id == dataObj.objectId) {
            dataObj.locationInfo = this._getLocationInfo(this._hierarchyList, re.id);
          }
        }
      }
      await downloadTickets(date, data)
      //这里是否需要判断空间下
      this.context.hideHud();
    } catch (e) {
      console.log('download ticket error', e)
      //出现异常，关闭对话框
      this.context.hideHud();
    }
  }

  _renderClearView() {
    return (
      <View style={{ alignItems: 'center', backgroundColor: Colors.seBrandNomarl, paddingTop: 12 }}>
        <TouchFeedback onPress={this._clearFilter}>
          <View style={{
            paddingHorizontal: 12,
            height: 31,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: Colors.seTextInverse,
            borderColor: CLEAN_FILTER_BORDER,
            borderWidth: 0,
            marginBottom: 12,
            borderRadius: 14
          }}>
            <Text style={{ fontSize: 14, color: Colors.seBrandNomarl }}>{localStr('lang_ticket_clear_filter')}</Text>
          </View>
        </TouchFeedback>
      </View>
    )
  }

  _renderFilter() {
    if (!this.state.openFilter) return null;
    return (
      <Modal style={{}} transparent={true} onRequestClose={this._closeFilter}>
        <View style={{ backgroundColor: '#00000066', flex: 1, flexDirection: 'row' }}>
          <TouchableOpacity style={{ width: '20%', height: '100%' }} onPress={this._closeFilter}></TouchableOpacity>
          <View style={{ width: '80%', backgroundColor: '#fff', height: '100%' }}>
            <SafeAreaView style={{ flex: 1 }}>
              <TicketFilter doReset={this._doReset} doFilter={this._doFilter} />
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    )
  }

  _goBack = () => this.props.navigation.pop();

  _renderTop() {
    //如果是工单筛选，显示工单筛选，否则显示日历
    if (this.state.showFilterResult) {
      return (
        <View style={{ marginTop: MP, backgroundColor: Colors.seBrandNomarl }}>
          <View style={{ flexDirection: 'row', paddingTop: 4, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 17, color: Colors.seTextInverse, fontWeight: '500' }}>{localStr('lang_ticket_filter')}</Text>
            <View style={{ position: 'absolute', right: 16 + (this.props.paddingRight || 0) }}>
              <TouchFeedback onPress={this._clickFilter}>
                <Icon name="filter" size={24} color={Colors.seTextInverse} />
              </TouchFeedback>
            </View>
          </View>
          <View style={{ height: 10, }} />
          {this._renderClearView()}
        </View>
      )
    }
    return (
      <View style={{ marginTop: MP, backgroundColor: Colors.seBrandNomarl }}>
        <CalendarStrip
          isChinese={getLanguage() === 'zh'}
          selectedDate={this.state.selectedDate || new Date()}
          onPressDate={(date) => {
            this.setState({
              selectedDate: date
            })
            this.loadTicketList(date, 1);
          }}
          onPressGoToday={(today) => {
            this.setState({
              selectedDate: today
            })
            this.loadTicketList(today, 1);
          }}
          markedDate={this.state.markedDate || []}
          loadTicketCount={(day1, day2) => {
            this.loadTicketCount(day1, day2)
          }}
          weekStartsOn={1} // 0,1,2,3,4,5,6 for S M T W T F S, defaults to 0
        />
        {this._renderRightButton()}
        {/* <View style={{ position: 'absolute', left: 16, top: Platform.OS === 'ios' ? 0 : 4 }}>
          <TouchFeedback onPress={this._goBack}>
            <Image style={{ tintColor: '#333', width: 20, height: 20 }} source={require('./images/back_arrow/back_arrow.png')} />
          </TouchFeedback>
        </View> */}
      </View>
    )
  }

  _renderNoPermission() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <Image source={require('./images/empty_box/empty_box.png')} style={{ width: 60, height: 40 }} />
        <Text style={{ fontSize: 15, color: '#888', marginTop: 8 }}>{localStr('lang_ticket_list_no_permission')}</Text>
      </View>
    );
  }

  _offlineView() {
    if (global.isConnected()) return null;
    return (
      <TouchableOpacity style={{
        paddingVertical: 7, paddingHorizontal: 16, alignItems: 'center',
        flexDirection: 'row', backgroundColor: '#fffbe6'
      }} onPress={this._gotoSync}>
        <Icon2 type="icon_info" color="#ff9500" size={12} />
        <Text numberOfLines={1} style={{ fontSize: 12, color: '#ff9500', marginLeft: 5 }}>
          {localStr('lang_offline_tip1')}
        </Text>
      </TouchableOpacity>
    )
  }

  _gotoSync = () => {
    this.props.navigation.push('PageWarpper', {
      id: 'ticket_sync',
      component: TicketSync,
      passProps: {
        onBack: () => { }
      }
    })
  }

  _autoSyncView() {
    if (global.isConnected() && this.state.waitingSyncTickets > 0) {
      //表示正在同步中...
      if (this.state.syncFailCount > 0) {
        return (
          <TouchFeedback onPress={this._gotoSync}>
            <View style={{
              paddingVertical: 7, paddingHorizontal: 16, alignItems: 'center',
              flexDirection: 'row', backgroundColor: '#ffe9e9'
            }}>
              <Icon2 type="icon_info_down" color="#ff4d4d" size={12} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontSize: 12, color: '#ff4d4d', marginLeft: 5 }}>
                  {localFormatStr('lang_offline_tip3', 1)}
                </Text>
              </View>
              <Icon2 type="icon_asset_folder" color="#ff4d4d" size={16} />
            </View>
          </TouchFeedback>
        );
      }
      return (
        <TouchFeedback onPress={this._gotoSync}>
          <View style={{
            paddingVertical: 7, paddingHorizontal: 16, alignItems: 'center',
            flexDirection: 'row', backgroundColor: '#fffbe6'
          }}>
            <RingRound>
              <Icon2 type="icon_sync" size={13} color="#ff9500" />
            </RingRound>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontSize: 12, color: '#ff9500', marginLeft: 5 }}>
                {localStr('lang_offline_tip2')}
              </Text>
            </View>
            <Icon2 type="icon_asset_folder" color="#ff9500" size={16} />
          </View>
        </TouchFeedback>
      );
    }
  }

  render() {
    if (!this.state.hasPermission) {
      return this._renderNoPermission()
    }

    return (
      <SafeAreaView style={{ flex: 1, marginTop: 0 }}>
        <StatusBar translucent={true} backgroundColor={'#00000022'} />
        <View style={{ height: StatusBar.currentHeight, backgroundColor: Colors.seBrandNomarl }} />
        <View style={{ flex: 1 }}>
          <View style={{ height: 6, backgroundColor: Colors.seBrandNomarl }} />
          {this._renderTop()}
          {this._offlineView()}
          {this._autoSyncView()}
          {this._getView()}
        </View>
        {this._renderFilter()}
      </SafeAreaView>
    );
  }
}


