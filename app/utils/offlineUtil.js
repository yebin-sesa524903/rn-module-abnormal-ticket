import {
  cacheDownloadTickets,
  clearCacheTicket,
  getCacheTicketByDate,
  TICKET_LOG_DELETE,
  TICKET_TYPE_SAVE_SIGN
} from "./sqliteHelper";
import { Platform, Dimensions } from 'react-native';

import RNFS, { DocumentDirectoryPath, ExternalDirectoryPath } from 'react-native-fs';
import RNFetchBlob from 'react-native-fetch-blob';


import {
  getDownloadTimeByTicketId, getUnSyncTickets, updateImageUpload,
  TICKET_LOG_ADD, TICKET_LOG_UPDATE,
} from "./sqliteHelper";
import { apiTicketDetail, getBaseUri, getCookie } from "../middleware/bff";

const dirPath = Platform.OS === 'ios' ? DocumentDirectoryPath : ExternalDirectoryPath
const pathPre = Platform.OS === 'ios' ? '' : 'file://';

/**
 * 运维工单里使用获取图片的地址是：let downUrl = getBaseUri()+'document/get?id='+cacheKey;其中cachekey就是日志图片里的key
 *
 * 下载工单中的图片和文档
 * @returns {Promise<void>}
 */
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
          let downUrl = getBaseUri() + 'document/get?id=' + cacheKey;
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

export async function startSyncTasks() {
  if (!isSynchronizing) {
    isSynchronizing = true;
    try {
      let ret = await syncUploadImages();
      if (!global.isConnected() || !ret) {
        //同步过程中断网了
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
        await syncTask(task);
      }

    } catch (e) {
      console.log('同步任务异常-------->', e)
    }
    isSynchronizing = false;
  }
}

const CODE_OK = '0'

async function syncTask(task) {
  //第一步，根据工单id获取最新的工单详情
  //如果网络异常，或者保存，就是当前任务失败
  let res = null
  try {
    res = await apiTicketDetail(task.id)
    if (res.code === CODE_OK) {

    } else {
      //掉接口失败了
    }
  } catch (e) {
    console.log('同步获取详情失败!', task)
  }


  //第二步，如果最新状态是已关闭，现在多了忽略，则提示用户 工单已完成了

  //第三步，判断最新的工单详情的操作记录的时间 与本地记录的操作时间做比较，
  //如果服务器时间最新，提示 是覆盖，还是 放弃

  //第四部 如果没有冲突，调用同步接口进行同步，同步完成后删除对应的本地缓存
}


/**
 *
 * @param doSync 直接进行同步
 * @param doUpdateSyncData 不同步，重新查询一下待同步数据，之后走旧流程
 * @returns {Promise<boolean>}
 */
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
    let ret = await fetch(getBaseUri() + 'document/upload', {
      method: 'post',
      headers: {
        Cookie: getCookie()
      },
      body: {
        content,
        name: filename
      }
    });
    if (ret.status === 200) {
      //上传成功会返回图片key,这个是需要记录的
      let data = await ret.json()
      if (data.code === '0') return data.data.key;
      return null;
    }
    return false;
  } catch (e) {
    console.log('上传图片失败了....', e)
    return false;
  }

}

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
      let op = null;
      if (item.operation_type === 3) {//执行工单状态需要单独区分，因为添加了定位信息
        //let content=JSON.parse(item.new_content);
        op = { "OperationType": 1, "Payload": { 'StartDateTime': item.operation_time, } };
      } else if (item.operation_type === 1) {
        //状态更新
        switch (String(item.new_status)) {
          case '50'://完成工单
            op = { "OperationType": 4, "Payload": { 'CloseDateTime': item.operation_time } };
            break;
          case '30'://提交工单
            op = { "OperationType": 2, "Payload": { 'AuthDateTime': item.operation_time } };
            break;
          case '60'://忽略工单
            //TODO 假设忽略工单对应的操作是5，这个需要和后端协商确定
            op = { "OperationType": 5, "Payload": { 'IgnoreDateTime': item.operation_time } };
            break;
        }
      } else if (item.operation_type === 2) {
        //巡检工单修改，这里没有

      } else if (item.operation_type === TICKET_TYPE_SAVE_SIGN) {
        //如果是签名项，则组装签名数据  这里也没有

      } else if (item.operation_type === TICKET_LOG_ADD) {
        //添加日志
        let log = JSON.parse(item.new_content);
        let logData = {
          "TicketId": log.ticketId,
          "Content": log.content,
          "Pictures": log.pictures,
        }
        op = {
          OperationType: 5,
          Payload: {
            OperateTime: item.operation_time,
            OperationType: 1,
            TicketLogContent: logData
          }
        }
      } else if (item.operation_type === TICKET_LOG_UPDATE) {
        //修改日志
        op = {
          OperationType: 5,
          Payload: {
            OperateTime: item.operation_time,
            OperationType: 2,
            TicketLogContent: JSON.parse(item.new_content)
          }
        }
      } else if (item.operation_type === TICKET_LOG_DELETE) {
        //删除日志
        op = {
          OperationType: 5,
          Payload: {
            OperateTime: item.operation_time,
            OperationType: 3,
            TicketLogContent: JSON.parse(item.new_content)
          }
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
  return oneTicket;
}


function findImagesFromDownloadTickets(data) {
  let imgs = [];
  data.forEach(ticket => {
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
  await clearCacheTicket();
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


