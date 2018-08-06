# ClovaSkills_Hands-on

Clovaスキル×駅すぱあとWebサービス開発体験！初心者向けハンズオン

# ディレクトリ構成

```
root/
　├ CEK/
　│　　Clova Extensions Kit向け設定ファイル
　├ Heroku/
　│　　Heroku向け設定ファイル
　└ Skills/
　　　 サンプルスキル
```

# サンプルの使い方

## 前提条件

1. Herokuの登録＆メールアドレスの認証が終わっていること  
※IDとパスワードが必要  
https://signup.heroku.com/login
2. Clova Developer Centerに登録していること  
https://clova-developers.line.me/cek/#/list
3. LINEアプリをスマートフォンにインストールしていること  
※LINEのアカウントにメールアドレスを登録していること
4. LINE Clovaアプリをスマートフォンにインストールしていること

## 動作環境

* Windows  
コマンドプロンプト
* macOS  
ターミナル
* その他  
上記以外のUNIX端末エミュレータやLinexなど、コマンドが打てる環境であれば読み替えてください

## 環境設定

* **node.js**のインストール  
下記のコマンドでバージョンが表示されるかを確認してください  
```node -v```  
バージョンが表示されない場合は下記からインストールを行ってください
https://nodejs.org/ja/

* **Heroku CLI**のインストール  
下記のコマンドでバージョンが表示されるかを確認してください  
```heroku -v```  
バージョンが表示されない場合は下記からインストールを行ってください  
https://devcenter.heroku.com/articles/heroku-cli#download-and-install

* **Git**のインストール  
※通常、Heroku CLIを入れることでインストールされますが、正しく入っているかを確認します  
```git --version```  
バージョンが表示されない場合は下記からインストールを行ってください  
https://git-scm.com/downloads

## HerokuのHello World(リファレンス)

https://jp.heroku.com/nodejs

1. 下記のコマンドを打ってhello_worldを作成  
```mkdir hello_world```  
```cd hello_world```  
```npm init```  
※設定はすべてエンターでOK  
※hello_worldを変えたい場合は適当な名前でも可(途中設定ファイルのコピー時に名前の変更が必要になります)

2. **package.json**と**index.js**をコピー  
※Windowsの場合はエクスプローラーでOK  
※macOSでコピー先の場所がわからない場合は、下記のコマンドでFinderを開く  
```open .```

3. **Git**と**Heroku**の初期化  
```git init```  
```git add . && git commit -m "init"```  
```heroku create```  
※herokuへのログイン(メールアドレス＆パスワード)が必要  
※プロジェクトはランダムな名前になるため、変更する場合は下記を入力  
```> heroku create プロジェクト名```

4. **Heroku**にアップロード  
```git push heroku master```  
ブラウザでアクセスできることを確認  
Herokuにアップロードした際、URLが表示されているので、コピーしてアクセスする  
`https://xxxxx-xxxxx-xxxxx.herokuapp.com/`

## CEKの設定
1. アカウントでログインする  
https://clova-developers.line.me/cek/#/list

2. チャンネルを作成する  
※通常は登録者名でチャンネルを作成  
※企業アカウントで企業名をチャンネルを作成する方法でも可

3. スキルを作成する
    1. スキルを登録する  
**Channel Name**：スキル名など  
**タイプ**：カスタム  
**使用する言語**：日本語  
**Extension ID**：特にない場合は「com.あなたのフルネーム.skill.first」としてください  
**スキル名**：スキル名  
**呼び出し名(メイン)**：スキル名と同一  
**呼び出し名(サブ)**：空  
**AudioPlayerの使用**：いいえ  
**提供者について**：個人でもOK  
**LINEとの連携**：しない  
※Channel NameとExtension IDは後から変更できないため、変な値は設定しないこと  
※スキル名/呼び出し名は、次の要件を満たしていることが必要です
        * 単語1語でないこと
        * 人名や地名、場所でないこと
        * Clovaの機能に影響があるフレーズを含まないこと
        * 他スキルと同一または類似する名称でないこと
        * 誤解を招く表現が含まれないこと
        * 利用規約に違反していないこと

    2. サーバー設定  
