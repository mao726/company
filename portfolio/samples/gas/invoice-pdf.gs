/**
 * サンプル3：請求先リストから請求書PDFを一括作成し、Googleドライブに保存
 *
 * シート「請求先」：A=会社名, B=担当者, C=品目, D=数量, E=単価, F=PDF作成日（自動記入）
 * シート「請求書テンプレート」：B3=会社名, B4=担当者, B8=品目, C8=数量, D8=単価, E8=金額, E12=合計, E2=発行日
 * 使い方：CONFIG.folderId に保存先フォルダのIDを入れ、メニュー「請求書」>「未作成分をPDF化」を実行
 */
const CONFIG = {
  listSheet: '請求先',
  templateSheet: '請求書テンプレート',
  folderId: 'ここにドライブのフォルダID',
  timeZone: 'Asia/Tokyo',
};

function onOpen() {
  SpreadsheetApp.getUi().createMenu('請求書').addItem('未作成分をPDF化', 'createInvoices').addToUi();
}

function createInvoices() {
  const ss = SpreadsheetApp.getActive();
  const list = ss.getSheetByName(CONFIG.listSheet);
  const tpl = ss.getSheetByName(CONFIG.templateSheet);
  const folder = DriveApp.getFolderById(CONFIG.folderId);
  const today = Utilities.formatDate(new Date(), CONFIG.timeZone, 'yyyy/MM/dd');
  const rows = list.getDataRange().getValues();
  let created = 0;

  for (let i = 1; i < rows.length; i++) {
    const [company, person, item, qty, price, doneAt] = rows[i];
    if (!company || doneAt) continue;

    const amount = Number(qty) * Number(price);
    tpl.getRange('E2').setValue(today);
    tpl.getRange('B3').setValue(company);
    tpl.getRange('B4').setValue(person);
    tpl.getRange('B8:E8').setValues([[item, qty, price, amount]]);
    tpl.getRange('E12').setValue(amount);
    SpreadsheetApp.flush();

    const blob = exportSheetAsPdf_(ss, tpl).setName(`請求書_${company}_${today.replace(/\//g, '')}.pdf`);
    folder.createFile(blob);
    list.getRange(i + 1, 6).setValue(today);
    created++;
  }
  SpreadsheetApp.getUi().alert(`${created}件の請求書PDFを作成しました。`);
}

function exportSheetAsPdf_(ss, sheet) {
  const url = `https://docs.google.com/spreadsheets/d/${ss.getId()}/export?format=pdf`
    + `&gid=${sheet.getSheetId()}&size=A4&portrait=true&fitw=true&gridlines=false`
    + '&sheetnames=false&printtitle=false&pagenumbers=false';
  const res = UrlFetchApp.fetch(url, {
    headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
  });
  return res.getBlob();
}
