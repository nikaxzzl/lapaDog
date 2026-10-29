/* js/analytics.js — все события GA4 в одном файле */
(function () {
  'use strict';

  var GA_ID = 'G-XVT5FS2HTK';

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID); // без debug_mode

  function send(name, params) {
    var clean = {};
    if (params) {
      Object.keys(params).forEach(function (k) {
        var v = params[k] == null ? '' : String(params[k]);
        clean[k] = v.length > 100 ? v.slice(0, 100) : v;
      });
    }
    gtag('event', name, clean);
  }

  // Делегирование data-event
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-event]');
    if (!el) return;
    var name = el.getAttribute('data-event');
    if (!name) return;

    var params = {};
    Array.prototype.forEach.call(el.attributes, function (attr) {
      if (attr.name.indexOf('data-') === 0 && attr.name !== 'data-event') {
        params[attr.name.slice(5).replace(/-/g, '_')] = attr.value;
      }
    });

    if (name === 'cta_click' || name === 'social_click') {
      params.page_section = el.getAttribute('data-page-section') ||
        (el.closest('section') && el.closest('section').id) || 'unknown';
    }
    send(name, params);
  }, true);

  // scroll 90%
  var scrolled = false;
  window.addEventListener('scroll', function () {
    if (scrolled) return;
    var h = document.documentElement;
    if ((h.scrollTop + window.innerHeight) / h.scrollHeight >= 0.9) {
      scrolled = true;
      send('scroll', { percent_scrolled: 90 });
    }
  }, { passive: true });

  // outbound click
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/^https?:\/\//i.test(href) && href.indexOf(location.host) === -1) {
      send('click', { link_url: href, outbound: 'true' });
    }
  }, true);

  // file_download
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href$=".pdf"], a[download]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var file = href.split('/').pop() || 'file';
    var ext = file.indexOf('.') > -1 ? file.split('.').pop() : '';
    send('file_download', { file_name: file, file_extension: ext });
  }, true);

  window.LapaAnalytics = {
    send: send,
    formStart: function (id) { send('form_start', { form_id: id }); },
    formSubmit: function (id) { send('form_submit', { form_id: id }); },
    formError: function (field, type) { send('form_error', { field_name: field, error_type: type }); },
    vaccineCalc: function (pet, age) { send('vaccine_calc', { pet_type: pet, age_weeks: age }); },
    generateLead: function (pet, service, source, done) {
      send('generate_lead', { lead_pet_type: pet, lead_service: service, lead_source: source });
      if (typeof done === 'function') setTimeout(done, 300);
    }
  };
})();