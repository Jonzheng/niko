const host = 'https://omoz.club/api'

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
  return str.replace(/\(.*?\)/g, '').replace('　', '')
}

/**
 * 评论时间显示格式化
 */
function formatDate(time) {
  if (time.length < 8) return time
  const now = new Date()
  const date = new Date(time)
  if (now.getDate() == date.getDate()) { // 今天的评论，显示具体时间
    let hour = date.getHours()
    let dt = 'am'
    if (hour > 12) {
      dt = 'pm'
      hour = hour - 12
    }
    return `${hour}:${date.getMinutes()}${dt}`
  } else { // 不是今天的评论，显示日期
    let year = date.getFullYear()
    let month = date.getMonth() + 1
    month = month < 10 ? '0' + month : month
    let day = date.getDate()
    day = day < 10 ? '0' + day : day
    return `${year}-${month}-${day}`
  }
}


module.exports = {
  host: host,
  trim: trim,
  formatDate: formatDate,
  formatTime: formatTime
}
