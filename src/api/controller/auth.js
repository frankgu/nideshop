const Base = require('./base.js');
const rp = require('request-promise');

module.exports = class extends Base {
  async loginByWeixinAction() {
    const code = this.post('code');
    const fullUserInfo = this.post('userInfo');
    const userInfo = fullUserInfo.userInfo;
    const clientIp = ''; // 暂时不记录 ip

    // Get the openid from wechat
    const options = {
      method: 'GET',
      url: 'https://api.weixin.qq.com/sns/jscode2session',
      qs: {
        grant_type: 'authorization_code',
        js_code: code,
        secret: think.config('weixin.secret'),
        appid: think.config('weixin.appid')
      }
    };

    let sessionData = await rp(options);
    sessionData = JSON.parse(sessionData);
    if (!sessionData.openid) {
      return this.fail('登录失败');
    }

    // Verify the completeness of the user
    const crypto = require('crypto');
    const sha1 = crypto.createHash('sha1').update(fullUserInfo.rawData + sessionData.session_key).digest('hex');
    if (fullUserInfo.signature !== sha1) {
      return this.fail('登录失败');
    }

    // Decrypt the user data
    const WeixinSerivce = this.service('weixin', 'api');
    const weixinUserInfo = await WeixinSerivce.decryptUserInfoData(sessionData.session_key, fullUserInfo.encryptedData, fullUserInfo.iv);
    if (think.isEmpty(weixinUserInfo)) {
      return this.fail('登录失败');
    }

    // User the openid from wechat to check if the user has been registered in our system
    let userId = await this.model('user').where({weixin_openid: sessionData.openid}).getField('id', true);
    if (think.isEmpty(userId)) {
      // Register the user in our system
      userId = await this.model('user').add({
        username: 'wechat_user' + think.uuid(6),
        password: sessionData.openid,
        register_time: parseInt(new Date().getTime() / 1000),
        register_ip: clientIp,
        last_login_time: parseInt(new Date().getTime() / 1000),
        last_login_ip: clientIp,
        mobile: '',
        weixin_openid: sessionData.openid,
        avatar: userInfo.avatarUrl || '',
        gender: userInfo.gender || 1, // gender( 0：unknown, 1：male, 2：female)
        nickname: userInfo.nickName
      });
    }
    sessionData.user_id = userId;

    // Get the user information
    const newUserInfo = await this.model('user').field(['id', 'username', 'nickname', 'gender', 'avatar', 'birthday', 'user_level_id']).where({id: userId}).find();
    const newUserLevel = await this.model('user_level').field(['name']).where({id: newUserInfo.user_level_id}).find();
    newUserInfo['user_level_name'] = newUserLevel.name;

    // Update the login info
    userId = await this.model('user').where({id: userId}).update({
      last_login_time: parseInt(new Date().getTime() / 1000),
      last_login_ip: clientIp
    });

    const TokenSerivce = this.service('token', 'api');
    const sessionKey = await TokenSerivce.create(sessionData);

    if (think.isEmpty(newUserInfo) || think.isEmpty(sessionKey)) {
      return this.fail('登录失败');
    }

    return this.success({token: sessionKey, userInfo: newUserInfo});
  }

  async authCosAction() {
    const method = this.get('method');
    const pathName = this.get('pathName');
    const COSService = this.service('cos', 'api');
    const cosTempKeys = await COSService.getTempKeys();
    if (cosTempKeys instanceof Error) {
      return this.fail(cosTempKeys);
    }
    const authorization = await COSService.getAuthorization(cosTempKeys, method, pathName);

    const data = {
      Authorization: authorization,
      XCosSecurityToken: cosTempKeys['credentials'] && cosTempKeys['credentials']['sessionToken']
    };

    // Set the header information
    return this.success(data);
  }

  async logoutAction() {
    return this.success();
  }
};
