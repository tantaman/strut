(ns strutserver.core
  (:gen-class :extends javax.servlet.http.HttpServlet)
  (:use compojure.core
        ring.util.servlet)
  (:require [compojure.route :as route])
  (:require [net.cgrand.enlive-html :as html])
  (:require [ring.util.response :as response])
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

(defn fetch-resources
  [resource-urls]
  (let [fetch-service (URLFetchServiceFactory/getURLFetchService)]
    (map #(.get %1) 
      (doall (map #(.fetchAsync fetch-service %1) resource-urls)
    ))
  )
)

(defn create-zip [http-responses]
  (let [buf-out (java.io.ByteArrayOutputStream.)]
  (let [zip-out (java.util.zip.ZipOutputStream. buf-out)]
    (do 
      (doseq [response http-responses]
        (do 
          (.putNextEntry zip-out (java.util.zip.ZipEntry. (str (.hashCode (.getFinalUrl response)))))
          (.write zip-out (.getContent response))
          (.closeEntry zip-out)
        ))
      (.close zip-out)
      (java.io.ByteArrayInputStream. (.toByteArray buf-out))
    )
  ))
)

(defn replace-urls [processed-urls]
  ; todo: replace the urls in the document
  (vals processed-urls)
)

(defn preprocess-urls [resource-urls]
  (let [processed (distinct (flatten (map seq resource-urls)))]
    (zipmap processed (map #(java.net.URL. %1) processed))
  )
)

(defn build-zip-response [markup]
  (let [zip-file (-> markup
        extract-resource-urls
        preprocess-urls
        replace-urls
        fetch-resources
        create-zip
      )]
    (->
      (response/response zip-file)
      (response/content-type "application/octet-stream")
      (response/header "Content-Length" (.available zip-file))
      (response/header "Content-Disposition" "attachment; filename=\"presentation.zip\"")
      (response/header "Content-Transfer-Encoding" "binary")
      (response/header "Content-Description" "File Transfer")
    ))
)

(defroutes example
  (GET "/" [] "I'm a babb")
  (GET "/debug/zip" []
    (build-zip-response "<img src='http://google.com'></img><link href='http://yahoo.com'></link><script src='http://cnn.com'></script>")
  )
  (GET "/zip/:markup" [markup]
    (build-zip-response markup)
  )
  (route/not-found "Page not found")
)

(defservice example)