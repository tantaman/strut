(ns strutserver.test.core
  (:use [strutserver.core])
  (:use [clojure.test]))



(deftest test-extract-resource-urls
	(fetch-resources (flatten (map seq 
		(extract-resource-urls "<html><img src='http://google.com'></img> <script src='http://www.gamers.com'></script> <link href='http://www.about.com'></link></html>"))
	))
) ; (is false "No tests have been written.")
