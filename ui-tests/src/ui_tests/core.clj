(ns ui-tests.core
  (:require [clj-webdriver.taxi :as t]
        [ui-tests.access.logo-menu :as logo-menu]
        [ui-tests.asserts :as asserts]
        [ui-tests.util :as u])
  (:use clojure.contrib.strint)
  (:gen-class))

(defn clean []
  (logo-menu/new-pres)
  (t/execute-script "clearPresentations()")
  (t/refresh)
  (u/wait)
  (asserts/one-slide)
)

(defn test-add-slides []
  (clean)
  (doseq [n (range 1 5)]
    (logo-menu/add-slide)
    (asserts/num-slides (+ n 1))
  )
)

(defn test-sort-slides []
  (let [slides (u/well-slides)
        num-slides (count slides)]
    (map 
      (fn [slide i]
        (t/click slide)
        (u/remove-current-components)
        (u/create-text (<< "Slide ~{i}"))
      ) slides (iterate dec num-slides))
    (dotimes [n num-slides]
      (u/drag (u/first-well-slide) (u/last-well-slide)))
    (dotimes [n num-slides]
      (u/select-well-slide n)
      (asserts/text (<< "Slide ~{n}") (u/slide-text))
    )
  )
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
  (u/wait)
  (test-add-slides)
  (test-sort-slides)
  (test-remove-components)
  (test-add-text)
  (test-select-slides)
)
