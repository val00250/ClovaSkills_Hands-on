var http = require('http');
var crypto = require('crypto');

//駅すぱあとWebサービスとの通信タイムアウト時間(ms)
var HTTP_TIMEOUT = 1000;
//駅すぱあとWebサービスのエンドポイント
var EKISPERT_API = 'http://api.ekispert.jp/v1/json/';
//駅すぱあとWebサービスのアクセスキー
var key = "keycode";
//ClovaスキルのExtension ID
var extensionId = "extensionId";

http.createServer(function (request, response) {
    //POSTリクエストかどうかのチェック
    if (request.method === 'POST') {
        var body = '';
        request.on('data', function (dat) {
            body += dat;
        });
        request.on('end', function () {
            //bodyが全て受信できたらリクエストメッセージを検証
            var signature = request.headers[String('SignatureCEK').toLocaleLowerCase()];
            var pkey = getCertificate();
            var verifier = crypto.createVerify('RSA-SHA256');
            verifier.update(body);
            var verified = verifier.verify(pkey, signature, 'base64');
            if (!verified) {
                //検証に失敗した場合
                response.writeHead(403, { "Content-Type": "text/plain" });
                response.end("signature error");
            } else {
                //検証に成功した場合はJSONを解析(オブジェクトをコピー)
                var data = JSON.parse(body);
                //Extension IDを検証
                if (data.context !== undefined && data.context.System !== undefined && data.context.System.application !== undefined && data.context.System.application.applicationId === extensionId) {
                    intentProcessing(data, response);
                } else {
                    response.writeHead(403, { "Content-Type": "text/plain" });
                    response.end("extensionId error");
                }
            }
        });
    } else {
        response.writeHead(405, { "Content-Type": "text/plain" });
        response.end("post error");
    }
}).listen(process.env.PORT);

/**
 * インテント処理
 */
function intentProcessing(data, response) {
    //sessionAttributesを抽出
    var sessionAttributes = data.session.sessionAttributes !== undefined ? data.session.sessionAttributes : {};
    if (data.request !== undefined && data.request.type !== undefined) {
        if (data.request.type === "LaunchRequest") {
            //LaunchRequestの処理
            response.write(JSON.stringify(createResponse(sessionAttributes, false, "クローバのハンズオンにようこそ。このスキルでは山の手線の駅かどうか判定できます。では、山の手線にある駅名を言ってください。")));
            response.end();
        } else if (data.request.type === "IntentRequest") {
            //インテントの処理
            switch (data.request.intent.name) {
                case "StationNameIntent":
                    //駅名をコールした際の処理
                    var url = EKISPERT_API + "station?key=" + key + "&railName=" + encodeURIComponent("ＪＲ山手線外回り") + "&direction=none";
                    getResponse(url).then(function (result) {
                        if (result !== undefined && result.ResultSet !== undefined && result.ResultSet.Point !== undefined) {
                            //駅すぱあとWebサービスから取得した駅名を配列に格納
                            var stations = [];
                            if (result.ResultSet.Point instanceof Array) {
                                for (var i = 0; i < result.ResultSet.Point.length; i++) {
                                    stations.push(getShotName(result.ResultSet.Point[i].Station.Name));
                                }
                            } else {
                                stations.push(getShotName(result.ResultSet.Point.Station.Name));
                            }
                            //駅すぱあとWebサービスから取得した駅名と発話内容を比較
                            if (stations.indexOf(data.request.intent.slots.stationName.value) !== -1) {
                                response.writeHead(200, { "Content-Type": "application/json" });
                                response.write(JSON.stringify(createResponse(sessionAttributes, false, "「" + data.request.intent.slots.stationName.value + "」は山の手線に存在します。他の駅名をどうぞ。")));
                                response.end();
                            } else {
                                response.writeHead(200, { "Content-Type": "application/json" });
                                response.write(JSON.stringify(createResponse(sessionAttributes, false, "山の手線に「" + data.request.intent.slots.stationName.value + "」はありません。他の駅名をどうぞ。")));
                                response.end();
                            }
                        } else {
                            response.writeHead(200, { "Content-Type": "application/json" });
                            response.write(JSON.stringify(createResponse(sessionAttributes, true, "駅名が取得できませんでした。")));
                            response.end();
                        }
                    }, function (err) {
                        console.log(err);
                        response.writeHead(200, { "Content-Type": "application/json" });
                        response.write(JSON.stringify(createResponse(sessionAttributes, true, "駅すぱあととの通信でエラーが発生しました。")));
                        response.end();
                    });
                    break;
                case "HowtoIntent":
                    //遊び方インテントが呼び出された際の処理
                    response.writeHead(200, { "Content-Type": "application/json" });
                    response.write(JSON.stringify(createResponse(sessionAttributes, false, "このスキルでは山の手線の駅かどうか判定できます。では、山の手線にある駅名を言ってください。")));
                    response.end();
                    break;
                case "EndIntent":
                    //終了インテントが呼び出された際の処理
                    response.writeHead(200, { "Content-Type": "application/json" });
                    response.write(JSON.stringify(createResponse(sessionAttributes, true, "スキルを遊んでくれてありがとう。また呼んでください。")));
                    response.end();
                    break;
                default:
                    //ビルトインインテントが呼び出された場合の処理
                    response.writeHead(200, { "Content-Type": "application/json" });
                    response.write(JSON.stringify(createResponse(sessionAttributes, false, "認識できない駅名、または、インテントが指定されました。もう一度、話しかけてください。")));
                    response.end();
            }
        }
    } else {
        response.writeHead(400, { "Content-Type": "application/json" });
        response.write(JSON.stringify(createResponse(sessionAttributes, false, "不正なリクエストが送信されました。")));
        response.end();
    }
}

/**
 * レスポンスを作成する
 * @param {object} sessionAttributes - sessionAttributesのオブジェクト
 * @param {boolean} sessionEnd - セッションを終わるかどうか
 * @param {string} message - 発話内容
 */
function createResponse(sessionAttributes, sessionEnd, message) {
    //音声情報の値
    let values;
    //メッセージの分解
    let messages = message.split(",");
    if (messages.length == 1) {
        //シンプルな文字列の場合はPlainTextとして処理
        values = {
            "type": "PlainText",
            "lang": "ja",
            "value": message
        };
    } else {
        //複数の文字列やURLの場合は分解してSpeechListにする
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
    //レスポンスメッセージ
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
