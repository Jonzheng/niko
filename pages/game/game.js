const App = new getApp()

const { host, deAvatar } = require('../../utils/util')
const pageStart = 1

const kana_a = [["kana_a", "a", "あ", "ア"], ["kana_a", "i", "い", "イ"], ["kana_a", "u", "う", "ウ"], ["kana_a", "e", "え", "エ"], ["kana_a", "o", "お", "オ"]]
const kana_ka = [["kana_ka", "ka", "か", "カ"], ["kana_ka", "ki", "き", "キ"], ["kana_ka", "ku", "く", "ク"], ["kana_ka", "ke", "け", "ケ"], ["kana_ka", "ko", "こ", "コ"]]
const kana_sa = [["kana_sa", "sa", "さ", "サ"], ["kana_sa", "shi", "し", "シ"], ["kana_sa", "su", "す", "ス"], ["kana_sa", "se", "せ", "セ"], ["kana_sa", "so", "そ", "ソ"]]
const kana_ta = [["kana_ta", "ta", "た", "タ"], ["kana_ta", "chi", "ち", "チ"], ["kana_ta", "tsu", "つ", "ツ"], ["kana_ta", "te", "て", "テ"], ["kana_ta", "to", "と", "ト"]]
const kana_na = [["kana_na", "na", "な", "ナ"], ["kana_na", "ni", "に", "ニ"], ["kana_na", "nu", "ぬ", "ヌ"], ["kana_na", "ne", "ね", "ネ"], ["kana_na", "no", "の", "ノ"]]
const kana_ha = [["kana_ha", "ha", "は", "ハ"], ["kana_ha", "hi", "ひ", "ヒ"], ["kana_ha", "fu", "ふ", "フ"], ["kana_ha", "he", "へ", "ヘ"], ["kana_ha", "ho", "ほ", "ホ"]]
const kana_ma = [["kana_ma", "ma", "ま", "マ"], ["kana_ma", "mi", "み", "ミ"], ["kana_ma", "mu", "む", "ム"], ["kana_ma", "me", "め", "メ"], ["kana_ma", "mo", "も", "モ"]]
const kana_ya = [["kana_ya", "ya", "や", "ヤ"], ["", "", "", ""], ["kana_ya", "yu", "ゆ", "ユ"], ["", "", "", ""], ["kana_ya", "yo", "よ", "ヨ"]]
const kana_ra = [["kana_ra", "ra", "ら", "ラ"], ["kana_ra", "ri", "り", "リ"], ["kana_ra", "ru", "る", "ル"], ["kana_ra", "re", "れ", "レ"], ["kana_ra", "ro", "ろ", "ロ"]]
const kana_wa = [["kana_wa", "wa", "わ", "ワ"], ["", "", "", ""], ["", "", "", ""], ["", "", "", ""], ["kana_wa", "wo", "を", "ヲ"]]
const kana_n = [["kana_n", "n", "ん", "ン"]]

const max_row = 11
const max_col = 8
const max_sed = 15
const least_sed = 10
const half_sed = 40
const totalStep = 80

const SrcYuku = 'https://link-1256378396.cos.ap-guangzhou.myqcloud.com/yuku_'
const SrcHshs = 'https://link-1256378396.cos.ap-guangzhou.myqcloud.com/hshs.wav'

import * as echarts from '../../modules/ec-canvas/echarts';

function setOption(chart, points, spends, golds) {
  let option = {
    color: ['rgba(255, 0, 0, 0.6)', 'rgba(0, 0, 255, 0.6)', 'rgba(255, 123, 0, 0.6)'],
    textStyle: {
      color: '#999'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {            // 坐标轴指示器，坐标轴触发有效
        type: 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
      },
      confine: true
    },
    legend: {
      data: ['分数', '耗时', '金币']
    },
    grid: {
      left: '5%',
      right: '12%',
      bottom: 25,
    },
    xAxis: [
      {
        type: 'category',
        data: ['10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%'],
        name: '排名',
        axisLabel: {
          align: 'left',
          fontSize: 10,
          interval: 0,
          rotate: 0
        }
      }
    ],
    yAxis: [
      {
        name: '人数',
        type: 'value',
        splitLine: {
          show: false
        },
        axisLabel: {
          show: false
        }
      }
    ],
    series: [
      {
        name: '分数',
        type: 'bar',
        data: points
      },
      {
        name: '耗时',
        type: 'bar',
        data: spends
      },
      {
        name: '金币',
        type: 'bar',
        data: golds
      },
    ]
  };
  chart.setOption(option);
}

