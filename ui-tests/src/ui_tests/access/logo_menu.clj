(ns ui-tests.access.logo-menu
  (:require [clj-webdriver.taxi :as t]
        [ui-tests.asserts :as asserts])
)

(defn open []
  (if (not (t/displayed? ".logo-group > ul"))
    (t/click "a.logo.btn")
  )
)

(defn new-pres []
  (open)
  (t/click ".logo-group > ul > li a")
  (asserts/one-slide)
)

(defn add-slide []
  (open)
  (t/click ".logo-group a[data-option='addSlide']")
)