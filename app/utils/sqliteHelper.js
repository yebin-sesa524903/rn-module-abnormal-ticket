'use strict';

import moment from 'moment';
import SQLite from './SqliteStorage.js';
let sqLite = null;


//查询某个工单本地是否有修改
export async function isTicketUpdatedInCache(ticketId, tableName = 'ticket_operation') {
  if (!sqLite) {
    sqLite = SQLite.getInstance();
  }
  let result = await sqLite.cmdSql(`select distinct ticket_id from ${tableName} where ticket_id = ? limit 10`,
    [ticketId])
  return result.rows.length >= 1;
}

//查询本地工单总条数
export async function getCacheTicketCount() {
  if (!sqLite) {
    sqLite = SQLite.getInstance();
  }

  let result = await sqLite.cmdSql('select distinct ticket_id from tickets limit 10000',
    [])
  return result.rows.length;

}


export async function cacheDownloadTickets(downloadDate, arrTickets) {
  if (!sqLite) {
    sqLite = SQLite.getInstance();
  }
  let lastUpdateTime = moment().format('YYYY-MM-DD HH:mm:ss');

  let ticket_log_ids = [];
  arrTickets.forEach(item => {
    ticket_log_ids = ticket_log_ids.concat(item.ticketLogs.map(log => log.id));
  })

  let ids = arrTickets.map(item => item.id);
  let result = await sqLite.cmdSql('select ticket_id from ticket_operation GROUP BY ticket_id', [])
  let needDeleteIds = [].concat(ids);
  if (result.rows.length > 0) {
    for (let i = 0; i < result.rows.length; i++) {
      let index = needDeleteIds.findIndex(item => item === result.rows.item(i).ticket_id);
      if (index >= 0) {
        needDeleteIds.splice(index, 1);
        arrTickets.splice(index, 1);//同时下载的数据中也不能插入已经修改的这些ID列
      }
    }
  } else {
    needDeleteIds = ids;
  }

  await sqLite.cmdSql(`delete from ticket_logs where ticket_id in (${needDeleteIds.join(',')})`, [])
  await sqLite.cmdSql(`delete from tickets where ticket_id in (${needDeleteIds.join(',')})`, [])
  //开始插入缓存数据
  for (let item of arrTickets) {
    let ticket_id = item.id;
    item.DownloadTime = lastUpdateTime;
    let ticket_detail = JSON.stringify(item);
    let download_date = downloadDate;
    let status = item.ticketState || 0;
    let content = item.content || '';
    await sqLite.cmdSql("INSERT INTO tickets(ticket_id,ticket_detail,download_date,status,content) values(?,?,?,?,?)",
      [ticket_id, ticket_detail, download_date, status, content])

    if (item.ticketLogs && item.ticketLogs.length > 0) {
      for (let log of item.ticketLogs) {
        await sqLite.cmdSql('insert into ticket_logs(log_id,ticket_id,log_detail) values(?,?,?)',
          [log.id, log.ticketId, JSON.stringify(log)])
      }
    }
  }
}


export async function isTicketInCache(ticketId, tableName = 'tickets') {
  if (!sqLite) {
    sqLite = SQLite.getInstance();
  }
  let result = await sqLite.cmdSql(`select distinct ticket_id from ${tableName} where ticket_id = ? limit 10`,
    [ticketId]);
  return result.rows.length >= 1;
}

//获取本地待同步的数据，查询修改记录，
export async function getUnSyncTickets(tableName = 'ticket_operation') {
  if (!sqLite) {
    sqLite = SQLite.getInstance();
  }
  let results = await sqLite.cmdSql(`select * from ${tableName} order by operation_time limit 1000 `,
    [])
  let arrDatas = [];
  if (results && results.rows && results.rows.length > 0) {
    for (let i = 0; i < results.rows.length; i++) {
      arrDatas.push(results.rows.item(i));
    }
  }
  return arrDatas;
}

export async function updateImageUpload(pid, content, tableName = 'ticket_operation') {
  if (!sqLite) {
    sqLite = SQLite.getInstance();
  }
  let ticketUpdateSql = `UPDATE ${tableName} SET new_content = ? WHERE id = ? `;
  let ticketUpdateParams = [content, pid];
  await sqLite.cmdSql(ticketUpdateSql, ticketUpdateParams);
}

