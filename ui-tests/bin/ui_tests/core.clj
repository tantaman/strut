(ns ui-tests.core
  (:use [clj-webdriver.taxi :as t]
        [ui-tests.access.logo-menu :as logo-menu])
  (:gen-class))

(defn clean []
  (logo-menu/new-pres)
  (t/execute-script "clearPresentations()")
  (t/refresh)
  (assert-one-slide)
)

; move into different namepsace once its all working
(defn test-add-slides []
  (clean)
  
)

(defn -main [& args]
  (t/set-driver! {:browser :firefox} (first args))
  ; use reflection to load in available tests?
  ; have tests register themselves?
  (test-add-slides)
)