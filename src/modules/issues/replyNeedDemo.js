/**
 * @file 当有 need demo 标签时自动回复需要相关预览链接
 * @author xuexb <fe.xiaowu@gmail.com>
 */

const format = require('string-template')
const { commentIssue } = require('../../github')

const comment = 'Please provide online code. You can quickly create an example using the following online link：https://jsfiddle.net/yyrzhm46/'

function replyNeedDemo (on) {
  on('issues_labeled', ({ payload, repo }) => {
    if (payload.label.name === 'provide example') {
      commentIssue(
        payload,
        format(comment, {
          user: payload.issue.user.login
        })
      )
    }
  })
}

module.exports = replyNeedDemo
