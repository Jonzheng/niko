const App = new getApp()
const { trim, host } = require('../../utils/util')

const recorderManager = wx.getRecorderManager()
const options = {
  duration: 10000,
  sampleRate: 44100,
  numberOfChannels: 2,
  encodeBitRate: 320000,
  format: 'mp3',
  frameSize: 50
}
const dura = options.duration / 1000

const src_heart = "../../images/heart-off.png"
const src_heart_full = "../../images/heart-on.png"
const src_zan_em = "../../images/zan-off.png"
const src_zan_fu = "../../images/zan-on.png"

const userId = 'ocVQY4-dF2m4IiYTTJZFo6k-NZbE'

function _next() {
  let that = this;
  let _progress = this.data.progress_record
  if (!this.data.isRecording) {
    return true;
  }
  if (_progress >= 100) {
    _progress = 100;
    return true
  }
  this.setData({
    progress_record: _progress + 2
  });
  setTimeout(function () {
    _next.call(that);
  }, 200);
}

Page({
  data: {
    loged: false,
    slider: 'bar-ori',
    cname: '* * *',
    cv: '* * * *',
    skill: '* * *',
    oriPlaying: false,
    show_video: false,
    an_in: false,
    recordList: [],
    record_map: {},
    icon_trash: "../../images/trash.png",
    icon_upload: "../../images/upload.png",
    icon_record: "../../images/record.png",
    icon_comm: "../../images/comm.png",
    icon_more: "../../images/more.png",
    re_id: '',
    re_name: '',
    re_content: '',
    icon_zan_em: src_zan_em,
    icon_zan_fu: src_zan_fu,
    progress_record: 0,
    hasTmp: false,
    isRecording: false,
    isPlaying: false,
    show_other: true,
    tempFile: '',

  },

  onLoad: function (options) {
    //页面初始参数
    let { fileId } = options
    this.initPageData(fileId)
    this.setData({
      fileId,
      loged: App.globalData.userInfo,
    })
    setTimeout(() => { this.setData({ an_in: true, show_other: false }) }, 300)
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
  },

  onReady: function () {
    this._videoContext = wx.createVideoContext('myVideo')
    this._audioContextOri = wx.createInnerAudioContext()
    this._audioContextMaster = wx.createInnerAudioContext()
    this._audioContextMine = wx.createInnerAudioContext()

    this._audioContextOri.onPlay(() => {
      console.log("audioContextOri...")
      this.setData({
        slider: 'bar-end',
        oriPlaying: true,
      });
    });

    this._audioContextOri.onEnded(() => {
      this.setOriStop();
    });

    this._audioContextOri.onStop(() => {
      this.setOriStop();
    });

    this._audioContextMaster.onEnded(() => {
      this.setMasterStop();
    });

    this._audioContextMine.onEnded(() => {
      this.setMineStop();
    });

    this._audioContextMine.onStop(() => {
      this.setMineStop();
    });

    //----监听录音------------
    recorderManager.onStart(() => {
      console.log('start,dura:' + dura)
      this.setData({
        isRecording: true,
        dura: dura,
        isPlayed: false,
      })
      _next.call(this);
    })

    recorderManager.onStop((res) => {
      console.log(res)
      let progress_record = res.duration / options.duration * 100
      this.setData({
        progress_record,
        tempFile: res,
        isRecording: false,
        hasTmp: true
      })
    })
  },

  onShareAppMessage() {
    return {
      title: '阴阳师·式神台词语音',
      path: '/pages/index/index',
    }
  },

  /**
   * 自定义函数
   */

  toLogin: function (e) {
    let userInfo = e.detail.userInfo
    console.log("toLogin:")
    if (userInfo) {
      App.globalData.hasLogin = true
      App.globalData.userInfo = userInfo
      let gender = 1
      if (userInfo.gender != "" && userInfo.gender != undefined) gender = userInfo.gender
      App.globalData.gender = gender
      this.setData({
        loged: true,
      })
      // 云登录
      wx.cloud.callFunction({
        name: 'login',
        data: { userInfo },
        success: res => {
          console.log(res)
          App.globalData.openid = res.result.openid
        }
      })
    } else {
      App.globalData.hasLogin = false
      this.setData({
        loged: false,
      })
    }
  },

  stopAllMedia() {
    this._audioContextOri.stop()
    this._audioContextMine.stop()
  },

  nextSerifu() {
    if (this._loading) return
    this.stopAllMedia()
    let fileId = this.data.fileId
    let list = this.data.list
    let idx = list.findIndex( item=> item.file_id == fileId)
    let nidx = (idx+1) % list.length
    console.log(nidx, fileId, list)
    let curList = list[nidx]
    // this.initSerifu(curList)
    this.initPageData(curList.file_id)
  },

  playVideo() {
    this.setData({
      showVideo: true
    })
  },

  initSerifu(curList) {
    let { title, serifu, koner, roma } = curList
    let fileId = curList.file_id
    let ts = title.split('_')
    let cname = ts[0]
    let skill = ts[1]

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
            words.push({value:w})
          }
          pre = word.substr(word.length - 1, word.length)
        } else{
          pre = word
        }
      } else { //平假注音
        words.push({value: pre, desc: word})
      }
    }
    this.setData({
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
      record["listenStatus"] = "listen-off"
      record["boxStyle"] = "btn-play-box"
      record["btnDelStyle"] = "btn-red-hidden"
      record["btnPoiStyle"] = "btn-red-hidden"
      record["btnRt"] = ""
      record["mon"] = "comment-hide"
      record["comm_word"] = record.comm
      record["holder"] = "输入文字"
      if (record.heart_ud) {
        record["heartShape"] = src_heart_full
        record["heartStatus"] = 1
      } else {
        record["heartShape"] = src_heart
        record["heartStatus"] = 0
      }
      record["isListen"] = false
    }
    this.setData({
      recordList: recordList,
    })
  },

  initPageData: function (fileId) {
    let that = this
    let openid = App.globalData.openid
    let user_id = openid ? openid : ''
    console.log(fileId, '#', user_id)
    wx.showNavigationBarLoading()
    that._loading = true
    // 查询阴阳师detail
    wx.request({
      url: `${host}/queryDetail`,
      method: 'post',
      data: { cate: 'y', userId: userId, fileId: fileId},
      complete(res) {
        console.log(res)
        setTimeout(() => {
          that._loading = false
          wx.hideNavigationBarLoading()
        }, 300)
        if (res && res.data) {
          let data = res.data
          let { list, audio, record } = data
          console.log(list)
          console.log(audio)
          console.log(record)
          let curList = list.filter(i=>i.file_id == fileId)[0]
          let curAudio = audio[0]
          let recordList = record
          that.initSerifu(curList)
          that.initRecords(recordList)
          let shadow = curAudio.shadow.split(",").map((item) => { return item + 'rpx' })
          that.setData({
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
        // 请求完成都会执行
        that.setData({
          requesting: false,
        })
      }
    })
    // wx.cloud.callFunction({
    //   name: 'getDetail',
    //   data: { cate: 'y', fileId, user_id },
    //   success: res => {
    //     console.log(res)
    //     wx.hideLoading()
    //     const data = res.result
    //     if (!data) return
    //     let curList = data["res_list"][0]
    //     let curAudio = data["res_audio"][0]
    //     let recordList = data["recordList"]
    //     let res_others = data["res_others"]
    //     that.initSerifu(curList)
    //     // 初始化-record
    //   }
    // })
  },

  setOriStop: function () {
    this.setData({
      slider: 'bar-ori',
      oriPlaying: false,
    });
  },

  setMasterStop: function () {
    let index = this.data.listenIndex
    //console.log("setMasterStop:", index)
    let recordList = this.data.recordList
    if (index != null && recordList[index]["isListen"]) {
      recordList[index]["isListen"] = false
      recordList[index]["listenStatus"] = "listen-off"
      recordList[index]["anListen"] = ""
      this._audioContextMaster.stop()
      this.setData({
        recordList,
        listenIndex: null
      })
    }
  },

  setMineStop: function () {
    this.setData({
      isPlaying: false,
      isPlayed: true
    })
  },

  playOri: function () {
    let curAudio = this.data.curAudio
    this._audioContextOri.src = curAudio.src_audio
    if (!this.data.oriPlaying) {
      this._audioContextOri.play()
    } else {
      this.stopOri()
    }
  },

  stopOri: function () {
    this._audioContextOri.stop()
  },

  showMore: function (e) {
    let that = this
    let currData = e.currentTarget.dataset
    let index = currData.idx
    let recordList = this.data.recordList
    let master_id = recordList[index]["master_id"]
    let isSelf = false
    if (master_id == App.globalData.openid) isSelf = true
    //console.log(isSelf)
    //console.log(recordList[index])
    if (recordList[index]["btnRt"] == "rt-90") {
      recordList[index]["boxStyle"] = "btn-play-box"
      recordList[index]["btnRt"] = ""
      if (isSelf) {
        recordList[index]["btnDelStyle"] = "btn-red-hidden"
      } else {
        recordList[index]["btnPoiStyle"] = "btn-red-hidden"
      }
    } else {
      recordList[index]["boxStyle"] = "btn-play-box-sm"
      recordList[index]["btnRt"] = "rt-90"
      if (isSelf) {
        recordList[index]["btnDelStyle"] = "btn-red"
      } else {
        recordList[index]["btnPoiStyle"] = "btn-red"
      }
    }
    that.setData({
      recordList
    })
  },


  //录音
  startRecord: function () {
    if (this.data.isPlaying) {
      this.stopMyVoice()
    }
    if (this.data.hasTmp) {
      this.data.tempFile = undefined
      this.setData({
        hasTmp: false,
        progress_record: 0
      })
      return
    }
    this.stopOri()
    if (!this.data.isRecording) {
      recorderManager.start(options)
    } else {
      recorderManager.stop()
      this.setData({
        isRecording: false,
        hasTmp: true,
      })
    }

  },

  playMyVoice: function () {
    if (this.data.isRecording) {
      return false
    }
    let tempFile = this.data.tempFile
    if (tempFile != undefined) {
      console.log(tempFile.tempFilePath)
      this._audioContextMine.src = tempFile.tempFilePath
      if (!this.data.isPlaying) {
        this._audioContextMine.play()
        this.setData({
          isPlaying: true,
          recordFile: tempFile.tempFilePath
        })
      } else {
        this._audioContextMine.stop()
      }

    }
  },

  delMine: function (record_id) {
    wx.cloud.callFunction({
      name: 'updateRecordStatus',
      data: { record_id },
      success: res => {
        console.log(res)
      }
    })
  },

  delConfirm: function (e) {
    let that = this
    let currData = e.currentTarget.dataset
    let record_id = currData.record_id
    let index = currData.idx
    wx.showModal({
      title: '删除录音?',
      content: '不可逆操作,请再次确认',
      confirmText: "确认",
      cancelText: "取消",
      success: function (res) {
        //console.log(res);
        if (res.confirm) {
          let recordList = that.data.recordList
          recordList.splice(index, 1)
          that.setData({ recordList })
          that.delMine(record_id)
        } else {
          //console.log('用户点击辅助操作')
        }
      }
    });
  },

  delCommConfirm: function (e) {
    let that = this
    let currData = e.currentTarget.dataset
    let comm_id = currData.cid
    let index = currData.idx
    wx.showModal({
      title: '删除评论?',
      content: '不可逆操作,请再次确认',
      confirmText: "确认",
      cancelText: "取消",
      success: function (res) {
        //console.log(res);
        if (res.confirm) {
          that.delComment(index, comm_id)
        } else {
          //console.log('用户点击辅助操作')
        }
      }
    });
  },


  listen: function (e) {
    let that = this
    let currData = e.currentTarget.dataset
    let record_id = currData.record_id
    let index = currData.idx
    let recordList = this.data.recordList
    let src_record = recordList[index]["src_record"]
    if (!src_record) return
    if (recordList[index]["isListen"]) {
      recordList[index]["isListen"] = false
      recordList[index]["listenStatus"] = "listen-off"
      recordList[index]["anListen"] = ""
      this._audioContextMaster.stop()
    } else {
      that.setMasterStop()
      recordList[index]["isListen"] = true
      recordList[index]["listenStatus"] = "listen-on"
      recordList[index]["anListen"] = "an-listen-on"
      console.log(index, src_record)
      this._audioContextMaster.src = src_record
      that.setData({
        listenIndex: index
      })
      this._audioContextMaster.play()
    }
    this.setData({
      recordList
    })
  },

  //--点心--
  updateHeart: function (e) {
    let that = this
    let currData = e.currentTarget.dataset
    let status = currData.status
    let openid = App.globalData.openid
    let user_id = openid
    let type = ""
    let index = currData.idx
    let recordList = this.data.recordList
    let curr_master = recordList[index]
    if (status == 0) {
      type = 'push'
      curr_master["heartShape"] = src_heart_full
      curr_master["heartStatus"] = 1
      curr_master["hearts"].push(user_id)
    } else {
      type = "pull"
      curr_master["heartShape"] = src_heart
      curr_master["heartStatus"] = 0
      let idx = curr_master["hearts"].indexOf(user_id)
      curr_master["hearts"].splice(idx, 1)
    }
    let record_id = curr_master["record_id"]
    wx.cloud.callFunction({
      name: 'updateHeart',
      data: { record_id, user_id, type },
      success: res => {
        console.log(res)
        that.setData({ recordList })
      }
    })
  },

  // 上传录音
  uploadRecord: function () {
    let that = this
    let recordFile = this.data.recordFile
    console.log("recordFile:")
    console.log(recordFile)
    let master_id = App.globalData.openid
    let fileId = this.data.fileId
    const record_id = fileId + new Date().getTime()
    const path = 'records/' + record_id + '.mp3'
    wx.cloud.uploadFile({
      cloudPath: path,
      filePath: recordFile, // 文件路径
    }).then(res => {
      console.log(res)
      const src_record = res.fileID.replace('cloud://omoz-dev-jono.', 'https://').replace('1256378396', '1256378396.tcb.qcloud.la')
      wx.cloud.callFunction({
        name: 'saveRecord',
        data: { record_id, fileId, src_record, master_id },
        success: res => {
          console.log(res)
          that.onPullDownRefresh()
        }
      })
    }).catch(err => {
      console.log(err)
    })
  },
  showComment: function (e) {
    let openid = App.globalData.openid
    let user_id = openid
    let that = this
    let currData = e.currentTarget.dataset
    let index = currData.idx
    let recordList = this.data.recordList
    this.clearInput()
    if (recordList[index]["mon"] == "comment-show") {
      recordList[index]["mon"] = "comment-hide"
      recordList[index]["comm_word"] = recordList[index]["comm"]
      that.setData({ recordList })
    } else {
      recordList[index]["mon"] = "comment-show"
      recordList[index]["comm_word"] = "收起"
      const record_id = recordList[index]["record_id"]
      wx.showLoading({ title: '加载中...' })
      wx.cloud.callFunction({
        name: 'getComment',
        data: { record_id, user_id },
        success: res => {
          wx.hideLoading()
          console.log('showComment')
          console.log(res)
          const comments = res.result['res_comments']
          for (let v of comments) {
            let zid = v.zans.includes(user_id)
            v["zanShape"] = zid ? src_zan_fu : src_zan_em
            v["self"] = v.user_id === user_id
          }
          recordList[index]["comments"] = comments
          that.setData({ recordList })
        }
      })
    }
  },
  addComment: function (e) {
    let that = this
    const content = e.detail.value
    let currData = e.currentTarget.dataset
    let index = currData.idx
    let recordList = this.data.recordList
    for (let v of recordList) {
      v["focus"] = false
      v["holder"] = "输入文字"
    }
    const master = recordList[index]
    const record_id = master.record_id
    const master_id = master.master_id
    const fileId = master.fileId
    let openid = App.globalData.openid
    let user_id = openid
    const re_id = this.data.re_id
    const re_name = this.data.re_name
    const re_content = this.data.re_content
    const comment = { record_id, master_id, fileId, user_id, content, re_id, re_name, re_content }
    wx.showLoading({ title: '...' })
    wx.cloud.callFunction({
      name: 'saveComment',
      data: comment,
      success: res => {
        console.log(res)
        const comments = res.result['res_comments']
        for (let v of comments) {
          let zid = v.zans.includes(user_id)
          v["zanShape"] = zid ? src_zan_fu : src_zan_em
          v["self"] = v.user_id === user_id
        }
        recordList[index]["comments"] = comments
        recordList[index]["comm"] = comments.length
        recordList[index]["inputValue"] = ""
        wx.hideLoading()
        that.setData({ recordList })
      }
    })

  },
  reply: function (e) {
    let that = this
    let currData = e.currentTarget.dataset
    const index = currData["idx"]
    const re_id = currData["cid"]
    const re_name = currData["name"]
    const re_content = currData["content"]
    let recordList = this.data.recordList
    this.clearInput()
    recordList[index]["holder"] = "回复:" + re_name
    recordList[index]["focus"] = true
    that.setData({ recordList, re_id, re_name, re_content })

  },
  clearInput: function () {
    let recordList = this.data.recordList
    for (let v of recordList) {
      v["focus"] = false
      v["holder"] = "输入文字"
    }
    const re_id = ''
    const re_name = ''
    const re_content = ''
    this.setData({ recordList, re_id, re_name, re_content })
  },
  delComment: function (index, comm_id) {
    let openid = App.globalData.openid
    let user_id = openid
    let that = this
    let recordList = this.data.recordList
    this.clearInput()
    const record_id = recordList[index]["record_id"]
    wx.showLoading({ title: '...' })
    wx.cloud.callFunction({
      name: 'deleteComment',
      data: { user_id, record_id, comm_id },
      success: res => {
        console.log(res)
        const comments = res.result['res_comments']
        for (let v of comments) {
          let zid = v.zans.includes(user_id)
          v["zanShape"] = zid ? src_zan_fu : src_zan_em
          v["self"] = v.user_id === user_id
        }
        recordList[index]["comments"] = comments
        recordList[index]["comm"] = comments.length
        wx.hideLoading()
        that.setData({ recordList })
      }
    })
  },

  //--留言点赞--
  updateZan: function (e) {
    let that = this
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
      recordList[idx]["comments"][midx]["zanShape"] = src_zan_em
      let dx = recordList[idx]["comments"][midx]["zans"].indexOf(user_id)
      recordList[idx]["comments"][midx]["zans"].splice(dx, 1)
    } else {
      type = 'push'
      recordList[idx]["comments"][midx]["zanShape"] = src_zan_fu
      recordList[idx]["comments"][midx]["zans"].push(user_id)
    }
    wx.cloud.callFunction({
      name: 'updateZan',
      data: { id, user_id, type },
      success: res => {
        console.log(res)
        that.setData({ recordList })
      }
    })
  },

  showOther: function () {
    let show_other = !this.data.show_other
    this.setData({
      show_other
    })
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

})