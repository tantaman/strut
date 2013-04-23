(ns ui-tests.util
  (:use [clj-webdriver.taxi :as t]))

(defn wait [] (t/wait-until #(exists? ".container-fluid")))

(defn count-slides [] (t/execute-script "return uiTestAcc.slides().length"))

(defn each-slide [f]
  (doseq [s (select ".slideWell > div")]
    (f s)
  ))

(defn each-slide-i [f]
  (map #(f %1 %2) (select ".slideWell > div") (iterate inc 0))
)

(defn each-component [f]
  (doseq [s (select ".slideContainer > .component")]
    (f s)
   ))

(defn remove-current-components []
  ; mouse over each component
  ; click the remove btn
)

(defn remove-components-from [s]
  (click s)
  (remove-current-components)
)

(defn remove-all-components []
  (each-slide #(remove-components-from %1)))

(defn create-text [text slide]
)