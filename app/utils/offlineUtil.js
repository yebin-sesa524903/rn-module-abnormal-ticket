import {
  cacheDownloadTickets,
  clearTicket,
  TICKET_LOG_DELETE,
  TICKET_TYPE_SAVE_SIGN
} from "./sqliteHelper";
import { Platform } from 'react-native';
import { DeviceEventEmitter } from 'react-native'
import RNFS, { DocumentDirectoryPath, ExternalDirectoryPath } from 'react-native-fs';
import RNFetchBlob from 'react-native-fetch-blob';
import moment from 'moment';

import {
  getDownloadTimeByTicketId, getUnSyncTickets, updateImageUpload,
  TICKET_LOG_ADD, TICKET_LOG_UPDATE,
} from "./sqliteHelper";
import { apiSyncTickets, apiTicketDetail, apiUploadFile, getBaseUri, getCookie, userId, userName } from "../middleware/bff";
import { getImageUrlByKey } from "../../../../app/containers/fmcs/plantOperation/utils/Utils";
const dirPath = Platform.OS === 'ios' ? DocumentDirectoryPath : ExternalDirectoryPath


export async function downloadImages(imgs) {
  if (imgs && imgs.length > 0) {
    for (let i = 0; i < imgs.length; i++) {
      let cacheKey = imgs[i];
      const filePath = dirPath + '/' + cacheKey;
      let isExist = await RNFS.exists(filePath)
      if (!isExist) {
        //如果不存在，那么就要开始下载了
        try {
          await RNFS.mkdir(dirPath, { NSURLIsExcludedFromBackupKey: true })
          let downUrl = getImageUrlByKey(cacheKey);//getBaseUri() + 'document/get?id=' + cacheKey;
          let downloadOptions = {
            fromUrl: downUrl,
            toFile: filePath,
            headers: {
              Cookie: getCookie()
            }
          };
          console.log('downloadOptions', downloadOptions)
          let res = await RNFS.downloadFile(downloadOptions).promise
          if (res.statusCode === 200 && res.bytesWritten > 512) {

          } else {
            //说明图片有问题，删除图片
            let exist = await RNFS.exists(filePath)
            if (exist) {
              await RNFS.unlink(filePath);
            }
          }
          //这里判断是否下载成功
        } catch (e) {
          console.warn("RNFS.mkdir error", e);
        }

      }
    }
  }
}

//表示图片上传任务是否在进行中，防止本次图片上传还没完成，下一次图片上传任务来临
export let isSynchronizing = false;

export let syncInfo = {}

export function getSyncErrorCount() {
  let count = 0;
  for (let key in syncInfo) {
    if (syncInfo[key] && syncInfo[key].status > 1) count++;
  }
  return count;
}

export async function startSyncTasks() {
  console.log('startSyncTasks----------->')
  if (!isSynchronizing) {
    isSynchronizing = true;
    try {
      let ret = await syncUploadImages();
      if (!global.isConnected() || !ret) {
        //同步过程中断网了
        isSynchronizing = false;
        sendSyncUpdateNotify();
        return;
      };
      //图片上传完成了，就开始做任务了
      let tasks = await querySyncTask()
      syncInfo = {}
      tasks.forEach(task => {
        syncInfo[task.id] = {
          task, status: 0
        }
      })
      for (let task of tasks) {
        if (!global.isConnected()) {
          isSynchronizing = false;
          sendSyncUpdateNotify();
          return;
        }
        await syncTask(task);
      }

    } catch (e) {
      console.log('同步任务异常-------->', e)
    }
    isSynchronizing = false;
    sendSyncUpdateNotify();
    //如果到了这里，说明上一次的同步流程走完整了，不需要再重复一次
    if (delayCallback) clearTimeout(delayCallback);
    delayCallback = null;
  } else {
    if (delayCallback) clearTimeout(delayCallback);
    delayCallback = setTimeout(() => {
      startSyncTasks();
    }, 1000);
  }

}

let delayCallback = null;

const CODE_OK = '0'

export const SYNC_UPDATE_NOTIFY = 'SYNC_UPDATE_NOTIFY';

//当有任务更新时，发一个通知
function sendSyncUpdateNotify() {
  DeviceEventEmitter.emit(SYNC_UPDATE_NOTIFY)
}

export async function giveUpTask(tid) {
  await clearTicket(tid);
  syncInfo[tid] = undefined;
  sendSyncUpdateNotify();
}

