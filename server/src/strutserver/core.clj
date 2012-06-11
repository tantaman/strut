(ns strutserver.core
  (:gen-class :extends javax.servlet.http.HttpServlet)
  (:use compojure.core
        ring.util.servlet)
  (:require [compojure.route :as route]))

(defroutes example
  (GET "/" [] "<h1>Hello World Wide Web!</h1>")
  (route/not-found "Page not found"))

(defservice example)