const App = getApp()
const { trim, host } = require('../../utils/util')

const pageStart = 1
const tabData = [
  { value: "m",name: "罗德岛"},
  { value: "sp", name:"SP"},
  { value: "ssr",name: "SSR"},
  { value: "sr",name: "SR"},
  { value: "r",name: "R"},
  { value: "n",name: "N"}
]
Page({

  data: {
    isIpx: App.globalData.isIpx,
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    tabData: tabData,
    tabCur: 2,
    size: 90,
    color: "#4a5fe2",
    loadingImg: "../../images/loading1.gif",
    requesting: false,
    end: false,
    emptyShow: false,
    pageNo: pageStart,
    level: 'ssr',
    list: [],
    scrollTop: null,
    enableBackToTop: true,
    refreshSize: 0,
    topSize: 90,
    bottomSize: 0,
    hideCircle: true,
    fakeHide: true
  },

  onLoad: function (options) {
    this.init()
    this.getList('refresh', pageStart);
    console.log(App.globalData)
    this._indexTab = true
  },

  onReady: function () {

  },

  onShow: function () {
    App.globalData.hasUpdate = false
    App.globalData.downCount = 0
    wx.hideNavigationBarLoading()
    wx.setNavigationBarTitle({
      title: '式神录',
    })
    this.setData({ hideCircle: App.globalData.hideCircle })
    if (this._stHide > -1) clearTimeout(this._stHide)
  },

  onHide: function () {
    this._indexTab = false
    this._stHide = setTimeout(()=>{
      wx.hideNavigationBarLoading()
      this.setData({ hideCircle: true })
    }, 900)
  },

  /**
   * 点击当前tab时触发
   */
  onTabItemTap: function (e) {
    if (this._indexTab){
      this.toTop();
      wx.vibrateShort();
    }
    console.log(e)
    this._indexTab = true
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
    return {
      title: '阴阳师·式神台词&模仿录音',
      path: '/pages/index/index',
    }
  },

  /**
   * 自定函数
   */

  init() {
    if (App.globalData.userInfo) {
      this.setData({
        userInfo: App.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      App.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          App.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  
  // 刷新数据
  refresh() {
    this.setData({
      requesting: true,
      empty: false,
      end: false,
    })
    this.getList('refresh', pageStart);
  },
  // 加载更多
  more() {
    this.setData({
      requesting: true
    })
    let { level } = this.data
    let pageNo = this.data[`${level}Page`]
    this.getList('more', pageNo, level);
  },

  getList(type, pageNo, level='') {
    if(this._lockQuery) return
    this._lockQuery = true
    wx.showNavigationBarLoading()
    wx.setNavigationBarTitle({
      title: '加载中...',
    })
    level = level ? level : this.data.level
    console.log({ level: level, pageNo: pageNo })
    wx.request({
      url: `${host}/queryList/merge`,
      method: 'post',
      data: { level: level, pageNo: pageNo},
      complete: (res)=> {
        this._lockQuery = false
        this.setData({ spin: false })
        setTimeout(()=>{
          this.setData({ spin: true })
          wx.hideNavigationBarLoading()
          wx.setNavigationBarTitle({
            title: '式神录',
          })
        }, 600)
        if (res && res.data){
          let data = res.data
          data['type'] = type
          data['pageNo'] = pageNo
          data['level'] = level
          this.initList(data)
        }
        // 请求完成都会执行
        this.setData({
          requesting: false,
        })
      }
    })
  },

  initItem(list, names) {
    let items = []
    for (let name of names) {
      let item = {}
      let sers = []
      let first = {}
      for (let v of list) {
        if (v.s_name == name) {
          let pure = trim(v.serifu).replace(/[　]+/g, "")
          if (!first.serifu || pure.length > trim(first.serifu).length) first = v
          sers.push(pure)
        }
      }
      item = first
      item['c_name'] = item.title.split('_')[0]
      sers = Array.from(new Set(sers))
      sers.sort((a, b) => b.length - a.length)
      item['sers'] = sers
      items.push(item)
    }
    return items
  },

  initList(data){
    let { total, list, names, type, pageNo, level } = data
    let items = this.initItem(list, names)
    console.log(items)
    let fakeHide = (list.length > 0 && list[0].clicks == 110)
    App.globalData.fakeHide = fakeHide
    this.setData({ fakeHide })
    if ('sp' == level){
      let spList = type === 'more' ? this.data.spList.concat(items) : items
      this.setData({
        spPage: pageNo + 1,
        end: spList.length >= total,
        list: spList,
        spList
      })
      console.log(this.data)
      this._spEnd = spList.length >= total
    } else if('ssr' == level){
      let ssrList = type === 'more' ? this.data.ssrList.concat(items) : items
      this.setData({
        ssrPage: pageNo + 1,
        end: ssrList.length >= total,
        list: ssrList,
        ssrList
      })
      this._ssrEnd = ssrList.length >= total
    } else if('sr' == level){
      let srList = type === 'more' ? this.data.srList.concat(items) : items
      this.setData({
        srPage: pageNo + 1,
        end: srList.length >= total,
        list: srList,
        srList
      })
      this._srEnd = srList.length >= total
    } else if('r' == level){
      let rList = type === 'more' ? this.data.rList.concat(items) : items
      this.setData({
        rPage: pageNo + 1,
        end: rList.length >= total,
        list: rList,
        rList
      })
      this._rEnd = rList.length >= total
    } else if('n' == level){
      let nList = type === 'more' ? this.data.nList.concat(items) : items
      this.setData({
        nPage: pageNo + 1,
        end: nList.length >= total,
        list: nList,
        nList
      })
      this._nEnd = nList.length >= total
    } else if('m' == level){
      let mList = type === 'more' ? this.data.mList.concat(items) : items
      this.setData({
        mPage: pageNo + 1,
        end: mList.length >= total,
        list: mList,
        mList
      })
      this._mEnd = mList.length >= total
    }
  },

  getUserInfo(e) {
    console.log(e)
    App.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },

  toDetail(e){
    wx.vibrateShort()
    let fileId = e.currentTarget.dataset.id
    fileId = fileId.indexOf('sp_wxsn') > -1 ? 'sp_wxsn_0_0' : fileId
    let url = `../detail/detail?fileId=${fileId}`
    App.toPage(url)
  },
  tabChange(e) {
    wx.vibrateShort()
    let { index, value } = e.detail
    let level = value
    if (level == this._level) {
      this.toTop()
      return;
    }
    let end = this[`_${level}End`]
    end = end ? end : false
    console.log(index, level, end)
    this.setData({
      empty: false,
      end,
      level
    })
    this._level = level
    if (!this.data[`${level}List`]){
      this.getList('refresh', pageStart, level);
    }
  },
  toTop() {
    this.setData({
      scrollAnimation: true
    })
    setTimeout(() => {
      this.setData({
        scrollTop: 0,
      })
    }, 0)
  },
  toRecord(e) {
    wx.vibrateShort()
    this.setData({ hideCircle: true })
    let url = `../record/record`
    App.toPage(url)
  },
})