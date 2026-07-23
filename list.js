/* All Words: browse the full vocabulary and bulk-move words between groups.
   Main use: quickly kick already-known words straight into Familiar so the
   learning loop only holds what's actually left to master. */
(function () {
  "use strict";

  var el = {
    progress: document.getElementById("progress"),
    search: document.getElementById("search"),
    chips: document.getElementById("chips"),
    list: document.getElementById("list"),
    selectAll: document.getElementById("select-all"),
    shownCount: document.getElementById("shown-count"),
    actionbar: document.getElementById("actionbar"),
    selCount: document.getElementById("sel-count"),
    clearSel: document.getElementById("clear-sel"),
  };

  var ids = []; // all word ids, in vocab order
  var groupById = {}; // id -> "learning" | "review" | "familiar"
  var selected = {}; // id -> true

  var state = { search: "", filter: "all" };

  var GROUP_LABEL = {
    learning: "To learn",
    review: "Review",
    familiar: "Familiar",
  };

  // ---- Compute current groups from the store --------------------------

  function recomputeGroups() {
    groupById = {};
    Store.getReview().forEach(function (id) {
      groupById[id] = "review";
    });
    Store.getFamiliar().forEach(function (id) {
      groupById[id] = "familiar";
    });
    ids.forEach(function (id) {
      if (!groupById[id]) groupById[id] = "learning";
    });
  }

  function counts() {
    var c = { all: ids.length, learning: 0, review: 0, familiar: 0 };
    ids.forEach(function (id) {
      c[groupById[id]]++;
    });
    return c;
  }

  // ---- Rendering -------------------------------------------------------

  function matchesFilters(id) {
    if (state.filter !== "all" && groupById[id] !== state.filter) return false;
    if (state.search) {
      var w = Store.word(id);
      var hay = (w.word + " " + (w.meaning || "")).toLowerCase();
      if (hay.indexOf(state.search) === -1) return false;
    }
    return true;
  }

  function rowHtml(id) {
    var w = Store.word(id);
    var g = groupById[id];
    var checked = selected[id] ? " checked" : "";
    return (
      '<label class="row" data-id="' + id + '">' +
      '<input type="checkbox" class="row__check"' + checked + " />" +
      '<span class="row__main">' +
      '<span class="row__word">' + escapeHtml(w.word) +
      (w.phonetic ? ' <small class="row__ph">' + escapeHtml(w.phonetic) + "</small>" : "") +
      "</span>" +
      '<span class="row__meaning">' + escapeHtml(w.meaning || "") + "</span>" +
      "</span>" +
      '<span class="badge badge--' + g + '">' + GROUP_LABEL[g] + "</span>" +
      "</label>"
    );
  }

  function render() {
    recomputeGroups();

    var c = counts();
    ["all", "learning", "review", "familiar"].forEach(function (k) {
      var span = el.chips.querySelector('[data-count="' + k + '"]');
      if (span) span.textContent = c[k];
    });
    el.progress.textContent = c.familiar + " familiar · " + c.learning + " to learn";

    var visible = ids.filter(matchesFilters);
    if (!visible.length) {
      el.list.innerHTML = '<p class="list__empty">No words match.</p>';
    } else {
      el.list.innerHTML = visible.map(rowHtml).join("");
    }
    el.shownCount.textContent = visible.length + " shown";
    updateActionbar();
  }

  function updateActionbar() {
    var n = Object.keys(selected).length;
    if (n === 0) {
      el.actionbar.hidden = true;
    } else {
      el.actionbar.hidden = false;
      el.selCount.textContent = n + " selected";
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ---- Events ----------------------------------------------------------

  var searchTimer;
  el.search.addEventListener("input", function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      state.search = el.search.value.trim().toLowerCase();
      render();
    }, 120);
  });

  el.chips.addEventListener("click", function (e) {
    var btn = e.target.closest(".chip");
    if (!btn) return;
    state.filter = btn.getAttribute("data-filter");
    Array.prototype.forEach.call(el.chips.children, function (c) {
      c.classList.toggle("chip--active", c === btn);
    });
    render();
  });

  // Toggle selection when a checkbox changes.
  el.list.addEventListener("change", function (e) {
    var cb = e.target.closest(".row__check");
    if (!cb) return;
    var id = Number(cb.closest(".row").getAttribute("data-id"));
    if (cb.checked) selected[id] = true;
    else delete selected[id];
    updateActionbar();
  });

  el.selectAll.addEventListener("click", function () {
    ids.filter(matchesFilters).forEach(function (id) {
      selected[id] = true;
    });
    render();
  });

  el.clearSel.addEventListener("click", function () {
    selected = {};
    render();
  });

  el.actionbar.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-move]");
    if (!btn) return;
    var group = btn.getAttribute("data-move");
    var moveIds = Object.keys(selected).map(Number);
    if (!moveIds.length) return;
    Store.moveToGroup(moveIds, group);
    selected = {};
    render();
  });

  // ---- Boot ------------------------------------------------------------

  Store.loadVocab()
    .then(function () {
      ids = Store.allIds().sort(function (a, b) {
        return a - b;
      });
      render();
    })
    .catch(function (err) {
      el.list.innerHTML =
        '<p class="list__empty">Could not load vocab.json. Run this page from a local web server.</p>';
      console.error(err);
    });
})();
