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
  var that = this;
  var _progress = this.data.progress_record
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
    oriPlaying: false,
    show_video: false,
    an_in: false,
    res_records: [],
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
  onUnload: function () {
    console.log("onUnload")
    var audioContextOri = this.data.audioContextOri
    var audioContextMaster = this.data.audioContextMaster
    var audioContextMine = this.data.audioContextMine
    audioContextOri.stop()
    audioContextMine.stop()
    audioContextMaster.stop()
  },
  onReady: function () {
    this.videoContext = wx.createVideoContext('myVideo')

    const audioContextOri = wx.createInnerAudioContext()
    const audioContextMaster = wx.createInnerAudioContext()
    const audioContextMine = wx.createInnerAudioContext()

    this.setData({
      audioContextOri,
      audioContextMaster,
      audioContextMine,
    })

    audioContextOri.onPlay(() => {
      console.log("audioContextOri...")
      this.setData({
        slider: 'bar-end',
        oriPlaying: true,
      });
    });

    audioContextOri.onEnded(() => {
      this.setOriStop();
    });

    audioContextOri.onStop(() => {
      this.setOriStop();
    });

    audioContextMaster.onEnded(() => {
      this.setMasterStop();
    });

    audioContextMine.onEnded(() => {
      this.setMineStop();
    });

    audioContextMine.onStop(() => {
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
      var progress_record = res.duration / options.duration * 100
      this.setData({
        progress_record,
        tempFile: res,
        isRecording: false,
        hasTmp: true
      })
    })
  },

  toLogin: function (e) {
    var userInfo = e.detail.userInfo
    console.log("toLogin:")
    if (userInfo) {
      App.globalData.hasLogin = true
      App.globalData.userInfo = userInfo
      var gender = 1
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
  //卍解-coin-1?
  unlock: function () {
    console.log("unlock")
    this.setData({
      show_video: true
    })
  },

  initSerifu: function (list_zero) {
    var serifu = list_zero.serifu
    var koner = list_zero.koner
    var roma = list_zero.roma

    var serifuList = []
    serifu = serifu.replace(new RegExp('[)(]+', 'g'), "#")
    var serifu_sp = serifu.split("#")
    for (let [idx, word] of serifu_sp.entries()) {
      if (idx % 2 == 0) {
        var cs = ""
        var sm = { word, cs }
        serifuList.push(sm)
      } else { //平假注音
        var cs = "dc-word left-" + word.length
        var sm = { word, cs }
        serifuList.push(sm)
      }
    }
    this.setData({
      serifuList,
      koner,
      roma,
    })
  },

  initPageData: function (fileId) {
    var that = this
    var openid = App.globalData.openid
    var user_id = openid ? openid : ''
    console.log(fileId, '#', user_id)
    wx.showNavigationBarLoading()
    // 查询阴阳师detail
    wx.request({
      url: `${host}/queryDetail`,
      method: 'post',
      data: { cate: 'y', userId: userId, fileId: fileId},
      complete(res) {
        console.log(res)
        setTimeout(() => {
          wx.hideNavigationBarLoading()
        }, 600)
        if (res && res.data) {
          let data = res.data
          let { list, audio, record } = data
          console.log(list)
          console.log(audio)
          console.log(record)
          let curList = list.filter(i=>i.file_id == fileId)
          that.initSerifu(curList[0])
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
    //     var list_zero = data["res_list"][0]
    //     var audio_zero = data["res_audio"][0]
    //     var res_records = data["res_records"]
    //     var res_others = data["res_others"]
    //     that.initSerifu(list_zero)
    //     // 初始化-record
    //     for (let record of res_records) {
    //       record["listenStatus"] = "listen-off"
    //       record["boxStyle"] = "btn-play-box"
    //       record["btnDelStyle"] = "btn-red-hidden"
    //       record["btnPoiStyle"] = "btn-red-hidden"
    //       record["btnRt"] = ""
    //       record["mon"] = "comment-hide"
    //       record["comm_word"] = record.comm
    //       record["holder"] = "输入文字"
    //       if (record.hearts.includes(openid)) {
    //         record["heartShape"] = src_heart_full
    //         record["heartStatus"] = 1
    //       } else {
    //         record["heartShape"] = src_heart
    //         record["heartStatus"] = 0
    //       }

    //       record["isListen"] = false
    //     }
    //     var other_lst = []
    //     for (let ot of res_others) {
    //       if (ot.fileId == fileId) continue
    //       other_lst.push(ot)
    //     }
    //     var shadow = audio_zero.shadow.split(",").map((item) => { return item + 'rpx' })
    //     var video_size = list_zero.video_size / 1048576
    //     that.setData({
    //       other_lst,
    //       list_zero,
    //       audio_zero,
    //       res_records: res_records,
    //       video_size: video_size.toFixed(2),
    //       shadow
    //     })

    //   }
    // })
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

  setOriStop: function () {
    this.setData({
      slider: 'bar-ori',
      oriPlaying: false,
    });
  },

  setMasterStop: function () {
    var index = this.data.listenIndex
    var audioContextMaster = this.data.audioContextMaster
    //console.log("setMasterStop:", index)
    var res_records = this.data.res_records
    if (index != null && res_records[index]["isListen"]) {
      res_records[index]["isListen"] = false
      res_records[index]["listenStatus"] = "listen-off"
      res_records[index]["anListen"] = ""
      audioContextMaster.stop()
      this.setData({
        res_records,
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
    var audioContextOri = this.data.audioContextOri
    var audio_zero = this.data.audio_zero
    audioContextOri.src = audio_zero.src_audio
    if (!this.data.oriPlaying) {
      audioContextOri.play()
    } else {
      this.stopOri()
    }
  },

  stopOri: function () {
    var audioContextOri = this.data.audioContextOri
    audioContextOri.stop()
  },

  showMore: function (e) {
    var that = this
    var currData = e.currentTarget.dataset
    var index = currData.idx
    var res_records = this.data.res_records
    var master_id = res_records[index]["master_id"]
    var isSelf = false
    if (master_id == App.globalData.openid) isSelf = true
    //console.log(isSelf)
    //console.log(res_records[index])
    if (res_records[index]["btnRt"] == "rt-90") {
      res_records[index]["boxStyle"] = "btn-play-box"
      res_records[index]["btnRt"] = ""
      if (isSelf) {
        res_records[index]["btnDelStyle"] = "btn-red-hidden"
      } else {
        res_records[index]["btnPoiStyle"] = "btn-red-hidden"
      }
    } else {
      res_records[index]["boxStyle"] = "btn-play-box-sm"
      res_records[index]["btnRt"] = "rt-90"
      if (isSelf) {
        res_records[index]["btnDelStyle"] = "btn-red"
      } else {
        res_records[index]["btnPoiStyle"] = "btn-red"
      }
    }
    that.setData({
      res_records
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
    var audioContextMine = this.data.audioContextMine
    var tempFile = this.data.tempFile
    if (tempFile != undefined) {
      console.log(tempFile.tempFilePath)
      audioContextMine.src = tempFile.tempFilePath
      if (!this.data.isPlaying) {
        audioContextMine.play()
        this.setData({
          isPlaying: true,
          recordFile: tempFile.tempFilePath
        })
      } else {
        audioContextMine.stop()
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
    var that = this
    var currData = e.currentTarget.dataset
    var record_id = currData.record_id
    var index = currData.idx
    wx.showModal({
      title: '删除录音?',
      content: '不可逆操作,请再次确认',
      confirmText: "确认",
      cancelText: "取消",
      success: function (res) {
        //console.log(res);
        if (res.confirm) {
          var res_records = that.data.res_records
          res_records.splice(index, 1)
          that.setData({ res_records })
          that.delMine(record_id)
        } else {
          //console.log('用户点击辅助操作')
        }
      }
    });
  },

  delCommConfirm: function (e) {
    var that = this
    var currData = e.currentTarget.dataset
    var comm_id = currData.cid
    var index = currData.idx
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
    var that = this
    var currData = e.currentTarget.dataset
    var record_id = currData.record_id
    var index = currData.idx
    var res_records = this.data.res_records
    var src_record = res_records[index]["src_record"]
    var audioContextMaster = this.data.audioContextMaster
    if (!src_record) return
    if (res_records[index]["isListen"]) {
      res_records[index]["isListen"] = false
      res_records[index]["listenStatus"] = "listen-off"
      res_records[index]["anListen"] = ""
      audioContextMaster.stop()
    } else {
      that.setMasterStop()
      res_records[index]["isListen"] = true
      res_records[index]["listenStatus"] = "listen-on"
      res_records[index]["anListen"] = "an-listen-on"
      console.log(index, src_record)
      audioContextMaster.src = src_record
      that.setData({
        listenIndex: index
      })
      audioContextMaster.play()
    }
    this.setData({
      res_records
    })
  },

  //--点心--
  updateHeart: function (e) {
    var that = this
    var currData = e.currentTarget.dataset
    var status = currData.status
    var openid = App.globalData.openid
    var user_id = openid
    var type = ""
    var index = currData.idx
    var res_records = this.data.res_records
    var curr_master = res_records[index]
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
    var record_id = curr_master["record_id"]
    wx.cloud.callFunction({
      name: 'updateHeart',
      data: { record_id, user_id, type },
      success: res => {
        console.log(res)
        that.setData({ res_records })
      }
    })
  },

  // 上传录音
  uploadRecord: function () {
    var that = this
    var recordFile = this.data.recordFile
    console.log("recordFile:")
    console.log(recordFile)
    var master_id = App.globalData.openid
    var fileId = this.data.fileId
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
    var openid = App.globalData.openid
    var user_id = openid
    var that = this
    var currData = e.currentTarget.dataset
    var index = currData.idx
    var res_records = this.data.res_records
    this.clearInput()
    if (res_records[index]["mon"] == "comment-show") {
      res_records[index]["mon"] = "comment-hide"
      res_records[index]["comm_word"] = res_records[index]["comm"]
      that.setData({ res_records })
    } else {
      res_records[index]["mon"] = "comment-show"
      res_records[index]["comm_word"] = "收起"
      const record_id = res_records[index]["record_id"]
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
          res_records[index]["comments"] = comments
          that.setData({ res_records })
        }
      })
    }
  },
  addComment: function (e) {
    var that = this
    const content = e.detail.value
    var currData = e.currentTarget.dataset
    var index = currData.idx
    var res_records = this.data.res_records
    for (let v of res_records) {
      v["focus"] = false
      v["holder"] = "输入文字"
    }
    const master = res_records[index]
    const record_id = master.record_id
    const master_id = master.master_id
    const fileId = master.fileId
    var openid = App.globalData.openid
    var user_id = openid
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
        res_records[index]["comments"] = comments
        res_records[index]["comm"] = comments.length
        res_records[index]["inputValue"] = ""
        wx.hideLoading()
        that.setData({ res_records })
      }
    })

  },
  reply: function (e) {
    var that = this
    var currData = e.currentTarget.dataset
    const index = currData["idx"]
    const re_id = currData["cid"]
    const re_name = currData["name"]
    const re_content = currData["content"]
    var res_records = this.data.res_records
    this.clearInput()
    res_records[index]["holder"] = "回复:" + re_name
    res_records[index]["focus"] = true
    that.setData({ res_records, re_id, re_name, re_content })

  },
  clearInput: function () {
    var res_records = this.data.res_records
    for (let v of res_records) {
      v["focus"] = false
      v["holder"] = "输入文字"
    }
    const re_id = ''
    const re_name = ''
    const re_content = ''
    this.setData({ res_records, re_id, re_name, re_content })
  },
  delComment: function (index, comm_id) {
    var openid = App.globalData.openid
    var user_id = openid
    var that = this
    var res_records = this.data.res_records
    this.clearInput()
    const record_id = res_records[index]["record_id"]
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
        res_records[index]["comments"] = comments
        res_records[index]["comm"] = comments.length
        wx.hideLoading()
        that.setData({ res_records })
      }
    })
  },

  //--留言点赞--
  updateZan: function (e) {
    var that = this
    var currData = e.currentTarget.dataset
    const idx = currData["idx"]
    const midx = currData["midx"]
    const id = currData["cid"]
    var openid = App.globalData.openid
    var user_id = openid
    var res_records = this.data.res_records
    var zans = res_records[idx]["comments"][midx]["zans"]
    var zid = zans.includes(user_id)
    var type = ''
    if (zid) {
      type = 'pull'
      res_records[idx]["comments"][midx]["zanShape"] = src_zan_em
      let dx = res_records[idx]["comments"][midx]["zans"].indexOf(user_id)
      res_records[idx]["comments"][midx]["zans"].splice(dx, 1)
    } else {
      type = 'push'
      res_records[idx]["comments"][midx]["zanShape"] = src_zan_fu
      res_records[idx]["comments"][midx]["zans"].push(user_id)
    }
    wx.cloud.callFunction({
      name: 'updateZan',
      data: { id, user_id, type },
      success: res => {
        console.log(res)
        that.setData({ res_records })
      }
    })
  },

  showOther: function () {
    var show_other = !this.data.show_other
    this.setData({
      show_other
    })
  },

  reload: function (e) {
    var currData = e.currentTarget.dataset
    var fileId = currData.fid
    console.log(fileId)

    var _url = '../detail/detail?fileId=' + fileId
    wx.redirectTo({
      url: _url
    })
  },
  onShareAppMessage() {
    return {
      title: '阴阳师·式神台词语音',
      path: '/pages/index/index',
    }
  }

})