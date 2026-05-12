// i18n.js - Language loading and t() function

const I18N = {
  strings: {},
  lang: "fr",

  async init() {
    const saved = localStorage.getItem("lang");
    const browser = navigator.language?.startsWith("fr") ? "fr" : "en";
    this.lang = saved || browser;
    await this.load(this.lang);
  },

  async load(lang) {
    try {
      const res = await fetch(`locales/${lang}.json`);
      this.strings = await res.json();
      this.lang = lang;
      localStorage.setItem("lang", lang);
    } catch (e) {
      console.error("i18n load error", e);
    }
  },

  t(key, vars = {}) {
    let str = this.strings[key] ?? key;
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, v);
    }
    return str;
  },
};

// Global shorthand
function t(key, vars) {
  return I18N.t(key, vars);
}
