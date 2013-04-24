(ns ui-tests.util
  (:require [clj-webdriver.taxi :as t]
            [clj-webdriver.core :as c])
  (:use clojure.contrib.strint))

(defn wait [] (t/wait-until #(t/exists? ".container-fluid")))

(defn count-slides [] (t/execute-script "return uiTestAcc.slides().length"))

(defn well-slides [] (t/find-elements {:css ".slideWell > div"}))
(defn well-slide [n] (t/find-element {:css (<< ".slideWell > div:nth-child(~{n})")}))
(defn component-button [type] (t/find-element {:css (<< "a[data-compType='~{type}']")}))
(defn components [] (t/css-finder ".slideContainer > .component"))
(defn first-well-slide [] (t/find-element {:css ".slideWell > div:first-child"}))
(defn last-well-slide [] (t/find-element {:css ".slideWell > div:last-child"}))
(defn drag [elem to] )
(defn slide-text [] "")

(defn each-slide [f]
  (map #(f %1 %2) well-slides (iterate inc 0))
)

(defn create-comp [type] (t/click (component-button type)))

(defn remove-current-components []
  (t/execute-script "$('.slideContainer .component .removeBtn).click()")
)

(defn remove-components-from [s]
  (t/click s)
  (remove-current-components)
)

(defn select-well-slide [n]
  (t/click (well-slide n))
)

(defn remove-all-components []
  (each-slide #(remove-components-from %1)))

(defn create-text [text]
  (let [comp (create-comp "TextBox")]
    (c/->actions 
      (c/double-click comp)
      (c/double-click comp)           
    )
    (t/input-text comp text)
  )
)