const App = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isIpx: App.globalData.isIpx,
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
    this.init()
    this.getRecords()
    // this.setBgColor()
  },

  onReady: function () {

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

  init() {
    this.setData({
      hasLogin: App.globalData.hasLogin,
      userInfo: App.globalData.userInfo,
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
    this._it2 = setTimeout(()=>{
      this.setData({
        requesting: false
      })
    }, 666)
  },
  // 加载更多
  more() {
    console.log('-the end-')
    // this.getList();
  },
  setMotto() {
    let motto = 'Hello you!'
    this._it0 = setTimeout(() => {
      if (!this.data.hasLogin) return
      this.setData({
        motto: 'Hello'
      })
      this._it1 = setTimeout(() => {
        this.setData({
          motto
        })
      }, 1000)
    }, 500)
  },

  initRecords(recordList) {
    for (let record of recordList) {
      record["listenStatus"] = "listen-off"
      record["boxStyle"] = "btn-play-box"
      record["btnDelStyle"] = "btn-red-hidden"
      record["btnPoiStyle"] = "btn-red-hidden"
      record["btnRt"] = ""
      record["dateStr"] = formatDate(record.c_date)
      record["isMine"] = record.master_id == App.globalData.openid
      if (record.heart_ud) {
        record["heartShape"] = heartOn
        record["heartStatus"] = 1
      } else {
        record["heartShape"] = heartOff
        record["heartStatus"] = 0
      }
      record["isListen"] = false
    }
    this.setData({
      recordList: recordList,
    })
  },

  getRecords(){

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

  toDetail() {
    wx.navigateTo({
      url: '../detail/detail',
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
  // setMotto() {
  //   let motto = !this._motto ? '纵然疾风起、人生不言弃' : ''
  //   this._motto = !this._motto
  //   this.setData({
  //     isMine: !this.data.isMine,
  //     motto
  //   })
  // },
  uploadAvatar() {
    let avatar = this.data.userInfo.avatarUrl
    console.log(avatar)
  },
})