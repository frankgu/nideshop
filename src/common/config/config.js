// default config
module.exports = {
  token: 'SLDLKKDS323ssdd@#@@gf',
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
  cos: {
    signTime: 600, // seconds
    signAlgorithm: 'sha1',
    url: 'https://sts.api.qcloud.com/v2/index.php',
    bucket: 'nideshop-1256426065',
    region: 'na-siliconvalley',
    domain: 'sts.api.qcloud.com'
  },
  tencentCloud: {
    appId: '1256426065',
    secretId: 'AKIDCIF5o8gXWM4bw5moUzIVcbQCnngTvXnr',
    secretKey: '85qQp23rTwFMJ4d5UjmcGix51nOn1gGe'
  }
};
