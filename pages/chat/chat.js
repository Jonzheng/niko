const App = getApp()
const { trim, host, formatDate } = require('../../utils/util')
Page({

  data: {
    inputPh: '',
    inputValue: '',
    msgList: []
  },

  onLoad: function (options) {
    console.log('------', options)
    this._userId = options.userId
    this._mineId = App.globalData.openid
    this.queryChatList()
    console.log(App.globalData.sysInfo)
    let boxHeight = App.globalData.sysInfo.safeArea.height - 80
    this.setData({ boxHeight })
  },

  onReady: function () {
    
  },

  onShow: function () {

  },

  onHide: function () {

  },

  onUnload: function () {

  },

  onPullDownRefresh: function () {

  },

  onReachBottom: function () {

  },

  initMessageList(msgList){
    msgList.map((it, idx)=>{
      it.isMe = it.master_id == this._mineId
      let pre = msgList[idx - 1]
      it.desc = formatDate(it.c_date)
      if (pre && new Date(it.c_date).getTime() / 1000 - new Date(pre.c_date).getTime() / 1000 < 600) {
        it.desc = ''
      }
    })
    console.log('--msgList:', msgList)
    let toLast = `item${msgList.length}`
    this.setData({ msgList })
    setTimeout(()=>{
      console.log('--toLast', toLast)
      this.setData({ toLast })
    }, 30)
  },
  queryChatList(){
    let recordId = 'chat'
    let userId = this._userId
    let masterId = this._mineId
    wx.request({
      url: `${host}/queryChat`,
      method: 'post',
      data: { recordId, userId, masterId },
      success: (res) => {
        console.log(res)
        if (res) {
          let list = res.data
          this.initMessageList(list)
        }
      },
      complete: ()=>{
        this.setData({ inFocus:true })
      }
    })
  },
  clearInput(){
    this.setData({ inputValue: '' })
  },
  confirmInput(e) {
    let detail = e.detail
    let content = detail.value || ''
    if (!content) return;
    let recordId = 'chat'
    let fileId = 'chat'
    let masterId = this._mineId
    let userId = this._userId
    wx.request({
      url: `${host}/saveChat`,
      method: 'POST',
      data: { recordId, masterId, fileId, userId, content},
      success: (res)=> {
        if (res && res.data && res.data.code == 87014) {
          let content = res.data.data
          wx.showModal({
            title: '送信失败',
            content,
          })
        } else {
          let list = res.data
          this.initMessageList(list)
          this.clearInput()
        }
      }
    });
  },

  delMessage(e){
    let commId = e.currentTarget.dataset.id
    let masterId = this._mineId
    let userId = this._userId
    wx.request({
      url: `${host}/deleteMessage`,
      method: 'post',
      data: { commId, userId, masterId },
      success: (res) => {
        console.log(res)
        if (res) {
          let list = res.data
          this.initMessageList(list)
        }
      }
    })
  },
  setDelMode(e){
    let midx = e.currentTarget.dataset.midx
    let date = e.currentTarget.dataset.date
    let delMode = (new Date().getTime() / 1000 - new Date(date).getTime() / 1000 < 300)
    if (!delMode) return wx.vibrateShort();
    this.setData({
      midx,
      delMode
    })
  },
  delModeOff(){
    this.setData({ delMode: false })
  },

})