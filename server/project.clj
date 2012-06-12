(defproject strutserver "1.0.0-SNAPSHOT"
  :description "Strut backend"
  :aot [strutserver.core]
  :dependencies [[org.clojure/clojure "1.4.0"]
  	 [compojure "1.1.0"]
		 [ring/ring-servlet "1.1.0"]
		 [enlive "1.0.0"]
     [com.google.appengine/appengine-api-1.0-sdk "1.6.6"]]
  :dev-dependencies [[lein-swank "1.4.4"]]
  :compile-path "war/WEB-INF/classes"
  :library-path "war/WEB-INF/lib"
  )