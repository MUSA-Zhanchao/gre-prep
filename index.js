/* Landing page: show live counts for each mode. */
(function () {
  "use strict";

  var learnCountEl = document.getElementById("learn-count");
  var familiarCountEl = document.getElementById("familiar-count");

  Store.loadVocab()
    .then(function () {
      var familiar = Store.getFamiliar().length;

      // Words left to learn = saved queue, or everything-minus-familiar if none saved yet.
      var learning = Store.getLearning();
      var toLearn = learning.length ? learning.length : Store.freshLearningQueue().length;

      learnCountEl.textContent = toLearn + " to learn";
      familiarCountEl.textContent = familiar + " familiar";
    })
    .catch(function (err) {
      learnCountEl.textContent = "load error";
      familiarCountEl.textContent = "load error";
      console.error(err);
    });
})();
