/**
 * @file 不规范issue则自动关闭
 * @author xuexb <fe.xiaowu@gmail.com>
 */

const format = require('string-template')
const md5 = require('md5');
const request = require('request');


function translate(content, cb) {
    // 清除注释
    let reg_annotation = /\<!--.+--\>/g;
    content = content.replace(reg_annotation, '');

    const appid = process.env.BAIDU_APPID;
    const secret = process.env.BAIDU_SECRET;

    const t = appid + content + '2' + secret;
    const sign = md5(t);

    const url = 'http://fanyi-api.baidu.com/api/trans/vip/translate';
    const options = {
        url: url,
        formData: {
            q: content,
            from: 'zh',
            to: 'en',
            appid: appid,
            salt: '2',
            sign: sign
        }
    };

    function callback (error, response, body) {
        if (!error && response.statusCode === 200) {
            const result = JSON.parse(body).trans_result;
            // console.log(result)
            let result_str = '';

            result.forEach(item => {
                result_str += item.dst + '\n'
            });

            let reg = /(\[.+\])\s+(\(.+\))/g;
            result_str.match(reg);
            result_str = result_str.replace(reg, RegExp.$1 + RegExp.$2);

            if (cb) cb(result_str)
            // console.log(result_str);
        }
    }

    request.post(options, callback);
}

const {
    commentIssue,
    closeIssue,
    addLabelsToIssue,
    editTitle
} = require('../../github')

const comment = [
    'Hello, this issue has been closed because it does not conform to our issue requirements. Please use the [Issue Helper](https://www.iviewui.com/new-issue) to create an issue - thank you!'
].join('')

function containsChinese(title) {
    return /[\u4e00-\u9fa5]/.test(title);
}

function replyInvalid(on) {
    on('issues_opened', ({payload}) => {
        const issue = payload.issue
        const opener = issue.user.login

        if (issue.body.indexOf('<!-- generated by iview-issues. DO NOT REMOVE -->') === -1) {
            commentIssue(
                payload,
                format(comment, {
                    user: opener
                })
            )

            closeIssue(payload)
            addLabelsToIssue(payload, 'invalid')
        } else {
            // 自动翻译
            if (containsChinese(issue.title)) {
                translate(issue.title, (data) => {
                    editTitle(
                        payload,
                        data
                    )
                });
                translate(issue.body, (data) => {
                    const translate_str = 'Translation of this issue:\n' + data;
                    commentIssue(
                        payload,
                        format(translate_str, {
                            user: opener
                        })
                    )
                });
            }
        }
    })
}

module.exports = replyInvalid
