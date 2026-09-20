const root = document.documentElement;
// The opening diagram keeps its real text and works without JavaScript.
const flowFigure = document.querySelector('.agent-illustration');
const flowToggle = document.querySelector('.flow-motion-toggle');
if (flowFigure && flowToggle) {
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motionPreference.matches;
  function updateFlowMotion() {
    flowFigure.classList.toggle('motion-ready', !motionPreference.matches);
    flowFigure.classList.toggle('motion-paused', paused);
    flowToggle.hidden = motionPreference.matches;
    flowToggle.setAttribute('aria-pressed', String(paused));
    flowToggle.textContent = paused ? 'Play motion' : 'Pause motion';
  }
  flowToggle.addEventListener('click', () => { paused = !paused; updateFlowMotion(); });
  motionPreference.addEventListener('change', () => { paused = motionPreference.matches; updateFlowMotion(); });
  updateFlowMotion();
}
const themeToggle = document.querySelector(".theme-toggle");
const updateThemeLabel = () => {
  themeToggle?.setAttribute(
    "aria-label",
    `Switch to ${root.dataset.theme === "dark" ? "light" : "dark"} theme`,
  );
};
updateThemeLabel();
themeToggle?.addEventListener("click", () => {
  const theme = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = theme;
  try {
    localStorage.setItem("quietstaff-theme", theme);
  } catch {}
  updateThemeLabel();
});
const mediaTheme = matchMedia("(prefers-color-scheme: dark)");
mediaTheme.addEventListener("change", (event) => {
  try {
    if (localStorage.getItem("quietstaff-theme")) return;
  } catch {}
  if (new URLSearchParams(location.search).has("theme")) return;
  root.dataset.theme = event.matches ? "dark" : "light";
  updateThemeLabel();
});
const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".main-nav");
function closeMenu(focus = false) {
  nav?.classList.remove("is-open");
  menuButton?.setAttribute("aria-expanded", "false");
  if (focus) menuButton?.focus();
}
menuButton?.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
  if (open) nav.querySelector("a")?.focus();
});
nav?.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    menuButton?.getAttribute("aria-expanded") === "true"
  ) {
    closeMenu(true);
  }
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".site-header")) closeMenu();
});
matchMedia("(min-width: 621px)").addEventListener("change", () => closeMenu());
const tabList = document.querySelector(".module-tabs");
const tabs = [...document.querySelectorAll(".module-tab")];
const overview = document.querySelector("#one-overview");
let activeTab = null;
let pendingSeek = null;
let loadingMetadata = false;
let syncModulesWithVideo = true;
function applyPendingSeek() {
  if (pendingSeek === null || !overview || overview.readyState < 1) return;
  overview.currentTime = pendingSeek;
  // A seek to the current frame need not dispatch a seeked event.
  if (!overview.seeking && Math.abs(overview.currentTime - pendingSeek) < 0.1)
    pendingSeek = null;
}
function selectTab(tab, { focus = false, fromVideo = false } = {}) {
  if (!fromVideo) syncModulesWithVideo = false;
  activeTab = tab;
  tabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.querySelector(item.getAttribute("href")).hidden = !selected;
  });
  if (focus) tab.focus();
}
function watchChapter(start) {
  if (!overview) return;
  syncModulesWithVideo = true;
  pendingSeek = start;
  if (overview.readyState >= 1) applyPendingSeek();
  else if (!loadingMetadata) {
    loadingMetadata = true;
    overview.load();
  }
  overview.scrollIntoView({ block: "center", behavior: "auto" });
  overview.focus({ preventScroll: true });
  // Explicit user action starts playback; native controls remain the fallback.
  const playback = overview.play();
  playback?.catch(() => {});
}

