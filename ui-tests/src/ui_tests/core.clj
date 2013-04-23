(ns ui-tests.core
  (:use [clj-webdriver.taxi :as t]
        [ui-tests.access.logo-menu :as logo-menu]
        [ui-tests.asserts :as asserts]
        [ui-tests.util :as util]
        clojure.contrib.strint)
  (:gen-class))

(defn clean []
  (logo-menu/new-pres)
  (t/execute-script "clearPresentations()")
  (t/refresh)
  (util/wait)
  (asserts/one-slide)
)

; move into different namepsace once its all working
(defn test-add-slides []
  (clean)
  (doseq [n (range 1 5)]
    (logo-menu/add-slide)
    (asserts/num-slides (+ n 1))
  )
)

(defn test-sort-slides []
  (util/remove-all-components)
  (util/each-slide-i
    (fn [s i]
      (util/create-text (<< "Slide ~{i}") s)
    ))
)

(defn test-add-text []
)

(defn test-select-slides []
)

(defn test-remove-components []
)

(defn -main [& args]
  (t/set-driver! {:browser :firefox} (first args))
  ; use reflection to load in available tests?
  ; have tests register themselves?
  (util/wait)
  (test-add-slides)
  (test-sort-slides)
  (test-remove-components)
  (test-add-text)
  (test-select-slides)
)
