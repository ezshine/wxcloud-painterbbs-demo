// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  const {act} = event;

  if(!act || ["post","list","delete"].indexOf(act)<0)return {err:1,msg:"no act"};

  const db = cloud.database();
  if(act==="post"){

    let res = await cloud.uploadFile({
      cloudPath:"painterbbs/"+wxContext.OPENID+Date.now()+".png",
      fileContent:Buffer.from(event.file, 'base64')
    });

    db.collection("painterbbs").add({
      data:{
        openid:wxContext.openid,
        fileid:res.fileID
      }
    });

    return res;

  }else if(act==="list"){
    const res = await db.collection("painterbbs")
      .skip(event.page?event.page:0)
      .limit(10)
      .get();

    return res;
  }else if(act==="delete"){
    const res = await db.collection("painterbbs").doc(event.id).remove();

    return res;
  }

  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}