function syncTabFromVideo() {
  // Ignore stale time events while a manual chapter choice is still loading/seeking.
  if (!syncModulesWithVideo || pendingSeek !== null || overview.seeking) return;
  const tab = [...tabs].reverse().find((item) =>
    overview.currentTime >= Number(item.dataset.chapterStart),
  );
  if (tab && tab !== activeTab) selectTab(tab, { fromVideo: true });
}
if (tabList) {
  tabList.setAttribute("role", "tablist");
  tabs.forEach((tab) => {
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", tab.getAttribute("href").slice(1));
    const panel = document.querySelector(tab.getAttribute("href"));
    panel.setAttribute("role", "tabpanel");
    panel.tabIndex = 0;
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      selectTab(tab);
    });
    tab.addEventListener("keydown", (event) => {
      let i = tabs.indexOf(tab);
      if (event.key === "ArrowRight") i = (i + 1) % tabs.length;
      else if (event.key === "ArrowLeft")
        i = (i - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") i = 0;
      else if (event.key === "End") i = tabs.length - 1;
      else return;
      event.preventDefault();
      selectTab(tabs[i], { focus: true });
    });
  });
  selectTab(
    tabs.find((tab) => tab.getAttribute("href") === location.hash) || tabs[0],
    { fromVideo: true },
  );
  window.addEventListener("hashchange", () => {
    const tab = tabs.find((t) => t.getAttribute("href") === location.hash);
    if (tab) selectTab(tab);
  });
}
document.querySelectorAll("[data-video-chapter]").forEach((link) => {
  link.addEventListener("click", (event) => {
    const start = Number(link.dataset.videoChapter);
    if (!overview || !Number.isFinite(start) || start < 0) return;
    event.preventDefault();
    watchChapter(start);
  });
});
if (overview && tabList) {
  overview.addEventListener("play", () => {
    syncModulesWithVideo = true;
    syncTabFromVideo();
  });
  overview.addEventListener("loadedmetadata", () => {
    loadingMetadata = false;
    applyPendingSeek();
  });
  overview.addEventListener("seeked", () => {
    if (pendingSeek !== null && Math.abs(overview.currentTime - pendingSeek) < 0.1)
      pendingSeek = null;
    syncTabFromVideo();
  });
  overview.addEventListener("timeupdate", syncTabFromVideo);
  overview.addEventListener("error", () => {
    loadingMetadata = false;
    pendingSeek = null;
  });
}
document.querySelectorAll("[data-module-link]").forEach((link) => {
  link.addEventListener("click", () => {
    const tab = document.querySelector(`#tab-${link.dataset.moduleLink}`);
    if (tab) selectTab(tab);
  });
});
const form = document.querySelector("#contact-form");
if (form) {
  const status = document.querySelector("#form-status");
  const submit = form.querySelector("button[type=submit]");
  const production =
    ["quietstaff.co.uk", "www.quietstaff.co.uk"].includes(location.hostname) &&
    location.protocol === "https:";
  const preview = !production;
  document.querySelector(".preview-note").hidden = !preview;
  submit.disabled = false;
  document.querySelectorAll("[data-interest]").forEach((link) =>
    link.addEventListener("click", () => {
      form.elements.subject.value = link.dataset.interest;
    }),
  );
  let pending = false;
  const report = (message, error = false) => {
    status.textContent = message;
    status.classList.toggle("error", error);
  };
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (pending) return;
    for (const name of ["name", "email", "message"])
      form.elements[name].value = form.elements[name].value.trim();
    if (!form.reportValidity()) return;
    const fields = Object.fromEntries(new FormData(form));
    fields.source = `Quiet Staff One ${location.pathname}`;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      report("Please enter a valid email address.", true);
      form.elements.email.focus();
      return;
    }
    if (new TextEncoder().encode(JSON.stringify(fields)).length > 10 * 1024) {
      report("Please shorten your message so the enquiry can be sent.", true);
      return;
    }
    pending = true;
    submit.disabled = true;
    submit.setAttribute("aria-busy", "true");
    report(preview ? "Testing the enquiry form…" : "Sending your enquiry…");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(
        production
          ? "https://quietstaff-contact.weathered-dust-84ba.workers.dev"
          : "/__preview/contact",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
          signal: controller.signal,
        },
      );
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error(
          "The service returned an unexpected response. Please try again or email contact@quietstaff.com.",
        );
      }
      if (!response.ok || !result || result.ok !== true) {
        const messages = {
          400: "Please check your details and try again.",
          403: "This enquiry could not be accepted from this page. Please email contact@quietstaff.com.",
          429: "Too many enquiries have been submitted. Please wait and try again, or email contact@quietstaff.com.",
          500: "Your enquiry could not be sent. Please try again or email contact@quietstaff.com.",
        };
        throw new Error(
          messages[response.status] ||
            "Your enquiry was not confirmed. Please try again or email contact@quietstaff.com.",
        );
      }
      if (preview) {
        report(
          "Simulation complete. No email was sent. Your details stay in this local preview.",
        );
      } else {
        report(
          "Thank you. Your enquiry has been sent. We’ll reply using the email address you provided.",
        );
        form.reset();
      }
    } catch (error) {
      report(
        error.name === "AbortError"
          ? "The request timed out. Delivery could not be confirmed. Please email contact@quietstaff.com before retrying."
          : error instanceof TypeError
            ? "The connection failed. Your enquiry was not confirmed. Please try again or email contact@quietstaff.com."
            : error.message,
        true,
      );
    } finally {
      clearTimeout(timeout);
      pending = false;
      submit.disabled = false;
      submit.removeAttribute("aria-busy");
    }
  });
}