export async function syncTask(task, force) {
  syncInfo[task.id].status = 1;//标识当前任务为进行中
  sendSyncUpdateNotify();
  //第一步，根据工单id获取最新的工单详情
  //如果网络异常，或者保存，就是当前任务失败
  console.log('syncTask', task);
  if (!force) {
    let res = null
    try {
      res = await apiTicketDetail(task.id)
      if (res.code === CODE_OK) {
        res = res.data;
      } else {
        //掉接口失败了
        syncInfo[task.id].status = res.code === '10010' ? 5 : 2;
        sendSyncUpdateNotify();
        return;
      }
    } catch (e) {
      console.log('同步获取详情失败!', task)
      syncInfo[task.id].status = 2;
      sendSyncUpdateNotify();
      return;
    }
    //第二步，如果最新状态是已关闭，现在多了忽略，则提示用户 工单已完成了
    if (res.ticketState === 60 || res.ticketState === 50) {
      syncInfo[task.id].status = 4;
      sendSyncUpdateNotify();
      return;
    }

    //第三步，判断最新的工单详情的操作记录的时间 与本地记录的操作时间做比较，
    //如果服务器时间最新，提示 是覆盖，还是 放弃
    let serverLastUpdateDate = res.ticketOperateLogs[0].createTime;
    if (moment(serverLastUpdateDate).isAfter(task.beginTime)) {
      syncInfo[task.id].status = 3;
      sendSyncUpdateNotify();
      return;
    }
  }

  //第四部 如果没有冲突，调用同步接口进行同步，同步完成后删除对应的本地缓存
  try {
    let res = await apiSyncTickets(task.id, task.data)
    if (res.code === CODE_OK) {
      //同步成功了
      await clearTicket(task.id)
      sendSyncUpdateNotify();
    } else {
      //掉接口失败了
      syncInfo[task.id].status = 2;
      sendSyncUpdateNotify();
      return;
    }
  } catch (e) {
    console.log('同步接口失败!', task)
    syncInfo[task.id].status = 2;
    sendSyncUpdateNotify();
    return;
  }
}

export async function syncUploadImages() {
  //从数据库待同步表里面找出所有需要同步的图片
  let arr = await getUnSyncTickets();
  //如果没网络，后面的就不进行了
  if (!global.isConnected()) return false;
  if (arr && arr.length > 0) {
    let result = [];
    for (let i = 0; i < arr.length; i++) {
      //判断有没有开始执行状态的，有的话，需要转换gps定位到高德定位和对应的高德地址信息
      let item = arr[i];
      if (item.operation_type === 2) { }
      else if (item.operation_type === 3) { }
      else if (item.operation_type === TICKET_LOG_ADD) {
        //处理离线定位转换成高德定位
        let logAdd = JSON.parse(item.new_content);
        //接着上传离线添加图片
        if (logAdd) {
          logAdd.pictures.forEach((img, index) => {
            if (img.uri) {
              result.push({
                PictureId: img.PictureId,
                uri: img.uri,
                img: img,
                filename: img.filename,
                index: index,
                imgParent: logAdd.Pictures,//引用父级，方便移除操作，
                id: item.id,
                content: logAdd
              })
            }
          });
        }
      } else if (item.operation_type === TICKET_LOG_UPDATE) {
        //如果是离线修改日志，可能需要上传图片
        let logUpdate = JSON.parse(item.new_content);
        if (logUpdate) {
          logUpdate.pictures.forEach((img, index) => {
            if (img.uri) {
              result.push({
                PictureId: img.PictureId,
                uri: img.uri,
                img: img,
                filename: img.filename,
                index: index,
                imgParent: logUpdate.Pictures,//引用父级，方便移除操作，
                id: item.id,
                content: logUpdate
              })
            }
          });
        }
      }

    }
    //需要上传的图片已找到，开始上传
    if (result.length > 0) {
      for (let i = 0; i < result.length; i++) {
        let item = result[i];
        //上传之前判断网络，如果断网，则停止上传，不做处理
        if (global.isConnected()) {
          let res = await updateBase64Image(item.uri, item.filename);
          if (res) {
            item.content.pictures[item.index].uri = undefined;
            item.content.pictures[item.index] = {
              key: res, name: item.filename
            }
            item.uri = undefined;
            await updateImageUpload(item.id, JSON.stringify(item.content));
          } else {
            //如果同步时上传图片失败，如何处理？目前是删除此条图片
            item.content.pictures.splice(item.index, 1);
            await updateImageUpload(item.id, JSON.stringify(item.content));
          }
        } else {
          //没有网络，就不再上传了
          return false;
        }
      }
    }
  }
  return true;
}

