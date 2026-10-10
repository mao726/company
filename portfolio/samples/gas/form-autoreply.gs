/**
 * サンプル1：Googleフォームの回答に自動返信＋担当者へ通知
 *
 * 使い方
 *  1. フォームの回答先スプレッドシートを開き、拡張機能 > Apps Script にこのコードを貼り付ける
 *  2. 下の CONFIG を書き換える
 *  3. setupTrigger を1回だけ実行する（初回は権限の許可が必要）
 */
const CONFIG = {
  sheetName: 'フォームの回答 1',
  emailColumnTitle: 'メールアドレス',
  nameColumnTitle: 'お名前',
  staffEmail: 'staff@example.com',
  shopName: '〇〇サロン',
};

function setupTrigger() {
  const ss = SpreadsheetApp.getActive();
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'onFormSubmit')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('onFormSubmit').forSpreadsheet(ss).onFormSubmit().create();
}

function onFormSubmit(e) {
  const answers = e.namedValues; // { 質問タイトル: [回答] }
  const email = (answers[CONFIG.emailColumnTitle] || [''])[0].trim();
  const name = (answers[CONFIG.nameColumnTitle] || ['お客様'])[0].trim();
  const summary = Object.keys(answers)
    .map(q => `■ ${q}\n${answers[q].join(', ')}`)
    .join('\n\n');

  if (email) {
    MailApp.sendEmail({
      to: email,
      subject: `【${CONFIG.shopName}】お問い合わせを受け付けました`,
      body: `${name} 様\n\nお問い合わせありがとうございます。\n以下の内容で受け付けました。2営業日以内にご連絡いたします。\n\n${summary}\n\n${CONFIG.shopName}`,
    });
  }

  MailApp.sendEmail({
    to: CONFIG.staffEmail,
    subject: `【新規】${name} 様からお問い合わせ`,
    body: `${summary}\n\nスプレッドシート：${SpreadsheetApp.getActive().getUrl()}`,
  });

  // 対応状況の列に記録（最終列の右に「自動返信」列を作る）
  const sheet = e.range.getSheet();
  const statusCol = ensureColumn_(sheet, '自動返信');
  sheet.getRange(e.range.getRow(), statusCol)
    .setValue(email ? `送信済 ${new Date().toLocaleString('ja-JP')}` : 'メール未入力');
}

function ensureColumn_(sheet, title) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idx = headers.indexOf(title);
  if (idx >= 0) return idx + 1;
  const col = headers.length + 1;
  sheet.getRange(1, col).setValue(title);
  return col;
}
