/* Landing page: show live counts for each mode. */
(function () {
  "use strict";

  var learnCountEl = document.getElementById("learn-count");
  var reviewCountEl = document.getElementById("review-count");
  var familiarCountEl = document.getElementById("familiar-count");

  Store.loadVocab()
    .then(function () {
      var familiar = Store.getFamiliar().length;
      var review = Store.getReview().length;

      // Words left to learn = saved queue, or everything-not-graduated if none saved yet.
      var learning = Store.getLearning();
      var toLearn = learning.length ? learning.length : Store.freshLearningQueue().length;

      learnCountEl.textContent = toLearn + " to learn";
      reviewCountEl.textContent = review + " in review";
      familiarCountEl.textContent = familiar + " familiar";
    })
    .catch(function (err) {
      learnCountEl.textContent = "load error";
      reviewCountEl.textContent = "load error";
      familiarCountEl.textContent = "load error";
      console.error(err);
    });
})();
