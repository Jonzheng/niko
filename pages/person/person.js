const App = getApp()
const { trim, host, formatDate } = require('../../utils/util')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    hasLogin: false,
    userInfo: {},
    bg: '../../images/bg-0.png',
    detaultAvatar: '../../images/de-avatar.png',
    motto: '',
    isMine: false,
    avatarUrl: 'https://avatar-1256378396.cos.ap-guangzhou.myqcloud.com/n_cm_0.png',
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    icon_more: "../../images/more.png",
    boxStyle: 'btn-play-box',
    anListen: '',
    isListen: false,
    listenStatus: 'listen-off',
    btnDelStyle: 'btn-red-hidden',
  },

  onLoad: function (options) {
    let { masterId } = options
    this._masterId = masterId
    this.getUser(masterId)
    this.getRecords(masterId)
    // this.setBgColor()
  },

  onReady: function () {
    this._audioContextMaster = wx.createInnerAudioContext()
    this._audioContextMaster.onEnded(() => {
      this.setMasterStop();
    });
  },

  onShow: function () {
    this.setMotto()
  },

  onHide: function () {
    clearTimeout(this._it0)
    clearTimeout(this._it1)
    clearTimeout(this._it2)
    // this.setBgColor()
    this.setData({
      motto: ''
    })
  },

  onUnload: function () {
    this._audioContextMaster.stop()
  },

  onPullDownRefresh: function () {
    wx.stopPullDownRefresh();
  },

  onReachBottom: function () {

  },

  onShareAppMessage: function () {

  },

  /**
   * 自定函数
   */

  getUser(openid) {
    wx.request({
      method: 'post',
      url: `${host}/getUser`,
      data: { openid },
      success: res => {
        if (res && res.data) {
          let userInfo = res.data
          this.setData({
            userInfo
          })
        }
      }
    })
    this.setData({
      admini: App.globalData.admini,
      isIpx: App.globalData.isIpx,
      hasLogin: App.globalData.hasLogin
    })
  },
  // 刷新数据
  refresh() {
    clearTimeout(this._it2)
    this.setData({
      requesting: true,
      empty: false,
      end: false,
    })
    this.getRecords(this._masterId)
  },
  // 加载更多
  more() {
    console.log('-the end-')
    // this.getList();
  },
  setMotto() {

  },
  showAvatar() {
    this.setData({
      avatarShow: true
    })
  },
  hideAvatar() {
    this.setData({
      avatarShow: false
    })
  },
  getRecords(masterId) {
    wx.request({
      url: `${host}/queryRecord`,
      method: 'post',
      data: { masterId },
      success: (res) => {
        this.setData({
          requesting: false
        })
        let { data } = res
        let recordList = data.filter((item)=>{return item.status == 1 || this.data.admini})
        this.initRecords(recordList)
      }
    })
  },

  initRecords(recordList) {
    for (let record of recordList) {
      record["listenStatus"] = "listen-off"
      record["boxStyle"] = "btn-play-box"
      record["btnDelStyle"] = "btn-red-hidden"
      record["btnPoiStyle"] = "btn-red-hidden"
      record["btnRt"] = ""
      record["dateStr"] = formatDate(record.c_date)
      record["ser"] = trim(record.serifu)
      if (record.heart_ud) {
        record["heartStatus"] = 1
      } else {
        record["heartStatus"] = 0
      }
      record["isListen"] = false
    }
    this.setData({
      recordList: recordList,
    })
  },

  getUserInfo: function (e) {
    let userInfo = e.detail.userInfo
    App.initAvatar(userInfo).then(data=>{
      console.log(data)
      this.setData({
        userInfo: data,
        hasLogin: true
      })
      this.setMotto()
    })
  },

  setMasterStop: function () {
    let index = this._listenIndex
    let recordList = this.data.recordList
    if (index != null && recordList[index]["isListen"]) {
      recordList[index]["isListen"] = false
      recordList[index]["listenStatus"] = "listen-off"
      recordList[index]["anListen"] = ""
      this._audioContextMaster.stop()
      this._listenIndex = null
      this.setData({
        recordList,
      })
    }
  },

  listen(e) {
    let currData = e.currentTarget.dataset
    let recordId = currData.rid
    let idx = currData.idx
    let recordList = this.data.recordList
    console.log(recordId, idx)
    let srcRecord = recordList[idx]["src_record"]
    if (!srcRecord) return
    if (recordList[idx]["isListen"]) {
      recordList[idx]["isListen"] = false
      recordList[idx]["listenStatus"] = "listen-off"
      recordList[idx]["anListen"] = ""
      this._audioContextMaster.stop()
    } else {
      this.setMasterStop()
      recordList[idx]["isListen"] = true
      recordList[idx]["listenStatus"] = "listen-on"
      recordList[idx]["anListen"] = "an-listen-on"
      this._audioContextMaster.src = srcRecord
      this._audioContextMaster.play()
      this._listenIndex = idx
    }
    this.setData({
      recordList
    })
  },

  showMore(e) {
    let currData = e.currentTarget.dataset
    let idx = currData.idx
    let recordList = this.data.recordList
    let master_id = recordList[idx]["master_id"]
    if (recordList[idx]["btnRt"] == "rt-90") {
      recordList[idx]["boxStyle"] = "btn-play-box"
      recordList[idx]["btnRt"] = ""
      recordList[idx]["btnDelStyle"] = "btn-red-hidden"
    } else {
      recordList[idx]["boxStyle"] = "btn-play-box-sm"
      recordList[idx]["btnRt"] = "rt-90"
      recordList[idx]["btnDelStyle"] = "btn-red"
    }
    this.setData({
      recordList
    })
  },

  updateHeart(e) {
    if (this._updating) return
    this._updating = true
    let currData = e.currentTarget.dataset
    let { idx, status, fid } = currData
    let userId = App.globalData.openid
    let recordList = this.data.recordList
    let curMaster = recordList[idx]
    let url = ''
    if (status == 0) {
      url = `${host}/updateHeart`
      curMaster["heartStatus"] = 1
      curMaster["heart"] += 1
    } else {
      url = `${host}/cancelHeart`
      curMaster["heartStatus"] = 0
      curMaster["heart"] -= 1
    }
    let recordId = curMaster["record_id"]
    let masterId = curMaster['master_id']
    this.setData({
      recordList
    })
    wx.request({
      url: url,
      method: 'post',
      data: { recordId, fileId: fid, userId, masterId },
      success: () => {
        setTimeout(() => {
          this._updating = false
        }, 300)
      }
    })
  },

  updateRecord(e) {
    if (this._updating) return
    this._updating = true
    let currData = e.currentTarget.dataset
    let recordId = currData.rid
    let idx = currData.idx
    let status = currData.status
    let title = status == 1 ? '发布成功' : '撤回成功'
    wx.request({
      url: `${host}/updateRecord`,
      method: 'post',
      data: { recordId, status },
      success: (res) => {
        setTimeout(()=>{
          this._updating = false
        }, 300)
        let recordList = this.data.recordList
        recordList[idx]['status'] = status
        this.setData({ recordList })
        wx.showToast({
          title: title,
        })
        console.log(res)
      }
    })
  },
  delRecord(recordId) {
    let masterId = App.globalData.openid
    wx.request({
      url: `${host}/deleteRecord`,
      method: 'post',
      data: { recordId, masterId },
      success: (res) => {
        App.cosDelete(recordId)
        console.log(res)
      }
    })
  },

  delRecordConfirm: function (e) {
    let currData = e.currentTarget.dataset
    let recordId = currData.rid
    let index = currData.idx
    wx.showModal({
      title: '删除录音?',
      content: '彻底删除数据',
      confirmText: "确认",
      cancelText: "取消",
      success: (res) => {
        if (res.confirm) {
          let recordList = this.data.recordList
          recordList.splice(index, 1)
          this.setData({ recordList })
          this.delRecord(recordId)
        }
      }
    });
  },

  /**
   * 评论
   */
  initCommentList(commentList) {
    let curMaster = this.data.curMaster
    for (let item of commentList) {
      item['isOwner'] = App.globalData.openid == item.user_id
      item['isAuthor'] = item.user_id == curMaster.master_id
      item['dateStr'] = formatDate(item.c_date)
    }
    this.setData({
      inputValue: '',
      commentList,
    })
  },
  showComment: function (e) {
    let currData = e.currentTarget.dataset
    let { idx, fid } = currData
    let userId = this._masterId
    let recordList = this.data.recordList
    let curMaster = recordList[idx]
    let recordId = curMaster.record_id
    let nickname = this.data.userInfo.nick_name
    this._inputPh = `评论 ${nickname}：`
    this._curRecordIdx = idx
    this.setData({
      fileId: fid,
      inputPh: `评论 ${nickname}：`,
      curMaster,
      commShow: true
    })
    wx.request({
      url: `${host}/queryComment`,
      method: 'post',
      data: { recordId, userId },
      success: (res) => {
        console.log(res)
        if (res) {
          let commentList = res.data
          this.initCommentList(commentList)
        }
      }
    })
  },
  saveComment(content) {
    let { fileId, curMaster } = this.data
    let recordId = curMaster.record_id
    let masterId = curMaster.master_id
    let userId = App.globalData.openid
    let reId = this.data.reId
    let reName = this.data.reName
    let reContent = this.data.reContent
    wx.request({
      url: `${host}/saveComment`,
      method: 'POST',
      data: { recordId, masterId, fileId, userId, content, reId, reName, reContent },
      success: (res) => {
        console.log(res.data)
        if (res) {
          let commentList = res.data
          this.initCommentList(commentList)
        }
      }
    });

  },
  replyUser(e) {
    let { cid, nickname, content } = e.currentTarget.dataset
    let recordList = this.data.recordList
    let pre = content.substr(0, 5)
    pre = (content.length > 5) ? pre + '...' : pre
    this.setData({
      inputPh: `回复 ${nickname} '${pre}'：`,
      inputValue: '',
      recordList,
      reId: cid,
      reName: nickname,
      reContent: content
    })
  },
  clearInput() {
    let inputPh = this._inputPh
    this.setData({
      inputPh,
      inputValue: '',
      reId: '',
      reName: '',
      reContent: ''
    })
  },
  delComment(commId, recordId) {
    let userId = App.globalData.openid
    wx.request({
      url: `${host}/deleteComment`,
      method: 'POST',
      data: { recordId, userId, commId },
      success: (res) => {
        this.clearInput()
        console.log(res.data)
        if (res) {
          let commentList = res.data
          this.initCommentList(commentList)
        }
      }
    });
  },
  delCommConfirm(e) {
    let { rid, cid, content } = e.currentTarget.dataset
    console.log(rid, cid, content)
    let pre = content.substr(0, 9)
    pre = content.length > 9 ? pre + '...' : pre
    wx.showModal({
      title: '删除评论?',
      content: pre,
      confirmText: "确认",
      cancelText: "取消",
      success: (res) => {
        if (res.confirm) {
          this.delComment(cid, rid)
        }
      }
    });
  },

  confirmInput(e) {
    let { value } = e.detail
    console.log('value:', value)
    this.saveComment(value.trim())
  },
  closeMask() {
    let idx = this._curRecordIdx
    let recordList = this.data.recordList
    console.log(idx, recordList)
    recordList[idx]['comm'] = this.data.commentList.length
    this.setData({
      recordList,
      rt90: false,
      otherShow: false,
    })
  },

  toDetail(e) {
    let fileId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `../detail/detail?fileId=${fileId}`,
    })
  },
  setBgColor() {
    let frontColor = !this._black ? '#ffffff' : '#000000'
    this._black = !this._black
    wx.setNavigationBarColor({
      frontColor: frontColor,
      backgroundColor: '',
      animation: { duration: 300, timingFunc: 'easeOut' }
    })
  },
  uploadAvatar() {
    let avatar = this.data.userInfo.avatarUrl
    console.log(avatar)
  },
})