export async function updateBase64Image(url, filename) {
  try {
    let content = await RNFS.readFile(url, 'base64');
    let ret = await apiUploadFile({
      content: content,
      name: filename
    })
    if (ret.code === CODE_OK) {
      //上传成功会返回图片key,这个是需要记录的
      return ret.data.key;
    }
    return false;
  } catch (e) {
    console.log('上传图片失败了....', e)
    return false;
  }

}

/**
 *
 * {
        "userId": 814256, // 用户id
        "userName": "tian_test", // 用户名称
        "ticketId": 2756062101154816, // 工单id
        "operationType": 1, // 操作类型
        "operationTime": "2024-02-22 14:25:24" // 操作时间
    },
 */

//TODO 注意，参数字段名需要和后端确定
export async function querySyncTask() {
  //读取本地
  let arr = await getUnSyncTickets();
  console.log('arr', arr)
  let result = [];
  if (arr && arr.length > 0) {
    for (let i = 0; i < arr.length; i++) {
      let item = arr[i];
      let index = result.findIndex(item2 => {
        return item2.id === item.ticket_id;
      });
      //获取指定工单对应的下载时间（判断冲突时需要使用到）
      let downloadTime = await getDownloadTimeByTicketId(item.ticket_id);
      let op = op = {
        "userId": userId, // 用户id
        "userName": userName, // 用户名称
        "ticketId": item.ticket_id, // 工单id
        "operationType": 1, // 操作类型
        "operationTime": item.operation_time // 操作时间
      };
      if (item.operation_type === 3) {//执行工单状态需要单独区分，因为添加了定位信息
        //let content=JSON.parse(item.new_content);
        // op = { "OperationType": 1, "Payload": { 'StartDateTime': item.operation_time, } };
        op.operationType = 1;
      } else if (item.operation_type === 1) {
        //状态更新
        switch (String(item.new_status)) {
          case '50'://完成工单
            // op = { "OperationType": 4, "Payload": { 'CloseDateTime': item.operation_time } };
            op.operationType = 4;
            break;
          case '30'://提交工单
            // op = { "OperationType": 2, "Payload": { 'AuthDateTime': item.operation_time } };
            op.operationType = 2;
            break;
          case '60'://忽略工单
            //TODO 假设忽略工单对应的操作是5，这个需要和后端协商确定
            // op = { "OperationType": 5, "Payload": { 'IgnoreDateTime': item.operation_time } };
            op.operationType = 6;
            break;
        }
      } else if (item.operation_type === 2) {
        //巡检工单修改，这里没有

      } else if (item.operation_type === TICKET_TYPE_SAVE_SIGN) {
        //如果是签名项，则组装签名数据  这里也没有

      } else if (item.operation_type === TICKET_LOG_ADD) {
        //添加日志
        let log = JSON.parse(item.new_content);
        log.id = undefined;
        log.localCreate = undefined;
        // op = {
        //   OperationType: 5,
        //   Payload: {
        //     OperateTime: item.operation_time,
        //     OperationType: 1,
        //     TicketLogContent: log
        //   }
        // }
        op.operationType = 5;
        op.ticketLog = {
          ...log,
          operationType: 1,
        }
      } else if (item.operation_type === TICKET_LOG_UPDATE) {
        //修改日志
        // op = {
        //   OperationType: 5,
        //   Payload: {
        //     OperateTime: item.operation_time,
        //     OperationType: 2,
        //     TicketLogContent: JSON.parse(item.new_content)
        //   }
        // }
        op.operationType = 5;
        op.ticketLog = {
          ...JSON.parse(item.new_content),
          operationType: 2,
        }
      } else if (item.operation_type === TICKET_LOG_DELETE) {
        //删除日志
        // op = {
        //   OperationType: 5,
        //   Payload: {
        //     OperateTime: item.operation_time,
        //     OperationType: 3,
        //     TicketLogContent: JSON.parse(item.new_content)
        //   }
        // }
        op.operationType = 5;
        op.ticketLog = {
          ...JSON.parse(item.new_content),
          operationType: 3,
        }
      }

      if (index >= 0) {
        result[index].data.push(op);
      } else {
        result.push({ id: item.ticket_id, beginTime: downloadTime, data: [op] });
      }
    }
  }

  return result;
}