export async function cacheTicketModify(ticketId, type, newStatusOrContents, isService = false) {
  if (!sqLite) {
    sqLite = SQLite.getInstance();
  }

  console.warn(ticketId, type, newStatusOrContents);
  let ticket_id = ticketId;
  let operation_time = moment().format('YYYY-MM-DD HH:mm:ss');
  let operation_type = type;
  let new_status = '';
  let new_content = '';
  let ticketUpdateSql = '';
  let ticketUpdateParams = [];
  if (type === 1) {
    new_status = newStatusOrContents;
    let tableName = isService ? 'service_tickets' : 'tickets';
    ticketUpdateSql = `UPDATE ${tableName} SET status = ? WHERE ticket_id = ? `;
    ticketUpdateParams = [new_status, ticket_id];
    if (typeof newStatusOrContents === 'object') {
      new_status = newStatusOrContents.status;
      new_content = newStatusOrContents.content;
      ticketUpdateParams = [new_status, ticket_id];

      let ticket = await getTicketFromCache(ticket_id);
      if (ticket) {
        await sqLite.cmdSql('UPDATE tickets SET ticket_detail = ? WHERE ticket_id = ? ', [JSON.stringify(ticket), ticket_id])
      }
    }

  } else if (type === 2) {
    let onlyContent = newStatusOrContents.content;
    if (onlyContent) {
      let tableName = isService ? 'service_tickets' : 'tickets';
      ticketUpdateSql = `UPDATE ${tableName} SET content = ?,ticket_detail = ? WHERE ticket_id = ? `;
      ticketUpdateParams = [JSON.stringify(onlyContent), newStatusOrContents.ticket, ticket_id];
    }
    new_content = JSON.stringify(newStatusOrContents);
  } else if (type === 3) {//开始执行
    new_status = newStatusOrContents.status;
    ticketUpdateSql = 'UPDATE tickets SET status = ? WHERE ticket_id = ? ';
    ticketUpdateParams = [new_status, ticket_id];
    new_content = JSON.stringify(newStatusOrContents);
  }
  if (ticketUpdateSql) {
    await sqLite.cmdSql(ticketUpdateSql, ticketUpdateParams)
  }
  let tableName = isService ? 'service_ticket_operation' : 'ticket_operation';
  await sqLite.cmdSql(`INSERT INTO ${tableName}(ticket_id,operation_time,operation_type,new_status,new_content) values(?,?,?,?,?)`,
    [ticket_id, operation_time, operation_type, new_status, new_content])

}

export async function clearTicket(ticketId, isService = false) {
  if (!sqLite) {
    sqLite = SQLite.getInstance();
  }
  let tableName = isService ? 'service_tickets' : 'tickets';
  let operationTableName = isService ? 'service_ticket_operation' : 'ticket_operation';
  await sqLite.cmdSql(`delete from ${operationTableName} where ticket_id = ?`, [ticketId])
  await sqLite.cmdSql(`delete from ${tableName} where ticket_id = ?`, [ticketId])
  await sqLite.cmdSql("delete from ticket_logs where ticket_id = ?", [ticketId])
}

export async function clearCacheTicket() {
  if (!sqLite) {
    sqLite = SQLite.getInstance();
  }
  await sqLite.cmdSql("delete from ticket_operation", [])
  await sqLite.cmdSql("delete from tickets", [])
  await sqLite.cmdSql("delete from ticket_logs", [])
}

export async function getTicketLogsFromCache(ticketId) {
  if (!sqLite) {
    sqLite = SQLite.getInstance();
  }
  let res = await sqLite.cmdSql('select * from ticket_logs where ticket_id = ?', [ticketId]);
  let logs = [];
  if (res && res.rows && res.rows.length > 0) {
    let len = res.rows.length;
    for (let i = 0; i < len; i++) {
      logs.push(JSON.parse(res.rows.item(i).log_detail));
    }
    logs.sort((a, b) => {
      let one = moment(a.createTime);
      let tow = moment(b.createTime);
      return tow.unix() - one.unix();
    });
  }
  return logs;
}

export async function getTicketFromCache(ticketId, multi) {
  if (!sqLite) {
    sqLite = SQLite.getInstance();
  }
  let results = await sqLite.cmdSql(`select ticket_id,ticket_detail,download_date,status,content from tickets where ticket_id IN (${ticketId})`,
    []);
  console.log('res', results)
  let len = results.rows.length;
  if (len >= 1) {
    if (multi) {
      let arr = [];
      for (let i = 0; i < len; i++) {
        let ticket = JSON.parse(results.rows.item(i).ticket_detail);
        ticket.content = results.rows.item(i).content;
        ticket.ticketState = results.rows.item(i).status;
        arr.push(ticket);
      }
      return arr;
    } else {
      let ticket = JSON.parse(results.rows.item(0).ticket_detail);
      ticket.content = results.rows.item(0).content;
      ticket.ticketState = results.rows.item(0).status;
      return ticket;
    }
  } else {
    return null;
  }
}

