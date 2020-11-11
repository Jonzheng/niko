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
    pageList: [],
  },

  onLoad: function (options) {
    this._globalIndex = 0
    this._globalList = []
    this.pageHeightArr = []
    wx.getSystemInfo({
      success: (res) => {
        let { windowHeight } = res;
        this._windowHeight = windowHeight;
      }
    })

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
    if (this.data.total > 0) {
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
    this._globalIndex = 0
    this._globalList = []
    this.pageHeightArr = []
    this._pageNo = 1
    this.setData({
      curData: 0,
      requesting: true,
      empty: false,
      end: false,
      isReady: false,
      pageList: [],
    })
    this.getRecords(this._masterId)
  },
  // 加载更多
  more() {
    this._pageNo += 1
    this._globalIndex += 1
    this.getRecords(this._masterId, 'more')
  },
  setHeight() {
    let globalIdx = this._globalIndex
    this.query = wx.createSelectorQuery();
    this.query.select(`#wrp_${globalIdx}`).boundingClientRect()
    this.query.exec((res) => {
      this.pageHeightArr[globalIdx] = res[0] && res[0].height;
    });
    this.observePage(globalIdx);
  },

  observePage(pageIndex) {
    const observerObj = wx.createIntersectionObserver(this).relativeToViewport({ top: 2 * this._windowHeight, bottom: 2 * this._windowHeight });
    observerObj.observe(`#wrp_${pageIndex}`, (res) => {
      if (res.intersectionRatio <= 0) {
        this.setData({
          ['pageList[' + pageIndex + ']']: { height: this.pageHeightArr[pageIndex] },
        })

      } else {
        this.setData({
          ['pageList[' + pageIndex + ']']: this._globalList[pageIndex],
        })
      }
    });
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
        let end = recordList.length == 0 || total <= pageSize
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
      this._globalList[this._globalIndex] = recordList
      let globalIdx = this._globalIndex
      let datas = {}
      datas['pageList[' + globalIdx + ']'] = recordList
      this.setData(datas, () => {
        this.setHeight();
      })
    } else {
      this._globalList[this._globalIndex] = recordList
      this.setData({ ['pageList[' + this._globalIndex + ']']: recordList }, () => {
        this.setHeight();
      })
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

  setMasterStop() {
    let idx = this._listenIndex
    let pdx = this._pdx
    let pageList = this.data.pageList
    if (idx != undefined && idx < pageList[pdx].length && pageList[pdx][idx]["isListen"]) {
      pageList[pdx][idx]["isListen"] = false
      pageList[pdx][idx]["listenStatus"] = "listen-off"
      pageList[pdx][idx]["anListen"] = ""
      this._audioContextMaster.stop()
      this._listenIndex = undefined
      this._pdx = undefined
      this.setData({
        pageList,
      })
    }
    this._audioContextMaster.seek(0)
    if (this._itMaster > -1) clearInterval(this._itMaster)
    this.setData({
      rePos: 0
    })
  },

  listen(e) {
    let { idx, pdx } = e.currentTarget.dataset
    let pageList = this.data.pageList
    let srcRecord = pageList[pdx][idx]["src_record"]
    if (!srcRecord) return
    if (pageList[pdx][idx]["isListen"]) {
      pageList[pdx][idx]["isListen"] = false
      pageList[pdx][idx]["listenStatus"] = "listen-off"
      pageList[pdx][idx]["anListen"] = ""
      this._audioContextMaster.stop()
    } else {
      wx.vibrateShort()
      this.setMasterStop()
      pageList[pdx][idx]["isListen"] = true
      pageList[pdx][idx]["listenStatus"] = "listen-on"
      pageList[pdx][idx]["anListen"] = "an-listen-on"
      this._audioContextMaster.src = srcRecord
      this._audioContextMaster.play()
      this._listenIndex = idx
      this._pdx = pdx
    }
    this.setData({
      pageList
    })
  },

  showMore(e) {
    let { pdx, idx } = e.currentTarget.dataset
    let pageList = this.data.pageList
    let master_id = pageList[pdx][idx]["master_id"]
    if (pageList[pdx][idx]["btnRt"] == "rt-90") {
      pageList[pdx][idx]["boxStyle"] = "btn-play-box"
      pageList[pdx][idx]["btnRt"] = ""
      pageList[pdx][idx]["btnShow"] = false
    } else {
      wx.vibrateShort()
      pageList[pdx][idx]["boxStyle"] = "btn-play-box-sm"
      pageList[pdx][idx]["btnRt"] = "rt-90"
      pageList[pdx][idx]["btnShow"] = true
    }
    this.setData({
      pageList
    })
  },

  updateHeart(e) {
    let { idx, pdx, status, fid } = e.currentTarget.dataset
    let userId = App.globalData.openid
    let pageList = this.data.pageList
    let recordId = pageList[pdx][idx]["record_id"]
    let masterId = pageList[pdx][idx]['master_id']
    if (this._lockHearts.indexOf(recordId) > -1) return
    this._lockHearts.push(recordId)
    let url = ''
    if (status == 0) {
      this.playHeartSrc()
      wx.vibrateShort()
      url = `${host}/updateHeart`
      pageList[pdx][idx]["heartStatus"] = 1
      pageList[pdx][idx]["heart"] += 1
    } else {
      url = `${host}/cancelHeart`
      pageList[pdx][idx]["heartStatus"] = 0
      pageList[pdx][idx]["heart"] -= 1
    }
    this.setData({
      pageList
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
        App.globalData.recordIds.push(recordId)
      },
      complete: () => {
        this._lockHearts.splice(this._lockHearts.indexOf(recordId), 1)
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

  delRecordConfirm(e) {
    let { idx, pdx, rid } = e.currentTarget.dataset
    wx.showModal({
      title: '删除录音?',
      content: '彻底删除数据',
      confirmText: "确认",
      cancelText: "取消",
      success: (res) => {
        if (res.confirm) {
          let total = this.data.total - 1
          let pageList = this.data.pageList
          pageList[pdx].splice(idx, 1)
          this.setData({ pageList, total })
          this.delRecord(rid)
        }
      }
    });
  },

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
  showComment(e) {
    let { idx, pdx, fid } = e.currentTarget.dataset
    let userId = App.globalData.openid
    let pageList = this.data.pageList
    let curMaster = pageList[pdx][idx]
    let recordId = curMaster.record_id
    let nickname = curMaster.nick_name
    this._inputPh = `评论 ${nickname}：`
    this.__idx = idx
    this.__pdx = pdx
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
    let { fileId, curMaster, reId, reName, reContent } = this.data
    let recordId = curMaster.record_id
    let masterId = curMaster.master_id
    let userId = App.globalData.openid

    wx.request({
      url: `${host}/saveComment`,
      method: 'POST',
      data: { recordId, masterId, fileId, userId, content, reId, reName, reContent },
      success: (res) => {
        App.globalData.hasUpdate = true
        App.globalData.recordIds.push(recordId)
        console.log(res.data)
        if (res && res.data && res.data.code == 87014) {
          let content = res.data.data
          wx.showModal({
            title: '评论失败',
            content,
          })
        } else {
          let commentList = res.data
          let pdx = this.__pdx
          let idx = this.__idx
          let pageList = this.data.pageList
          pageList[pdx][idx].comments = commentList.slice(0, 2)
          this.setData({ pageList })
          this.initCommentList(commentList)
        }
      }
    });

  },
  replyUser(e) {
    let { cid, nickname, content } = e.currentTarget.dataset
    let pre = content.substr(0, 5)
    pre = (content.length > 5) ? pre + '...' : pre
    this.setData({
      inputPh: `回复 ${nickname} '${pre}'：`,
      inputValue: '',
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
        App.globalData.recordIds.push(recordId)
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
    let pdx = this.__pdx
    let idx = this.__idx
    if (idx != undefined) {
      let pageList = this.data.pageList
      pageList[pdx][idx]['comm'] = this.data.commentList.length
      pageList[pdx][idx]['comments'] = this.data.commentList.slice(0, 2)
      this.setData({ pageList })
    }
    this.__idx = undefined
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