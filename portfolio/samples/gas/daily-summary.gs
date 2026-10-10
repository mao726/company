/**
 * サンプル2：毎朝、前日の売上を集計してSlack（またはメール）に送信
 *
 * 想定シート「売上」：A列=日付, B列=カテゴリ, C列=金額（1行目は見出し）
 * 使い方：CONFIG を書き換え、setupTrigger を1回実行（毎朝8時台に自動実行）
 */
const CONFIG = {
  sheetName: '売上',
  slackWebhookUrl: '', // 空ならメールで送信
  reportEmail: 'owner@example.com',
  timeZone: 'Asia/Tokyo',
};

function setupTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'sendDailySummary')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('sendDailySummary').timeBased().everyDays(1).atHour(8).create();
}

function sendDailySummary() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(CONFIG.sheetName);
  const rows = sheet.getDataRange().getValues().slice(1);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const target = Utilities.formatDate(yesterday, CONFIG.timeZone, 'yyyy-MM-dd');

  const byCategory = {};
  let total = 0;
  rows.forEach(([date, category, amount]) => {
    if (!(date instanceof Date)) return;
    if (Utilities.formatDate(date, CONFIG.timeZone, 'yyyy-MM-dd') !== target) return;
    const value = Number(amount) || 0;
    byCategory[category] = (byCategory[category] || 0) + value;
    total += value;
  });

  const lines = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([c, v]) => `・${c}：${v.toLocaleString()}円`);
  const text = `📊 ${target} の売上\n合計：${total.toLocaleString()}円\n${lines.join('\n') || '・売上なし'}`;

  if (CONFIG.slackWebhookUrl) {
    UrlFetchApp.fetch(CONFIG.slackWebhookUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ text }),
    });
  } else {
    MailApp.sendEmail(CONFIG.reportEmail, `${target} の売上レポート`, text);
  }
}
