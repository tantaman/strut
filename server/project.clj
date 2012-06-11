(defproject strut-srvr "1.0.0-SNAPSHOT"
  :description "Strut backend"
  :dependencies [[org.clojure/clojure "1.3.0"]
		 [org.clojure/clojure-contrib "1.2.0"]
		 [compojure "1.1.0"]
		 [ring/ring-servlet "0.2.1"]
		 ]
  :compile-path "war/WEB-INF/classes"
  :library-path "war/WEB-INF/lib"
  )