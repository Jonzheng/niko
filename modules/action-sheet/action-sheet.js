const App = getApp()
const { trim } = require('../../utils/util')

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    formTitle:{
      type: String,
      value: '式神台词',
      observer(val) {
        this.setData({
          formTitle: val
        })
      }
    },
    inputValue:{
      type: String,
      value: '输入评论：',
      observer(val) {
        this.setData({
          inputValue: val
        })
      }
    },
    inputPh:{
      type: String,
      value: '输入评论：',
      observer(val) {
        this.setData({
          inputPh: val
        })
      }
    },
    boxHeight:{
      type: Number,
      value: 720,
      observer(val) {
        this.setData({
          boxHeight: val
        })
      }
    },
    formShow: {
      type: Boolean,
      value: false,
      observer(val) {
        this.setData({
          formShow: val
        })
      }
    },
    hasInput: {
      type: Boolean,
      value: false,
      observer(val) {
        this.setData({
          hasInput: val
        })
      }
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    isIpx: App.globalData.isIpx,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    clickMask() {
      console.log('triiger clickMask')
      this.triggerEvent('clickMask')
      this.setData({formShow: false})
    },
    confirmInput(e) {
      let detail = e.detail
      console.log('triiger confirmInput')
      this.triggerEvent('confirmInput', detail)
    },
    blur() {
      this.triggerEvent('blur')
    },

    pass() {
      return
    }

  }
})
