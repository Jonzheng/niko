const host = 'https://nikoni.fun/api'

const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

const trim = (str) => {
  if (!str) return ''
  return str.replace(/\(.*?\)/g, '').replace('　', '')
}

/**
 * 评论时间显示格式化
 */
function formatDate(time) {
  if (time.length < 8) return time
  let now = new Date()
  let date = new Date(time)
  let year = date.getFullYear()
  let month = date.getMonth() + 1
  let day = date.getDate()
  let today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
  let _today = `${year}-${month}-${day}`
  if (today == _today) { // 今天的评论，显示具体时间
    let hour = date.getHours()
    let minute = date.getMinutes()
    let dt = 'am'
    if (hour > 12) {
      dt = 'pm'
      hour = hour - 12
    }
    hour = hour < 10 ? '0' + hour : hour
    minute = minute < 10 ? '0' + minute : minute
    return `今天 ${hour}:${minute} ${dt}`
  } else { // 不是今天的评论，显示日期
    month = month < 10 ? '0' + month : month
    day = day < 10 ? '0' + day : day
    return `${year}-${month}-${day}`
  }
}

/**
 * 随机且固定的默认头像
 */
function deAvatar(openid) {
  let randInt = openid.codePointAt(openid.length - 1) % 9
  let avatar = `https://avatar-1256378396.cos.ap-guangzhou.myqcloud.com/de_avatar_${randInt}.png`
  return avatar
}

module.exports = {
  host: host,
  trim: trim,
  deAvatar,
  formatDate: formatDate,
  formatTime: formatTime
}
