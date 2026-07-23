/* Learn New: cycle through not-yet-familiar words.
   True  -> move the word into the familiar store and drop it from the loop.
   False -> re-insert it ~10 words later (near the end if fewer remain). */
(function () {
  "use strict";

  var FALSE_GAP = 10;

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
    resetBtn: document.getElementById("reset-btn"),
    done: document.getElementById("done"),
  };

  var queue = []; // ids not yet familiar; front (index 0) is the current word

  function currentWord() {
    return queue.length ? Store.word(queue[0]) : null;
  }

  function render() {
    var w = currentWord();

    if (!w) {
      // Nothing left to learn.
      el.progress.textContent = "0 to learn";
      el.form.hidden = true;
      el.answer.hidden = true;
      el.word.hidden = true;
      el.phonetic.hidden = true;
      el.done.hidden = false;
      return;
    }

    el.progress.textContent = queue.length + " to learn";
    el.word.textContent = w.word;
    el.phonetic.textContent = w.phonetic || "";

    el.answer.hidden = true;
    el.done.hidden = true;
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

  // True: remembered -> graduate out of the loop.
  //   never missed -> familiar   |   missed before -> review
  function markTrue() {
    if (!queue.length) return;
    var id = queue.shift();

    var targetKey = Store.isMissed(id) ? "review" : "familiar";
    var target =
      targetKey === "review" ? Store.getReview() : Store.getFamiliar();
    if (target.indexOf(id) === -1) target.push(id);
    if (targetKey === "review") Store.setReview(target);
    else Store.setFamiliar(target);

    Store.setLearning(queue);
    render();
  }

  // False: forgotten -> flag as missed and re-insert ~10 words later.
  function markFalse() {
    if (!queue.length) return;
    var id = queue[0];
    Store.markMissed(id); // permanently blocks this word from familiar

    if (queue.length <= 1) {
      render();
      return;
    }
    queue.shift();
    var pos = Math.min(FALSE_GAP, queue.length);
    queue.splice(pos, 0, id);
    Store.setLearning(queue);
    render();
  }

  // Keep only ids that still exist and haven't already graduated.
  function sanitize(ids) {
    var graduated = {};
    Store.getFamiliar().forEach(function (id) {
      graduated[id] = true;
    });
    Store.getReview().forEach(function (id) {
      graduated[id] = true;
    });
    return ids.filter(function (id) {
      return Store.exists(id) && !graduated[id];
    });
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

  el.resetBtn.addEventListener("click", function () {
    queue = Store.freshLearningQueue();
    Store.setLearning(queue);
    render();
  });

  // ---- Boot ------------------------------------------------------------

  Store.loadVocab()
    .then(function () {
      queue = sanitize(Store.getLearning());
      if (!queue.length && Store.freshLearningQueue().length) {
        queue = Store.freshLearningQueue();
      }
      Store.setLearning(queue);
      render();
    })
    .catch(function (err) {
      el.word.textContent = "Could not load vocab.json";
      el.phonetic.textContent = "Run this page from a local web server.";
      el.form.hidden = true;
      console.error(err);
    });
})();