function getOne() {
  let oneTicket = {
    "code": "0",
    "data": {
      "id": "675258890622074880",
      "ownerId": "",
      "ownerType": null,
      "objectId": "75",
      "objectType": 26,
      "ticketCode": "75_10_20231019_000004",
      "sysClass": 12,
      "sysClassLabel": "其他",
      "ticketState": 20,
      "ticketStateLabel": "已提交",
      "ticketType": 10,
      "ticketTypeLabel": "异常行为工单",
      "title": "上海太古汇店5月异常行为工单",
      "customerId": 1,
      "content": "异常行为工单",
      "startTime": "2023-05-20 00:00:00",
      "endTime": "2023-05-22 23:59:59",
      "extensionProperties": null,
      "assets": [
        {
          "assetId": 93,
          "assetType": 27,
          "assetName": "照明系统",
          "locationId": 75,
          "locationType": 26,
          "locationName": "上海太古汇",
          "extensionProperties": null
        }
      ],
      "executors": [
        {
          "userId": 814207,
          "userName": "工单执行用户"
        },
        {
          "userId": 814215,
          "userName": "xddemo"
        }
      ],
      "ticketLogs": [
        {
          "userId": 814215,
          "userName": "xddemo",
          "id": "734696711325220864",
          "ticketId": "675258890622074880",
          "content": "上传图片完成",
          "createTime": "2024-01-09 16:31:12",
          "pictures": [
            {
              "key": "734696635177893888",
              "name": "MicrosoftTeams-image.png"
            }
          ]
        },
        {
          "userId": 814215,
          "userName": "xddemo",
          "id": "730170358030925824",
          "ticketId": "675258890622074880",
          "content": "已完成",
          "createTime": "2024-01-03 10:38:09",
          "pictures": []
        }
      ],
      "ticketOperateLogs": [
        {
          "userId": 814215,
          "userName": "xddemo",
          "operationType": 32,
          "operationDescription": "提交工单",
          "content": null,
          "createTime": "2024-01-09 17:02:46"
        },
        {
          "userId": 814215,
          "userName": "xddemo",
          "operationType": 20,
          "operationDescription": "新加日志",
          "content": null,
          "createTime": "2024-01-09 16:31:13"
        },
        {
          "userId": 814215,
          "userName": "xddemo",
          "operationType": 34,
          "operationDescription": "驳回工单",
          "content": "测试",
          "createTime": "2024-01-09 16:30:36"
        },
        {
          "userId": 814215,
          "userName": "xddemo",
          "operationType": 32,
          "operationDescription": "提交工单",
          "content": null,
          "createTime": "2024-01-03 10:38:17"
        },
        {
          "userId": 814215,
          "userName": "xddemo",
          "operationType": 20,
          "operationDescription": "新加日志",
          "content": null,
          "createTime": "2024-01-03 10:38:09"
        },
        {
          "userId": 814215,
          "userName": "xddemo",
          "operationType": 30,
          "operationDescription": "开始执行",
          "content": null,
          "createTime": "2024-01-03 10:38:00"
        },
        {
          "userId": 814215,
          "userName": "xddemo",
          "operationType": 11,
          "operationDescription": "更新工单",
          "content": null,
          "createTime": "2024-01-03 10:35:38"
        },
        {
          "userId": 813928,
          "userName": "admin",
          "operationType": 10,
          "operationDescription": "创建工单",
          "content": null,
          "createTime": "2023-10-19 16:18:52"
        }
      ],
      "createUser": 813928,
      "createUserName": "admin",
      "createTime": "2023-10-19T16:18:52.610+08:00",
      "updateTime": "2024-01-09T17:02:46.812+08:00",
      "updateUser": 814215,
      "updateUserName": "xddemo",
      "rejectReason": "测试"
    },
    "msg": "操作成功"
  }

  let toTicket = {
    "code": "0",
    "data": {
      "id": "693237389103726592",
      "ownerId": "",
      "ownerType": null,
      "objectId": "113",
      "objectType": 25,
      "ticketCode": "113_10_20231113_000001",
      "sysClass": 1,
      "sysClassLabel": "空调",
      "ticketState": 20,
      "ticketStateLabel": "执行中",
      "ticketType": 10,
      "ticketTypeLabel": "异常行为工单",
      "title": "行为异常工单",
      "customerId": 1,
      "content": "行为异常工单",
      "startTime": "2023-11-13 00:00:00",
      "endTime": "2023-11-15 23:59:59",
      "extensionProperties": null,
      "assets": [
        {
          "assetId": 116,
          "assetType": 26,
          "assetName": "节能设备_测试2",
          "locationId": 113,
          "locationType": 25,
          "locationName": "测试门店2",
          "extensionProperties": null
        }
      ],
      "executors": [
        {
          "userId": 814235,
          "userName": "test_admin"
        },
        {
          "userId": 814245,
          "userName": "qa_admin"
        }
      ],
      "ticketLogs": [
        {
          "userId": 814235,
          "userName": "test_admin",
          "id": "2818227407480832",
          "ticketId": "693237389103726592",
          "content": "123",
          "createTime": "2023-12-22 10:24:35",
          "pictures": [
            {
              "key": "2818227308178432",
              "name": "图像-B7227C8A-9125-46EF-852D-14444EBB257A.png"
            }
          ]
        },
        {
          "userId": 814235,
          "userName": "test_admin",
          "id": "2806869531929600",
          "ticketId": "693237389103726592",
          "content": "qwr",
          "createTime": "2023-12-18 10:07:40",
          "pictures": []
        }
      ],
      "ticketOperateLogs": [
        {
          "userId": 814235,
          "userName": "test_admin",
          "operationType": 20,
          "operationDescription": "新加日志",
          "content": null,
          "createTime": "2023-12-22 10:24:35"
        },
        {
          "userId": 814235,
          "userName": "test_admin",
          "operationType": 20,
          "operationDescription": "新加日志",
          "content": null,
          "createTime": "2023-12-18 10:07:40"
        },
        {
          "userId": 814235,
          "userName": "test_admin",
          "operationType": 30,
          "operationDescription": "开始执行",
          "content": null,
          "createTime": "2023-12-18 10:07:06"
        },
        {
          "userId": 814235,
          "userName": "test_admin",
          "operationType": 11,
          "operationDescription": "更新工单",
          "content": null,
          "createTime": "2023-12-18 10:07:02"
        },
        {
          "userId": 814235,
          "userName": "test_admin",
          "operationType": 11,
          "operationDescription": "更新工单",
          "content": null,
          "createTime": "2023-12-18 10:06:50"
        },
        {
          "userId": 813928,
          "userName": "admin",
          "operationType": 10,
          "operationDescription": "创建工单",
          "content": null,
          "createTime": "2023-11-13 11:38:57"
        }
      ],
      "createUser": 813928,
      "createUserName": "admin",
      "createTime": "2023-11-13T11:38:56.640+08:00",
      "updateTime": "2023-12-18T10:07:06.837+08:00",
      "updateUser": 814235,
      "updateUserName": "test_admin",
      "rejectReason": null
    },
    "msg": "操作成功"
  }
  return toTicket;
}


