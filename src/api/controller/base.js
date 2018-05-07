module.exports = class extends think.Controller {
  async __before() {
    // Get the User ID from the token
    think.token = this.ctx.header['x-nideshop-token'] || '';
    const tokenSerivce = think.service('token', 'api');
    think.userId = await tokenSerivce.getUserId();

    const publicController = this.config('publicController');
    const publicAction = this.config('publicAction');

    // If the action is not public, login the user first
    const controllerAction = this.ctx.controller + '/' + this.ctx.action;
    if (!publicController.includes(this.ctx.controller) && !publicAction.includes(controllerAction)) {
      if (think.userId <= 0) {
        return this.fail(401, '请先登录');
      }
    }
  }

  /**
   * Get the current time in milliseconds
   * @returns {Number}
   */
  getTime() {
    return parseInt(Date.now() / 1000);
  }

  /**
   * Get the current logged user id
   * @returns {*}
   */
  getLoginUserId() {
    return think.userId;
  }
};
