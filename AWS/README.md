# ClovaSkills_AWS

AWS環境向けClovaスキル設定

## はじめに

Alexa向けにリリース済みのスキルをClovaに移植する場合やHerokuではなくAWS環境を使ってClovaスキルを開発するためのサンプルです。

※このサンプルはClovaスキルのリファレンスではありません  
※このサンプルは公式サンプルではありません  
※このサンプルはLINE株式会社、および、アマゾンウェブサービスジャパン株式会社とは一切関係ありません

## スキル作成手順

### Lambda関数を作成する

ランタイムは `node.js 6.10` もしくは `node.js 8.10` を選択します  
ロールは `CloudWatch` への書き込み権限など、最低限のものでかまいません
1. このディレクトリにある**index.js**を貼り付け
2. Webサービスのアクセスキーを書き換え  
下記のkeycodeにWebサービスのアクセスキーを設定します  
`var key = "keycode";`
3. extensionIdを書き換え  
スキル登録時のExtension IDを設定します  
`var extensionId = "extensionId";`

### API Gatewayを設定する

1. 必要に応じて新しいAPIの作成
1. POSTでメソッドを追加  
※リソースの階層は問いません
2. 呼び出すLambda関数に作成したスキルを指定
3. メソッドリクエストのHTTPリクエストヘッダーに**SignatureCEK**を追加
4. 統合リクエストのマッピングテンプレートに下記を追加  
リクエスト本文のパススルー：**テンプレートが定義されていない場合 (推奨)**   
Content-Type：**application/json**  
テンプレート：
    ```
    {
        "body":$input.body,
        "headers":{
            "SignatureCEK":"$input.params('SignatureCEK')"
        }
    }
    ```

6. APIのデプロイを行う  
https://xxxxx.execute-api.ap-northeast-1.amazonaws.com/{$ステージ名}/{$リソース名}

## スキルを作成する

CEKにてスキルを設定します