function findImagesFromDownloadTickets(data) {
  let imgs = [];
  data.forEach(ticket => {
    if (ticket.extensionProperties && ticket.extensionProperties.attachments
      && ticket.extensionProperties.attachments.length > 0) {
      ticket.extensionProperties.attachments.forEach(img => {
        imgs.push(img.key)
      })
    }
    if (ticket.ticketLogs) {
      ticket.ticketLogs.forEach(log => {
        if (log.pictures) {
          log.pictures.forEach(img => {
            imgs.push(img.key)
          })
        }
      })
    }
  })
  return imgs;
}

//判断是否有足够空间下载工单 判断剩余空间是否小于2G
export async function checkDisk() {
  let response = await RNFetchBlob.fs.df()
  let nFreeGb = (Platform.OS === 'android' ? response.external_free : response.free) / 1000.0 / 1000.0 / 1000.0;
  if (nFreeGb < 2.0) return false;
  return true;

}

//根据日期下载离线工单
export async function downloadTickets(date, data) {
  console.log(date, data)
  // await clearCacheTicket();
  //第一部，从数据里找出图片，然后下载到本地
  let imgs = findImagesFromDownloadTickets(data);
  await downloadImages(imgs);
  //第二部，才是把数据缓存到sqlite中
  await cacheDownloadTickets(date, data)
  console.log('download done')
}

//模拟下载工单列表操作
export function getTicketsData() {
  let ret = [getOne().data];
  // for(let i=0;i<10;i++) {
  //     let one = getOne();
  //     one.data.id += i;
  //     ret.push(one.data)
  // }
  return ret;
}


