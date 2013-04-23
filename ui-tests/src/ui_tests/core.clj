(ns ui-tests.core
  (:gen-class))

(use 'clj-webdriver.taxi)

(defn clean []
  (execute-script "clearPresentations()")
  (refresh)
)

; move into different namepsace once its all working
(defn test-add-slides []
  (clean)
  
)

(defn -main [& args]
  (set-driver! {:browser :firefox} (first args))
  ; use reflection to load in available tests?
  ; have tests register themselves?
  (test-add-slides)
)