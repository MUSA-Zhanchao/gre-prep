/* Review Familiar: cycle through words already marked familiar.
   True  -> still remembered, rotate to the end of the familiar list.
   False -> forgotten, remove from familiar and send back to the learning loop. */
(function () {
  "use strict";

  var el = {
    progress: document.getElementById("progress"),
    word: document.getElementById("word"),
    phonetic: document.getElementById("phonetic"),
    form: document.getElementById("recall-form"),
    guess: document.getElementById("guess"),
    answer: document.getElementById("answer"),
    meaning: document.getElementById("meaning"),
    synonyms: document.getElementById("synonyms"),
    synonymsBlock: document.getElementById("synonyms-block"),
    example: document.getElementById("example"),
    exampleBlock: document.getElementById("example-block"),
    trueBtn: document.getElementById("true-btn"),
    falseBtn: document.getElementById("false-btn"),
    empty: document.getElementById("empty"),
    exportBtn: document.getElementById("export-btn"),
    importInput: document.getElementById("import-input"),
  };

  // The persisted familiar list itself acts as the rotating review queue.
  var queue = [];

  function currentWord() {
    return queue.length ? Store.word(queue[0]) : null;
  }

  function render() {
    var w = currentWord();

    if (!w) {
      el.progress.textContent = "0 familiar";
      el.form.hidden = true;
      el.answer.hidden = true;
      el.word.hidden = true;
      el.phonetic.hidden = true;
      el.empty.hidden = false;
      return;
    }

    el.progress.textContent = queue.length + " familiar";
    el.word.textContent = w.word;
    el.phonetic.textContent = w.phonetic || "";

    el.answer.hidden = true;
    el.empty.hidden = true;
    el.form.hidden = false;
    el.guess.value = "";
    el.guess.focus();
  }

  function revealAnswer() {
    var w = currentWord();
    if (!w) return;

    el.meaning.textContent = w.meaning || "—";

    if (w.synonyms && w.synonyms.length) {
      el.synonyms.textContent = w.synonyms.join(", ");
      el.synonymsBlock.hidden = false;
    } else if (w.synonyms_raw) {
      el.synonyms.textContent = w.synonyms_raw;
      el.synonymsBlock.hidden = false;
    } else {
      el.synonymsBlock.hidden = true;
    }

    if (w.example) {
      el.example.textContent = w.example;
      el.exampleBlock.hidden = false;
    } else {
      el.exampleBlock.hidden = true;
    }

    el.form.hidden = true;
    el.answer.hidden = false;
  }

  // True: still familiar -> rotate to the end.
  function markTrue() {
    if (queue.length <= 1) {
      render();
      return;
    }
    var id = queue.shift();
    queue.push(id);
    Store.setFamiliar(queue);
    render();
  }

  // False: forgotten -> drop from familiar, add back to the learning loop.
  function markFalse() {
    if (!queue.length) return;
    var id = queue.shift();
    Store.setFamiliar(queue);

    var learning = Store.getLearning();
    if (learning.indexOf(id) === -1) learning.push(id);
    Store.setLearning(learning);

    render();
  }

  // ---- Export / Import a real familiar.json ----------------------------

  function exportJson() {
    var payload = {
      exported_at: new Date().toISOString(),
      count: queue.length,
      words: queue.map(function (id) {
        var w = Store.word(id) || {};
        return { id: id, word: w.word || null };
      }),
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "familiar.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importJson(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        // Accept either {words:[{id}]} (our export) or a plain array of ids.
        var ids = Array.isArray(data)
          ? data
          : (data.words || []).map(function (w) {
              return typeof w === "object" ? w.id : w;
            });
        ids = ids
          .map(Number)
          .filter(function (id) {
            return Store.exists(id);
          });

        // Merge with any existing familiar words, de-duplicated.
        var merged = Store.getFamiliar().slice();
        ids.forEach(function (id) {
          if (merged.indexOf(id) === -1) merged.push(id);
        });
        // Remove imported words from the learning loop.
        var learning = Store.getLearning().filter(function (id) {
          return merged.indexOf(id) === -1;
        });

        Store.setFamiliar(merged);
        Store.setLearning(learning);
        queue = merged;
        render();
      } catch (e) {
        alert("Could not read that file as familiar.json.");
        console.error(e);
      }
    };
    reader.readAsText(file);
  }

  // ---- Events ----------------------------------------------------------

  el.form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (el.guess.value.trim() === "") {
      el.guess.focus();
      return;
    }
    revealAnswer();
  });

  el.trueBtn.addEventListener("click", markTrue);
  el.falseBtn.addEventListener("click", markFalse);
  el.exportBtn.addEventListener("click", exportJson);
  el.importInput.addEventListener("change", function (e) {
    if (e.target.files && e.target.files[0]) importJson(e.target.files[0]);
    e.target.value = ""; // allow re-importing the same file
  });

  // ---- Boot ------------------------------------------------------------

  Store.loadVocab()
    .then(function () {
      // Keep only ids that still exist; shuffle for review variety.
      queue = Store.shuffle(
        Store.getFamiliar().filter(function (id) {
          return Store.exists(id);
        })
      );
      Store.setFamiliar(queue);
      render();
    })
    .catch(function (err) {
      el.word.textContent = "Could not load vocab.json";
      el.phonetic.textContent = "Run this page from a local web server.";
      el.form.hidden = true;
      console.error(err);
    });
})();
