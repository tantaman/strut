(ns ui-tests.asserts
  (:use [clj-webdriver.taxi :as t]))


(defn num-slides [n]
  (assert (= t/execute-script "return uiTestAcc.slides().length") n)
)

(defn one-slide []
  (num-slides 1)
)