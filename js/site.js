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
  var loaderVer = document.getElementById("loader-ver");
  var nameInput = document.getElementById("roblox-name");
  var checkBtn = document.getElementById("check");
  var hint = document.getElementById("gate-hint");
  var payload = document.getElementById("payload");
  var code = document.getElementById("code");
  var copyBtn = document.getElementById("copy");
  var catalog = null;
  var unlockedLine = null;
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

  function iconUrl(placeId) {
    return "https://www.roblox.com/asset-thumbnail/image?assetId=" + placeId + "&width=150&height=150&format=png";
  }

  function fillIcons(games) {
    var ids = games.map(function (g) { return g.placeId; }).filter(Boolean);
    if (!ids.length) return;
    var url = "https://thumbnails.roblox.com/v1/places/gameicons?placeIds=" +
      ids.join(",") + "&returnPolicy=PlaceHolder&size=150x150&format=Png&isCircular=false";
    fetch(url).then(function (r) { return r.json(); }).then(function (data) {
      var map = {};
      (data.data || []).forEach(function (row) {
        if (row.targetId && row.imageUrl) map[row.targetId] = row.imageUrl;
      });
      cardsHost.querySelectorAll(".card").forEach(function (card) {
        var pid = Number(card.getAttribute("data-place"));
        var img = card.querySelector(".icon");
        if (map[pid]) img.src = map[pid];
      });
    }).catch(function () {});
  }

  function renderGames(games) {
    cardsHost.textContent = "";
    games.forEach(function (g, idx) {
      var node = tpl.content.firstElementChild.cloneNode(true);
      node.setAttribute("data-place", g.placeId || "");
      node.querySelector(".cn").textContent = g.cn;
      node.querySelector(".en").textContent = g.en;
      node.querySelector(".ver").textContent = "v" + g.version;
      node.querySelector(".blurb").textContent = g.blurb || "";
      var img = node.querySelector(".icon");
      img.alt = g.cn;
      if (g.placeId) img.src = iconUrl(g.placeId);
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
    fillIcons(games);
  }

  function hidePayload(msg, kind) {
    unlockedLine = null;
    payload.hidden = true;
    code.textContent = "";
    hint.textContent = msg || "加载行默认隐藏。";
    hint.className = "hint" + (kind ? " " + kind : "");
  }

  function showPayload(line) {
    unlockedLine = line;
    payload.hidden = false;
    code.textContent = line;
    hint.textContent = "校验通过，可复制执行。";
    hint.className = "hint ok";
  }

  function markCopied() {
    copyBtn.textContent = "已复制";
    window.setTimeout(function () {
      copyBtn.textContent = copyBtn.getAttribute("data-label") || "复制";
    }, 1400);
  }

  function fallbackCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-999px";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    document.body.removeChild(area);
    return ok;
  }

  checkBtn.addEventListener("click", function () {
    if (!window.__TK || !catalog) return;
    var name = nameInput.value;
    checkBtn.disabled = true;
    hint.textContent = "正在读取白名单…";
    hint.className = "hint";
    window.__TK.unlock(name, catalog.usersRemote).then(function (res) {
      checkBtn.disabled = false;
      if (res.count) countTo(userCountEl, res.count);
      if (!res.ok) {
        var map = {
          empty: "请先输入 Roblox 用户名。",
          deny: "不在白名单，加载行继续隐藏。",
          expired: "账号已到期，请联系作者续约。",
          bad: "名单格式异常。"
        };
        hidePayload(map[res.reason] || "校验失败。", "bad");
        return;
      }
      showPayload(res.line);
    }).catch(function () {
      checkBtn.disabled = false;
      hidePayload("白名单拉取失败，稍后再试。", "bad");
    });
  });

  nameInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") checkBtn.click();
  });

  copyBtn.addEventListener("click", function () {
    if (!unlockedLine) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(unlockedLine).then(markCopied, function () {
        if (fallbackCopy(unlockedLine)) markCopied();
      });
      return;
    }
    if (fallbackCopy(unlockedLine)) markCopied();
  });

  // hard hide: never leave line in DOM before unlock
  hidePayload();

  fetch("data/catalog.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      catalog = data;
      loaderVer.textContent = "Loader " + (data.loaderVersion || "");
      countTo(gameCountEl, (data.games || []).length);
      countTo(userCountEl, data.userCount || 0);
      renderGames(data.games || []);
      if (window.__TK && data.usersRemote) {
        window.__TK.peekCount(data.usersRemote).then(function (n) {
          if (n) countTo(userCountEl, n);
        }).catch(function () {});
      }
    })
    .catch(function () {
      stage.textContent = "清单加载失败";
    });

  window.addEventListener("scroll", onScroll, { passive: true });
  runIntro();
})();
