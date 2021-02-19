const App = getApp()
const _width = 180;
const _height = 180;
const _quality = 1
const _canvasId = 'canvas2d'

Page({

  data: {
    width: _width,
    height: _height,
    imgWidth: _width,
    imgHeight: _height,
    imgLeft: _width / 2,
    imgTop: _height / 2,
    export_scale: 1,
    scale: 1,
    angle: 0,
    cutLeft: 0,
    cutTop: 0,
    _canvas_width: _width,
    _canvas_height: _height,
    canvas_left: 0,
    canvas_top: 0,
    limit_move: true

  },

  onLoad(options) {
    this._touch_img_relative = [{
      x: 0,
      y: 0
    }]
    this._moveLock = true
    this._sysInfo = wx.getSystemInfoSync()
    this.initCanvas()
    //检查裁剪框是否在范围内
    this._cutDetectionPosition();
    // this.imgReset()
  },

  initCanvas(){
    if (!this._ctx) {
      this._ctx = wx.createCanvasContext(_canvasId);
    }
  },

  onReady() {

  },

  onShow() {

  },

  onHide() {

  },

  onUnload() {

  },

  onShareAppMessage() {

  },

  chooseImage() {
    wx.chooseImage({
      success: (res)=> {
        let imgSrc = res.tempFilePaths[0]
        this.setData({ imgSrc })
        this.initImageInfo(imgSrc)
      }
    })
  },

  /**
   * 初始化图片，包括位置、大小、旋转角度
   */
  imgReset() {
    this.setData({
      scale: 1,
      angle: 0,
      imgLeft: _width / 2,
      imgTop: _height / 2,
    })
  },

  initAvatar() {
    let userInfo = App.globalData.userInfo
    console.log(userInfo)
    wx.downloadFile({
      url: userInfo.avatar_url,
      success: (res) => {
        console.log(res)
        if (res.statusCode === 200) {
          let imgSrc = res.tempFilePath
          this.setData({ imgSrc })
          this.initImageInfo(imgSrc)
        }
      },
      fail: (err)=> {
        console.log(err)
      }
    })
  },

  initImageInfo(src) {
    wx.getImageInfo({
      src: src,
      success: (res) => {
        console.log('image info', res)
        this._imageObject = res;
        //计算最后图片尺寸
        this.imgReset()
        this._imgComputeSize();
        this._imgMarginDetectionScale();
        this._draw();
      },
      fail: (err) => {
        this.setData({
          imgSrc: ''
        });
      }
    });
  },

  _draw(callback) {
    let imgSrc = this.data.imgSrc
    if (!imgSrc) return;
    let draw = () => {
      //图片实际大小
      let { imgLeft, imgTop, cutLeft, cutTop, imgWidth, imgHeight, scale, export_scale, angle } = this.data
      imgWidth = imgWidth * scale * export_scale;
      imgHeight = imgHeight * scale * export_scale;
      //canvas和图片的相对距离
      let xpos = imgLeft;
      let ypos = imgTop;
      //旋转画布
      console.log(xpos * export_scale, ypos * export_scale)
      this._ctx.translate(xpos * export_scale, ypos * export_scale);
      this._ctx.rotate(angle * Math.PI / 180);
      console.log('----------', -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight)
      this._ctx.drawImage(imgSrc, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
      this._ctx.draw(false, () => {
        callback && callback();
      });
    }
    if (this._ctx.width != this.data.width || this._ctx.height != this.data.height) {
      //优化拖动裁剪框，所以必须把宽高设置放在离用户触发渲染最近的地方
      this.setData({
        _canvas_height: this.data.height,
        _canvas_width: this.data.width,
      }, () => {
        //延迟40毫秒防止点击过快出现拉伸或裁剪过多
        setTimeout(() => {
          draw();
        }, 600);
      });
    } else {
      draw();
    }
  },
  _imgMarginDetectionScale() {

  },
  /**
   * 设置剪裁框和图片居中
   */
  setCutCenter() {
    console.log('----setCutCenter')
    let cutTop = (this._sysInfo.windowHeight - this.data.height) * 0.5;
    let cutLeft = (this._sysInfo.windowWidth - this.data.width) * 0.5;
    //顺序不能变
    this.setData({
      imgTop: this.data.imgTop - this.data.cutTop + cutTop,
      cutTop: cutTop, //截取的框上边距
      imgLeft: this.data.imgLeft - this.data.cutLeft + cutLeft,
      cutLeft: cutLeft, //截取的框左边距
    });
  },
  _setCutCenter() {
    console.log('_setCutCenter')
    let cutTop = (this._sysInfo.windowHeight - this.data.height) * 0.5;
    let cutLeft = (this._sysInfo.windowWidth - this.data.width) * 0.5;
    this.setData({
      cutTop: cutTop, //截取的框上边距
      cutLeft: cutLeft, //截取的框左边距
    });
  },
  /**
   * 图片边缘检测-位置
   */
  _imgMarginDetectionPosition(left, top) {
    console.log('------_imgMargin-DetectionPosition')
    if (!this.data.limit_move) return;
    var scale = scale || this.data.scale;
    let imgWidth = this.data.imgWidth;
    let imgHeight = this.data.imgHeight;
    if (this.data.angle / 90 % 2) {
      imgWidth = this.data.imgHeight;
      imgHeight = this.data.imgWidth;
    }
    left = this.data.cutLeft + imgWidth * scale / 2 >= left ? left : this.data.cutLeft + imgWidth * scale / 2;
    left = this.data.cutLeft + this.data.width - imgWidth * scale / 2 <= left ? left : this.data.cutLeft + this.data.width - imgWidth * scale / 2;
    top = this.data.cutTop + imgHeight * scale / 2 >= top ? top : this.data.cutTop + imgHeight * scale / 2;
    top = this.data.cutTop + this.data.height - imgHeight * scale / 2 <= top ? top : this.data.cutTop + this.data.height - imgHeight * scale / 2;
    console.log(left, top)
    this.setData({
      imgLeft: left,
      imgTop: top,
      scale: scale
    })
  },
  /**
   * 检测剪裁框位置是否在允许的范围内(屏幕内)
   */
  _cutDetectionPosition() {
    let _cutDetectionPositionTop = () => {
      //检测上边距是否在范围内
      if (this.data.cutTop < 0) {
        this.setData({
          cutTop: 0
        });
      }
      if (this.data.cutTop > this._sysInfo.windowHeight - this.data.height) {
        this.setData({
          cutTop: this._sysInfo.windowHeight - this.data.height
        });
      }
    }, _cutDetectionPositionLeft = () => {
      //检测左边距是否在范围内
      if (this.data.cutLeft < 0) {
        this.setData({
          cutLeft: 0
        });
      }
      if (this.data.cutLeft > this._sysInfo.windowWidth - this.data.width) {
        this.setData({
          cutLeft: this._sysInfo.windowWidth - this.data.width
        });
      }
    };
    //裁剪框坐标处理（如果只写一个参数则另一个默认为0，都不写默认居中）
    if (this.data.cutTop == null && this.data.cutLeft == null) {
      this._setCutCenter();
    } else if (this.data.cutTop != null && this.data.cutLeft != null) {
      _cutDetectionPositionTop();
      _cutDetectionPositionLeft();
    } else if (this.data.cutTop != null && this.data.cutLeft == null) {
      _cutDetectionPositionTop();
      this.setData({
        cutLeft: (this._sysInfo.windowWidth - this.data.width) / 2
      });
    } else if (this.data.cutTop == null && this.data.cutLeft != null) {
      _cutDetectionPositionLeft();
      this.setData({
        cutTop: (this._sysInfo.windowHeight - this.data.height) / 2
      });
    }
  },
  _imgComputeSize() {
    //默认按图片最小边 = 对应裁剪框尺寸
    let imgWidth = this._imageObject.width;
    let imgHeight = this._imageObject.height;
    if (imgWidth / imgHeight > this.data.width / this.data.height) {
      imgHeight = this.data.height;
      imgWidth = this._imageObject.width / this._imageObject.height * imgHeight;
    } else {
      imgWidth = this.data.width;
      imgHeight = this._imageObject.height / this._imageObject.width * imgWidth;
    }
    this.setData({
      imgWidth,
      imgHeight,
      imgLeft: imgWidth / 2,
      imgTop: imgHeight / 2,
    });
  },
  //停止移动时需要做的操作
  _moveStop() {
    //清空之前的自动居中延迟函数并添加最新的
    clearTimeout(this._TIME_CUT_CENTER);
    this._TIME_CUT_CENTER = setTimeout(() => {
      //动画启动
      if (!this.data._cut_animation) {
        this.setData({
          _cut_animation: true
        });
      }
      this.setCutCenter();
    }, 1000)
    //清空之前的背景变化延迟函数并添加最新的
    clearTimeout(this._TIME_BG);
    this._TIME_BG = setTimeout(() => {
      if (this.data._flag_bright) {
        this.setData({
          _flag_bright: false
        });
      }
    }, 2000)
  },
  //移动中
  _moveDuring() {
    //清空之前的自动居中延迟函数
    clearTimeout(this._stMove);
    //清空之前的背景变化延迟函数
    clearTimeout(this._TIME_BG);
    //高亮背景
    if (!this.data._flag_bright) {
      this.setData({
        _flag_bright: true
      });
    }
  },
  //开始触摸
  _start(event) {
    this._endtouch = false;
    if (event.touches.length == 1) {
      //单指拖动
      this._touch_img_relative[0] = {
        x: (event.touches[0].clientX - this.data.imgLeft),
        y: (event.touches[0].clientY - this.data.imgTop)
      }
    } else {
      //双指放大
      let width = Math.abs(event.touches[0].clientX - event.touches[1].clientX);
      let height = Math.abs(event.touches[0].clientY - event.touches[1].clientY);
      this._touch_img_relative = [{
        x: (event.touches[0].clientX - this.data.imgLeft),
        y: (event.touches[0].clientY - this.data.imgTop)
      }, {
        x: (event.touches[1].clientX - this.data.imgLeft),
        y: (event.touches[1].clientY - this.data.imgTop)
      }];
      this.data._hypotenuse_length = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
    }
    !this.data._canvas_overflow && this._draw();
  },
  _move_throttle() {
    //安卓需要节流
    if (this._sysInfo.platform == 'android') {
      clearTimeout(this._stMove);
      this._stMove = setTimeout(() => {
        this._moveLock = true;
      }, 1000 / 40)
      return this._moveLock;
    } else {
      this._moveLock = true;
    }
  },
  _move(event) {
    if (this._endtouch || !this._moveLock) return;
    this._moveLock = false;
    this._move_throttle();
    this._moveDuring();
    if (event.touches.length == 1) {
      //单指拖动
      let left = (event.touches[0].clientX - this._touch_img_relative[0].x),
        top = (event.touches[0].clientY - this._touch_img_relative[0].y);
      //图像边缘检测,防止截取到空白
      this._imgMarginDetectionPosition(left, top);
    } else {
      //双指放大
      let width = (Math.abs(event.touches[0].clientX - event.touches[1].clientX)),
        height = (Math.abs(event.touches[0].clientY - event.touches[1].clientY)),
        hypotenuse = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)),
        scale = this.data.scale * (hypotenuse / this.data._hypotenuse_length),
        current_deg = 0;
      scale = scale <= this.data.min_scale ? this.data.min_scale : scale;
      scale = scale >= this.data.max_scale ? this.data.max_scale : scale;
      //图像边缘检测,防止截取到空白
      this.data.scale = scale;
      this._imgMarginDetectionScale();
      //双指旋转(如果没禁用旋转)
      let _touch_img_relative = [{
        x: (event.touches[0].clientX - this.data.imgLeft),
        y: (event.touches[0].clientY - this.data.imgTop)
      }, {
        x: (event.touches[1].clientX - this.data.imgLeft),
        y: (event.touches[1].clientY - this.data.imgTop)
      }];
      this._touch_img_relative = _touch_img_relative;
      this.data._hypotenuse_length = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
      //更新视图
      this.setData({
        angle: this.data.angle + current_deg,
        scale: this.data.scale
      });
    }
    !this.data._canvas_overflow && this._draw();
  },
  //结束操作
  _end(event) {
    this._endtouch = true;
    // this._moveStop();
  },

  getImg(getCallback) {
    this._draw((res) => {
      wx.canvasToTempFilePath({
        width: this.data.width * this.data.export_scale,
        height: Math.round(this.data.height * this.data.export_scale),
        destWidth: this.data.width * this.data.export_scale,
        destHeight: Math.round(this.data.height) * this.data.export_scale,
        fileType: 'png',
        quality: _quality,
        canvasId: _canvasId,
        success: (res) => {
          getCallback({
            url: res.tempFilePath,
            width: this.data.width * this.data.export_scale,
            height: this.data.height * this.data.export_scale
          });
        },
        fail: (err) => {
          console.log(err)
        }
      }, this)
    })
  },

  saveImg(){
    this.getImg(res=>{
      console.log('getImg', res)
      wx.saveImageToPhotosAlbum({
        filePath: res.url,
        success:()=>{
          wx.showToast({
            title: '保存成功',
          })
        }
      })
    })
  },

  toMine() {
    wx.switchTab({
      url: '/pages/mine/mine',
    })
  },
  reload(){
    wx.reLaunch({
      url: '/pages/hat/hat',
    })
  }
})