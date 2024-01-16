import React, { Component } from 'react';
import { connect } from 'react-redux';
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
import { getLanguage, localStr } from "./utils/Localizations/localization";
import TicketFilter from "./TicketFilter";
import TicketDetail from "./TicketDetail";
import {
  apiQueryTicketList,
  apiTicketCount,
  apiTicketList, customerId,
} from "./middleware/bff";
import moment from "moment";

import { isPhoneX } from "./utils";
import privilegeHelper, { CodeMap } from "./utils/privilegeHelper";
import Loading from "rn-module-abnormal-ticket/app/components/Loading";
import { apiHierarchyList } from "./middleware/bff";
import Colors, {isDarkMode} from "../../../app/utils/const/Colors";
const MP = Platform.OS === 'ios' ? (isPhoneX() ? 0 : 10) : 0;
const CODE_OK = '0';
const DAY_FORMAT = 'YYYY-MM-DD';

const TICKET_TYPE_MAP = {
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

  }

  componentWillUnmount() {
    this._initListener && this._initListener.remove();
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
        <Image resizeMode={'contain'} source={isDarkMode() ? require('./images/empty_box/empty_box_dark.png') : require('./images/empty_box/empty_box.png')} style={{width: 128 * 0.5, height: 80 * 0.5}} />
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
    let locationMsg = '';
    let parentName = '';
    let parentParentName = '';
    let parentId = 0;
    for (let hierarchy of hierarchies) {
      if (locationId == hierarchy.id) {
        locationMsg = hierarchy.name;
        parentId = hierarchy.parentId;
        break;
      }
    }
    let parParentId = 0;
    for (let hierarchy of hierarchies) {
      if (parentId == hierarchy.id) {
        parentName = hierarchy.name;
        parParentId = hierarchy.parentId;
        break;
      }
    }
    for (let hierarchy of hierarchies) {
      if (parParentId == hierarchy.id) {
        parentParentName = hierarchy.name;
        break;
      }
    }
    return parentParentName + '/' + parentName + '/' + locationMsg;
  }

  loadTicketList(date, pageNo) {
    this.setState({ refreshing: true, showEmpty: false, ticketData: [], error: null })
    date = moment(date).format(DAY_FORMAT);
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
    return (
      <View style={{ position: 'absolute', marginTop: -10, right: 14 + (this.props.paddingRight || 0), padding: 6, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', marginRight: -6 }}>
          {
            <TouchableOpacity style={{ padding: 6 }} onPress={this._clickFilter}>
              <Icon name="filter" size={24} color={'#fff'} />
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
    this.props.navigation.push('PageWarpper',{
      id: 'service_ticket_detail',
      component: TicketDetail,
      passProps: {
        ticketId: rowData.id,
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
          <View style={{flex:1, backgroundColor: Colors.seBgContainer}}>
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
      openFilter:false,
    })
    setTicketFilter({})
    this.loadTicketList(this.state.selectedDate, 1)
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
            marginBottom:12,
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

  _goBack = () => this.props.navigator.pop();

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
          {this._getView()}
        </View>
        {this._renderFilter()}
      </SafeAreaView>
    );
  }
}


