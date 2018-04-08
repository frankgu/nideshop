/**
 * 数据库初始化脚本
 */
const fs = require('fs')
const path = require('path')
const { mysql: config } = require('../common/config/database')

console.log('\n======================================')
console.log('开始初始化数据库...')

// 初始化 SQL 文件路径
const INIT_DB_FILE = path.join(__dirname, './nideshop.sql')

const DB = require('knex')({
    client: 'mysql',
    connection: {
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        charset: config.encoding,
        multipleStatements: true
    }
})

console.log(`准备读取 SQL 文件：${INIT_DB_FILE}`)

// 读取 .sql 文件内容
const content = fs.readFileSync(INIT_DB_FILE, 'utf8')

console.log('开始执行 SQL 文件...')

// 执行 .sql 文件内容
DB.raw(content).then(res => {
    console.log('数据库初始化成功！')
    process.exit(0)
}, err => {
    throw new Error(err)
})
