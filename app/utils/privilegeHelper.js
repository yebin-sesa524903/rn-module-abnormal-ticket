'use strict'

var _codes;


export const CodeMap = {
  /**
   * 客户全部工单-完整权限
   * 完整权限可以看到该客户的【全部工单】页面
   */
  TICKET_LIST_FULL: "9101",

  /**
   * 查看执行工单-完整权限
   * 完整权限可以执行工单，可以开始执行、创建工单执行日志、提交工单、忽略工单
   */
  TICKET_MANAGEMENT_FULL: "9111",

  /**
   * 查看执行工单-仅查看
   * 仅查看只能对工单详情内容进行查看
   */
  TICKET_MANAGEMENT_VIEW: "9115",

  /**
   * 创建编辑工单-完整权限
   * 创建编辑工单：分为无权限、完整权限
   * 完整权限可以手动创建工单，并对自己创建的工单进行编辑修改
   */
  TICKET_EDIT_FULL: "9121",

  /**
   * 关闭工单-完整权限（ 完整权限可以对自己创建的工单在提交后进行驳回和审核通过操作）
   */
  TICKET_ADULT_FULL: "9131",

  //更新了权限码
  OMTicketRead: '10050',
  OMTicketFull: '10049',
  OMTicketExecute: '10052',
}

export default {
  setPrivilegeCodes: (codes) => {
    _codes = codes;
  },
  hasCodes: () => _codes,
  hasAuth: (code) => {
    if (Number.isInteger(code)) code = String(code);
    if (_codes) {
      if (code === 'FeedbackPrivilegeCode') {
        return true;
      }
      if (CodeMap[code]) {
        code = CodeMap[code];
      }
      else {
      }
      code = _codes.find((item) => item === code);
      return code ? true : false;
    }
    return false;
  },
}
