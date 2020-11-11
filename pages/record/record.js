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
    pageList: [],
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
    this._globalIndex = 0
    this._globalList = []
    this.pageHeightArr = []
    wx.getSystemInfo({
      success: (res) => {
        let { windowHeight } = res;
        this._windowHeight = windowHeight;
      }
    })

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
        if (this.data.pageList.length == 0) {
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
    this._globalIndex = 0
    this._globalList = []
    this.pageHeightArr = []
    this._showIdxs = []
    this._pageNo = 1
    this.setData({
      curData: 0,
      requesting: true,
      empty: false,
      end: false,
      isReady: false,
      pageList: [],
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
    this._globalIndex += 1
    this.getRecords('more')
  },

  setHeight() {
    let globalIdx = this._globalIndex
    this.query = wx.createSelectorQuery();
    this.query.select(`#wrp_${globalIdx}`).boundingClientRect()
    this.query.exec( (res) => {
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
      this._globalList[this._globalIndex] = recordList
      let globalIdx = this._globalIndex
      let datas = {}
      datas['pageList[' + globalIdx + ']'] = recordList
      this.setData(datas, () => {
        this.setHeight();
      })
    }else{
      this._globalList[this._globalIndex] = recordList
      this.setData({ ['pageList[' + this._globalIndex + ']']: recordList }, () => {
        this.setHeight();
      })
    }
  },

  getRecords(type='refresh', silence = false) {
    App.globalData.needReload = false
    wx.showNavigationBarLoading()
    let openid = App.globalData.openid
    let pageNo = this._pageNo
    let recordIds = App.globalData.recordIds.join()
    wx.setNavigationBarTitle({
      title: '加载中※模仿录音',
    })
    wx.request({
      url: `${host}/queryRecord`,
      method: 'post',
      data: { openid, pageNo, pageSize, recordIds },
      success: (res) => {
        let { records, avatars, total } = res.data
        total = total || 800
        if (silence){
          let pageList = this.data.pageList
          records = records || res.data
          for (let lst of pageList){
            if (!lst.length) continue;
            for (let record of lst) {
              for (let dd of records) {
                if (record.record_id == dd.record_id){
                  console.log('set--', dd.record_id)
                  record['heart'] = dd.heart
                  record['comm'] = dd.comm
                  record['heart_ud'] = dd.heart_ud
                }
              } // for end
            }
          } // for end
          App.globalData.recordIds = []
          this.setData({ pageList })
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

  showComment(e) {
    wx.vibrateShort()
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
    let { fileId, curMaster, reId, reName, reContent  } = this.data
    let recordId = curMaster.record_id
    let masterId = curMaster.master_id
    let userId = App.globalData.openid

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
    let { pdx, idx } = e.currentTarget.dataset
    let pageList = this.data.pageList
    let master_id = pageList[pdx][idx]["master_id"]
    let isSelf = false
    if (master_id == App.globalData.openid) isSelf = true
    if (pageList[pdx][idx]["btnRt"] == "rt-90") {
      pageList[pdx][idx]["boxStyle"] = "btn-play-box"
      pageList[pdx][idx]["btnRt"] = ""
      if (isSelf) {
        pageList[pdx][idx]["btnShow"] = false
      }
    } else {
      pageList[pdx][idx]["boxStyle"] = "btn-play-box-sm"
      pageList[pdx][idx]["btnRt"] = "rt-90"
      if (isSelf) {
        pageList[pdx][idx]["btnShow"] = true
      }
    }
    this.setData({
      pageList
    })
  },

  confirmInput(e) {
    let { value } = e.detail
    console.log('value:', value)
    this.saveComment(value.trim())
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
    if (!status) {
      this.playHeartSrc()
      wx.vibrateShort()
      url = `${host}/updateHeart`
      pageList[pdx][idx]["heart_ud"] = true
      pageList[pdx][idx]["heart"] += 1
    } else {
      url = `${host}/cancelHeart`
      pageList[pdx][idx]["heart_ud"] = false
      pageList[pdx][idx]["heart"] -= 1
    }
    this.setData({ pageList })
    wx.request({
      url: url,
      method: 'post',
      data: { recordId, fileId: fid, userId, masterId },
      success: () => {
        App.globalData.hasUpdate = true
      },
      complete: () => {
        this._lockHearts.splice(this._lockHearts.indexOf(recordId), 1)
      }
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
      wx.showNavigationBarLoading()
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

  setMasterStop() {
    let idx = this._listenIndex
    let pdx = this._pdx
    let pageList = this.data.pageList
    if (idx != undefined && idx < pageList[pdx].length && pageList[pdx][idx]["isListen"]) {
      wx.hideNavigationBarLoading()
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

  delRecordConfirm(e) {
    let { idx, pdx, rid } = e.currentTarget.dataset
    wx.showModal({
      title: '撤回录音?',
      content: '撤回后可在「我的」再次发布',
      confirmText: "确认",
      cancelText: "取消",
      success: (res) => {
        if (res.confirm) {
          let pageList = this.data.pageList
          pageList[pdx].splice(idx, 1)
          this.setData({ pageList })
          this.delRecord(rid)
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