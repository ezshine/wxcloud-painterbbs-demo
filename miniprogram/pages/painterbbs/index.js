// pages/book/shelfcomments.js
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    page: 0,
    painterIsShow: false,
    painterItems: [{ name: "黑色", brushcolor: "#000000", icon: "icon-brush_fill" },
    { name: "红色", brushcolor: "#ff0000", icon: "icon-brush_fill" },
    { name: "黄色", brushcolor: "#ffff00", icon: "icon-brush_fill" },
    { name: "蓝色", brushcolor: "#0000ff", icon: "icon-brush_fill" },
    { name: "绿色", brushcolor: "#00ff00", icon: "icon-brush_fill" },
    { name: "橡皮擦", brushcolor: "#ffffff", icon: "icon-eraser", iconcolor: "#000" }],
    painterBrushWidthArray: [1, 3, 5, 7, 10, 15],
    painterBrushWidthIndex: 3,
    painterBrushAlpha: 100,
    painterBrushWidthSelectorShow: false,
    painterInkDistance: 0,
    painterItemIndex: 0,
    commentlist:[],
    canloadmore: false
  },
  touchStart: function (e) {
    var that = this;
    that.setData({
      painterBrushWidthSelectorShow: false
    });
    //得到触摸点的坐标
    that.startX = e.changedTouches[0].x;
    that.startY = e.changedTouches[0].y;
    that.context.setGlobalAlpha(that.data.painterBrushAlpha / 100);
    that.context.setStrokeStyle(that.data.painterBrushColor);

    that.context.setLineJoin('round');
    that.context.setLineCap('round');
    that.context.setLineWidth(that.data.painterBrushWidthArray[that.data.painterBrushWidthIndex])

    that.context.beginPath();
  },
  //手指触摸后移动
  touchMove: function (e) {
    var that = this;
    var startX1 = e.changedTouches[0].x;
    var startY1 = e.changedTouches[0].y;

    that.context.moveTo(that.startX, that.startY);
    that.context.lineTo(startX1, startY1);
    that.context.stroke();

    var dx = startX1 - that.startX;
    var dy = startY1 - that.startY;
    var dist = Math.sqrt(dx * dx + dy * dy);

    that.data.painterInkDistance += dist;

    that.startX = startX1;
    that.startY = startY1;
    //只是一个记录方法调用的容器，用于生成记录绘制行为的actions数组。context跟<canvas/>不存在对应关系，一个context生成画布的绘制动作数组可以应用于多个<canvas/>
    that.context.draw(true);
  },
  touchEnd: function (e) {
    var that = this;
    that.setData({
      painterInkDistance: that.data.painterInkDistance
    });
  },
  touchCancel: function (e) {
    var that = this;
    that.setData({
      painterInkDistance: that.data.painterInkDistance
    });
  },
  btnPainterItemClicked: function (e) {
    var that = this;
    wx.showToast({
      title: '切换至' + that.data.painterItems[e.currentTarget.id].name,
    })
    that.setData({
      painterBrushWidthSelectorShow: true,
      painterBrushWidth: that.data.painterBrushWidthArray[that.data.painterBrushWidthIndex],
      painterBrushColor: that.data.painterItems[e.currentTarget.id].brushcolor,
    });
  },
  btnPainterWidthItemClicked: function (e) {
    var that = this;
    that.setData({
      painterBrushWidthIndex: e.currentTarget.id,
      painterBrushWidthSelectorShow: false,
      painterBrushWidth: that.data.painterBrushWidthArray[e.currentTarget.id]
    });
  },
  painterBrushAlphaChange: function (e) {
    var that = this;
    that.setData({
      painterBrushAlpha: e.detail.value
    });
  },
  btnShowPainter: function () {
    this.setData({
      painterIsShow: true,
      painterInkDistance: 0,
    });
    this.context = wx.createCanvasContext('myCanvas');
  },
  btnPainterCancel: function () {
    this.setData({
      painterIsShow: false
    });
  },
  btnPainterConfirm: function () {
    var that = this;
    if (that.data.painterInkDistance <= 1000) {
      wx.showModal({
        title: '',
        content: '画的内容不够哦',
        showCancel: false
      })
      return;
    }
    wx.showModal({
      title: '',
      content: '确定发布吗？',
      success: function (res) {
        if (res.confirm) {
          that.postPainter();
        }
      }
    })
  },
  postPainter: function () {
    var that = this;
    wx.showLoading({
      title: '正在上传',
      mask: true
    });
    wx.canvasToTempFilePath({
      canvasId: 'myCanvas',
      success: function (res) {

        wx.cloud.callFunction({
          name:"painterbbs",
          data:{
            act:"post",
            file:wx.getFileSystemManager().readFileSync(res.tempFilePath,"base64")
          },
          success:(result)=>{
            wx.hideLoading();
            console.log(result);
            that.setData({
              painterIsShow: false
            });
          }
        });
      }
    })
  },
  btnLoadMore: function () {
    if (this.data.canloadmore) {
      this.data.page += 1;
      this.refreshCommentList(this.data.page);
    }
  },
  btnCommentAction: function (e) {
    var that = this;
    var commentId = e.currentTarget.id;
    wx.showActionSheet({
      itemList: ["删除此条留言"],
      success: function (res) {
        if (res.tapIndex == 0) {
          wx.cloud.callFunction({
            name:"painterbbs",
            data:{
              act:"delete",
              id:commentId
            },
            success:(result)=>{
              console.log(result);
              that.refreshCommentList();
            }
          });
        }
      }
    })
  },
  refreshCommentList: function (page = 0) {
    wx.cloud.callFunction({
      name:"painterbbs",
      data:{
        act:"list",
        page:page
      },
      success:(res)=>{
        console.log(res);

        this.setData({
          commentlist:res.result.data
        });
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    that.refreshCommentList();
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

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

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

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  }
})