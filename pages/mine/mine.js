const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isIpx: app.globalData.isIpx,
    hasLogin: false,
    userInfo: {},
    bg: '../../images/bg-0.png',
    detaultAvatar: '../../images/de-avatar.png',
    motto: '',
    isMine: false,
    avatarUrl: 'https://avatar-1256378396.cos.ap-guangzhou.myqcloud.com/n_cm_0.png',
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.init()
    // this.setBgColor()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.setMotto()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    clearTimeout(this._it0)
    clearTimeout(this._it1)
    // this.setBgColor()
    this.setData({
      motto: ''
    })
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  /**
   * 自定函数
   */

  init() {
    this.setData({
      hasLogin: app.globalData.hasLogin,
      userInfo: app.globalData.userInfo,
    })
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

  getUserInfo: function (e) {
    let userInfo = e.detail.userInfo
    app.initAvatar(userInfo).then(data=>{
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