/**
 * LapaDok — приёмник заявок (ТЗ-06/2026, раздел 6).
 * Развернуть как веб-приложение: Execute as "Me", Who has access — "Anyone".
 * URL веб-приложения вставить в contacts.html в window.LEADS_ENDPOINT.
 *
 * Перед первым запуском:
 *   1. Создать Google Таблицу «LapaDok — Leads».
 *   2. Скопировать её ID из адресной строки в SPREADSHEET_ID.
 *   3. Запустить функцию setupSheet() из редактора Apps Script.
 */

// ⚠️ ЗАМЕНИТЕ НА ID ВАШЕЙ ТАБЛИЦЫ
var SPREADSHEET_ID = 'ВСТАВЬТЕ_ID_ТАБЛИЦЫ';
var SHEET_NAME = 'leads';

var HEADERS = [
  'request_id', 'created_at', 'name', 'phone', 'email',
  'pet_type', 'service', 'utm_source', 'utm_medium',
  'utm_campaign', 'utm_content', 'status'
];

var ALLOWED_PET = ['cat', 'dog', 'rabbit', 'other'];
var ALLOWED_SERVICE = ['consult', 'vaccine', 'chip', 'sterilization', 'analysis', 'home_visit'];
var ALLOWED_STATUS = ['new', 'contacted', 'appointment', 'visited', 'lost'];

// ============================================================
// ПРИЁМ ЗАЯВКИ
// ============================================================
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json({ ok: false, error: 'empty_request' });
    }

    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return json({ ok: false, error: 'invalid_json' });
    }

    if (SPREADSHEET_ID === 'ВСТАВЬТЕ_ID_ТАБЛИЦЫ') {
      return json({ ok: false, error: 'server: SPREADSHEET_ID is not set' });
    }

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) return json({ ok: false, error: 'sheet_not_found' });

    // 1. Валидация
    var err = validate(data);
    if (err) return json({ ok: false, error: err });

    // 2. Дедупликация
    if (requestIdExists(sheet, data.request_id)) {
      return json({ ok: false, error: 'duplicate_request_id' });
    }

    // 3. Запись
    var row = [
      String(data.request_id),
      new Date(),
      String(data.name).trim(),
      String(data.phone).trim(),
      data.email ? String(data.email).trim() : '',
      data.pet_type,
      data.service,
      data.utm_source || 'direct',
      data.utm_medium || 'none',
      data.utm_campaign || 'not_set',
      data.utm_content || 'not_set',
      'new'
    ];
    sheet.appendRow(row);

    return json({ ok: true, request_id: data.request_id });
  } catch (err) {
    return json({ ok: false, error: 'server: ' + err.message });
  }
}

// ============================================================
// ВАЛИДАЦИЯ
// ============================================================
function validate(d) {
  if (!d || typeof d !== 'object') return 'empty_request';

  if (!d.request_id || String(d.request_id).length > 200) return 'request_id';
  if (!d.name || String(d.name).trim().length < 2 || String(d.name).trim().length > 60) return 'name';
  if (!d.phone || !/^\+7\d{10}$/.test(String(d.phone))) return 'phone';
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(d.email))) return 'email';
  if (ALLOWED_PET.indexOf(d.pet_type) === -1) return 'pet_type';
  if (ALLOWED_SERVICE.indexOf(d.service) === -1) return 'service';

  var utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  for (var i = 0; i < utmFields.length; i++) {
    var v = d[utmFields[i]];
    if (v && String(v).length > 200) return utmFields[i];
  }

  return null;
}

// ============================================================
// ПРОВЕРКА ДУБЛИКАТА
// ============================================================
function requestIdExists(sheet, requestId) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(requestId)) return true;
  }
  return false;
}

