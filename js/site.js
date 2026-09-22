(function () {
  var STAGES = ["读取名单", "核对身份", "匹配当前游戏", "面板就绪"];
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var rail = document.getElementById("rail");
  var stage = document.getElementById("stage");
  var splash = document.getElementById("splash-inner");
  var cardsHost = document.getElementById("cards");
  var tpl = document.getElementById("card-tpl");
  var userCountEl = document.getElementById("user-count");
  var gameCountEl = document.getElementById("game-count");
  var injectCountEl = document.getElementById("inject-count");
  var introDone = false;

  function arm() {
    document.body.classList.add("armed");
  }

  function setRail(pct) {
    rail.style.width = Math.max(0, Math.min(100, pct)) + "%";
  }

  function onScroll() {
    var y = window.scrollY || 0;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (introDone) setRail((y / max) * 100);
    var p = Math.min(1, y / (window.innerHeight * 0.42));
    if (!reduce) {
      splash.style.opacity = String(1 - p);
      splash.style.transform = "translateY(" + (-28 * p) + "px)";
    }
  }

  function runIntro() {
    if (reduce) {
      arm();
      stage.textContent = "进游戏，打开面板。";
      introDone = true;
      onScroll();
      return;
    }
    requestAnimationFrame(function () {
      rail.style.transition = "width 1.5s cubic-bezier(0.23, 1, 0.32, 1)";
      setRail(100);
    });
    window.setTimeout(arm, 80);
    var i = 0;
    stage.textContent = STAGES[0];
    var timer = window.setInterval(function () {
      i += 1;
      if (i >= STAGES.length) {
        window.clearInterval(timer);
        stage.textContent = "进游戏，打开面板。";
        introDone = true;
        rail.style.transition = "width 80ms linear";
        onScroll();
        return;
      }
      stage.textContent = STAGES[i];
    }, 700);
  }

  function countTo(el, n) {
    if (!el) return;
    if (reduce) {
      el.textContent = String(n).padStart(2, "0");
      return;
    }
    var start = performance.now();
    function frame(now) {
      var p = Math.min(1, (now - start) / 900);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(eased * n)).padStart(2, "0");
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function renderGames(games) {
    cardsHost.textContent = "";
    games.forEach(function (g, idx) {
      var node = tpl.content.firstElementChild.cloneNode(true);
      node.setAttribute("data-place", g.placeId || "");
      node.querySelector(".cn").textContent = g.cn;
      node.querySelector(".en").textContent = g.en;
      var st = (g.status || "ok").toLowerCase();
      if (st !== "ok" && st !== "warn" && st !== "down") st = "ok";
      var statusEl = node.querySelector(".status");
      var statusLabel = { ok: "可用", warn: "警告", down: "不可用" }[st];
      statusEl.className = "status " + st;
      statusEl.title = statusLabel;
      statusEl.setAttribute("aria-label", statusLabel);
      node.querySelector(".blurb").textContent = g.blurb || "";
      var img = node.querySelector(".icon");
      img.alt = "";
      if (g.icon) {
        img.src = g.icon;
      } else {
        img.removeAttribute("src");
        img.classList.add("missing");
      }
      var feats = node.querySelector(".feats");
      (g.features || []).forEach(function (f) {
        var li = document.createElement("li");
        li.textContent = f;
        feats.appendChild(li);
      });
      var play = node.querySelector(".play");
      if (g.url) {
        play.href = g.url;
      } else {
        play.setAttribute("aria-disabled", "true");
        play.removeAttribute("href");
      }
      var head = node.querySelector(".card-head");
      var body = node.querySelector(".card-body");
      head.addEventListener("click", function () {
        var open = node.classList.toggle("open");
        head.setAttribute("aria-expanded", open ? "true" : "false");
        body.hidden = !open;
      });
      cardsHost.appendChild(node);
      window.setTimeout(function () {
        node.classList.add("in");
      }, reduce ? 0 : Math.min(idx, 12) * 35);
    });
  }

  function loadInjectCount(meta) {
    var url = (meta && meta.get) || "https://abacus.jasoncameron.dev/get/thekinghub/scriptinjects";
    fetch(url, { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var n = Number(data && data.value);
        if (!isFinite(n) || n < 0) throw new Error("bad");
        countTo(injectCountEl, n);
      })
      .catch(function () {
        if (injectCountEl) injectCountEl.textContent = "--";
      });
  }

  fetch("data/catalog.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      countTo(gameCountEl, (data.games || []).length);
      countTo(userCountEl, data.userCount || 0);
      renderGames(data.games || []);
      loadInjectCount(data.injects);
    })
    .catch(function () {
      stage.textContent = "清单加载失败";
    });

  window.addEventListener("scroll", onScroll, { passive: true });
  runIntro();
})();
