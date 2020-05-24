const App = getApp()
const { host, formatDate } = require('../../utils/util')
const tops = {
  "news": { api: "queryNews", idx: 0, total: 30 },
  "heart": { api: "queryHeart", idx: 1, total: 30 },
  "follow": { api: "queryFollow", idx: 2, total: 0 },
  "fans": { api: "queryFans", idx: 3, total: 0 },
  }
const levels = [ "news", "heart", "follow", "fans" ]
const pageStart = 1

Page({

  data: {
    isIpx: App.globalData.isIpx,
    bg: '../../images/bg-0.png',
    tabData: [],
    tabCur: 0,
    size: 90,
    color: "#4a5fe2",
    requesting: false,
    end: false,
    emptyShow: false,
    pageNo: pageStart,
    level: 'news',
    list: [],
    scrollTop: null,
    enableBackToTop: true,
    refreshSize: 0,
    topSize: 0,
    bottomSize: 220,
  },

  onLoad: function (options) {
    console.log('onLoad:', options)
    let { level, news, heartCount, followCount, fansCount } = options
    news = news ? '+'+news : '+0'
    const tabData = [
      { value: "news", name: "通知", count: news},
      { value: "heart", name: "获赞", count: heartCount},
      { value: "follow", name: "关注", count: followCount},
      { value: "fans", name: "粉丝", count: fansCount},
    ]
    tops['follow'].total = followCount
    tops['fans'].total = fansCount
    this._level = level
    this.setData({
      isIpx: App.globalData.isIpx,
      level,
      total: tops[level].total,
      tabCur: tops[level].idx,
      heartCount,
      followCount: parseInt(followCount),
      fansCount,
      tabData
    })
    this.getList('reflash', pageStart, level)
  },

  onReady: function () {

  },

  onShow: function (options) {
    console.log('onShow:', options)
  },

  onHide: function () {
    wx.hideNavigationBarLoading()
  },

  onUnload: function () {

  },

  onPullDownRefresh: function () {

  },

  onReachBottom: function () {

  },

  onShareAppMessage: function () {

  },
  back() {
    wx.navigateBack()
  },
  toDetail(e) {
    let fileId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `../detail/detail?fileId=${fileId}`,
    })
  },
  toPerson(e) {
    let masterId = e.currentTarget.dataset.uid
    if (masterId == App.globalData.openid) return
    wx.navigateTo({
      url: `../person/person?masterId=${masterId}`,
    })
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
    let level = this._level
    let pageNo = this.data[`${level}Page`]
    this.getList('more', pageNo, level);
  },
  follow(e, followId='', idx=-1) {
    let suffix = (e == 'unFollow') ? e : 'follow'
    let openid = App.globalData.openid
    followId = followId ? followId : e.currentTarget.dataset.uid
    idx = idx > -1 ? idx : e.currentTarget.dataset.idx
    let followCount = this.data.followCount
    followCount = (suffix == 'follow') ? followCount + 1 : followCount - 1
    let tabData = this.data.tabData
    tabData[2]['count'] = followCount
    let level = this._level
    if (level == 'follow'){
      let followList = this.data.followList
      followList[idx]['both'] = (suffix == 'follow') ? 1 : 0
      this.setData({
        tabData,
        followCount,
      })
    } else if (level == 'fans'){
      let fansList = this.data.fansList
      fansList[idx]['both'] = (suffix == 'follow') ? 1 : 0
      this.setData({
        tabData,
        followCount,
        fansList
      })
    }
    this._reload = true
    wx.request({
      url: `${host}/${suffix}`,
      method: 'post',
      data: { openid, followId },
      success: (res) => {
        console.log(res)
        if (level == 'follow'){
          this.getList('refresh', pageStart, level);
        }
      }
    })
  },
  unFollow(e) {
    console.log(e.currentTarget.dataset)
    let followId = e.currentTarget.dataset.uid
    let idx = e.currentTarget.dataset.idx
    wx.showActionSheet({
      itemList: ['取消关注'],
      success: (res) => {
        if (res.tapIndex == 0) {
          this.follow('unFollow', followId, idx)
        }
      }
    })
  },
  initList(list, type, pageNo, level) {
    list.map((item) => {
      item["level"] = level
      item["dateStr"] = formatDate(item.c_date)
      if (item.content){
        let pre = item.content.substr(0, 7)
        pre = (item.content.length > 5) ? pre + '...' : pre
        item['pre'] = pre
      }
      if (item.file_id) {
        let sps = item.file_id.split('_')
        let fname = sps[0] + '_' + sps[1] + '_0.png'
        item['skCover'] = `https://image-1256378396.cos.ap-guangzhou.myqcloud.com/${fname}`
      }
    })
    if ('news' == level) {
      list.sort((a, b)=>{return b.times - a.times})
      let newsList = type === 'more' ? this.data.newsList.concat(list) : list
      this.setData({
        newsPage: pageNo + 1,
        end: true,
        list: newsList,
        newsList
      })
      this._newsEnd = true
    } else if ('heart' == level) {
      let heartList = type === 'more' ? this.data.heartList.concat(list) : list
      this.setData({
        heartPage: pageNo + 1,
        end: true,
        list: heartList,
        heartList
      })
      this._heartEnd = true
    } else if ('follow' == level) {
      let followList = type === 'more' ? this.data.followList.concat(list) : list
      this.setData({
        followPage: pageNo + 1,
        end: followList.length >= this.data.followCount,
        list: followList,
        followList
      })
      this._followEnd = followList.length >= this.data.followCount
    } else if ('fans' == level) {
      let fansList = type === 'more' ? this.data.fansList.concat(list) : list
      this.setData({
        fansPage: pageNo + 1,
        end: fansList.length >= this.data.fansCount,
        list: fansList,
        fansList
      })
      this._fansEnd = fansList.length >= this.data.fansCount
    }
  },
  getList(type, pageNo, level = '') {
    wx.showNavigationBarLoading()
    level = level ? level : this.data.level
    let suffix = tops[level].api
    let openid = App.globalData.openid
    console.log({ level: level, pageNo: pageNo })
    wx.request({
      url: `${host}/${suffix}`,
      method: 'post',
      data: { openid, pageNo },
      complete: (res)=> {
        wx.hideNavigationBarLoading()
        if (res && res.data) {
          let data = res.data
          this.initList(data, type, pageNo, level)
        }
        // 请求完成都会执行
        this.setData({
          requesting: false,
        })
      }
    })
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
  tabChange: function (e) {
    let { index, value } = e.detail
    let level = value
    if (level == this._level) {
      wx.vibrateShort()
      this.toTop()
      return;
    }
    let end = this[`_${level}End`]
    end = end ? end : false
    console.log(index, level, end)
    this.setData({
      total: tops[level].total,
      empty: false,
      end,
      level
    })
    this._level = level
    if (!this.data[`${level}List`] || this._reload) {
      this._reload = false
      this.getList('refresh', pageStart, level);
    }
  },
})