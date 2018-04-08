// default config
module.exports = {
  default_module: 'api',
  weixin: {
    appid: 'wx6ad21b55baf297fc', // 小程序 appid
    secret: 'e34facd4d9ded251d160177867655b23', // 小程序密钥
    mch_id: '', // 商户帐号ID
    partner_key: '', // 微信支付密钥
    notify_url: '' // 微信异步通知，例：https://www.nideshop.com/api/pay/notify
  },
  express: {
    // 快递物流信息查询使用的是快递鸟接口，申请地址：http://www.kdniao.com/
    appid: '', // 对应快递鸟用户后台 用户ID
    appkey: '', // 对应快递鸟用户后台 API key
    request_url: 'http://api.kdniao.cc/Ebusiness/EbusinessOrderHandle.aspx'
  },
  // COS 配置，用于上传模块使用
  cos: {
    /**
     * 区域
     * 华北：cn-north
     * 华东：cn-east
     * 华南：cn-south
     * 西南：cn-southwest
     */
    region: 'ap-guangzhou',
    fileBucket: 'qcloudtest',               
    uploadFolder: ''                      
  }
};
