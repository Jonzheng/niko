const App = new getApp()
const RecordBucket = 'record-1256378396'
const Region = 'ap-guangzhou'
const { trim, host, formatDate, deAvatar } = require('../../utils/util')
const cvColor = ['#dfdfdf', '#dfdfbf', '#95ddb2', '#92d1e5', '#ffb37c', '#ff6c00', '#ff0000', '#e52fec', '#841cf9', 'black', 'black']

const RecorderManager = wx.getRecorderManager()
const Options = {
  duration: 12000,
  sampleRate: 44100,
  numberOfChannels: 2,
  encodeBitRate: 320000,
  format: 'mp3',
  frameSize: 50
}

const userId = 'ocVQY4-dF2m4IiYTTJZFo6k-NZbE'

let Shape = [...Array(137)].map((v, idx) => v = { height: 0, idx })
let Shadow = [...Array(166)].map((v, idx) => v = { height: 0, idx })

Page({
  data: {
    isIpx: App.globalData.isIpx,
    cname: '* * *',
    skill: '* * *',
    oriPlaying: false,
    recordList: [],
    oriIdx: 0,
    mineIdx: 0,
    rePos: 0,
    logo: 'https://systems-1256378396.cos.ap-guangzhou.myqcloud.com/omoz_sm.png',
    reId: '',
    reName: '',
    reContent: '',
    progress_record: 0,
    hasTmp: false,
    isRecording: false,
    minePlaying: false,
    rt90: true,
    color: "#4a5fe2",
    requesting: false,
    bottomSize: 0,
    commentList: [],
    shadow: Shadow,
    shape: Shape,
    cvColor
  },

  onLoad: function (options) {
    let { fileId } = options
    if (!App.globalData.openid){
      setTimeout(()=>{
        App.initOpenid().then(openid =>{
          console.log('App.initOpenid():', openid)
          App.globalData.openid = openid
          let url = `../detail/detail?fileId=${fileId}`
          wx.redirectTo({ url })
        })
      }, 600)
    } else {
      this.initPageData(fileId)
      this._title = '式神录'
      this.setData({
        fileId,
        isIpx: App.globalData.isIpx,
        userId: App.globalData.openid,
        hasLogin: App.globalData.hasLogin,
      })
      setTimeout(() => { this.setData({ rt90: false }) }, 300)
      App.getHeartSrc()
      this._cantRecord = 0
    }
    this.playBGM()
  },

  onShow() {
    if (App.globalData.hasUpdate){
      this.getRecords()
      let pages = getCurrentPages()
      App.globalData.hasUpdate = pages.length > 2
    }
  },

  onHide: function () {
    wx.hideNavigationBarLoading()
    this.setData({
      showCode: false
    })
    if (this._audioContextBgm) this._audioContextBgm.stop()
  },

  onPullDownRefresh: function () {
    const fileId = this.data.fileId
    const option = { fileId }
    this.onLoad(option)
    wx.stopPullDownRefresh()
  },

  onUnload: function () {
    console.log("onUnload")
    this._audioContextOri.stop()
    this._audioContextMine.stop()
    this._audioContextMaster.stop()
    this._audioContextOri.destroy()
    this._audioContextMine.destroy()
    this._audioContextMaster.destroy()
    if (this._audioContextBgm) this._audioContextBgm.destroy()
  },

  onReady: function () {
    // 文学少女BGM
    this.playBGM()
    this.videoContext = wx.createVideoContext('myVideo')
    this._audioContextOri = wx.createInnerAudioContext()
    this._audioContextMaster = wx.createInnerAudioContext()
    this._audioContextMine = wx.createInnerAudioContext()
    this._ctx = []
    for (let i = 0; i < 6; i++) {
      this._ctx.push(wx.createInnerAudioContext())
    }
    if (this._audioContextBgm){
      this._audioContextBgm.onPlay(() => {
        this._bgmOnPlay = true
      })
      this._audioContextBgm.onStop(() => {
        this._bgmOnPlay = false
      })
      this._audioContextBgm.onPause(() => {
        this._bgmOnPlay = false
      })
    }
    // wx.setInnerAudioOption({ 'obeyMuteSwitch': false })
    // console.log('obeyMuteSwitch:',this._audioContextOri.obeyMuteSwitch)
    this._audioContextOri.onPlay(() => {
      wx.hideNavigationBarLoading()
      let _len = this.data.shadow.filter(it=>it.height>0).length
      this._itOri = setInterval(()=>{
        let curTime = this._audioContextOri.currentTime || 0
        let idx = curTime / this._audioContextOri.duration * _len
        let oriIdx = Math.round(idx)
        this.setData({
          oriIdx
        })
      }, 30)
      this.setData({
        oriPlaying: true,
      })
    })

    this._audioContextOri.onEnded(() => {
      this.setOriStop();
      let tipsRecord = wx.getStorageSync('tipsRecord')
      if (!tipsRecord && !this.data.tipsRecord) {
        wx.setStorageSync('tipsRecord', true)
        setTimeout(() => {
          this.setData({ tipsRecord: '录音模仿一下吧' })
          setTimeout(() => {
            this.setData({ tipsRecord: '录音模仿一下吧, 网友!' })
            setTimeout(() => {
              this.setData({ tipsRecord: '' })
            }, 9500)
          }, 3000)
        }, 500)
      } else if (!this.data.tipsRecord) {
        if (!this._btnTipsShow) {
          this._btnTipsShow = true
          let tipsDetailBtns = wx.getStorageSync('tipsDetailBtns') || 0
          tipsDetailBtns += 1
          console.log('tipsDetailBtns:', tipsDetailBtns)
          wx.setStorageSync('tipsDetailBtns', tipsDetailBtns)
          this.setData({ tipsDetailBtns })
          setTimeout(() => {
            this._btnTipsShow = false
          }, 10000)
        }
      }
    })

    this._audioContextOri.onStop(() => {
      this.setOriStop();
    })

    this._audioContextMaster.onPlay(() => {
      wx.hideNavigationBarLoading()
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
    });

    this._audioContextMaster.onEnded(() => {
      this.setMasterStop();
      let tipsRecord = wx.getStorageSync('tipsRecord101')
      if (!tipsRecord && !this.data.tipsRecord) {
        wx.setStorageSync('tipsRecord101', true)
        setTimeout(() => {
          this.setData({ tipsRecord: '轮到你了' })
          setTimeout(() => {
            this.setData({ tipsRecord: '轮到你了, 网友!' })
            setTimeout(() => {
              this.setData({ tipsRecord: '' })
            }, 9500)
          }, 3000)
        }, 500)
      }
    });

    this._audioContextMine.onEnded(() => {
      this.setMineStop();
    });

    this._audioContextMine.onStop(() => {
      this.setMineStop();
    });

    this._audioContextMine.onPlay(() => {
      console.log(this._audioContextMine.currentTime)
      let _len = this.data.shape.filter(it=>it.height>0).length
      this._itMine = setInterval(() => {
        let curTime = this._audioContextMine.currentTime || 0
        let idx = curTime / this._audioContextMine.duration * _len
        let mineIdx = Math.round(idx)
        this.setData({
          mineIdx
        })
      }, 30)
      this.setData({
        minePlaying: true,
      });
    });

    //----监听录音------------
    RecorderManager.onStart(() => {
      this.setData({
        isRecording: true,
        isPlayed: false,
      })
      let idx = 0
      let shape = Shape
      this._itRer = setInterval(()=>{
        if (!shape[idx]) return
        let height = idx > 5 ? Math.round(Math.random() * 30) + 5 : 10+idx*2
        height = height < 2 ? 3 : height
        shape[idx].height = height
        this.setData({ shape })
        idx += 1
      }, 87)
    })

    RecorderManager.onStop((res) => {
      console.log(res)
      this._tempFile = res
      this.setData({
        isRecording: false,
        hasTmp: true
      })
      console.log('this._tempFile', this._tempFile.duration)
      clearInterval(this._itRer)
      this.playBGM()
    })
  },

  onShareAppMessage() {
    this._itBgm = setInterval(()=>{
      console.log('it_bgmOnPlay', this._bgmOnPlay)
      if (!this._bgmOnPlay){
        this.playBGM()
      } else {
        clearInterval(this._itBgm)
      }
    }, 1000)
    let fileId = this.data.fileId
    let cname = this.data.cname
    return {
      title: `${cname}·台词&模仿录音`,
      path: `/pages/detail/detail?fileId=${fileId}`,
    }
  },

  /**
   * 自定义函数
   */

  getUserInfo(e) {
    let userInfo = e.detail.userInfo
    if(!userInfo) return
    App.initAvatar(userInfo).then(data=>{
      console.log(data)
      this.setData({
        userInfo: data,
        hasLogin: true
      })
    })
  },

  // 刷新数据
  refresh() {
    this.setData({
      requesting: true,
      empty: false,
      end: false,
    })
    this.initPageData(this.data.fileId)
  },
  // 加载更多
  more() {
    console.log('-the end-')
    this.setData({end: true})
    // this.getList();
  },
  playHeartSrc(){
    App.getHeartSrc().then(heartSrc => {
      let ctx = this._ctx.pop()
      this._ctx.unshift(ctx)
      ctx.src = heartSrc
      ctx.play()
    })
  },

  toggleCode() {
    wx.vibrateShort()
    let showCode = !this.data.showCode
    let title = showCode ? '微信小程序·式神录' : '式神录'
    this._title = title
    this.setData({
      showCode
    })
    wx.setNavigationBarTitle({
      title,
    })
  },

  stopAllMedia() {
    this._audioContextOri.stop()
    this._audioContextMine.stop()
  },

  nextSerifu(e) {
    let rev = e.currentTarget.dataset.rev == '1' ? -1 : 1
    if (this._loading) return
    wx.vibrateShort()
    this.stopAllMedia()
    let fileId = this.data.fileId
    let list = this.data.list
    let idx = list.findIndex( item=> item.file_id == fileId)
    let nidx = (idx+rev) % list.length
    nidx = nidx == -1 ? list.length - 1 : nidx
    console.log(nidx, fileId, list)
    let curList = list[nidx]
    this.initPageData(curList.file_id)
  },
  toSerifu(e) {
    let { index } = e.currentTarget.dataset
    let list = this.data.list
    let curList = list[index]
    if (curList.file_id != this.data.fileId){
      this.initPageData(curList.file_id)
    }
    this.closeMask()
  },

  showVideo() {
    this.setData({
      showVideo: true
    })
  },
  videoEnd() {

  },
  hideVideo() {
    this.setData({
      showVideo: false
    })
  },
  fullScreenChange(e) {
    if (e.detail.fullScreen) {
      setTimeout(()=>{
        this.playVideo()
      }, 300)
    } else {
      setTimeout(() => {
        this.pauseVideo()
      }, 100)
    }
  },
  videoOnPlay() {
    this.stopAllMedia()
    this._videoPlay = true
  },
  playVideo() {
    wx.createVideoContext('thisVideo').play()
    this._videoPlay = true
  },
  pauseVideo() {
    wx.createVideoContext('thisVideo').pause()
    this._videoPlay = false
  },
  togglePlay() {
    if (!this._videoPlay){
      this.playVideo()
    }else{
      this.pauseVideo()
    }
  },
  pass(){
    console.log('pass')
  },

  initSerifu(curList) {
    let { title, serifu, koner, roma } = curList
    let fileId = curList.file_id
    let ver = fileId.split('_')[3]
    let ts = title.split('_')
    let cname = ts[0]
    let skill = `${ts[1]}_${ver}`

    let serifuList = []
    let words = []
    serifu = serifu.replace(/[)(]+/g, "#")
    let serifu_sp = serifu.split("#")
    let pre = ''
    for (let [idx, word] of serifu_sp.entries()) {
      if (idx % 2 == 0) {
        if (word.length > 1){
          let value = word.substr(0, word.length - 1)
          value = idx == serifu_sp.length - 1 ? word : value
          for (let w of value){
            words.push({ value: w })
          }
          pre = word.substr(word.length - 1, word.length)
        } else if (idx == serifu_sp.length - 1){
          words.push({ value: word })
        } else {
          pre = word
        }
      } else { //平假注音
        words.push({value: pre, desc: word})
      }
    }
    this.setData({
      videoSize: curList.video_size,
      fileId,
      cname,
      skill,
      koner,
      roma,
    })
    for (let [i, v] of words.entries()) {
      setTimeout(()=>{
        serifuList.push(v)
        this.setData({
          serifuList
        })
      }, i * 30)
    }
  },
  initRecords(recordList) {
    for (let record of recordList) {
      record["deAvatar"] = deAvatar(record.master_id)
      record["btnShow"] = false
      record["btnRt"] = ""
      record["dateStr"] = formatDate(record.c_date)
      record["isMine"] = record.master_id == App.globalData.openid
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

  initPageData(fileId) {
    let openid = App.globalData.openid
    console.log(fileId, ',', openid)
    wx.showNavigationBarLoading()
    wx.setNavigationBarTitle({
      title: '加载中...',
    })
    this._loading = true
    // 查询阴阳师detail
    wx.request({
      url: `${host}/queryDetail`,
      method: 'post',
      data: { cate: 'y', userId: openid, fileId: fileId},
      complete: (res)=> {
        this.setData({
          requesting: false
        })
        setTimeout(() => {
          this._loading = false
          wx.hideNavigationBarLoading()
          wx.setNavigationBarTitle({
            title: this._title,
          })
        }, 300)
        if (res && res.data) {
          let data = res.data
          let { list, audio, record } = data
          list = list || []
          let fakeHide = (list.length > 0 && list[0].clicks == 110)
          this.setData({ fakeHide })
          let curList = list.filter(i=>i.file_id == fileId)[0]
          let curAudio = audio[0]
          let recordList = record
          this.initSerifu(curList)
          this.initRecords(recordList)
          list.map((item)=> {
            item['ser'] = trim(item.serifu)
            item['title'] = item.title + '_' + item.file_id.split('_')[3]
          })
          console.log(list)
          let shadow = curAudio.shadow.split(",").map((height, idx)=>{ return { idx, height } })
          let srcVideo = curList.src_video.trim()
          this.setData({
            srcVideo,
            curAudio,
            list,
            shadow
          })
          
        }else{
          wx.showToast({
            icon: 'none',
            title: '数据加载失败...',
          })
        }
      }
    })
  },

  // 单独拉取record
  getRecords() {
    wx.showNavigationBarLoading()
    let openid = App.globalData.openid
    let fileId = this.data.fileId
    wx.request({
      url: `${host}/queryRecord`,
      method: 'post',
      data: { fileId, openid },
      success: (res) => {
        wx.hideNavigationBarLoading()
        let { data } = res
        this.initRecords(data)
      }
    })
  },

  setOriStop() {
    wx.hideNavigationBarLoading()
    this._audioContextOri.seek(0)
    if (this._itOri > -1) clearInterval(this._itOri)
    this.setData({
      oriIdx: 0,
      oriPlaying: false,
    });
  },

  setMasterStop() {
    let index = this._listenIndex
    let recordList = this.data.recordList
    console.log('_listenIndex', index)
    if (index != undefined && recordList[index] && recordList[index]["isListen"]) {
      wx.hideNavigationBarLoading()
      recordList[index]["isListen"] = false
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

  setMineStop() {
    if (this._itMine > -1) clearInterval(this._itMine)
    this._audioContextMine.seek(0)
    this.setData({
      mineIdx: 0,
      minePlaying: false,
      isPlayed: true
    })
  },

  playOri() {
    wx.vibrateShort()
    let curAudio = this.data.curAudio
    if (!curAudio) return
    this._audioContextOri.src = curAudio.src_audio
    if (!this.data.oriPlaying && !this.data.isRecording) {
      wx.showNavigationBarLoading()
      this._audioContextOri.play()
    } else {
      this.stopOri()
    }
  },

  stopOri() {
    if (!this.data.oriPlaying) return
    this._audioContextOri.stop()
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
      recordList[idx]["btnRt"] = ""
      if (isSelf) {
        recordList[idx]["btnShow"] = false
      }
    } else {
      recordList[idx]["btnRt"] = "rt-90"
      if (isSelf) {
        recordList[idx]["btnShow"] = true
      }
    }
    this.setData({
      recordList
    })
  },


  //录音
  startRecord() {
    this.canIRecord()
    wx.vibrateShort()
    this.setMasterStop()
    wx.setStorageSync('tipsRecord', true)
    this.setData({ tipsRecord: '' })
    if (this.data.minePlaying) {
      this._audioContextMine.stop()
    }
    this.stopOri()
    if (!this.data.isRecording) {
      this.pauseBGM()
      RecorderManager.start(Options)
    } else {
      RecorderManager.stop()
      this.setData({
        isRecording: false,
        hasTmp: true,
      })
    }
  },

  clearTemp() {
    wx.vibrateShort()
    if (this.data.minePlaying) {
      this._audioContextMine.stop()
    }
    this._tempFile = null
    Shape.map(it=>it.height = 0)
    this.setData({
      mineIdx: 0,
      hasTmp: false,
      shape: Shape
    })
  },

  playMyVoice() {
    wx.vibrateShort()
    if (this.data.isRecording) return
    if (this._tempFile) {
      console.log('this._tempFile.tempFilePath:', this._tempFile.tempFilePath)
      this._audioContextMine.src = this._tempFile.tempFilePath
      if (!this.data.minePlaying) {
        this._audioContextMine.play()
      } else {
        this._audioContextMine.stop()
      }
    }
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
      success: (res)=> {
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
      success: (res)=> {
        if (res.confirm) {
          this.delComment(cid, rid)
        }
      }
    });
  },

  toPerson(e) {
    wx.vibrateShort()
    let masterId = e.currentTarget.dataset.uid
    if (masterId == App.globalData.openid){
      return wx.switchTab({
        url: '/pages/mine/mine',
      })
    }
    let url = `../person/person?masterId=${masterId}`
    App.toPage(url)
  },

  listen(e) {
    let currData = e.currentTarget.dataset
    let recordId = currData.rid
    let idx = currData.idx
    let recordList = this.data.recordList
    let srcRecord = recordList[idx]["src_record"]
    if (!srcRecord) return
    if (recordList[idx]["isListen"]) {
      recordList[idx]["isListen"] = false
      this._audioContextMaster.stop()
    } else {
      wx.vibrateShort()
      wx.showNavigationBarLoading()
      this.setMasterStop()
      recordList[idx]["isListen"] = true
      this._audioContextMaster.src = srcRecord
      this._audioContextMaster.play()
      this._listenIndex = idx
    }
    this.setData({
      recordList
    })
  },

  //--点心--
  updateHeart(e) {
    if(this._lockHeart) return
    this._lockHeart = true
    let currData = e.currentTarget.dataset
    let { idx, status } = currData
    let userId = App.globalData.openid
    let recordList = this.data.recordList
    let curMaster = recordList[idx]
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
    let recordId = curMaster["record_id"]
    let masterId = curMaster['master_id']
    let fileId = this.data.fileId
    wx.request({
      url: url,
      method: 'post',
      data: { recordId, fileId, userId, masterId },
      success: ()=>{
        App.globalData.hasUpdate = true
        App.globalData.recordIds.push(recordId)
        this.setData({
          recordList
        })
      },
      complete: () => {
        this._lockHeart = false
      }
    })
  },

  // 上传录音-- record-1256378396.cos.ap-guangzhou.myqcloud.com/ssr_gq_0_31588943189222.mp3
  uploadRecord() {
    if (this._uploading) return
    this._uploading = true
    wx.vibrateShort()
    wx.showNavigationBarLoading()
    wx.showLoading({
      title: '上传中...',
    })
    let recordFile = this._tempFile.tempFilePath
    let masterId = App.globalData.openid
    let fileId = this.data.fileId
    let recordId = fileId + new Date().getTime()
    let filename = `${recordId}.mp3`
    let Cos = App.globalData.Cos
    Cos.postObject({
      Bucket: RecordBucket,
      Region: Region,
      Key: filename,
      FilePath: recordFile,
      onProgress: (info)=> {
        console.log(JSON.stringify(info));
      }
    }, (err, data)=> {
      this._uploading = false
      wx.hideNavigationBarLoading()
      wx.hideLoading()
      console.log(err || data);
      if (err){
        wx.showToast({
          icon: 'none',
          title: '上传失败了',
        })
      }else{ // 上传成功，保存地址
        let location = data.Location
        let srcRecord = `https://${location}`
        wx.request({
          url: `${host}/saveRecord`,
          method: 'post',
          data: { recordId, fileId, masterId, srcRecord },
          success: (res) => {
            App.globalData.hasUpdate = true
            console.log('saveRecord success:', res)
            App.globalData.newRecord = true
            this.onPullDownRefresh()
            wx.showToast({
              title: '上传成功',
            })
          },
          complete: ()=>{
            this.clearTemp()
          }
        })
      }
    })
  },
  initCommentList(commentList){
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
    wx.vibrateShort()
    let currData = e.currentTarget.dataset
    let { idx } = currData
    let userId = App.globalData.openid
    let recordList = this.data.recordList
    let curMaster = recordList[idx]
    let recordId = curMaster.record_id
    let nickname = curMaster.nick_name
    this._inputPh = `评论 ${nickname}：`
    this._curRecordIdx = idx
    this.setData({
      inputPh: `评论 ${nickname}：`,
      curIdx: idx,
      curMaster,
      commShow: true
    })
    wx.request({
      url: `${host}/queryComment`,
      method: 'post',
      data: { recordId, userId },
      success: (res) => {
        console.log(res)
        if (res){
          let commentList = res.data
          this.initCommentList(commentList)
        }
      }
    })
  },
  saveComment: function (content) {
    let { fileId, curMaster, curIdx } = this.data
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
      success: (res)=> {
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
          let recordList = this.data.recordList
          recordList[curIdx].comments = commentList.slice(0, 2)
          this.setData({ recordList })
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

  confirmInput(e) {
    let { value } = e.detail
    console.log('value:',value)
    this.saveComment(value.trim())
  },

  //--留言点赞--
  updateZan: function (e) {
    let currData = e.currentTarget.dataset
    const idx = currData["idx"]
    const midx = currData["midx"]
    const id = currData["cid"]
    let openid = App.globalData.openid
    let user_id = openid
    let recordList = this.data.recordList
    let zans = recordList[idx]["comments"][midx]["zans"]
    let zid = zans.includes(user_id)
    let type = ''
    if (zid) {
      type = 'pull'
      recordList[idx]["comments"][midx]["zanShape"] = zanOff
      let dx = recordList[idx]["comments"][midx]["zans"].indexOf(user_id)
      recordList[idx]["comments"][midx]["zans"].splice(dx, 1)
    } else {
      type = 'push'
      recordList[idx]["comments"][midx]["zanShape"] = zanOn
      recordList[idx]["comments"][midx]["zans"].push(user_id)
    }
    wx.cloud.callFunction({
      name: 'updateZan',
      data: { id, user_id, type },
      success: res => {
        console.log(res)
        this.setData({ recordList })
      }
    })
  },

  showOther() {
    wx.vibrateShort()
    let rt90 = !this.data.rt90
    let otherShow = !this.data.otherShow
    this.setData({
      rt90,
      otherShow,
    })
  },
  closeMask() {
    let idx = this._curRecordIdx
    console.log('idx;',idx)
    if (idx != undefined){
      let recordList = this.data.recordList
      recordList[idx]['comm'] = this.data.commentList.length
      this.setData({ recordList })
    }
    this.setData({
      rt90: false,
      otherShow: false,
    })
    this._curRecordIdx = undefined
  },

  reload: function (e) {
    let currData = e.currentTarget.dataset
    let fileId = currData.fid
    console.log(fileId)

    let _url = '../detail/detail?fileId=' + fileId
    wx.redirectTo({
      url: _url
    })
  },
  toRecord(e) {
    wx.vibrateShort()
    let url = `../record/record`
    App.toPage(url)
  },

  canIRecord(){
    wx.getSetting({
      success: res => {
        if (!res.authSetting['scope.record'] && !this.data.tipsCantRecord) {
          this._cantRecord += 1
          if (this._cantRecord > 1){
            wx.vibrateLong()
            this.setData({ tipsCantRecord: true })
            setTimeout(()=>{
              this.setData({ tipsCantRecord: false })
            }, 10000)
          }
        }
      }
    })
  },
  playBGM(){
    console.log('this._bgmOnPlay', this._bgmOnPlay)
    if (!this.data.fileId || this.data.fileId.indexOf('sp_wxsn') == -1 || this._bgmOnPlay) return
    if (!this._audioContextBgm) this._audioContextBgm = wx.createInnerAudioContext()
    App.getBgmSrc().then(bgmSrc => {
      this._audioContextBgm.src = bgmSrc
      this._audioContextBgm.loop = true
      this._audioContextBgm.volume = 0.3
      this._audioContextBgm.play()
    })
  },
  pauseBGM(){
    if (!this._audioContextBgm) return
    this._audioContextBgm.pause()
  }

})