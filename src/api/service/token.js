const jwt = require('jsonwebtoken');
const config = require('../../common/config/config');
const secret = config.token;

module.exports = class extends think.Service {
  /**
   * Get user id from header[X-Nideshop-Token]
   */
  async getUserId() {
    const token = think.token;
    if (!token) {
      return 0;
    }

    const result = await this.parse();
    if (think.isEmpty(result) || result.user_id <= 0) {
      return 0;
    }

    return result.user_id;
  }

  /**
   * Get user information
   */
  async getUserInfo() {
    const userId = await this.getUserId();
    if (userId <= 0) {
      return null;
    }

    const userInfo = await this.model('user').field(['id', 'username', 'nickname', 'gender', 'avatar', 'birthday']).where({ id: userId }).find();

    return think.isEmpty(userInfo) ? null : userInfo;
  }

  async create(userInfo) {
    const token = jwt.sign(userInfo, secret);
    return token;
  }

  async parse() {
    if (think.token) {
      try {
        return jwt.verify(think.token, secret);
      } catch (err) {
        return null;
      }
    }
    return null;
  }

  async verify() {
    const result = await this.parse();
    if (think.isEmpty(result)) {
      return false;
    }

    return true;
  }
};
