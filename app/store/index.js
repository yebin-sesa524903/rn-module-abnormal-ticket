import mm from 'moment'
import {localStr} from "../utils/Localizations/localization";
import {apiTicketList} from "../middleware/bff";
const DAY_FORMAT = 'yyyy-MM-DD';

const GROUP = [
  localStr('lang_status_1'),
  localStr('lang_status_2'),
  localStr('lang_status_3'),
  localStr('lang_status_4'),
  localStr('lang_status_5'),
  localStr('lang_status_6'),
]

let ticketList = {

}

let ticketFilter = {
  filter:{},
  data:processTicketList(randomDemoTickets())
}

function setTicketFilter(filter) {
  console.log('setfilter',filter)
  ticketFilter.filter = {...filter}
}

function resetTicketFilter() {
  ticketFilter.filter = {}
}

function getTicketFilter() {
  return ticketFilter
}



function randomDemoTickets() {
  let list = [];
  for(let i=0;i<34;i++) {
    list.push({
      Id:i,
      BuildingNames:['建筑1','建筑2'],
      Title:'诊断'+i,
      StartTime:new Date(),
      EndTime:new Date(),
      Content:'这里是工单的内容',
      Status:Number.parseInt(Math.random()*6)+1
    })
  }
  return list;
}

function processTicketList(dataList) {
  //转换成sectionList使用的数据
  let data = GROUP.map((item,index) => {
    return {
      data:[],
      key:index+1,
      title:item,
      isFold:false
    }
  })
  dataList.forEach((item,index) => {
    let find = data.find(sec => sec.key === item.Status);
    if(find) {
      find.data.push(item);
    }
  })
  return data;
}

async function getTicketList(time) {
  let day = mm(time).format(DAY_FORMAT);
  let data = await apiTicketList(day);
  console.log('...data',data)
  return null;

  // let data = ticketList[day];
  // if(!data) {
  //   data = processTicketList(randomDemoTickets());
  //   setTicketList(day,data);
  // }
  // return data;
}

//对列表进行折叠后者展开操作
function sectionOp(type,isFold,index){
  let list = null;
  if(type === 'ticketList') {
    list = {...ticketList}
  }else {
    list = {...ticketFilter}
  }


  return list;
}

function setTicketList(time,data) {
  let day = mm(time).format(DAY_FORMAT);
  ticketList[day] = data;
}

export {
  getTicketList,setTicketList,setTicketFilter,resetTicketFilter,getTicketFilter
}
