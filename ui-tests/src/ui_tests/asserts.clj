(ns ui-tests.asserts
  (:require [clj-webdriver.taxi :as t]))


(defn num-slides [n]
  (assert (= (t/execute-script "return uiTestAcc.slides().length") n))
)

(defn text [expected actual]
  (assert (= expected actual))
)

(defn one-slide []
  (num-slides 1)
)