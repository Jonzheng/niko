const App = getApp()
const { host } = require('../../utils/util')

Page({

  data: {
    showName: '',
    motto: ''
  },

  onLoad: function (options) {
    let { showName, motto } = options
    this._showName = showName
    this._motto = motto
    this.setData({
      showName,
      motto
    })
  },

  onReady: function () {

  },

  onShow: function () {

  },

  onHide: function () {
    wx.hideLoading()
  },

  onUnload: function () {

  },

  onPullDownRefresh: function () {

  },

  onReachBottom: function () {

  },
  setName(e){
    let showName = e.detail.value.trim()
    this.setData({
      showName
    })
  },
  setMotto(e){
    let motto = e.detail.value.trim()
    this.setData({
      motto
    })
  },

  updateProfile() {
    let openid = App.globalData.openid
    let showName = this.data.showName
    let motto = this.data.motto
    if (this._showName == showName && motto == this._motto){
      wx.navigateBack()
      return
    }
    let content = showName + motto
    wx.showLoading({
      icon: 'none',
      title: '正在保存...',
    })
    wx.request({
      method: 'post',
      url: `${host}/updateProfile`,
      data: { openid, showName, motto, content },
      success: res => {
        wx.hideLoading()
        if (res && res.data && res.data.code == 87014) {
          wx.showModal({
            title: '保存失败',
            content: res.data.data,
          })
        }else{
          App.globalData.showName = showName
          App.globalData.motto = motto
          wx.navigateBack()
        }
      }
    })
  },
  back() {
    wx.navigateBack()
  },

})