Page({
  data: {
    isIpx: App.globalData.isIpx,
    bucket: [],
    this_lefts: [],
    this_rights: [],
    this_ups: [],
    this_downs: [],
    ks_sed: [],
    level: 1,
    spinCount: 0,
    icon_setting: "../../images/set.png",
    icon_omoz: 'https://systems-1256378396.cos.ap-guangzhou.myqcloud.com/omoz_sm.png',
    bgk_ori: [{ "key": "ka", "word": "か", "price": 100 }, { "key": "ki", "word": "き", "price": 1000 }, { "key": "ku", "word": "く", "price": 1000 }, { "key": "ke", "word": "け", "price": 1000 }, { "key": "ko", "word": "こ", "price": 10000 }],
    bgk: [{ "key": "ka", "word": "か", "price": 100 }, { "key": "ki", "word": "き", "price": 1000 }, { "key": "ku", "word": "く", "price": 1000 }, { "key": "ke", "word": "け", "price": 1000 }, { "key": "ko", "word": "こ", "price": 10000 }],
    myclst: [{ "key": "no", "word": "" }],
    bgc: { "no": "step-bg-no", "ka": "step-bg-ka", "ki": "step-bg-ki", "ku": "step-bg-ku", "ke": "step-bg-ke", "ko": "step-bg-ko" },
    cosmap: { "hira": "no", "kata": "no", "space": "no" },
    tip: '',
    tips: ['方块的颜色和假名都可以自由设定', '加油，手指！'],
    option: 1,
    top_hide: true,
    rank_hide: true,
    kana_hide: true,
    kon: true,
    skon: false,
    puzon: false,
    tipsPuzon: true,
    sakki_hira: "",
    sakki_kata: "",
    sakki_roma: "",
    show_price: 0,
    oldCoin: 0,
    subCoin: 0,
    try_idx: 0,
    color: "#4a5fe2",
    requesting: false,
    end: false,
    emptyShow: false,
    scrollTop: null,
    enableBackToTop: true,
    refreshSize: 0,
    topSize: 0,
    bottomSize: 220,
    showChart: false,
    ec: {
      lazyLoad: true
    }
  },

  onLoad(options) {
    if (!App.globalData.openid) {
      setTimeout(()=>{
        App.initOpenid().then(openid => {
          console.log('App.initOpenid():', openid)
          App.globalData.openid = openid
          this.onLoad()
        })
      }, 600)
      return
    }
    this._pageNo = pageStart
    this.setData({
      isIpx: App.globalData.isIpx,
      hasLogin: App.globalData.hasLogin,
      userInfo: App.globalData.userInfo
    }) 
    let openid = App.globalData.openid
    console.log('onLoad_openid', openid)
    this.initKanaRows()
    wx.request({
      url: `${host}/queryRank`,
      method: 'POST',
      data: { openid },
      success: (res) => {
        let rank = res.data
        if (rank) {
          let cosmap = this.data.cosmap
          let hira = rank.hira
          let kata = rank.kata
          let space = rank.space
          cosmap["hira"] = hira ? hira : 'ka'
          cosmap["kata"] = kata ? kata : 'ka'
          cosmap["space"] = space ? space : 'ke'
          this.setData({ cosmap })
        }
        this.initGame()
      }
    });
  },

  onReady: function () {
    this._echartsComponnet = this.selectComponent('#mychart')
    this._ctx = []
    for (let i = 0;i<6;i++){
      this._ctx.push(wx.createInnerAudioContext())
    }
  },

  onShow: function () {

  },

  onHide: function () {
    if (this._tipsIt > -1) this._tipsIt = clearInterval(this._tipsIt)
  },

  onUnload: function () {

  },

  onPullDownRefresh: function () {

  },

  onReachBottom: function () {

  },

  onShareAppMessage: function () {
    return {
      title: '假名·连连看@式神录',
      path: '/pages/game/game',
      imageUrl: 'https://systems-1256378396.cos.ap-guangzhou.myqcloud.com/title00.png'
    }
  },

  getUserInfo(e) {
    let userInfo = e.detail.userInfo
    if (!userInfo) return
    App.initAvatar(userInfo).then(data => {
      wx.showToast({
        title: '登录成功',
      })
      this.setData({
        userInfo: data,
        hasLogin: true
      })
    })
  },

  getKanaRows: function (kana_row) {
    var rows = []
    for (let lst of kana_row) {
      var words = {}
      words["cate"] = lst[0]
      words["roma"] = lst[1]
      words["hira"] = lst[2]
      words["kata"] = lst[3]
      rows.push(words)
    }
    return rows
  },

  initKanaRows: function () {
    var ks_a = this.getKanaRows(kana_a)
    var ks_ka = this.getKanaRows(kana_ka)
    var ks_sa = this.getKanaRows(kana_sa)
    var ks_ta = this.getKanaRows(kana_ta)
    var ks_na = this.getKanaRows(kana_na)
    var ks_ha = this.getKanaRows(kana_ha)
    var ks_ma = this.getKanaRows(kana_ma)
    var ks_ya = this.getKanaRows(kana_ya)
    var ks_ra = this.getKanaRows(kana_ra)
    var ks_wa = this.getKanaRows(kana_wa)
    var ks_n = this.getKanaRows(kana_n)
    var ks_all = []
    ks_all.push(ks_a, ks_ka, ks_sa, ks_ta, ks_na, ks_ha, ks_ma, ks_ya, ks_ra, ks_wa, ks_n)
    //console.log(ks_all)
    this.setData({
      ks_all,
      ks_a,
      ks_ka,
      ks_sa,
      ks_ta,
      ks_na,
      ks_ha,
      ks_ma,
      ks_ya,
      ks_ra,
      ks_wa,
      ks_n
    })
  },

  loadGame(new_fields) {
    let fields = []
    this._selectedSize = this._selectedSize || 10
    this._restStep = totalStep
    this._hitaCount = 0
    this._puzs = []
    this._remind = 0
    this._spend = 0
    this._gap = 0
    this.setData({
      fields,
      tip: '',
      sakki_roma: "",
      bucket: [],
      level: 1,
      spinCount: 0,
    })
    this._it = setInterval(()=> {
      let row = new_fields.shift()
      if (!row) {
        clearInterval(this._it)
        return
      }
      fields.push(row)
      //fields = []
      this.setData({ fields })
    }, 120)
    this.autoTips()
  },

  initBarChart(points, spends, glods){
    console.log(this._echartsComponnet)
    this._echartsComponnet.init((canvas, width, height, dpr) => {
      // 获取组件的 canvas、width、height 后的回调函数
      // 在这里初始化图表
      const chart = echarts.init(canvas, null, {
        width: width || 365,
        height: height || 300,
        devicePixelRatio: dpr // new
      });
      setOption(chart, points, spends, glods);
      chart.on('legendselectchanged', (params)=> {
        if(params.name == '分数'){
          this.setData({ pointHide: !params.selected[params.name] })
        } else if (params.name == '金币'){
          this.setData({ goldHide: !params.selected[params.name] })
        } else if (params.name == '耗时') {
          this.setData({ spendHide: !params.selected[params.name] })
        }
      })

      // 将图表实例绑定到 this 上，可以在其他成员函数（如 dispose）中访问
      this.chart = chart;

      this.setData({
        isLoaded: true
      });
      // 注意这里一定要返回 chart 实例，否则会影响事件处理等
      return chart;
    });

  },
  initResult() {
    clearInterval(this._spendIt)
    let spend = this._spend
    let spinCount = this.data.spinCount
    let point = Math.round((spinCount + this._hitaCount * 10) * this._selectedSize / 10)
    let checkCoin = Math.round(point * 1.2 / 10)
    //解锁假名
    let ksOri = this.data.ksOri
    for (let roma of this._puzs){
      ksOri.map(it=> {
        it.count = it.count || 0
        it.count = it.roma == roma ? it.count + 1 : it.count
      })
    }
    console.log(spend, ksOri)
    let puz = this._puzs.join()
    console.log(puz)
    
    wx.showNavigationBarLoading()
    wx.request({
      url: `${host}/saveRank`,
      method: 'POST',
      data: {
        openid: App.globalData.openid,
        point,
        spend,
        status: 1,
        puz,
        checkCoin,
      },
      success: (res)=> {
        let data = res.data
        let _points = []
        let _spends = []
        let _glods = []
        let points = []
        let spends = []
        let glods = []
        let myTotalCoin = checkCoin
        for (let it of data){
          _points.push(it.point)
          _spends.push(it.spend > 0 ? it.spend : 320 - Math.round(it.point / 10 + it.round / 2))
          _glods.push(it.total_coin)
          myTotalCoin = it.openid == App.globalData.openid ? it.total_coin + checkCoin : myTotalCoin
        }
        console.log(App.globalData.openid, myTotalCoin, _spends)
        let _maxPoint = Math.max.apply(Math, _points)
        let _maxSpend = Math.max.apply(Math, _spends)
        let _maxGlod = Math.max.apply(Math, _glods)
        let _minPoint = Math.min.apply(Math, _points)
        let _minSpend = Math.min.apply(Math, _spends)
        let _minGlod = Math.min.apply(Math, _glods)
        let _spPoint = (_maxPoint - _minPoint) / 10
        let _spSpend = (_maxSpend - _minSpend) / 10
        let _spGlod = (_maxGlod - _minGlod) / 10
        let pointPercent = point / _maxPoint * 100
        let spendPercent = spend / _maxSpend * 100
        let glodPercent = myTotalCoin / _maxGlod * 100
        console.log(pointPercent, spendPercent, glodPercent)
        console.log('max:', _maxPoint, _maxSpend, _maxGlod)
        pointPercent = pointPercent > 100 ? 100 : pointPercent
        spendPercent = spendPercent > 100 ? 100 : spendPercent
        glodPercent = glodPercent > 100 ? 100 : glodPercent
        for (let i=0;i<10;i++){
          console.log(i, i * _spGlod + _minGlod, '~', (i + 1) * _spGlod + _minGlod)
          let p = _points.filter(it => { return it >= i * _spPoint + _minPoint && it <= (i + 1) * _spPoint + _minPoint }).length
          points.push(p)
          let s = _spends.filter(it => { return it >= i * _spSpend + _minSpend && it <= (i + 1) * _spSpend + _minSpend }).length
          spends.push(s)
          let g = _glods.filter(it => { return it >= i * _spGlod + _minGlod && it <= (i + 1) * _spGlod + _minGlod }).length
          glods.push(g)
        }
        console.log(points, spends, glods)
        this.initBarChart(points, spends, glods)
        this.setData({
          ksOri,
          spend,
          point,
          checkCoin,
          pointPercent,
          spendPercent,
          glodPercent,
          showResult: true,
        })
      },
      complete: (res) => {
        wx.hideNavigationBarLoading()
      }
    })

  },

  initBGK: function (sdate, ldate) {
    var bgk = this.data.bgk
    var bgk_ori = this.data.bgk_ori
    if (sdate != ldate) {
      for (let kp of bgk) {
        kp["word"] = "签"
      }
    } else {
      bgk = bgk_ori
    }
    this.setData({ bgk })
  },

  initColor: function (rank) {
    var oldCoin = rank.oldCoin
    if (!oldCoin) oldCoin = 0
    var my_coin = rank.coin
    var myco = rank.myco
    var mycos = myco.split(",")
    var myclst = []
    for (let kk of mycos) {
      var cod = { "key": kk, "word": "" }
      myclst.push(cod)
    }
    this.setData({
      my_coin,
      oldCoin,
      myco,
      myclst
    })
  },

  checkRank(checkCoin, ran) {
    var openid = App.globalData.openid
    wx.request({
      url: `${host}/checkRank`,
      method: 'POST',
      data: { openid, checkCoin, ran },
      success: (res)=> {
        var ranks = res.data
        console.log(ranks)
        if (ranks.length != 1) return
        var rank = ranks[0]
        console.log(rank)
        var sdate = rank["s_date"].substring(0, 10)
        var ldate = rank["latest"].substring(0, 10)
        this.initBGK(sdate, ldate)
        this.initColor(rank)
      }
    });
  },

  loadRank(type, pageNo) {
    wx.request({
      url: `${host}/queryRank`,
      method: 'POST',
      data: { pageNo, pageSize:20 },
      success: (res)=> {
        let total = res.data.total
        let list = res.data.ranks
        for (let rank of list) {
          let myco = rank.myco
          let colst = myco.split(",")
          rank["colst"] = colst
          rank["deAvatar"] = deAvatar(rank.openid)
        }
        let ranks = type === 'more' ? this.data.ranks.concat(list) : list
        this.setData({
          total,
          requesting: false,
          end: ranks.length >= total,
          ranks
        })
      }
    });
  },

  setting(e) {
    wx.vibrateShort()
    if (!this.data.hasLogin) return
    this._gap = 0
    this._remind = 0
    var currData = e.currentTarget.dataset
    var option = currData.option
    if (option == 0) { //icon-setting
      //toggle
      var top_hide = !this.data.top_hide
      var se = this.data.option
      this.setData({
        option: 1,
        top_hide,
        stn: 0,
        puzon: top_hide,
        rank_hide: se == 1,
        kana_hide: se == 2,
        color_hide: se == 3,
        requesting: false,
      })
      var ch_color = this.data.ch_color
      if (ch_color) this.updateColor()

    } else if (option == 1) { //假名设定
      this.setData({ option: 1 })
    } else if (option == 2) { //排行榜
      if (!this.data.total){
        this.loadRank('refresh', pageStart)
      }
      this.setData({ option: 2 })
    } else if (option == 3) { //颜色设定
      this.checkRank(0, 0)
      this.setData({ option: 3 })
    }
    this.setData({ oldCoin: 0, subCoin: 0, buy_log: "", tip: '' })
  },
  // 刷新数据
  refresh() {
    this._pageNo = pageStart
    this.setData({
      requesting: true,
      empty: false,
      end: false,
    })
    this.loadRank('refresh', pageStart);
  },
  // 加载更多
  more() {
    this._pageNo += 1
    this.loadRank('more', this._pageNo);
  },
  select: function (e) {
    var currData = e.currentTarget.dataset
    var row = currData.row
    var col = currData.col
    var ks_all = this.data.ks_all
    var ks_sed = this.data.ks_sed
    if (ks_all[row][col]["roma"] == "") return
    var se = ks_all[row][col]["selected"]
    if (se) {
      ks_sed.pop()
      ks_all[row][col]["selected"] = false
    } else {
      wx.vibrateShort()
      ks_sed.push([row, col])
      ks_all[row][col]["selected"] = true
      let cur = ks_all[row][col]['roma']
      let curSrc = SrcYuku + cur + '.wav'
      let ctx = this._ctx.pop()
      this._ctx.unshift(ctx)
      ctx.src = curSrc
      ctx.play()
    }
    if (ks_sed.length > max_sed) { //如果点击已选或者大于可选--取消最先选择的
      var ned = ks_sed.shift()
      var n_row = ned[0]
      var n_col = ned[1]
      ks_all[n_row][n_col]["selected"] = false
    }

    this._selectedSize = ks_sed.length
    var is_max = this._selectedSize == max_sed
    this.setData({ ks_all, ks_sed, is_max })
  },

  setPuzMap: function (puz) {
    var puz_map = {}
    if (puz && puz != "") {
      var puz_sp = puz.split(";")
      for (let sp of puz_sp) {
        sp = sp.trim()
        var sps = sp.split(",")
        var spk = sps[0]
        if (!spk || spk == "") continue
        var spv = sps[1]
        puz_map[spk] = spv
      }
    }
    this.setData({ puz_map })
    return puz_map
  },

  showPuz: function () {
    let openid = App.globalData.openid
    let puzon = !this.data.puzon
    let hasPuzon = wx.getStorageSync('hasPuzon')
    wx.setStorageSync('hasPuzon', true)
    if (puzon) {
      wx.request({
        url: `${host}/queryRank`,
        method: 'POST',
        data: { openid },
        success: (res)=> {
          let rank = res.data
          if (!rank) return
          let re_puz = rank.puz
          this.setPuzMap(re_puz)
          this.setData({
            tipsPuzon: !hasPuzon,
            puzon
          })
        }
      });

    } else {
      this.setData({
        tipsPuzon: !hasPuzon,
        puzon
      })
    }

  },

  switchKata() {
    wx.vibrateShort()
    var kon = !this.data.kon
    this.setData({ kon })
    if (kon) {
      let ctx = this._ctx.pop()
      this._ctx.unshift(ctx)
      ctx.src = SrcHshs
      ctx.play()
    }
  },

  initGame() {
    if (this._tabBarHide){
      this._tabBarHide = false
      wx.showTabBar()
    }
    let ks_ed = []
    let ks_no = []
    let ks_all = this.data.ks_all
    for (let rows of ks_all) {
      for (let step of rows) {
        if (step.selected) {
          ks_ed.push(step)
        } else if (step["roma"]) {
          ks_no.push(step)
        }
      }
    }

    ks_no.sort(()=> { return (Math.random() - 0.5) })

    let fill_size = least_sed - ks_ed.length
    fill_size = fill_size > 0 ? fill_size : 0
    let ks_fill = ks_no.slice(0, fill_size)
    //concat(ks_fill)
    ks_ed.push(...ks_fill)
    let ksOri = ks_ed.concat()
    while (ks_ed.length < half_sed) {
      ks_ed = ks_ed.concat(ks_ed)
    }
    ks_ed = ks_ed.slice(0, half_sed)
    ks_ed.sort(()=> { return (Math.random() - 0.5) })
    let t_kanas = ks_ed.concat()
    t_kanas.sort(()=> { return (Math.random() - 0.5) })
    //console.log(ks_ed.length)
    this.setData({ top_hide: true, showResult: false, ksOri })
    this.initFields(ks_ed, t_kanas)
  },

  initFields(kanas, t_kanas) {
    let pos_map = {}
    let new_fields = []
    let kon = this.data.kon
    for (let row = 0; row < max_row; row++) {
      let rows = []
      for (let col = 0; col < max_col; col++) {
        var kana = {}
        var space1 = (row == 6 && col > 0 && col < max_col - 1)
        var space2 = (row == 3 && col > 2 && col < 5)
        if ((row + col) % 2 == 0) {
          if (!space1 && !space2) kana = kanas.pop()
          var roma = kana["roma"] ? kana["roma"] : ""
          var hira = kana["hira"] ? kana["hira"] : ""
          var kata = kana["kata"] ? kana["kata"] : ""
          var word = hira
          var kton = false
        } else {
          if (!space1 && !space2) kana = t_kanas.pop()
          var roma = kana["roma"] ? kana["roma"] : ""
          var hira = kana["hira"] ? kana["hira"] : ""
          var kata = kana["kata"] ? kana["kata"] : ""
          var word = kon ? kata : hira
          var kton = kon
        }
        //couple
        if (pos_map[roma]) {
          pos_map[roma].push([row, col])
        } else {
          pos_map[roma] = [[row, col]]
        }

        let step = { row, col, roma, hira, kata, word, kton }
        rows.push(step)
      }
      new_fields.push(rows)
    }

    this.setData({ pos_map })
    this.loadGame(new_fields)
  },


  //--------------------------------

  prebuy: function (e) {
    var currData = e.currentTarget.dataset
    var key = currData.key
    var word = currData.word
    var stn = this.data.stn
    var cosmap = this.data.cosmap
    var ck = "c" + stn

    //点击我的颜色
    if ("" == word) { //颜色更换
      if (stn == 1) cosmap["hira"] = key
      if (stn == 2) cosmap["kata"] = key
      if (stn == 3) cosmap["space"] = key
      cosmap[ck] = !cosmap[ck]
      if (stn != 0) this.setData({ ch_color: true })

      //购买颜色
    } else if ("签" == word) { //日签
      var bgk_ori = this.data.bgk_ori
      var bgk = bgk_ori
      this.setData({ bgk, oldCoin: 0, subCoin: 0, buy_log: "" })
      var ran = Math.random()
      var checkCoin = parseInt(ran * 666)
      checkCoin = Math.max(100, checkCoin)
      this.checkRank(checkCoin, checkCoin)
    } else { //兑换颜色
      var bgk = this.data.bgk
      for (let bgc of bgk) {
        bgc["active"] = false
        if (key == bgc["key"]) bgc["active"] = true
      }
      var show_price = currData.price
      var myco = this.data.myco
      if (myco && myco.includes(key)) show_price = "已兑换"
      var try_idx = 0
      var buy_log = ""
      var subCoin = 0
      var co_key = key
      this.setData({ show_price, bgk, try_idx, buy_log, co_key, subCoin })
    }
    this.setData({
      cosmap,
    })
  },

  setColor: function (e) {
    var currData = e.currentTarget.dataset
    var stn = currData.stn
    if (stn == this.data.stn) stn = 0
    this.setData({ stn })
  },

  buy(e) {
    var co_key = this.data.co_key
    var currData = e.currentTarget.dataset
    var key = currData.key
    var show_price = this.data.show_price
    if (key != co_key || "已兑换" == show_price) return
    wx.vibrateLong()
    var that = this
    var openid = App.globalData.openid
    var price = currData.price
    var coin = this.data.my_coin
    var try_idx = this.data.try_idx
    if (price > coin) {
      var log_lst = ["金币不足!", "金币不够啦!", "玩游戏&赚金币!", "玩游戏&赚金币!!", "玩游戏&赚金币!!!", "...ん?", ".........", "...............", "(╯°Д°)╯︵ ┻━┻", "真的是金币不够了!!!"]
      var buy_log = log_lst[try_idx]
      try_idx += 1
      try_idx = Math.min(log_lst.length - 1, try_idx)
      that.setData({ buy_log, try_idx })
      return
    }
    if ("ko" == key) { //购买黑色
      wx.request({
        url: `${host}/queryRank`,
        method: 'POST',
        data: { openid },
        success: function (res) {
          var rank = res.data
          if (!rank) return
          var re_puz = rank.puz
          var puz_map = that.setPuzMap(re_puz)
          var canbuy = true
          var roman = 0
          for (let kk in puz_map) {
            if (!kk || kk == "") continue
            if (puz_map[kk] < 10) {
              canbuy = false
              break
            }
            roman += 1
          }
          if (roman < 46) canbuy = false
          console.log("canbuy?", canbuy, roman)
          if (canbuy) {
            that.buyColor(key, coin, price)
          } else { //条件未解锁
            var buy_log = "兑换条件不满足!"
            that.setData({ buy_log })
          }
        }
      });

    } else { //购买非黑色
      that.buyColor(key, coin, price)
    }
  },

  buyColor(color, coin, price) {
    if (this._buyLock) return
    this._buyLock = true
    var openid = App.globalData.openid
    var balance = coin - price
    var subCoin = price
    wx.request({
      url: `${host}/buyColor`,
      method: 'POST',
      data: { openid, color, balance },
      success: (res)=> {
        var ranks = res.data
        if (ranks.length != 1) return
        var rank = ranks[0]
        var show_price = "已兑换"
        var buy_log = "兑换成功!"
        this.setData({ subCoin, buy_log, show_price })
        this.initColor(rank)
      },
      complete: ()=>{
        this._buyLock = false
      }
    });
  },

  updateColor: function () {
    var openid = App.globalData.openid
    var cosmap = this.data.cosmap
    var hira = cosmap["hira"]
    var kata = cosmap["kata"]
    var space = cosmap["space"]
    this.setData({ ch_color: false })
    wx.request({
      url: `${host}/updateColor`,
      method: 'POST',
      data: { openid, hira, kata, space },
      success: ()=> {
        this.setData({ ch_color: false })
      }
    });
  },

/**
 * 游戏逻辑
 */

  rightLink: function (begin_col, end_col, fixed_row) {
    console.log("-right")
    var fields = this.data.fields
    var this_lefts = this.data.this_lefts
    var this_ups = this.data.this_ups
    var this_downs = this.data.this_downs
    var steps = []
    var step_col = begin_col
    while (step_col < end_col) {
      step_col += 1
      var step = fields[fixed_row][step_col]
      if (step["word"] != "") break
      var row_col = step.row + "," + step.col
      steps.push(row_col)
      var idx = this_lefts.indexOf(row_col)
      if (idx != -1) {
        steps = steps.concat(this_lefts.slice(0, idx))
        return steps
      }
      idx = this_ups.indexOf(row_col)
      if (idx != -1) {
        steps = steps.concat(this_ups.slice(0, idx))
        return steps
      }
      idx = this_downs.indexOf(row_col)
      if (idx != -1) {
        steps = steps.concat(this_downs.slice(0, idx))
        return steps
      }
    }//while end
    return []
  },

  downLink: function (begin_row, end_row, fixed_col) {
    console.log("-down")
    var fields = this.data.fields
    var this_lefts = this.data.this_lefts
    var this_ups = this.data.this_ups
    var this_rights = this.data.this_rights
    var steps = []
    var step_row = begin_row
    while (step_row < end_row) {
      step_row += 1
      var step = fields[step_row][fixed_col]
      if (step["word"] != "") break
      var row_col = step.row + "," + step.col
      steps.push(row_col)
      var idx = this_ups.indexOf(row_col)
      if (idx != -1) {
        steps = steps.concat(this_ups.slice(0, idx))
        return steps
      }
      idx = this_lefts.indexOf(row_col)
      if (idx != -1) {
        steps = steps.concat(this_lefts.slice(0, idx))
        return steps
      }
      idx = this_rights.indexOf(row_col)
      if (idx != -1) {
        steps = steps.concat(this_rights.slice(0, idx))
        return steps
      }
    }//while end
    return []
  },

  leftLink: function (begin_col, end_col, fixed_row) {
    console.log("-left")
    var fields = this.data.fields
    var this_downs = this.data.this_downs
    var this_ups = this.data.this_ups
    var this_rights = this.data.this_rights
    var steps = []
    var step_col = begin_col
    while (step_col > end_col) {
      step_col -= 1
      var step = fields[fixed_row][step_col]
      if (step["word"] != "") break
      var row_col = step.row + "," + step.col
      steps.push(row_col)
      var idx = this_rights.indexOf(row_col)
      if (idx != -1) {
        steps = steps.concat(this_rights.slice(0, idx))
        return steps
      }
      idx = this_ups.indexOf(row_col)
      if (idx != -1) {
        steps = steps.concat(this_ups.slice(0, idx))
        return steps
      }
      idx = this_downs.indexOf(row_col)
      if (idx != -1) {
        steps = steps.concat(this_downs.slice(0, idx))
        return steps
      }
    }//while end
    return []
  },

  upLink: function (begin_row, end_row, fixed_col) {
    console.log("-up")
    var fields = this.data.fields
    var this_downs = this.data.this_downs
    var this_lefts = this.data.this_lefts
    var this_rights = this.data.this_rights
    var steps = []
    var step_row = begin_row
    while (step_row > end_row) {
      step_row -= 1
      var step = fields[step_row][fixed_col]
      if (step["word"] != "") break
      var row_col = step.row + "," + step.col
      steps.push(row_col)
      var idx = this_downs.indexOf(row_col)
      if (idx != -1) {
        steps = steps.concat(this_downs.slice(0, idx))
        return steps
      }
      idx = this_lefts.indexOf(row_col)
      if (idx != -1) {
        steps = steps.concat(this_lefts.slice(0, idx))
        return steps
      }
      idx = this_rights.indexOf(row_col)
      if (idx != -1) {
        steps = steps.concat(this_rights.slice(0, idx))
        return steps
      }
    }//while end
    return []
  },
  isNext: function (old_row, old_col, this_row, this_col) {
    if (old_col == this_col && Math.abs(old_row - this_row) == 1) {
      return true
    }
    if (old_row == this_row && Math.abs(old_col - this_col) == 1) {
      return true
    }
    return false
  },
  autoLink: function (this_row, this_col) {
    var fields = this.data.fields
    var pos_map = this.data.pos_map

    //var roma = fields[this_row][this_col]["roma"]
    //var pos = pos_map[roma]
    //距离排序--逆序
    //pos.sort(function(a,b){return (a[0]-this_row)**2+(a[1]-this_col)**2 < (b[0]-this_row)**2+(b[1]-this_col)**2})
    //console.log("pos:")
    //console.log(pos)
    //for(let p of pos){
    //  console.log(p[0],p[1])
    //}
    //this.setData({fields})
    //console.log("up:")
    //up_pos
    if (this_row > 0) {
      console.log("up_pos")
      var up_row = this_row - 1
      var up_roma = fields[up_row][this_col]["roma"]
      var up_pos = pos_map[up_roma]
      up_pos.sort(function (a, b) { return (a[0] - up_row) ** 2 + (a[1] - this_col) ** 2 < (b[0] - up_row) ** 2 + (b[1] - this_col) ** 2 })
      for (let p of up_pos) {

        var row = p[0]
        var col = p[1]
        if (fields[row][col]["status"] == 0) break
        console.log("--start", row, col, fields[row][col]["word"])

        var linked = this.linkDirect(up_row, this_col, row, col)
        if (linked) {
          console.log("--link-true")
          this.setData({ auto: false })
          break
        }
      }
    }
    console.log("--end")
    //this.setData({fields})
    return

    //down_pos
    if (this_row < max_row - 1) {
      console.log("down_pos")
      var down_row = this_row + 1
      var down_roma = fields[down_row][this_col]["roma"]
      var down_pos = pos_map[down_roma]
      down_pos.sort(function (a, b) { return (a[0] - down_row) ** 2 + (a[1] - this_col) ** 2 < (b[0] - down_row) ** 2 + (b[1] - this_col) ** 2 })
      for (let p of down_pos) {
        console.log(p)
        fields[p[0]][p[1]]["active"] = true
      }
    }

    //left_pos
    if (this_col > 0) {
      console.log("left_pos")
      var left_col = this_col - 1
      var left_roma = fields[this_row][left_col]["roma"]
      var left_pos = pos_map[left_roma]
      left_pos.sort(function (a, b) { return (a[0] - this_row) ** 2 + (a[1] - left_col) ** 2 < (b[0] - this_row) ** 2 + (b[1] - left_col) ** 2 })
      for (let p of left_pos) {
        console.log(p)
        fields[p[0]][p[1]]["active"] = true
      }
    }

    //right_pos
    if (this_col < max_col - 1) {
      console.log("right_pos")
      var right_col = this_col + 1
      var right_roma = fields[this_row][right_col]["roma"]
      var right_pos = pos_map[right_roma]
      right_pos.sort(function (a, b) { return (a[0] - this_row) ** 2 + (a[1] - right_col) ** 2 < (b[0] - this_row) ** 2 + (b[1] - right_col) ** 2 })
      for (let p of right_pos) {
        console.log(p)
        fields[p[0]][p[1]]["active"] = true
      }
    }

  },

  hideBoth(old_row, old_col, this_row, this_col, steps) {
    wx.vibrateShort()
    var fields = this.data.fields
    var thisStep = fields[this_row][this_col]
    var oldStep = fields[old_row][old_col]
    //解锁假名
    if (thisStep["word"] != oldStep["word"]) {
      var roma = thisStep["roma"]
      this._puzs.push(roma)
      this._hitaCount += 1
    }
    var sold = old_row + "," + old_col
    var sthis = this_row + "," + this_col
    var both = [sold, sthis]
    steps = steps.concat(both)
    this.passStep(steps)

    let cur = thisStep["roma"]
    let curSrc = SrcYuku + cur + '.wav'
    let ctx = this._ctx.pop()
    this._ctx.unshift(ctx)
    ctx.src = curSrc
    ctx.play()

    var sakki_roma = thisStep["roma"]
    var sakki_hira = thisStep["hira"]
    var sakki_kata = thisStep["kata"]

    //if(steps.length > 2 && this.data.auto){
    //  this.autoLink(this_row, this_col)
    //}

    thisStep["word"] = ""
    oldStep["word"] = ""
    thisStep["active"] = false
    oldStep["active"] = false
    thisStep["roma"] = sthis
    oldStep["roma"] = sold

    this.setData({
      fields,
      skon: false,
      sakki_roma,
      sakki_hira,
      sakki_kata,
    })
    if (this._spend == 0){
      this._spendIt = setInterval(it=>{
        this._spend += 1
      }, 1000)
    }
    return true
  },

  passStep(steps) {
    var fields = this.data.fields
    for (let step of steps) {
      var rc = step.split(",")
      var row = rc[0]
      var col = rc[1]
      fields[row][col]["on"] = !fields[row][col]["on"]
    }
    //记录分数用
    let spinCount = this.data.spinCount
    let endCount = spinCount + steps.length
    this._restStep -= 2

    let spit = setInterval(() => {
      if (spinCount < endCount) {
        spinCount += 1
        this.setData({ spinCount })
      } else {
        clearInterval(spit)
      }
    }, 66)

    this.setData({
      fields,
    })

    //分数结算
    if (this._restStep <= 0) {
      setTimeout(() => {
        this.initResult()
      }, 100)
    }
  },

  initTargetPoint: function (this_row, this_col) {
    var fields = this.data.fields
    var this_lefts = []
    var this_rights = []
    var this_ups = []
    var this_downs = []

    var step_col = this_col
    while (step_col > 0) {
      step_col -= 1
      var step = fields[this_row][step_col]
      if (step["word"] != "") break
      this_lefts.push(step.row + "," + step.col)
    }
    step_col = this_col
    while (step_col < max_col - 1) {
      step_col += 1
      var step = fields[this_row][step_col]
      if (step["word"] != "") break
      this_rights.push(step.row + "," + step.col)
    }
    var step_row = this_row
    while (step_row > 0) {
      step_row -= 1
      var step = fields[step_row][this_col]
      if (step["word"] != "") break
      this_ups.push(step.row + "," + step.col)
    }
    step_row = this_row
    while (step_row < max_row - 1) {
      step_row += 1
      var step = fields[step_row][this_col]
      if (step["word"] != "") break
      this_downs.push(step.row + "," + step.col)
    }
    this.setData({
      this_lefts,
      this_rights,
      this_ups,
      this_downs
    })
  },

  linkDirect: function (old_row, old_col, this_row, this_col) {
    var fields = this.data.fields
    var steps = []
    if (this.isNext(old_row, old_col, this_row, this_col)) {
      console.log("is next")
      return this.hideBoth(old_row, old_col, this_row, this_col, steps)
    }
    this.initTargetPoint(this_row, this_col)
    //从old_开始寻路
    steps = this.rightLink(old_col, this_col, old_row)
    if (steps.length > 0) {
      return this.hideBoth(old_row, old_col, this_row, this_col, steps)
    }
    steps = this.downLink(old_row, this_row, old_col)
    if (steps.length > 0) {
      return this.hideBoth(old_row, old_col, this_row, this_col, steps)
    }
    steps = this.leftLink(old_col, this_col, old_row)
    if (steps.length > 0) {
      return this.hideBoth(old_row, old_col, this_row, this_col, steps)
    }
    steps = this.upLink(old_row, this_row, old_col)
    if (steps.length > 0) {
      return this.hideBoth(old_row, old_col, this_row, this_col, steps)
    }
    console.log("2-right")
    var steps_sec = []
    var step_col = old_col
    while (step_col < max_col - 1) {
      step_col += 1
      var step = fields[old_row][step_col]
      if (step["word"] != "") break
      var row_col = step.row + "," + step.col
      steps.push(row_col)
      //(begin_row, end_row, fixed_col)
      steps_sec = this.upLink(step.row, this_row, step.col)
      if (steps_sec.length > 0) {
        steps = steps.concat(steps_sec)
        return this.hideBoth(old_row, old_col, this_row, this_col, steps)
      }
      steps_sec = this.downLink(step.row, this_row, step.col)
      if (steps_sec.length > 0) {
        steps = steps.concat(steps_sec)
        return this.hideBoth(old_row, old_col, this_row, this_col, steps)
      }
    }
    console.log("2-left")
    steps = []
    var step_col = old_col
    while (step_col > 0) {
      step_col -= 1
      var step = fields[old_row][step_col]
      if (step["word"] != "") break
      var row_col = step.row + "," + step.col
      steps.push(row_col)
      //(begin_row, end_row, fixed_col)
      steps_sec = this.upLink(step.row, this_row, step.col)
      if (steps_sec.length > 0) {
        steps = steps.concat(steps_sec)
        return this.hideBoth(old_row, old_col, this_row, this_col, steps)
      }
      steps_sec = this.downLink(step.row, this_row, step.col)
      if (steps_sec.length > 0) {
        steps = steps.concat(steps_sec)
        return this.hideBoth(old_row, old_col, this_row, this_col, steps)
      }
    }
    console.log("2-down")
    steps = []
    var step_row = old_row
    while (step_row < max_row - 1) {
      step_row += 1
      var step = fields[step_row][old_col]
      if (step["word"] != "") break
      var row_col = step.row + "," + step.col
      steps.push(row_col)
      //(begin_col, end_col, fixed_row)
      steps_sec = this.leftLink(step.col, this_col, step.row)
      if (steps_sec.length > 0) {
        steps = steps.concat(steps_sec)
        return this.hideBoth(old_row, old_col, this_row, this_col, steps)
      }
      steps_sec = this.rightLink(step.col, this_col, step.row)
      if (steps_sec.length > 0) {
        steps = steps.concat(steps_sec)
        return this.hideBoth(old_row, old_col, this_row, this_col, steps)
      }
    }
    console.log("2-up")
    steps = []
    var step_row = old_row
    while (step_row > 0) {
      step_row -= 1
      var step = fields[step_row][old_col]
      if (step["word"] != "") break
      var row_col = step.row + "," + step.col
      steps.push(row_col)
      //(begin_col, end_col, fixed_row)
      steps_sec = this.leftLink(step.col, this_col, step.row)
      if (steps_sec.length > 0) {
        steps = steps.concat(steps_sec)
        return this.hideBoth(old_row, old_col, this_row, this_col, steps)
      }
      steps_sec = this.rightLink(step.col, this_col, step.row)
      if (steps_sec.length > 0) {
        steps = steps.concat(steps_sec)
        return this.hideBoth(old_row, old_col, this_row, this_col, steps)
      }
    }
    return false
  },
  goLink: function (e) {
    var currData = e.currentTarget.dataset
    var word = currData.word
    if (word == "" || this._hasHint) return
    var bucket = this.data.bucket
    var fields = this.data.fields
    var row = currData.row
    var col = currData.col
    var this_step = fields[row][col]
    this_step["active"] = true
    if (bucket.length > 0) {
      var olds = bucket[0]
      var old_row = olds[0]
      var old_col = olds[1]
      var old_step = fields[old_row][old_col]
      var old_rc = old_row + "" + old_col
      var rc = row + "" + col
      //console.log(old_row, old_col)
      if (old_rc != rc) {
        old_step["active"] = false
        bucket.pop()
        bucket.push([row, col])
        if (old_step["word"] != "" && this_step["roma"] == old_step["roma"]) {
          this.linkDirect(old_row, old_col, row, col)
          // 清空提示
          this._remind = 0
          this._gap = 0
          this.setData({ tip: '' })
        } else if (old_step["word"] != "" && this_step["word"] != "") {
          console.log("remind...")
          this._gap = 0
          this._remind += 1
          if (this._remind > 5) {
            var tip = Math.random() > 0.5 ? '忘记罗马音时可以长按方块查看' : '觉得难的话可以自选假名和关闭片假名哦'
            this.setData({ tip })
          }
        }
      }
    } else {
      bucket.push([row, col])
    }
    this.setData({ fields, bucket })

  },

  autoTips(){
    if (this._tipsIt > -1) return
    this._gap = 0
    let tips = this.data.tips
    this._tipsIt = setInterval(() => {
      if (this._restStep < 80) this._tipsIt = clearInterval(this._tipsIt)
      this._gap += 3
      if (this._gap % 18 == 0) {
        let ridx = parseInt(Math.random() * tips.length)
        ridx = Math.min(ridx, tips.length - 1)
        let tip = tips[ridx]
        this.setData({ tip })
      }
    }, 3000)
  },

  showRoma(e) {
    let currData = e.currentTarget.dataset
    let word = currData.word
    if (word == "" || this._hasHint) return
    wx.vibrateLong()
    let fields = this.data.fields
    let row = currData.row
    let col = currData.col
    let this_step = fields[row][col]
    this_step["hint"] = true
    let cur = this_step['roma']
    let curSrc = SrcYuku + cur + '.wav'
    let ctx = this._ctx.pop()
    this._ctx.unshift(ctx)
    ctx.src = curSrc
    ctx.play()
    this._hasHint = setTimeout(() => {
      this_step["hint"] = false
      this.setData({ fields })
      this._hasHint = false
    }, 1000)

    this.setData({ fields })
  },

  sakki() {
    wx.vibrateShort()
    var skon = !this.data.skon
    this.setData({ skon })
    let curSrc = SrcYuku + this.data.sakki_roma + '.wav'
    let ctx = this._ctx.pop()
    this._ctx.unshift(ctx)
    ctx.src = curSrc
    ctx.play()
  },

})