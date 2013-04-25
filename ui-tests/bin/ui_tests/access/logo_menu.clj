(ns ui-tests.access.logo-menu
  (:use [clj-webdriver.taxi :as t]
        [ui-test.asserts :as asserts])
)

(defn open []
  (if (not (t/displayed? ".logo-group > ul"))
    (t/click "a.logo.btn")
  )
)

(defn new-pres []
  (open)
  (click ".logo-group > ul > li a")
  (asserts/one-slide)
)

(defn add-slide []
  
)