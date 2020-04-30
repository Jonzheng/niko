const COS = require('./lib/cos-sdk.js')
const Cos = new COS({
  SecretId: 'AKIDtfGm8pIo1Ur57BCE7vJ9tgVFVdaab45x',
  SecretKey: 'AOSVQEvvpaFl8OU3Yv8B5pPo0SDzfFi2',
})
const AvatarBucket = 'avatar-1256378396'
const Region = 'ap-guangzhou'

App({
  onLaunch: function () {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    // iPhone X 设置
    this.setIpx()

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              let userInfo = res.userInfo
              console.log(userInfo)
              this.globalData.userInfo = userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        } else{
          // 登录-resgist
          wx.login({
            success: res => {
              // 发送 res.code 到后台换取 openId, sessionKey, unionId
              console.log(res)
            }
          })
        }
      }
    })
  },
  setIpx() {
    this.globalData.sysInfo = wx.getSystemInfoSync();
    this.globalData.isIpx = this.globalData.sysInfo.model.includes('iPhone 11') || this.globalData.sysInfo.model.includes('iPhone X') || this.globalData.sysInfo.model.includes('unknown<iPhone')
  },
  uploadToCos(filename, filePath) {
    return Cos.postObject({
      Bucket: AvatarBucket,
      Region: Region,
      Key: filename,
      FilePath: filePath,
      onProgress: function (info) {
        console.log(JSON.stringify(info));
      }
    }, function (err, data) {
      console.log(err || data);
    })
  },
  uploadAvatar(filename, filePath) {
    return new Promise((resolve, reject) =>{
      Cos.postObject({
        Bucket: AvatarBucket,
        Region: Region,
        Key: filename,
        FilePath: filePath,
        onProgress: function (info) {
          // console.log(JSON.stringify(info))
        }
      }, function (err, data) {
        if (err){
          reject(err)
        }else{
          resolve(data)
        }
      })
    })
  },
  globalData: {
    isIpx: false,
    userInfo: null
  }
})