**アカウント連携の有無**：いいえ  
**ExtensionサーバーのURL**：HerokuのURLを登録する  

4. 対話モデルを登録する
    * スロットを登録する
        * 駅名スロット  
スロット名：STATION_NAME  
アップロードファイル：slottype_STATION_NAME.tsv  
    * カスタムインテントを登録する
        * 駅名インテント  
インテント名：StationNameIntent  
アップロードファイル：intent_StationNameIntent.tsv
        * 遊び方インテント  
インテント名：HowtoIntent  
アップロードファイル：intent_HowtoIntent.tsv
        * ゲーム終了インテント  
インテント名：EndIntent  
アップロードファイル：intent_EndIntent.tsv

5. スキルをビルドする  
　※ビルドには時間がかかるため、その間にスキルの実装を開始します

## 実装する

※Windowsの場合、メモ帳を利用すると文字化けや改行コードがおかしくなることがあります。  
その際はTeraPadなど、他のテキストエディタを利用してください。  
また、macOSはテキストエディットなどを利用してください。

1. **Skills/index.js**の内容を**index.js**に反映
2. Webサービスのアクセスキーを書き換え  
下記のkeycodeにWebサービスのアクセスキーを設定します  
`var key = "keycode";`
3. extensionIdを書き換え  
スキル登録時のExtension IDを設定します  
`var extensionId = "extensionId";`
4. 更新分をHerokuに反映  
HerokuのHello Worldで利用したコマンドと同様に下記を実行  
```git add . && git commit -m “change”```  
```git push heroku master```

## スキルを確認する
対話モデル→テストから実際に「東京」などを入れて試してみます  

## 実機確認
1. LINE Clovaアプリのデバイス追加でスピーカーを登録
    1. LINE Clovaアプリを開いて、スピーカーアイコンをタップする  
    ※Clovaが見つからない場合は背面の音声認識マイクを6秒以上押す
    2. 呼び名を変更してみる  
※ハンズオンでは多くの方が参加しているため、混信します。変更してみてください

2. デバッグをオンにする  
テスト→発話履歴を**オン**にします

3. 動作確認する  
「ねぇ、Clova、”スキル名”を開いて」と呼んでみる  
※呼び名が違う場合は設定した呼び名で呼び出してください

4. スキルがうまく認識しない場合
    * 言葉として認識しているか確認しよう  
言葉として認識できない場合は「呼び出し名(メイン)」の変更を検討します
    * 言葉として認識しているが、漢字が違う  
認識したスキル名を「呼び出し名(サブ)」に追加します
    * 何度か呼び出してみて揺れがある場合  
「呼び出し名(サブ)」に追加するか、「呼び出し名(メイン)」の変更を検討します

5. 遊ぶ  
起動した後、駅名を言っていきます。  
「遊び方」と言うと遊び方を教えてくれます。  
「負けた」と言うとゲームが終わります。  

## カスタマイズする  
あとは自由に路線を変えてみたり、ゲームの内容を変えてみてください。

### カスタマイズ例1：効果音をつけてみる

1. mp3ファイルを公開環境に置く
2. レスポンスにmp3ファイルのURLをつける  
```response.write(JSON.stringify(createResponse(sessionAttributes, false, "https://xxx.xxx/hoge.mp3,「" + data.request.intent.slots.stationName.value + "」は山の手線に存在します。他の駅名をどうぞ。")));```

    ※今回のサンプルスキルではカンマ区切りでmp3ファイルを指定することで、その音声ファイルを再生します  
`"テキスト,URL,テキスト"`

### カスタマイズ例2：正解数のカウント機能をつけてみる
1. sessionAttributesにカウント数を格納する  
```sessionAttributes.count = sessionAttributes.count !== undefined ? sessionAttributes.count + 1 : 1;```
2. カウント数を発話する  
```response.write(JSON.stringify(createResponse(sessionAttributes, false, "「" + data.request.intent.slots.stationName.value + "」は山の手線に存在します。" + String(sessionAttributes.count) + "回目の正解です。他の駅名をどうぞ。")));```

## 最後に  
LINE Clovaをレンタルしている方は接続の解除を行ってください
