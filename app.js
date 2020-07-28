const COS = require('./lib/cos-sdk.js')
const { host } = require('./utils/util')

const Cos = new COS({
  SecretId: 'AKIDWibBTXGkvtZx6yIqtfCPLzLYP5ORQlrg',
  SecretKey: 'f2B2ZolRouiETQFeCSQ6UbVKjtuLUWHl',
})
const AvatarBucket = 'avatar-1256378396'
const RecordBucket = 'record-1256378396'
const Region = 'ap-guangzhou'

App({
  onLaunch: function () {
    // 检查更新
    this.checkUpdate();
    // iPhone X 设置
    this.setIpx()
    this.initOpenid()
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              console.log('auth hasLogin', res.userInfo)
              this.globalData.hasLogin = true
              this.globalData.avatarUrl = res.userInfo.avatarUrl
              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        } else{
          console.log('false:!')
          this.globalData.hasLogin = false
        }
      }
    })
  },
  setIpx() {
    this.globalData.sysInfo = wx.getSystemInfoSync();
    this.globalData.isIpx = this.globalData.sysInfo.model.includes('iPhone 11') || this.globalData.sysInfo.model.includes('iPhone X') || this.globalData.sysInfo.model.includes('unknown<iPhone')
  },
  toPage(url) {
    let pages = getCurrentPages();
    if (pages.length > 9) {
      wx.redirectTo({ url })
    } else {
      wx.navigateTo({ url })
    }
  },
  checkUpdate() {
    try {
      let updateManager = wx.getUpdateManager()
      console.log('========== checkUpdate ==========')
      updateManager.onCheckForUpdate(res => {
        console.log('========== onCheckForUpdate called ==========', res)
        if (res.hasUpdate) {
          wx.showToast({
            icon: 'none',
            title: '小程序需要更新'
          })
        }
      })
      updateManager.onUpdateReady(() => {
        console.log('========== onUpdateReady called ==========')
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，即将进行更新',
          showCancel: false,
          success: res => {
            updateManager.applyUpdate()
          }
        })
      })
    } catch (e) {
      console.log('========== checkUpdate failed ==========', e)
    }
  },
  initOpenid() {
    return new Promise((resolve, reject) => {
      if (this.globalData.openid){
        return resolve(this.globalData.openid)
      }
      // 登录-后台注册或更新登录时间
      wx.login({
        success: res => {
          // 发送 res.code 到后台换取 openId, sessionKey, unionId
          let userCode = res.code
          console.log(res)
          wx.request({
            method: 'post',
            url: `${host}/regist`,
            data: { userCode: userCode },
            success: res => {
              if (res && res.data) {
                let userInfo = res.data[0]
                this.globalData.userInfo = userInfo
                this.globalData.openid = userInfo.openid
                return resolve(userInfo.openid)
              }
            },
            fail: (err)=>{
              reject(err)
            }
          })
        }
      })
    })
  },
  initAvatar(userInfo){
    console.log('initAvatar', userInfo)
    return new Promise((resolve, reject)=>{
      let { avatarUrl } = userInfo
      avatarUrl = avatarUrl || this.globalData.avatarUrl
      userInfo['nickName'] = userInfo.nickName || userInfo.nick_name
      userInfo['nick_name'] = userInfo.nickName
      userInfo['showName'] = userInfo.show_name
      let openid = userInfo.openid || this.globalData.openid
      openid = openid || new Date().getTime()
      wx.downloadFile({
        url: avatarUrl,
        success: res => {
          console.log(res)
          let { tempFilePath } = res
          let filename = `${openid}.png`
          this.uploadAvatar(filename, tempFilePath).then(data => {
            this.globalData.hasLogin = true
            let location = data.Location
            avatarUrl = `https://${location}`
            userInfo['avatarUrl'] = avatarUrl
            userInfo['avatar_url'] = avatarUrl
            this.updateUser(userInfo).then((res)=>{
              resolve(res)
            })
          })
        },
        fail: err=>{
          console.log('download avatar fail!!!', err)
        }
      })
    })
  },
  updateUser(userInfo){
    return new Promise((resolve, reject) => {
      userInfo['openid'] = userInfo.openid || this.globalData.openid
      wx.request({
        method: 'post',
        url: `${host}/updateUser`,
        data: userInfo,
        success: res => {
          userInfo = res.data[0]
          resolve(userInfo)
        }
      })
    })
  },
  uploadRecord(filename, filePath) {
    return Cos.postObject({
      Bucket: RecordBucket,
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
  cosDelete(recordId){
    let filename = `${recordId}.mp3`
    Cos.deleteObject({
      Bucket: RecordBucket,
      Region: Region,
      Key: filename
    }, function (err, data) {
      console.log(err || data);
    });
  },
  getHeartSrc() {
    return new Promise((resolve, reject) => {
      let url = 'https://systems-1256378396.cos.ap-guangzhou.myqcloud.com/ds_heart.wav'
      if (this.globalData.downCount > 3){
        resolve(url)
        return
      }
      let heartSrc = wx.getStorageSync('heartSrc')
      console.log('heartSrc:', this.globalData.downCount, !heartSrc, heartSrc)
      if (!heartSrc) {
        wx.downloadFile({
          url: url,
          success: (res) => {
            if (res && res.tempFilePath) {
              let fs = wx.getFileSystemManager()
              heartSrc = res.tempFilePath
              wx.setStorageSync('heartSrc', heartSrc)
              resolve(heartSrc)
            }
          },
          fail: (err)=>{
            console.log(err)
          }
        })
      } else { // 判断缓存文件是否可用
        wx.getFileInfo({
          filePath: heartSrc,
          complete: (info) => {
            if (info && info.size > 0){
              resolve(heartSrc)
            }else{
              wx.setStorageSync('heartSrc', false)
              this.globalData.downCount += 1
              this.getHeartSrc()
            }
          }
        })
      } // end 判断缓存文件是否可用
    })
  },
  globalData: {
    Cos,
    isIpx: false,
    admini: false,
    downCount: 0,
    userInfo: null,
    hideCircle: false,
    needReload: true
  }
})