//获取指定日期的本地缓存数据
export async function getCacheTicketByDate(date) {
  if (!sqLite) {
    sqLite = SQLite.getInstance();
  }

  let results = await sqLite.cmdSql(`select ticket_id,ticket_detail,download_date,status,content from tickets where download_date = ?`, [date])
  let len = results.rows.length;
  if (len >= 1) {
    let arr = [];
    for (let i = 0; i < len; i++) {
      let item = results.rows.item(i);
      let ticket = JSON.parse(item.ticket_detail);
      ticket.content = item.content;
      ticket.ticketState = item.status;
      arr.push(ticket);
    }
    //根据状态排序
    arr.sort((a, b) => a.ticketState - b.ticketState)
    return arr;
  }
  return null;
}

export const TICKET_LOG_ADD = 4;
export const TICKET_LOG_UPDATE = 5;
export const TICKET_LOG_DELETE = 6;
export const TICKET_TYPE_SAVE_SIGN = 7;
export const TICKET_TYPE_SAVE_SIGN_BZ = 8;
//记录对工单日志的离线操作
export async function cacheTicketLogOperate(type, ticketLog) {
  if (!sqLite) {
    sqLite = SQLite.getInstance();
  }
  let operation_time = moment().format('YYYY-MM-DD HH:mm:ss');
  //删除日志，需要把ticket_logs表中的对应记录删除
  //还需要在ticket_operation表中记录删除日志操作
  let logSql = null;
  let logParam = [];
  //操作记录
  let operateSql = null;
  let operateParam = [];
  let log_string = JSON.stringify(ticketLog);
  switch (type) {
    case TICKET_LOG_ADD:
      logSql = 'insert into ticket_logs(log_id,ticket_id,log_detail) values(?,?,?)';
      logParam = [ticketLog.id, ticketLog.ticketId, log_string];
      operateSql = "INSERT INTO ticket_operation(ticket_id,log_id,operation_time,operation_type,new_status,new_content) values(?,?,?,?,?,?)";
      operateParam = [ticketLog.ticketId, ticketLog.id, operation_time, TICKET_LOG_ADD, '', log_string];
      break;
    case TICKET_LOG_UPDATE:
      logSql = 'update ticket_logs set log_detail = ? where log_id = ?';
      logParam = [log_string, ticketLog.id];
      //如果是修改的本地创建日志，更新操作不单独记录操作，而仅仅只是在原来创建记录中做修改
      if (ticketLog.localCreate) {
        operateSql = 'update ticket_operation set operation_time = ?,new_content =? where log_id =?';
        operateParam = [operation_time, log_string, ticketLog.id];
      } else {
        operateSql = "INSERT INTO ticket_operation(ticket_id,log_id,operation_time,operation_type,new_status,new_content) values(?,?,?,?,?,?)";
        operateParam = [ticketLog.ticketId, ticketLog.id, operation_time, TICKET_LOG_UPDATE, '', log_string];
      }
      break;
    case TICKET_LOG_DELETE:
      logSql = 'delete from  ticket_logs where log_id = ?';
      logParam = [ticketLog.id];
      //这里情况有点特殊，如果删除的日志，是本地添加的，还没有被同步过，则不需要记录到同步记录里面
      //为了区分是本地工单日志，给本地工单日志添加一个字段进行标识 isLocal=true;
      if (ticketLog.localCreate) {
        operateSql = 'delete from ticket_operation where log_id = ?';
        operateParam = [ticketLog.id];
      } else {
        operateSql = "INSERT INTO ticket_operation(ticket_id,log_id,operation_time,operation_type,new_status,new_content) values(?,?,?,?,?,?)";
        operateParam = [ticketLog.ticketId, ticketLog.id, operation_time, TICKET_LOG_DELETE, '', log_string];
      }
      break;
    default:
      throw (`日志操作类型错误：${type}`);
  }
  await sqLite.cmdSql(logSql, logParam);
  await sqLite.cmdSql(operateSql, operateParam);

}


//获取指定日期的本地缓存数据
export async function getCacheDays(tableName = 'tickets') {
  if (!sqLite) {
    sqLite = SQLite.getInstance();
  }
  let results = await sqLite.cmdSql(`select download_date from ${tableName} GROUP BY download_date `, [])
  let len = results.rows.length;
  if (len >= 1) {
    let arr = [];
    for (let i = 0; i < len; i++) {
      let item = results.rows.item(i);
      arr.push(item.download_date);
    }
    return arr;
  }
  return [];
}

//获取指定工单的下载时间（同步时判断是否被其他用户修改需要用到）
export async function getDownloadTimeByTicketId(ticketId, tableName = 'tickets') {
  if (!sqLite) {
    sqLite = SQLite.getInstance();
  }
  let results = await sqLite.cmdSql(`select ticket_detail from ${tableName} where ticket_id = ? `, [ticketId])
  let len = results.rows.length;
  if (len >= 1) {
    let downloadTime = JSON.parse(results.rows.item(0).ticket_detail).DownloadTime;
    return downloadTime;
  }
  return null;
}

