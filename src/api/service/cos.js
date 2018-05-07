const rp = require('request-promise');
const crypto = require('crypto');
const config = require('../../common/config/config');

// 缓存临时密钥
let tempKeysCache = {
  policyStr: '',
  expiredTime: 0
};

module.exports = class extends think.Service {
  async getTempKeys() {
    const ShortBucketName = config.cos.bucket.substr(0, config.cos.bucket.lastIndexOf('-'));
    const AppId = config.cos.bucket.substr(1 + config.cos.bucket.lastIndexOf('-'));
    const policy = {
      'version': '2.0',
      'statement': [{
        'action': [
          'name/cos:*'
        ],
        'effect': 'allow',
        'principal': {'qcs': ['*']},
        'resource': [
          'qcs::cos:' + config.cos.region + ':uid/' + AppId + ':prefix//' + AppId + '/' + ShortBucketName + '/',
          'qcs::cos:' + config.cos.region + ':uid/' + AppId + ':prefix//' + AppId + '/' + ShortBucketName + '/*'
        ]
      }]
    };

    const policyStr = JSON.stringify(policy);

    // Token expire in 30 seconds
    if (tempKeysCache.expiredTime - Date.now() / 1000 > 30 && tempKeysCache.policyStr === policyStr) {
      return tempKeysCache;
    }

    const params = {
      Action: 'GetFederationToken',
      Nonce: this.getRandom(10000, 20000),
      Region: '',
      SecretId: config.tencentCloud.secretId,
      Timestamp: Math.trunc(Date.now() / 1000),
      durationSeconds: 7200,
      name: '',
      policy: policyStr
    };
    params.Signature = encodeURIComponent(this.getSignature(params, config.tencentCloud.secretKey, 'GET'));

    const sendOptions = {
      method: 'GET',
      url: config.cos.url + '?' + this.json2str(params),
      rejectUnauthorized: false,
      headers: {
        Host: config.cos.domain
      }
    };

    try {
      const requestResult = await rp(sendOptions);
      const data = JSON.parse(requestResult).data;
      tempKeysCache = data;
      tempKeysCache.policyStr = policyStr;
      return tempKeysCache;
    } catch (err) {
      return err;
    }
  }

  async getAuthorization(keys, method = 'GET', pathname = '/', headers = {}, query = {}) {
    const SecretId = keys.credentials.tmpSecretId;
    const SecretKey = keys.credentials.tmpSecretKey;
    if (typeof SecretId === 'undefined' || typeof SecretKey === 'undefined') {
      return '';
    }

    const now = Math.trunc(Date.now() / 1000) - 1;
    const expired = now + config.cos.signTime;

    const qSignAlgorithm = config.cos.signAlgorithm;
    const qAk = SecretId;
    const qSignTime = now + ';' + expired;
    const qKeyTime = now + ';' + expired;
    const qHeaderList = this.getObjectKeys(headers).join(';').toLowerCase();
    const qUrlParamList = this.getObjectKeys(query).join(';').toLowerCase();

    // 签名算法说明文档：https://www.qcloud.com/document/product/436/7778
    // 步骤一：计算 SignKey
    const signKey = crypto.createHmac('sha1', SecretKey).update(qKeyTime).digest('hex');

    // 步骤二：构成 FormatString
    const formatString = [method.toLowerCase(), pathname, this.obj2str(query), this.obj2str(headers), ''].join('\n');

    // 步骤三：计算 StringToSign
    const stringToSign = ['sha1', qSignTime, crypto.createHash('sha1').update(formatString).digest('hex'), ''].join('\n');

    // 步骤四：计算 Signature
    const qSignature = crypto.createHmac('sha1', signKey).update(stringToSign).digest('hex');

    // 步骤五：构造 Authorization
    const authorization = [
      'q-sign-algorithm=' + qSignAlgorithm,
      'q-ak=' + qAk,
      'q-sign-time=' + qSignTime,
      'q-key-time=' + qKeyTime,
      'q-header-list=' + qHeaderList,
      'q-url-param-list=' + qUrlParamList,
      'q-signature=' + qSignature
    ].join('&');

    return authorization;
  }

  getObjectKeys(obj) {
    const list = [];
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        list.push(key);
      }
    }
    return list.sort();
  };

  obj2str(obj) {
    const list = [];
    const keyList = this.getObjectKeys(obj);
    for (let i = 0; i < keyList.length; i++) {
      const key = keyList[i];
      const val = (obj[key] === undefined || obj[key] === null) ? '' : (String(obj[key]));
      const keyLowerCase = key.toLowerCase();
      const encodeKey = this.camSafeUrlEncode(keyLowerCase);
      const encodeVal = this.camSafeUrlEncode(val) || '';
      list.push(encodeKey + '=' + encodeVal);
    }
    return list.join('&');
  };

  getRandom(min, max) {
    return Math.round(Math.random() * (max - min) + min);
  }

  json2str(obj, notEncode) {
    var arr = [];
    Object.keys(obj).sort().forEach(function(item) {
      var val = obj[item] || '';
      arr.push(item + '=' + val);
    });
    return arr.join('&');
  }

  getSignature(opt, key, method) {
    const formatString = method + config.cos.domain + '/v2/index.php?' + this.json2str(opt, 1);
    const hmac = crypto.createHmac('sha1', key);
    const sign = hmac.update(Buffer.from(formatString, 'utf8')).digest('base64');
    return sign;
  }

  camSafeUrlEncode(str) {
    return encodeURIComponent(str)
      .replace(/!/g, '%21')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/\*/g, '%2A');
  }
};
