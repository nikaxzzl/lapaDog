const SPREADSHEET_ID = '1k8PA1CkCwjY_hQaVpb9vShLfIKEiV_G_ti86mwSy5Q8';
const SHEET_NAME = 'leads';

function doPost(e) {
  try {
    var data;

    // Проверяем, как пришли данные (из FormData или JSON)
    if (e.parameter && e.parameter.request_id) {
      data = e.parameter; 
    } else if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents); 
    } else {
      return json({ ok: false, error: 'Пустой запрос' });
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);

    if (isDuplicate(sheet, data.request_id)) {
      return json({ ok: true, request_id: data.request_id, duplicate: true });
    }

    const err = validate(data);
    if (err) return json({ ok: false, error: err });

    sheet.appendRow([
      data.request_id,
      new Date(),
      data.name.trim(),
      data.phone.trim(),
      (data.email || '').trim(),
      data.pet_type,
      data.service,
      data.utm_source || 'direct',
      data.utm_medium || 'none',
      data.utm_campaign || 'not_set',
      data.utm_content || 'not_set',
      'new',
    ]);

    return json({ ok: true, request_id: data.request_id });

  } catch (err) {
    return json({ ok: false, error: 'Ошибка сервера: ' + err.message });
  }
}

function isDuplicate(sheet, requestId) {
  if (!requestId) return false;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  return ids.indexOf(requestId) !== -1;
}

function validate(d) {
  const required = ['request_id', 'name', 'phone', 'pet_type', 'service'];
  for (const f of required) {
    if (d[f] === undefined || d[f] === null || String(d[f]).trim() === '') {
      return 'Поле «' + f + '» обязательно';
    }
  }
  
  const allFields = ['request_id', 'name', 'phone', 'email', 'pet_type', 'service', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  for (const f of allFields) {
    if (d[f] && String(d[f]).length > 200) {
      return 'Поле «' + f + '» длиннее 200 символов';
    }
  }
  
  const name = String(d.name).trim();
  if (name.length < 2 || name.length > 60) {
    return 'Имя должно быть от 2 до 60 символов';
  }
  
  const cleanPhone = String(d.phone).replace(/\D/g, '');
  if (cleanPhone.length !== 11 || cleanPhone.charAt(0) !== '7') {
    return 'Телефон должен быть в формате +7XXXXXXXXXX';
  }
  
  const email = (d.email || '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Некорректный e-mail';
  }
  
  if (['cat', 'dog', 'rabbit', 'other'].indexOf(d.pet_type) === -1) {
    return 'Недопустимый pet_type';
  }
  
  if (['consult', 'vaccine', 'chip', 'sterilization', 'analysis', 'home_visit'].indexOf(d.service) === -1) {
    return 'Недопустимый service';
  }
  
  return null;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
