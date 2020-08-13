const App = getApp()
const { trim, host, formatDate, deAvatar } = require('../../utils/util')

const Levels = [{ 'uv': 0, 'pv': -1 }, { 'uv': 1, 'pv': 1 }, { 'uv': 4, 'pv': 15 }, { 'uv': 9, 'pv': 53 }, { 'uv': 16, 'pv': 127 }, { 'uv': 25, 'pv': 249 }, { 'uv': 36, 'pv': 431 }, { 'uv': 49, 'pv': 685 }, { 'uv': 64, 'pv': 1023 }, { 'uv': 81, 'pv': 1457 }]

const cvColor = ['#dfdfdf', '#dfdfbf', '#95ddb2', '#92d1e5', '#ffb37c', '#ff6c00', '#ff0000', '#e52fec', '#841cf9', 'black', 'black']
const pageSize = 20

Page({

  /**
   * 页面的初始数据
   */
  data: {
    hasLogin: false,
    userInfo: {},
    detaultAvatar: '../../images/de-avatar.png',
    motto: '',
    isMine: false,
    avatarUrl: 'https://avatar-1256378396.cos.ap-guangzhou.myqcloud.com/n_cm_0.png',
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    boxStyle: 'btn-play-box',
    anListen: '',
    isListen: false,
    listenStatus: 'listen-off',
    btnShow: false,
    rePos:0,
    cvDescShow: 0,
    cvColor,
    bottomSize: 280,
    hasTop: true,
    curData: 0,
    total:0,
  },

  onLoad: function (options) {
    this._pageNo = 1
    this._lockHearts = []
    let { masterId } = options
    if (!App.globalData.openid) {
      setTimeout(()=>{
        App.initOpenid().then(openid => {
          console.log('App.initOpenid():', openid)
          App.globalData.openid = openid
          let url = `../person/person?masterId=${masterId}`
          wx.redirectTo({ url })
        })
      }, 600)
    } else {
      this._masterId = masterId
      if (App.globalData.openid == this._masterId) {
        return wx.switchTab({
          url: '/pages/mine/mine',
        })
      }
      let pages = getCurrentPages()
      this.setData({
        home: pages.length == 1
      })
      this.getUser(masterId)
      this.getRecords(masterId)
      App.getHeartSrc()
    }
  },

  onReady: function () {
    this._audioContextMaster = wx.createInnerAudioContext()
    this._audioContextMaster.onEnded(() => {
      this.setMasterStop();
    });
    this.setData({ isReady: true })
    this._ctx = []
    for (let i = 0; i < 6; i++) {
      this._ctx.push(wx.createInnerAudioContext())
    }

    this._audioContextMaster.onPlay(() => {
      this._itMaster = setInterval(() => {
        let curTime = this._audioContextMaster.currentTime || 0
        let rePos = curTime / this._audioContextMaster.duration * 100
        this.setData({
          rePos
        })
      }, 30)
    })

    this._audioContextMaster.onStop(() => {
      this.setMasterStop();
    })

  },

  onShow: function () {
    if (App.globalData.hasUpdate) {
      this.getRecords(this._masterId)
      let pages = getCurrentPages()
      App.globalData.hasUpdate = pages.length > 2
    }
  },

  onHide: function () {
    if (this._audioContextMaster) {
      this._audioContextMaster.stop()
    }
  },

  onUnload: function () {

  },

  onPullDownRefresh: function () {
    wx.stopPullDownRefresh();
  },

  onReachBottom: function () {

  },

  onShareAppMessage: function () {
    let masterId = this._masterId
    let title = '阴阳师·式神台词&模仿语音'
    let path = `/pages/index/index`
    if (this.data.recordList) {
      let name = this.data.userInfo.show_name || this.data.userInfo.nick_name
      title = `${name}の式神台词模仿录音`
      path = `/pages/person/person?masterId=${masterId}`
    }
    return {
      title,
      path,
    }
  },

  /**
   * 自定函数
   */

  getUser(openid) {
    let mineId = App.globalData.openid
    console.log('openid:', mineId)
    if (!mineId) return
    wx.showLoading({
      title: '加载中...',
    })
    wx.request({
      method: 'post',
      url: `${host}/getUser`,
      data: { openid, mineId },
      success: res => {
        if (res && res.data) {
          let userInfo = res.data
          userInfo["deAvatar"] = deAvatar(openid)
          userInfo = this.computeCvLevel(userInfo)
          this.setData({
            cv: userInfo.cv,
            userInfo
          })
        }
      },
      complete: ()=>{
        wx.hideLoading()
      }
    })
    let admini = App.globalData.admini
    admini = admini ? admini : false
    this.setData({
      admini,
      isIpx: App.globalData.isIpx,
      hasLogin: App.globalData.hasLogin
    })
  },
  // 刷新数据
  refresh() {
    this._pageNo = 1
    this.setData({
      curData: 0,
      requesting: true,
      empty: false,
      end: false,
      isReady: false,
      recordList: [],
    })
    this.getRecords(this._masterId)
  },
  // 加载更多
  more() {
    this._pageNo += 1
    this.getRecords(this._masterId, 'more')
  },
  playHeartSrc() {
    App.getHeartSrc().then(heartSrc => {
      let ctx = this._ctx.pop()
      this._ctx.unshift(ctx)
      ctx.src = heartSrc
      ctx.play()
    })
  },
  toNews(e) {
    if (!App.globalData.hasLogin) return
    wx.vibrateShort()
    let level = e.currentTarget.dataset.level
    let { news, heartCount, followCount, fansCount } = this.data.userInfo
    let masterId = this._masterId
    news = -1
    let url = `../news/news?level=${level}&news=${news}&heartCount=${heartCount}&followCount=${followCount}&fansCount=${fansCount}&masterId=${masterId}`
    App.toPage(url)
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
  back(){
    wx.navigateBack({
      fail: ()=>{
        wx.switchTab({
          url: '/pages/index/index',
        })
      }
    })
  },

  getRecords(masterId, type = 'refresh') {
    if (this._loading) return
    this._loading = true
    let openid = App.globalData.openid
    let pageNo = this._pageNo
    this.setData({ showLoading:true })
    wx.request({
      url: `${host}/queryRecord`,
      method: 'post',
      data: { masterId, openid, pageNo, pageSize },
      success: (res) => {
        let { records, total } = res.data        
        records = records || []
        let recordList = records.filter((item)=>{return item.status == 1 || this.data.admini})
        let end = recordList.length == 0
        this.setData({ total, end })
        this.initRecords(recordList, type)
      },
      complete: (res) => {
        this._loading = false
        this.setData({
          requesting: false,
          showLoading: false,
          isReady: true
        })
        let curData = this.data.curData
        let total = this.data.total
        if (this._itPage > -1) clearInterval(this._itPage)
        this._itPage = setInterval(() => {
          if (curData < pageNo * pageSize && curData < total) {
            curData += 1
            this.setData({ curData })
          } else {
            clearInterval(this._itPage)
          }
        }, 30)

      } // end complete
    })
  },

  initRecords(recordList, type) {
    for (let record of recordList) {
      record["listenStatus"] = "listen-off"
      record["boxStyle"] = "btn-play-box"
      record["btnShow"] = false
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
    if (type == 'more') {
      let oldList = this.data.recordList
      if (oldList.length > 40 && recordList.length > 0) {
        oldList = []
        this.toTop()
      }
      recordList = oldList.concat(recordList)
      setTimeout(()=>{
        this.setData({ recordList })
      }, 30)
    } else {
      this.setData({ recordList })
    }
  },

  getUserInfo(e) {
    let userInfo = e.detail.userInfo
    if (!userInfo) return
    App.initAvatar(userInfo).then(data => {
      wx.showToast({
        title: '登录成功',
      })
      this.setData({
        hasLogin: true
      })
    })
  },

  setMasterStop: function () {
    let index = this._listenIndex
    let recordList = this.data.recordList
    if (index != null && index < recordList.length && recordList[index]["isListen"]) {
      recordList[index]["isListen"] = false
      recordList[index]["listenStatus"] = "listen-off"
      recordList[index]["anListen"] = ""
      this._audioContextMaster.stop()
      this._listenIndex = null
      this.setData({
        recordList,
      })
    }
    this._audioContextMaster.seek(0)
    if (this._itMaster > -1) clearInterval(this._itMaster)
    this.setData({
      rePos: 0
    })
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
      wx.vibrateShort()
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
      recordList[idx]["btnShow"] = false
    } else {
      wx.vibrateShort()
      recordList[idx]["boxStyle"] = "btn-play-box-sm"
      recordList[idx]["btnRt"] = "rt-90"
      recordList[idx]["btnShow"] = true
    }
    this.setData({
      recordList
    })
  },

  updateHeart(e) {
    let currData = e.currentTarget.dataset
    let { idx, status, fid } = currData
    let userId = App.globalData.openid
    let recordList = this.data.recordList
    let curMaster = recordList[idx]
    let recordId = curMaster["record_id"]
    let masterId = curMaster['master_id']
    if (this._lockHearts.indexOf(recordId) > -1) return
    this._lockHearts.push(recordId)
    let url = ''
    if (status == 0) {
      this.playHeartSrc()
      wx.vibrateShort()
      url = `${host}/updateHeart`
      curMaster["heartStatus"] = 1
      curMaster["heart"] += 1
    } else {
      url = `${host}/cancelHeart`
      curMaster["heartStatus"] = 0
      curMaster["heart"] -= 1
    }
    this.setData({
      recordList
    })
    wx.request({
      url: url,
      method: 'post',
      data: { recordId, fileId: fid, userId, masterId },
      success: () => {
        let userInfo = this.data.userInfo
        userInfo['heartCount'] = status == 0 ? userInfo['heartCount'] + 1 : userInfo['heartCount'] - 1
        userInfo = this.computeCvLevel(userInfo)
        this.setData({ userInfo })
        App.globalData.hasUpdate = true
      },
      complete: () => {
        this._lockHearts.splice(this._lockHearts.indexOf(recordId), 1)
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
        App.globalData.hasUpdate = true
        setTimeout(()=>{
          this._updating = false
        }, 100)
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
    masterId = this.data.admini ? this._masterId : masterId
    wx.request({
      url: `${host}/deleteRecord`,
      method: 'post',
      data: { recordId, masterId },
      success: (res) => {
        App.globalData.hasUpdate = true
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
      item['deAvatar'] = deAvatar(item.openid)
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
        App.globalData.hasUpdate = true
        console.log(res.data)
        if (res && res.data && res.data.code == 87014) {
          let content = res.data.data
          wx.showModal({
            title: '评论失败',
            content,
          })
        } else {
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
        App.globalData.hasUpdate = true
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
    let url = `../detail/detail?fileId=${fileId}`
    App.toPage(url)
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
  follow(e) {
    wx.vibrateShort()
    let suffix = (e == 'unFollow') ? e : 'follow'
    let openid = App.globalData.openid
    let followId = this._masterId
    wx.request({
      url: `${host}/${suffix}`,
      method: 'post',
      data: { openid, followId },
      success: (res) => {
        console.log(res)
        let userInfo = this.data.userInfo
        userInfo['isFollow'] = (suffix == 'follow')
        this.setData({
          userInfo
        })
      }
    })
  },
  unFollow(){
    wx.showActionSheet({
      itemList: ['取消关注'],
      success:(res)=> {
        if(res.tapIndex == 0){
          this.follow('unFollow')
        }
      }
    })
  },
  showTagDesc(e) {
    wx.vibrateShort()
    this.setData({
      cvDescShow: 1
    })
  },
  closeCvMask() {
    this.setData({
      cvDescShow: 0
    })
  },
  computeCvLevel(userInfo) {
    userInfo.cv = this.getCvLevel(userInfo)
    let cv = userInfo.cv
    userInfo.heartCount = userInfo.heartCount || 0
    userInfo.heartUv = userInfo.heartUv || 0
    userInfo.uv = (cv + 1) ** 2
    userInfo.pv = (cv + 1) ** 3 * 2 - 1
    userInfo.uvWidth = userInfo.heartUv / userInfo.uv * 100
    userInfo.uvWidth = userInfo.uvWidth < 100 ? userInfo.uvWidth : 100
    userInfo.pvWidth = userInfo.heartCount / userInfo.pv * 100
    userInfo.pvWidth = userInfo.pvWidth < 100 ? userInfo.pvWidth : 100
    console.log(cv, userInfo.heartUv, userInfo.heartCount, userInfo.uvWidth, userInfo.pvWidth)
    return userInfo
  },
  getCvLevel(userInfo) {
    let uv = userInfo.heartUv
    let pv = userInfo.heartCount
    let cv = 0
    for (let [idx, it] of Levels.entries()) {
      if (uv >= it.uv && pv >= it.pv) cv = idx
    }
    return cv
  },
  toTop() {
    this.setData({
      scrollAnimation: true
    })
    setTimeout(()=>{
      this.setData({
        scrollTop: 0,
      })
    }, 0)
  },
})