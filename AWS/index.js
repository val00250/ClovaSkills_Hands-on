var http = require('http');
var crypto = require('crypto');

var HTTP_TIMEOUT = 1000;
var EKISPERT_API = 'http://api.ekispert.jp/v1/json/';
var key = "keycode";

var extensionId = "extensionId";

exports.handler = (event, context, callback) => {
    if (event.body !== undefined && event.headers !== undefined) {
        var body = JSON.stringify(event.body);
        var signature = event.headers.SignatureCEK;
        var pkey = getCertificate();
        var verifier = crypto.createVerify('RSA-SHA256');
        verifier.update(body);
        var verified = verifier.verify(pkey, signature, 'base64');
        if (!verified) {
            context.fail("signature error");
        } else {
            var data = JSON.parse(body);
            if (data.context !== undefined && data.context.System !== undefined && data.context.System.application !== undefined && data.context.System.application.applicationId === extensionId) {
                intentProcessing(data, context);
            } else {
                context.fail("extensionId error");
            }
        }
    } else {
        context.fail("parameter error");
    }
};

/**
 * インテント処理
 */
function intentProcessing(data, context) {
    var sessionAttributes = data.session.sessionAttributes !== undefined ? data.session.sessionAttributes : {};
    if (data.request !== undefined && data.request.type !== undefined) {
        if (data.request.type === "LaunchRequest") {
            //LaunchRequestの処理
            context.succeed(createResponse(sessionAttributes, false, "クローバのハンズオンにようこそ。このスキルでは山の手線の駅かどうか判定できます。では、山の手線にある駅名を言ってください。"));
        } else if (data.request.type === "IntentRequest") {
            //インテントの処理
            switch (data.request.intent.name) {
                case "StationNameIntent":
                    //駅名をコールした際の処理
                    var url = EKISPERT_API + "station?key=" + key + "&railName=" + encodeURIComponent("ＪＲ山手線外回り") + "&direction=none";
                    getResponse(url).then(function (result) {
                        if (result !== undefined && result.ResultSet !== undefined && result.ResultSet.Point !== undefined) {
                            var stations = [];
                            if (result.ResultSet.Point instanceof Array) {
                                for (var i = 0; i < result.ResultSet.Point.length; i++) {
                                    stations.push(getShotName(result.ResultSet.Point[i].Station.Name));
                                }
                            } else {
                                stations.push(getShotName(result.ResultSet.Point.Station.Name));
                            }
                            if (stations.indexOf(data.request.intent.slots.stationName.value) !== -1) {
                                context.succeed(createResponse(sessionAttributes, false, "「" + data.request.intent.slots.stationName.value + "」は山の手線に存在します。他の駅名をどうぞ。"));
                            } else {
                                context.succeed(createResponse(sessionAttributes, false, "山の手線に「" + data.request.intent.slots.stationName.value + "」はありません。他の駅名をどうぞ。"));
                            }
                        } else {
                            context.succeed(createResponse(sessionAttributes, true, "駅名が取得できませんでした。"));
                        }
                    }, function (err) {
                        console.log(err);
                        context.succeed(createResponse(sessionAttributes, true, "駅すぱあととの通信でエラーが発生しました。"));
                    });
                    break;
                case "HowtoIntent":
                    //遊び方インテントが呼び出された際の処理
                    context.succeed(createResponse(sessionAttributes, false, "このスキルでは山の手線の駅かどうか判定できます。では、山の手線にある駅名を言ってください。"));
                    break;
                case "EndIntent":
                    //終了インテントが呼び出された際の処理
                    context.succeed(createResponse(sessionAttributes, true, "スキルを遊んでくれてありがとう。また呼んでください。"));
                    break;
                default:
                    //ビルトインインテントが呼び出された場合の処理
                    context.succeed(createResponse(sessionAttributes, false, "認識できない駅名、または、インテントが指定されました。もう一度、話しかけてください。"));
            }
        }
    } else {
        context.succeed(createResponse(sessionAttributes, false, "不正なリクエストが送信されました。"));
    }
}

/**
 * レスポンスを作成する
 */
function createResponse(sessionAttributes, sessionEnd, message) {
    let values;
    let messages = message.split(",");
    if (messages.length == 1) {
        values = {
            "type": "PlainText",
            "lang": "ja",
            "value": message
        };
    } else {
        values = [];
        for (var i = 0; i < messages.length; i++) {
            if (messages[i].indexOf("http") == 0) {
                values.push({
                    "type": "URL",
                    "lang": "",
                    "value": messages[i]
                });
            } else {
                values.push({
                    "type": "PlainText",
                    "lang": "ja",
                    "value": messages[i]
                });
            }
        }
    }
    let response = {
        "version": "0.1.0",
        "sessionAttributes": sessionAttributes,
        "response": {
            "outputSpeech": {
                "type": messages.length == 1 ? "SimpleSpeech" : "SpeechList",
                "values": values
            },
            "card": {},
            "directives": [],
            "shouldEndSession": sessionEnd
        }
    };
    return response;
}

/**
 * 指定したURLにアクセスしてレスポンスを取得する
 */
function getResponse(url) {
    return new Promise((resolve, reject) => {
        console.log("API URL: " + url);
        let req = http.get(url, function (res) {
            res.setEncoding('utf8');
            let body = '';
            res.on("data", function (chunk) {
                body += chunk;
            });
            res.on('end', function (res) {
                let resultSet = JSON.parse(body || "null");
                resolve(resultSet);
            });
        });
        //Webサービスへのアクセス時のタイムアウト設定
        req.setTimeout(HTTP_TIMEOUT);
        req.on('timeout', function () {
            console.log('request timed out');
            req.abort();
            reject();
        });
        //アクセスキー不正などのチェック
        req.on('error', function (err) {
            console.log("Error: " + err.code + ", " + err.message);
            reject();
        });
    });
}

/**
 * カッコつきの駅名を補正する
 */
function getShotName(name) {
    if (name.indexOf("(") !== -1) {
        return name.substr(0, name.indexOf("("));
    } else {
        return name;
    }
}

/**
 * 公開鍵の取得
 */
function getCertificate() {
    return `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwiMvQNKD/WQcX9KiWNMb
nSR+dJYTWL6TmqqwWFia69TyiobVIfGfxFSefxYyMTcFznoGCpg8aOCAkMxUH58N
0/UtWWvfq0U5FQN9McE3zP+rVL3Qul9fbC2mxvazxpv5KT7HEp780Yew777cVPUv
3+I73z2t0EHnkwMesmpUA/2Rp8fW8vZE4jfiTRm5vSVmW9F37GC5TEhPwaiIkIin
KCrH0rXbfe3jNWR7qKOvVDytcWgRHJqRUuWhwJuAnuuqLvqTyAawqEslhKZ5t+1Z
0GN8b2zMENSuixa1M9K0ZKUw3unzHpvgBlYmXRGPTSuq/EaGYWyckYz8CBq5Lz2Q
UwIDAQAB
-----END PUBLIC KEY-----`;
}
