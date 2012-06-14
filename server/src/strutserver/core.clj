(ns strutserver.core
  (:gen-class :extends javax.servlet.http.HttpServlet)
  (:use compojure.core
        ring.util.servlet)
  (:require [compojure.route :as route])
  (:require [net.cgrand.enlive-html :as html])
  (:require [ring.util.response :as response])
  (:import com.google.appengine.api.urlfetch.URLFetchServiceFactory)
  (:import com.google.appengine.api.urlfetch.FetchOptions$Builder)
  (:import com.google.appengine.api.urlfetch.HTTPMethod)
  (:import com.google.appengine.api.urlfetch.HTTPRequest))


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

(defn create-http-request [url]
  (HTTPRequest. url HTTPMethod/GET (FetchOptions$Builder/followRedirects))
)

(defn fetch-resources
  [resource-urls]
  (let [fetch-service (URLFetchServiceFactory/getURLFetchService)]
    (doall (map #(.get %1)  ; make sure the gets are all run
      (doall (map #(.fetchAsync fetch-service (create-http-request %1)) resource-urls) ; make sure the fetches are run
    )))
  )
)

(defn create-local-url [^java.net.URL url]
  (str (.hashCode url) (.replace (.replace (.getFile url) "/" ".") "?" "."))
)

(defn create-zip [http-responses new-markup original-urls]
  (let [buf-out (java.io.ByteArrayOutputStream.)]
  (let [zip-out (java.util.zip.ZipOutputStream. buf-out)]
    (do 
      (doseq [group (map (fn [response origUrl] {:response response :originalUrl origUrl}) http-responses original-urls)]
        (do 
          (println (.getResponseCode (:response group)) (.getFinalUrl (:response group)))
          (.putNextEntry zip-out (java.util.zip.ZipEntry. (create-local-url (:originalUrl group))))
          (.write zip-out (.getContent (:response group)))
          (.closeEntry zip-out)
        ))
      (.putNextEntry zip-out (java.util.zip.ZipEntry. "index.html"))
      (.write zip-out (.getBytes new-markup))
      (.closeEntry zip-out)
      (.close zip-out)
      (java.io.ByteArrayInputStream. (.toByteArray buf-out))
    )
  ))
)

(defn replace-urls [processed-urls markup]
  ; todo: replace the urls in the document
  ; find [src=(keys processed-urls)] and replace with
  ; (create-local-url (keys processed-urls))
  {:urls (vals processed-urls) :markup 
    (reduce #(clojure.string/replace %1 (first %2) (create-local-url (last %2))) markup processed-urls)}
)

(defn preprocess-urls [resource-urls]
  (let [processed (distinct (flatten (map seq resource-urls)))]
    (zipmap processed (map #(java.net.URL. %1) processed))
  )
)

(defn build-zip-response [markup]
  (let [urls-and-markup 
    (replace-urls (preprocess-urls (extract-resource-urls markup)) markup)]
    (let [zip-file (-> (:urls urls-and-markup)
        fetch-resources
        (create-zip (:markup urls-and-markup) (:urls urls-and-markup))
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
)

(defroutes example
  (GET "/" [] "I'm a babb")
  (GET "/debug/zip" []
    (build-zip-response "<img src='http://clojuredocs.org/images/cd_logo.png'></img><link href='http://html5boilerplate.com/css/style.css?v3launch'></link><script src='http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js'></script>")
  )
  (GET ["/zip/:markup", :markup #".+"] [markup]
    (do
      (println markup)
      (build-zip-response markup)
    )
  )
  (route/not-found "Page not found")
)

(defservice example)