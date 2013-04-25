(ns ui-tests.asserts
  (:use [clj-webdriver.taxi :as t]))

(defn one-slide []
  (assert (= (t/execute-script "return uiTestAcc.slides().length()") 1))
)