// ============================================================
// ОТВЕТ В JSON
// ============================================================
function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ ТАБЛИЦЫ
// ============================================================
function setupSheet() {
  if (SPREADSHEET_ID === 'ВСТАВЬТЕ_ID_ТАБЛИЦЫ') {
    SpreadsheetApp.getUi().alert('Сначала укажите SPREADSHEET_ID в начале кода.');
    return;
  }

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (sheet && sheet.getLastRow() > 1) {
    var ok = SpreadsheetApp.getUi().alert(
      'В листе «leads» уже есть данные. Очистить и пересоздать?',
      SpreadsheetApp.getUi().ButtonSet.YES_NO
    );
    if (ok !== SpreadsheetApp.getUi().Button.YES) return;
  }

  sheet = sheet || ss.insertSheet(SHEET_NAME);
  sheet.clear();

  // Заголовки
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight('bold')
    .setBackground('#2E8B57')
    .setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);

  // Выпадающий список status
  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(ALLOWED_STATUS, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 12, 1000, 1).setDataValidation(statusRule);

  // Подсветка пустых обязательных ячеек
  var requiredColumns = [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12];
  var emptyRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($A2<>"", OR(' +
      requiredColumns.map(function (c) {
        var col = columnLetter(c);
        return 'LEN(TRIM(' + col + '2))=0';
      }).join(',') + '))')
    .setBackground('#FDE2E1')
    .setRanges([sheet.getRange(2, 1, 1000, HEADERS.length)])
    .build();
  sheet.setConditionalFormatRules([emptyRule]);

  // Подсветка дубликатов request_id
  var dupRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($A2<>"", COUNTIF($A:$A, $A2) > 1)')
    .setBackground('#F9CB9C')
    .setRanges([sheet.getRange(2, 1, 1000, 1)])
    .build();
  sheet.setConditionalFormatRules([emptyRule, dupRule]);

  SpreadsheetApp.getUi().alert('Лист «leads» создан и настроен.');
}

// ============================================================
// НОМЕР СТОЛБЦА → БУКВА
// ============================================================
function columnLetter(num) {
  var letter = '';
  while (num > 0) {
    var rem = (num - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    num = Math.floor((num - 1) / 26);
  }
  return letter;
}

// ============================================================
// ЛИСТ crm_import
// ============================================================
function setupCrmImport() {
  if (SPREADSHEET_ID === 'ВСТАВЬТЕ_ID_ТАБЛИЦЫ') {
    SpreadsheetApp.getUi().alert('Сначала укажите SPREADSHEET_ID в начале кода.');
    return;
  }

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('crm_import') || ss.insertSheet('crm_import');
  sheet.clear();

  var headers = [
    'request_id', 'created_at', 'email', 'first_name', 'last_name',
    'phone_e164', 'pet_type', 'service', 'deal_stage', 'deal_name',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#2E8B57')
    .setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);

  var formulas = [
    '=IFERROR(Leads!A2,"")',
    '=IFERROR(Leads!B2,"")',
    '=IFERROR(Leads!E2,"")',
    '=IFERROR(IF(Leads!C2="","",TRIM(LEFT(Leads!C2,FIND(" ",Leads!C2&" ")-1))),"")',
    '=IFERROR(IF(Leads!C2="","",TRIM(SUBSTITUTE(Leads!C2,D2,""))),"")',
    '=IFERROR(IF(Leads!D2="","",IF(LEFT(Leads!D2,2)="+7",Leads!D2,"+7"&SUBSTITUTE(Leads!D2,"+7",""))),"")',
    '=IFERROR(Leads!F2,"")',
    '=IFERROR(Leads!G2,"")',
    '=IFERROR(VLOOKUP(Leads!L2,{"new","New lead";"contacted","Contacted";"appointment","Appointment booked";"visited","Closed won";"lost","Closed lost"},2,FALSE),"")',
    '=IFERROR(IF(D2="","",D2&" — "&G2&" — "&H2),"")',
    '=IFERROR(Leads!H2,"")',
    '=IFERROR(Leads!I2,"")',
    '=IFERROR(Leads!J2,"")',
    '=IFERROR(Leads!K2,"")'
  ];

  for (var i = 0; i < formulas.length; i++) {
    var col = columnLetter(i + 1);
    sheet.getRange(col + '2:' + col + '1000').setFormula(formulas[i]);
  }

  sheet.autoResizeColumns(1, headers.length);
  SpreadsheetApp.getUi().alert('Лист «crm_import» создан и настроен.');
}