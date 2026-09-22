/**
 * Paste this whole file into Extensions > Apps Script on a new
 * Google Sheet, then deploy it as a Web App (see README for the
 * exact steps). Every test submission gets POSTed here as JSON
 * and appended as a new row in the "Results" sheet.
 */

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Results");
  if (!sheet) sheet = ss.insertSheet("Results");

  var data = JSON.parse(e.postData.contents);
  var answers = data.answers || {};
  var qKeys = Object.keys(answers).sort(function (a, b) { return Number(a) - Number(b); });

  // Write the header row once, sized to however many questions this submission has.
  if (sheet.getLastRow() === 0) {
    var headers = ["Submitted At", "Username", "Name", "Score", "Total", "Violations", "Elapsed (s)"];
    qKeys.forEach(function (k) { headers.push("Q" + (Number(k) + 1)); });
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  var row = [
    data.submittedAt || new Date().toISOString(),
    data.username || "",
    data.name || "",
    data.correct,
    data.total,
    data.violations,
    data.elapsedSeconds
  ];
  qKeys.forEach(function (k) { row.push(answers[k]); });
  sheet.appendRow(row);

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Optional: run this once from the Apps Script editor (Run button,
 * with this function selected) to create a self-sorting "Rank List"
 * sheet next to "Results". It rebuilds itself with a formula, so you
 * never need to re-run this — just open the Rank List tab any time.
 */
function setupRankListSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var existing = ss.getSheetByName("Rank List");
  if (existing) ss.deleteSheet(existing);
  var rank = ss.insertSheet("Rank List");
  rank.getRange("A1").setValue(
    "=SORT(QUERY(Results!A2:G,\"select B,C,D,E,F,G where B is not null\",0),3,FALSE,6,TRUE)"
  );
  rank.getRange("A1").setFontStyle("italic").setFontColor("#999999");
  // Header row above the formula's output for readability.
  rank.insertRowBefore(1);
  rank.getRange("A1:F1").setValues([["Username", "Name", "Score", "Total", "Violations", "Elapsed (s)"]]);
  rank.getRange("A1:F1").setFontWeight("bold");
  rank.setFrozenRows(1);
}
