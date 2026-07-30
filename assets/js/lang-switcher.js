/* =====================================================================
   CUBOC — Navbar Language Switcher
   Uses Google Website Translator as the free translation engine, but
   hides its default UI completely and drives it from our own themed
   dropdown. Selection persists across pages via a cookie + localStorage.
===================================================================== */
(function () {
  "use strict";

  var COOKIE_NAME = "googtrans";
  var STORAGE_KEY = "cuboc_preferred_lang";
  var DEFAULT_LANG = "en";

  function setCookie(name, value) {
    var host = window.location.hostname;
    document.cookie = name + "=" + value + "; path=/";
    if (host && host.indexOf("localhost") === -1) {
      document.cookie = name + "=" + value + "; path=/; domain=" + host;
      document.cookie = name + "=" + value + "; path=/; domain=." + host;
    }
  }

  function getStoredLang() {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
    } catch (e) {
      return DEFAULT_LANG;
    }
  }

  function storeLang(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
  }

  function updateToggleLabel(lang) {
    document.querySelectorAll(".lang-switcher").forEach(function (root) {
      var codeEl = root.querySelector(".lang-switcher__current");
      var option = root.querySelector('.lang-option[data-lang="' + lang + '"]');
      if (codeEl) {
        codeEl.textContent = lang.toUpperCase();
      }
      root.querySelectorAll(".lang-option").forEach(function (a) {
        a.classList.toggle("is-active", a.getAttribute("data-lang") === lang);
      });
    });
  }

  function applyLanguage(lang, opts) {
    opts = opts || {};
    storeLang(lang);
    updateToggleLabel(lang);

    if (lang === DEFAULT_LANG) {
      setCookie(COOKIE_NAME, "/en/en");
    } else {
      setCookie(COOKIE_NAME, "/en/" + lang);
    }

    // If Google's <select> is already present, drive it directly (no reload needed).
    var select = document.querySelector("#google_translate_element select.goog-te-combo");
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event("change"));
      return;
    }

    // Otherwise (engine not ready yet, e.g. first click on the page) reload so the
    // cookie we just set is picked up on load.
    if (!opts.silent) {
      window.location.reload();
    }
  }

  function wireDropdown() {
    document.querySelectorAll(".lang-switcher").forEach(function (root) {
      var toggle = root.querySelector(".lang-switcher__toggle");
      if (!toggle) return;

      toggle.addEventListener("click", function (e) {
        e.preventDefault();
        var isOpen = root.classList.contains("is-open");
        document.querySelectorAll(".lang-switcher.is-open").forEach(function (o) {
          o.classList.remove("is-open");
        });
        if (!isOpen) root.classList.add("is-open");
      });

      root.querySelectorAll(".lang-option").forEach(function (a) {
        a.addEventListener("click", function (e) {
          e.preventDefault();
          var lang = a.getAttribute("data-lang");
          root.classList.remove("is-open");
          applyLanguage(lang);
        });
      });
    });

    document.addEventListener("click", function (e) {
      if (!e.target.closest(".lang-switcher")) {
        document.querySelectorAll(".lang-switcher.is-open").forEach(function (o) {
          o.classList.remove("is-open");
        });
      }
    });
  }

  // Reflect saved language in the toggle label immediately (no flash of "EN").
  document.addEventListener("DOMContentLoaded", function () {
    wireDropdown();
    updateToggleLabel(getStoredLang());
  });

  // Called by the Google Translate script tag once it loads.
  window.googleTranslateElementInit = function () {
    new google.translate.TranslateElement(
      {
        pageLanguage: "en",
        includedLanguages:
          "en,hi,es,fr,de,ar,zh-CN,ru,pt,ja,bn,ta,te,mr,gu,kn,ur",
        autoDisplay: false,
      },
      "google_translate_element"
    );

    // Sync UI once the widget's <select> exists, and silently re-apply the
    // saved language in case the cookie approach didn't fully catch on load.
    var tries = 0;
    var poll = setInterval(function () {
      var select = document.querySelector("#google_translate_element select.goog-te-combo");
      tries++;
      if (select || tries > 40) {
        clearInterval(poll);
        var saved = getStoredLang();
        if (select && saved !== DEFAULT_LANG && select.value !== saved) {
          applyLanguage(saved, { silent: true });
        }
      }
    }, 250);
  };
})();
