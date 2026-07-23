/* Shared data layer for the GRE Vocabulary Loop.
   No backend: word data comes from vocab.json, all progress lives in localStorage. */
window.Store = (function () {
  "use strict";

  var LEARN_KEY = "gre-learning-queue-v2";
  var FAMILIAR_KEY = "gre-familiar-v2";

  var wordsById = {};
  var _allIds = [];

  // ---- Vocabulary ------------------------------------------------------

  function loadVocab() {
    return fetch("vocab.json")
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        (data.words || []).forEach(function (w) {
          wordsById[w.id] = w;
        });
        _allIds = Object.keys(wordsById).map(Number);
        return true;
      });
  }

  function word(id) {
    return wordsById[id];
  }

  function exists(id) {
    return Object.prototype.hasOwnProperty.call(wordsById, id);
  }

  function allIds() {
    return _allIds.slice();
  }

  // ---- localStorage helpers -------------------------------------------

  function getArr(key) {
    try {
      var parsed = JSON.parse(localStorage.getItem(key));
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function setArr(key, arr) {
    try {
      localStorage.setItem(key, JSON.stringify(arr));
    } catch (e) {
      /* storage unavailable — keep working in memory */
    }
  }

  function getLearning() {
    return getArr(LEARN_KEY);
  }
  function setLearning(a) {
    setArr(LEARN_KEY, a);
  }
  function getFamiliar() {
    return getArr(FAMILIAR_KEY);
  }
  function setFamiliar(a) {
    setArr(FAMILIAR_KEY, a);
  }

  // ---- Utilities -------------------------------------------------------

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  // Build a fresh shuffled learning queue from every word not yet familiar.
  function freshLearningQueue() {
    var familiar = {};
    getFamiliar().forEach(function (id) {
      familiar[id] = true;
    });
    return shuffle(
      _allIds.filter(function (id) {
        return !familiar[id];
      })
    );
  }

  return {
    loadVocab: loadVocab,
    word: word,
    exists: exists,
    allIds: allIds,
    shuffle: shuffle,
    getLearning: getLearning,
    setLearning: setLearning,
    getFamiliar: getFamiliar,
    setFamiliar: setFamiliar,
    freshLearningQueue: freshLearningQueue,
  };
})();
