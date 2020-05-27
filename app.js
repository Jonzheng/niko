const COS = require('./lib/cos-sdk.js')
const { host } = require('./utils/util')

const Cos = new COS({
  SecretId: 'AKIDtfGm8pIo1Ur57BCE7vJ9tgVFVdaab45x',
  SecretKey: 'AOSVQEvvpaFl8OU3Yv8B5pPo0SDzfFi2',
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
            if (res && res.data){
              let userInfo = res.data[0]
              this.globalData.userInfo = userInfo
              this.globalData.openid = userInfo.openid
            }
          }
        })
      }
    })

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              console.log('success.globalData.hasLogin')
              this.globalData.hasLogin = true
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
  initAvatar(userInfo){
    return new Promise((resolve, reject)=>{
      let { avatarUrl } = userInfo
      avatarUrl = avatarUrl ? avatarUrl : userInfo.avatar_url
      let openid = this.globalData.openid
      wx.downloadFile({
        url: avatarUrl,
        success: res => {
          let { tempFilePath } = res
          let filename = `${openid}.png`
          this.uploadAvatar(filename, tempFilePath).then(data => {
            this.globalData.hasLogin = true
            let location = data.Location
            avatarUrl = `https://${location}`
            console.log(data)
            userInfo['avatarUrl'] = avatarUrl
            userInfo['avatar_url'] = avatarUrl
            userInfo['nick_name'] = userInfo.nickName
            resolve(userInfo)
            this.updateUser(userInfo)
          })
        },
        fail: err=>{
          console.log('download avatar fail!!!', err)
          userInfo['avatarUrl'] = ''
          userInfo['avatar_url'] = ''
          // this.updateUser(userInfo)
        }
      })
    })
  },
  updateUser(userInfo){
    userInfo['openid'] = this.globalData.openid
    wx.request({
      method: 'post',
      url: `${host}/updateUser`,
      data: userInfo,
      success: res => {
        console.log(res)
      }
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
  globalData: {
    Cos,
    isIpx: false,
    admini: false,
    userInfo: null
  }
})