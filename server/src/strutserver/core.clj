(ns strutserver.core
  (:gen-class :extends javax.servlet.http.HttpServlet)
  (:use compojure.core
        ring.util.servlet)
  (:require [compojure.route :as route])
  (:require [net.cgrand.enlive-html :as html])
  (:import com.google.appengine.api.urlfetch.URLFetchServiceFactory))


(defn extract-resource-urls
	"Takes the source of a page and extracts urls 
	to its external resources"
  [page-src]
  (let [document (html/html-resource (java.io.StringReader. page-src))]
    (concat 
      (map #(html/attr-values %1 :src)
        (html/select document
          #{[:img] [:video] [:script]}
      ))
      (map #(html/attr-values %1 :href)
        (html/select document
          #{[:link]}
      ))
      (map #(html/attr-values %1 :src)
        (html/select document
          #{[:video :source]}
      ))
    )
  )
)

(defn resource-downloaded [http-response]
  (println http-response)
)

(defn fetch-resources
  [resource-urls]
  (let [fetch-service (URLFetchServiceFactory/getURLFetchService)]
    (doseq [future (map #(.fetchAsync fetch-service %1)
                    (map #(java.net.URL. %1) resource-urls))]
      (resource-downloaded (.get future))
    )
  )
)


(defroutes example
  (GET "/" [] "<h1>Hello World Wide Web!</h1>")
  (route/not-found "Page not found"))

(defservice example)