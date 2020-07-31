const App = new getApp()
const { trim, host, formatDate, deAvatar } = require('../../utils/util')
const cvColor = ['#dfdfdf', '#dfdfbf', '#95ddb2', '#92d1e5', '#ffb37c', '#ff6c00', '#ff0000', '#e52fec', '#841cf9', 'black', 'black']

const pageStart = 1
const pageSize = 20

Page({

  data: {
    isIpx: App.globalData.isIpx,
    hasLogin: App.globalData.hasLogin,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    recordList: [],
    commentList: [],
    avatars: [],
    rotY: 180,
    isReady: false,
    reId: '',
    reName: '',
    reContent: '',
    rt90: true,
    requesting: false,
    end: false,
    emptyShow: false,
    pageNo: pageStart,
    recordes: [],
    scrollTop: null,
    enableBackToTop: true,
    refreshSize: 0,
    topSize: 150,
    bottomSize: 0,
    curData: 0,
    cursor: 0,
    cvColor
  },

  onLoad: function (options) {
    this._lockHearts = []
    this._pageNo = 1
    this._showIdxs = []
    if (!App.globalData.openid) {
      setTimeout(()=>{
        App.initOpenid().then(openid => {
          console.log('App.initOpenid():', openid)
          App.globalData.openid = openid
          let url = `../record/record`
          wx.redirectTo({ url })
        })
      }, 600)
    } else {
      this._step = 10
      this._avatars = []
      let avatars = []
      while (avatars.length < 18) {
        avatars.push({ url: '', openid: '' })
      }
      this._loadSpin = setInterval(() => {
        if (this.data.recordList.length == 0) {
          this.avatarTap(true)
        } else {
          clearInterval(this._loadSpin)
        }
      }, 1000)
      
      this.setData({
        avatars,
        rotY: this.data.rotY + 120,
        hasLogin: App.globalData.hasLogin,
      })
      this.getRecords()
      App.getHeartSrc()
    }
  },

  onReady: function () {
    this._audioContextMaster = wx.createInnerAudioContext()
    this._audioContextMaster.onPlay(() => {
      wx.hideNavigationBarLoading()
    })
    this._audioContextMaster.onEnded(() => {
      this.setMasterStop();
    });
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
    App.globalData.hideCircle = true
    if (App.globalData.hasUpdate) {
      this.getRecords('', true)
      let pages = getCurrentPages()
      App.globalData.hasUpdate = pages.length > 2
      setTimeout(() => {
        wx.hideNavigationBarLoading()
      }, 300)
    }
  },

  onHide: function () {
    wx.hideNavigationBarLoading()
  },

  onUnload: function () {

  },

  onPullDownRefresh: function () {
    wx.stopPullDownRefresh()
  },

  onReachBottom: function () {

  },

  onShareAppMessage: function () {
    return {
      title: `式神台词&模仿录音`,
      path: `/pages/record/record`,
      imageUrl: 'https://systems-1256378396.cos.ap-guangzhou.myqcloud.com/s-record.jpg'
    }
  },

  /**
   * 自定义函数
   */

  getUserInfo(e) {
    let userInfo = e.detail.userInfo
    if (!userInfo) return
    App.initAvatar(userInfo).then(data => {
      wx.showToast({
        title: '登录成功',
      })
      this.setData({
        userInfo: data,
        hasLogin: true
      })
    })
  },

  // 刷新数据
  refresh() {
    this._showIdxs = []
    this._pageNo = 1
    this.setData({
      curData: 0,
      requesting: true,
      empty: false,
      end: false,
      isReady: false,
      recordList: [],
      rotY: this.data.rotY + 120,
    })
    this.getRecords()
  },
  // 加载更多
  more() {
    if (!this.data.isReady) return
    console.log('-load more-', this._step)
    for(let i = 0; i < this._step; i++){
      this.avatarTap()
    }
    this.setData({ isReady: this._step < 5 })
    setTimeout(()=>{
      this.setData({ isReady: true })
    }, 600)
    this._pageNo += 1
    this.getRecords('more')
  },

  initRecords(recordList, type = 'refresh') {
    this._step = 0
    let unq = new Set()
    for (let record of recordList) {
      record["deAvatar"] = deAvatar(record.master_id)
      record["listenStatus"] = "listen-off"
      record["boxStyle"] = "btn-play-box"
      record["btnShow"] = false
      record["btnRt"] = ""
      record["dateStr"] = formatDate(record.c_date)
      record["ser"] = trim(record.serifu)
      record["isMine"] = record.master_id == App.globalData.openid
      record["isListen"] = false
      unq.add(record.openid)
    }
    this._step = unq.size
    if (type == 'more') {
      let oldList = this.data.recordList
      if (oldList.length > 40){
        oldList = []
        this.toTop()
      }
      recordList = oldList.concat(recordList)
      this.setData({ recordList })
    }else{
      this.setData({ recordList })
    }
  },

  getRecords(type='refresh', silence = false) {
    App.globalData.needReload = false
    wx.showNavigationBarLoading()
    let openid = App.globalData.openid
    let pageNo = this._pageNo
    let recordIds = App.globalData.recordIds.join()
    recordIds = ''
    wx.setNavigationBarTitle({
      title: '加载中※模仿录音',
    })
    wx.request({
      url: `${host}/queryRecord`,
      method: 'post',
      data: { openid, pageNo, pageSize, recordIds },
      success: (res) => {
        console.log(res)
        let { records, avatars, total } = res.data
        total = total || 800
        if (silence){
          let recordList = this.data.recordList
          for (let record of recordList){
            for (let dd of records) {
              if (record.record_id == dd.record_id){
                record['heart'] = dd.heart
                record['comm'] = dd.comm
                record['heart_ud'] = dd.heart_ud
              }
            } // for end
          } // for end
          this.setData({ recordList })
        }else {
          this.initRecords(records, type)
          if (type == 'refresh') {
            this._avatars = [].concat(avatars)
            console.log('_avatars', this._avatars)
            avatars = avatars.slice(0, 18)
            while (avatars.length < 18) {
              avatars.push({ url: '', openid: '' })
            }
            avatars.map(it=>it.url = it.url || deAvatar(it.openid))
            this.setData({ avatars, total })
          }
        }
      },
      complete: (res) => {
        wx.hideNavigationBarLoading()
        wx.setNavigationBarTitle({
          title: '式神录※模仿录音',
        })
        if (!silence && type == 'refresh'){
          setTimeout(() => {
            this.setData({ rotY: -20, isReady: true })
          }, 300)
        }
        this.setData({
          requesting: false
        })
        
        let curData = this.data.curData
        this._itPage = setInterval(() => {
          if (curData < pageNo * pageSize && curData < this.data.total) {
            curData += 1
            this.setData({ curData })
          } else {
            clearInterval(this._itPage)
          }
        }, 50)
        
        this._needReload = false
      }
    })
  },

  playHeartSrc() {
    App.getHeartSrc().then(heartSrc => {
      let ctx = this._ctx.pop()
      this._ctx.unshift(ctx)
      ctx.src = heartSrc
      ctx.play()
    })
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

  closeMask() {
    let idx = this._curRecordIdx
    console.log('idx;', idx)
    if (idx != undefined) {
      let recordList = this.data.recordList
      recordList[idx]['comm'] = this.data.commentList.length
      this.setData({ recordList })
    }
    this.setData({
      rt90: false,
    })
    this._curRecordIdx = undefined
  },

  showComment(e) {
    wx.vibrateShort()
    let currData = e.currentTarget.dataset
    let { idx, fid } = currData
    let userId = App.globalData.openid
    let recordList = this.data.recordList
    let curMaster = recordList[idx]
    let recordId = curMaster.record_id
    let nickname = curMaster.nick_name
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

  saveComment: function (content) {
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

  showMore(e) {
    wx.vibrateShort()
    let currData = e.currentTarget.dataset
    let idx = currData.idx
    let recordList = this.data.recordList
    let master_id = recordList[idx]["master_id"]
    let isSelf = false
    if (master_id == App.globalData.openid) isSelf = true
    if (recordList[idx]["btnRt"] == "rt-90") {
      recordList[idx]["boxStyle"] = "btn-play-box"
      recordList[idx]["btnRt"] = ""
      if (isSelf) {
        recordList[idx]["btnShow"] = false
      }
    } else {
      recordList[idx]["boxStyle"] = "btn-play-box-sm"
      recordList[idx]["btnRt"] = "rt-90"
      if (isSelf) {
        recordList[idx]["btnShow"] = true
      }
    }
    this.setData({
      recordList
    })
  },

  confirmInput(e) {
    let { value } = e.detail
    console.log('value:', value)
    this.saveComment(value.trim())
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
    if (!status) {
      this.playHeartSrc()
      wx.vibrateShort()
      url = `${host}/updateHeart`
      curMaster["heart_ud"] = true
      curMaster["heart"] += 1
    } else {
      url = `${host}/cancelHeart`
      curMaster["heart_ud"] = false
      curMaster["heart"] -= 1
    }
    wx.request({
      url: url,
      method: 'post',
      data: { recordId, fileId: fid, userId, masterId },
      success: () => {
        App.globalData.hasUpdate = true
      },
      complete: () => {
        this.setData({
          recordList
        })
        this._lockHearts.splice(this._lockHearts.indexOf(recordId), 1)
      }
    })
  },

  listen(e) {
    let currData = e.currentTarget.dataset
    let recordId = currData.rid
    let idx = currData.idx
    let recordList = this.data.recordList
    let srcRecord = recordList[idx]["src_record"]
    console.log(srcRecord)
    if (!srcRecord) return
    if (recordList[idx]["isListen"]) {
      recordList[idx]["isListen"] = false
      recordList[idx]["listenStatus"] = "listen-off"
      recordList[idx]["anListen"] = ""
      this._audioContextMaster.stop()
    } else {
      wx.vibrateShort()
      wx.showNavigationBarLoading()
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

  setMasterStop() {
    let index = this._listenIndex
    let recordList = this.data.recordList
    if (index != undefined && recordList[index] && recordList[index]["isListen"]) {
      wx.hideNavigationBarLoading()
      recordList[index]["isListen"] = false
      recordList[index]["listenStatus"] = "listen-off"
      recordList[index]["anListen"] = ""
      this._audioContextMaster.stop()
      this._listenIndex = undefined
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

  delRecord(recordId) {
    wx.request({
      url: `${host}/updateRecord`,
      method: 'post',
      data: { recordId, status: 0 },
      success: (res) => {
        App.globalData.hasUpdate = true
        console.log(res)
      }
    })
  },

  delRecordConfirm: function (e) {
    let currData = e.currentTarget.dataset
    let recordId = currData.rid
    let index = currData.idx
    wx.showModal({
      title: '撤回录音?',
      content: '撤回后可在「我的」再次发布',
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

  moveStart(e) {
    this._pageX = e.changedTouches[0].pageX
  },
  moveEnd(e) {
    let move = e.changedTouches[0].pageX - this._pageX
    if (Math.abs(move) < 30 || !this.data.isReady) return
    let n = Math.floor(Math.abs(move) / 30)
    for (let i = 0;i<n;i++){
      this.avatarTap(move > 0)
    }
    if (n > 4){
      this.setData({ isReady: false })
      setTimeout(() => {
        this.setData({ isReady: true })
      }, 600)
    }
  },

  toDetail(e) {
    let fileId = e.currentTarget.dataset.id
    if (!fileId) return
    let url = `../detail/detail?fileId=${fileId}`
    App.toPage(url)
  },

  toPerson(e) {
    wx.vibrateShort()
    let masterId = e.currentTarget ? e.currentTarget.dataset.uid : e
    if (masterId == App.globalData.openid) {
      return wx.switchTab({
        url: '/pages/mine/mine',
      })
    }
    let url = `../person/person?masterId=${masterId}`
    App.toPage(url)
  },

  avatarTap(up) {
    wx.vibrateShort()
    let step = up ? 20 : -20
    let rotY = this.data.rotY + step
    this.setData({ rotY })
    let idx = up ? (rotY / -20 + 6) % 18 : (rotY / -20 + 12) % 18
    setTimeout(()=>{
      let avatars = this.data.avatars
      let last = this._avatars.pop()
      let n = 0
      while (last && avatars.filter(it => it.openid == last.openid).length != 0 && n < this._avatars.length) { // last已有
        this._avatars.unshift(last)
        last = this._avatars.pop()
        n += 1
      }
      this._avatars.unshift(last)
      if (n < this._avatars.length - 1){
        avatars.splice(idx, 1, last)
        this.setData({ avatars })
      }
    }, 300)
    
  },
  autoRot(e){
    // if (this._it > -1) clearInterval(this._it)
    if (!e){
      // this._it = setInterval(()=>{
      //   this.avatarTap()
      // }, 1000)
    }else{
      let uid = e.currentTarget.dataset.uid
      if (uid && e.detail.x >= 90 && e.detail.x < 290) {
        return this.toPerson(uid)
      }
      if (this._ct > -1) clearTimeout(this._ct)
      let up = e.detail.x < 90
      this.avatarTap(up)
    }
  },
  toTop() {
    this.setData({
      scrollAnimation: true
    })
    setTimeout(() => {
      this.setData({
        scrollTop: 0,
      })
    }, 0)
  },

})