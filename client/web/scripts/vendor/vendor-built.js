/*!
 * jQuery JavaScript Library v1.7.1
 * http://jquery.com/
 *
 * Copyright 2011, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 * Copyright 2011, The Dojo Foundation
 * Released under the MIT, BSD, and GPL Licenses.
 *
 * Date: Mon Nov 21 21:11:03 2011 -0500
 */(function(e,t){function u(e){var t=o[e]={},n,r;e=e.split(/\s+/);for(n=0,r=e.length;n<r;n++)t[e[n]]=!0;return t}funct
ion c(e,n,r){if(r===t&&e.nodeType===1){var i="data-"+n.replace(l,"-$1").toLowerCase();r=e.getAttribute(i);if(typeof r==
"string"){try{r=r==="true"?!0:r==="false"?!1:r==="null"?null:s.isNumeric(r)?parseFloat(r):f.test(r)?s.parseJSON(r):r}ca
tch(o){}s.data(e,n,r)}else r=t}return r}function h(e){for(var t in e){if(t==="data"&&s.isEmptyObject(e[t]))continue;if(
t!=="toJSON")return!1}return!0}function p(e,t,n){var r=t+"defer",i=t+"queue",o=t+"mark",u=s._data(e,r);u&&(n==="queue"|
|!s._data(e,i))&&(n==="mark"||!s._data(e,o))&&setTimeout(function(){!s._data(e,i)&&!s._data(e,o)&&(s.removeData(e,r,!0)
,u.fire())},0)}function H(){return!1}function B(){return!0}function W(e){return!e||!e.parentNode||e.parentNode.nodeType
===11}function X(e,t,n){t=t||0;if(s.isFunction(t))return s.grep(e,function(e,r){var i=!!t.call(e,r,e);return i===n});if
(t.nodeType)return s.grep(e,function(e,r){return e===t===n});if(typeof t=="string"){var r=s.grep(e,function(e){return e
.nodeType===1});if(q.test(t))return s.filter(t,r,!n);t=s.filter(t,r)}return s.grep(e,function(e,r){return s.inArray(e,t
)>=0===n})}function V(e){var t=$.split("|"),n=e.createDocumentFragment();if(n.createElement)while(t.length)n.createElem
ent(t.pop());return n}function at(e,t){return s.nodeName(e,"table")?e.getElementsByTagName("tbody")[0]||e.appendChild(e
.ownerDocument.createElement("tbody")):e}function ft(e,t){if(t.nodeType!==1||!s.hasData(e))return;var n,r,i,o=s._data(e
),u=s._data(t,o),a=o.events;if(a){delete u.handle,u.events={};for(n in a)for(r=0,i=a[n].length;r<i;r++)s.event.add(t,n+
(a[n][r].namespace?".":"")+a[n][r].namespace,a[n][r],a[n][r].data)}u.data&&(u.data=s.extend({},u.data))}function lt(e,t
){var n;if(t.nodeType!==1)return;t.clearAttributes&&t.clearAttributes(),t.mergeAttributes&&t.mergeAttributes(e),n=t.nod
eName.toLowerCase();if(n==="object")t.outerHTML=e.outerHTML;else if(n!=="input"||e.type!=="checkbox"&&e.type!=="radio")
{if(n==="option")t.selected=e.defaultSelected;else if(n==="input"||n==="textarea")t.defaultValue=e.defaultValue}else e.
checked&&(t.defaultChecked=t.checked=e.checked),t.value!==e.value&&(t.value=e.value);t.removeAttribute(s.expando)}funct
ion ct(e){return typeof e.getElementsByTagName!="undefined"?e.getElementsByTagName("*"):typeof e.querySelectorAll!="und
efined"?e.querySelectorAll("*"):[]}function ht(e){if(e.type==="checkbox"||e.type==="radio")e.defaultChecked=e.checked}f
unction pt(e){var t=(e.nodeName||"").toLowerCase();t==="input"?ht(e):t!=="script"&&typeof e.getElementsByTagName!="unde
fined"&&s.grep(e.getElementsByTagName("input"),ht)}function dt(e){var t=n.createElement("div");return ut.appendChild(t)
,t.innerHTML=e.outerHTML,t.firstChild}function vt(e,t){t.src?s.ajax({url:t.src,async:!1,dataType:"script"}):s.globalEva
l((t.text||t.textContent||t.innerHTML||"").replace(st,"/*$0*/")),t.parentNode&&t.parentNode.removeChild(t)}function Lt(
e,t,n){var r=t==="width"?e.offsetWidth:e.offsetHeight,i=t==="width"?xt:Tt,o=0,u=i.length;if(r>0){if(n!=="border")for(;o
<u;o++)n||(r-=parseFloat(s.css(e,"padding"+i[o]))||0),n==="margin"?r+=parseFloat(s.css(e,n+i[o]))||0:r-=parseFloat(s.cs
s(e,"border"+i[o]+"Width"))||0;return r+"px"}r=Nt(e,t,t);if(r<0||r==null)r=e.style[t]||0;r=parseFloat(r)||0;if(n)for(;o
<u;o++)r+=parseFloat(s.css(e,"padding"+i[o]))||0,n!=="padding"&&(r+=parseFloat(s.css(e,"border"+i[o]+"Width"))||0),n===
"margin"&&(r+=parseFloat(s.css(e,n+i[o]))||0);return r+"px"}function Gt(e){return function(t,n){typeof t!="string"&&(n=
t,t="*");if(s.isFunction(n)){var r=t.toLowerCase().split(Rt),i=0,o=r.length,u,a,f;for(;i<o;i++)u=r[i],f=/^\+/.test(u),f
&&(u=u.substr(1)||"*"),a=e[u]=e[u]||[],a[f?"unshift":"push"](n)}}}function Yt(e,n,r,i,s,o){s=s||n.dataTypes[0],o=o||{},
o[s]=!0;var u=e[s],a=0,f=u?u.length:0,l=e===Xt,c;for(;a<f&&(l||!c);a++)c=u[a](n,r,i),typeof c=="string"&&(!l||o[c]?c=t:
(n.dataTypes.unshift(c),c=Yt(e,n,r,i,c,o)));return(l||!c)&&!o["*"]&&(c=Yt(e,n,r,i,"*",o)),c}function Zt(e,n){var r,i,o=
s.ajaxSettings.flatOptions||{};for(r in n)n[r]!==t&&((o[r]?e:i||(i={}))[r]=n[r]);i&&s.extend(!0,e,i)}function en(e,t,n,
r){if(s.isArray(t))s.each(t,function(t,i){n||Ot.test(e)?r(e,i):en(e+"["+(typeof i=="object"||s.isArray(i)?t:"")+"]",i,n
,r)});else if(!n&&t!=null&&typeof t=="object")for(var i in t)en(e+"["+i+"]",t[i],n,r);else r(e,t)}function tn(e,n,r){va
r i=e.contents,s=e.dataTypes,o=e.responseFields,u,a,f,l;for(a in o)a in r&&(n[o[a]]=r[a]);while(s[0]==="*")s.shift(),u=
==t&&(u=e.mimeType||n.getResponseHeader("content-type"));if(u)for(a in i)if(i[a]&&i[a].test(u)){s.unshift(a);break}if(s
[0]in r)f=s[0];else{for(a in r){if(!s[0]||e.converters[a+" "+s[0]]){f=a;break}l||(l=a)}f=f||l}if(f)return f!==s[0]&&s.u
nshift(f),r[f]}function nn(e,n){e.dataFilter&&(n=e.dataFilter(n,e.dataType));var r=e.dataTypes,i={},o,u,a=r.length,f,l=
r[0],c,h,p,d,v;for(o=1;o<a;o++){if(o===1)for(u in e.converters)typeof u=="string"&&(i[u.toLowerCase()]=e.converters[u])
;c=l,l=r[o];if(l==="*")l=c;else if(c!=="*"&&c!==l){h=c+" "+l,p=i[h]||i["* "+l];if(!p){v=t;for(d in i){f=d.split(" ");if
(f[0]===c||f[0]==="*"){v=i[f[1]+" "+l];if(v){d=i[d],d===!0?p=v:v===!0&&(p=d);break}}}}!p&&!v&&s.error("No conversion fr
om "+h.replace(" "," to ")),p!==!0&&(n=p?p(n):v(d(n)))}}return n}function fn(){try{return new e.XMLHttpRequest}catch(t)
{}}function ln(){try{return new e.ActiveXObject("Microsoft.XMLHTTP")}catch(t){}}function bn(){return setTimeout(wn,0),y
n=s.now()}function wn(){yn=t}function En(e,t){var n={};return s.each(gn.concat.apply([],gn.slice(0,t)),function(){n[thi
s]=e}),n}function Sn(e){if(!cn[e]){var t=n.body,r=s("<"+e+">").appendTo(t),i=r.css("display");r.remove();if(i==="none"|
|i===""){hn||(hn=n.createElement("iframe"),hn.frameBorder=hn.width=hn.height=0),t.appendChild(hn);if(!pn||!hn.createEle
ment)pn=(hn.contentWindow||hn.contentDocument).document,pn.write((n.compatMode==="CSS1Compat"?"<!doctype html>":"")+"<h
tml><body>"),pn.close();r=pn.createElement(e),pn.body.appendChild(r),i=s.css(r,"display"),t.removeChild(hn)}cn[e]=i}ret
urn cn[e]}function Nn(e){return s.isWindow(e)?e:e.nodeType===9?e.defaultView||e.parentWindow:!1}var n=e.document,r=e.na
vigator,i=e.location,s=function(){function H(){if(i.isReady)return;try{n.documentElement.doScroll("left")}catch(e){setT
imeout(H,1);return}i.ready()}var i=function(e,t){return new i.fn.init(e,t,u)},s=e.jQuery,o=e.$,u,a=/^(?:[^#<]*(<[\w\W]+
>)[^>]*$|#([\w\-]*)$)/,f=/\S/,l=/^\s+/,c=/\s+$/,h=/^<(\w+)\s*\/?>(?:<\/\1>)?$/,p=/^[\],:{}\s]*$/,d=/\\(?:["\\\/bfnrt]|u
[0-9a-fA-F]{4})/g,v=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,m=/(?:^|:|,)(?:\s*\[)+/g,g=/(web
kit)[ \/]([\w.]+)/,y=/(opera)(?:.*version)?[ \/]([\w.]+)/,b=/(msie) ([\w.]+)/,w=/(mozilla)(?:.*? rv:([\w.]+))?/,E=/-([a
-z]|[0-9])/ig,S=/^-ms-/,x=function(e,t){return(t+"").toUpperCase()},T=r.userAgent,N,C,k,L=Object.prototype.toString,A=O
bject.prototype.hasOwnProperty,O=Array.prototype.push,M=Array.prototype.slice,_=String.prototype.trim,D=Array.prototype
.indexOf,P={};return i.fn=i.prototype={constructor:i,init:function(e,r,s){var o,u,f,l;if(!e)return this;if(e.nodeType)r
eturn this.context=this[0]=e,this.length=1,this;if(e==="body"&&!r&&n.body)return this.context=n,this[0]=n.body,this.sel
ector=e,this.length=1,this;if(typeof e=="string"){e.charAt(0)==="<"&&e.charAt(e.length-1)===">"&&e.length>=3?o=[null,e,
null]:o=a.exec(e);if(o&&(o[1]||!r)){if(o[1])return r=r instanceof i?r[0]:r,l=r?r.ownerDocument||r:n,f=h.exec(e),f?i.isP
lainObject(r)?(e=[n.createElement(f[1])],i.fn.attr.call(e,r,!0)):e=[l.createElement(f[1])]:(f=i.buildFragment([o[1]],[l
]),e=(f.cacheable?i.clone(f.fragment):f.fragment).childNodes),i.merge(this,e);u=n.getElementById(o[2]);if(u&&u.parentNo
de){if(u.id!==o[2])return s.find(e);this.length=1,this[0]=u}return this.context=n,this.selector=e,this}return!r||r.jque
ry?(r||s).find(e):this.constructor(r).find(e)}return i.isFunction(e)?s.ready(e):(e.selector!==t&&(this.selector=e.selec
tor,this.context=e.context),i.makeArray(e,this))},selector:"",jquery:"1.7.1",length:0,size:function(){return this.lengt
h},toArray:function(){return M.call(this,0)},get:function(e){return e==null?this.toArray():e<0?this[this.length+e]:this
[e]},pushStack:function(e,t,n){var r=this.constructor();return i.isArray(e)?O.apply(r,e):i.merge(r,e),r.prevObject=this
,r.context=this.context,t==="find"?r.selector=this.selector+(this.selector?" ":"")+n:t&&(r.selector=this.selector+"."+t
+"("+n+")"),r},each:function(e,t){return i.each(this,e,t)},ready:function(e){return i.bindReady(),C.add(e),this},eq:fun
ction(e){return e=+e,e===-1?this.slice(e):this.slice(e,e+1)},first:function(){return this.eq(0)},last:function(){return
 this.eq(-1)},slice:function(){return this.pushStack(M.apply(this,arguments),"slice",M.call(arguments).join(","))},map:
function(e){return this.pushStack(i.map(this,function(t,n){return e.call(t,n,t)}))},end:function(){return this.prevObje
ct||this.constructor(null)},push:O,sort:[].sort,splice:[].splice},i.fn.init.prototype=i.fn,i.extend=i.fn.extend=functio
n(){var e,n,r,s,o,u,a=arguments[0]||{},f=1,l=arguments.length,c=!1;typeof a=="boolean"&&(c=a,a=arguments[1]||{},f=2),ty
peof a!="object"&&!i.isFunction(a)&&(a={}),l===f&&(a=this,--f);for(;f<l;f++)if((e=arguments[f])!=null)for(n in e){r=a[n
],s=e[n];if(a===s)continue;c&&s&&(i.isPlainObject(s)||(o=i.isArray(s)))?(o?(o=!1,u=r&&i.isArray(r)?r:[]):u=r&&i.isPlain
Object(r)?r:{},a[n]=i.extend(c,u,s)):s!==t&&(a[n]=s)}return a},i.extend({noConflict:function(t){return e.$===i&&(e.$=o)
,t&&e.jQuery===i&&(e.jQuery=s),i},isReady:!1,readyWait:1,holdReady:function(e){e?i.readyWait++:i.ready(!0)},ready:funct
ion(e){if(e===!0&&!--i.readyWait||e!==!0&&!i.isReady){if(!n.body)return setTimeout(i.ready,1);i.isReady=!0;if(e!==!0&&-
-i.readyWait>0)return;C.fireWith(n,[i]),i.fn.trigger&&i(n).trigger("ready").off("ready")}},bindReady:function(){if(C)re
turn;C=i.Callbacks("once memory");if(n.readyState==="complete")return setTimeout(i.ready,1);if(n.addEventListener)n.add
EventListener("DOMContentLoaded",k,!1),e.addEventListener("load",i.ready,!1);else if(n.attachEvent){n.attachEvent("onre
adystatechange",k),e.attachEvent("onload",i.ready);var t=!1;try{t=e.frameElement==null}catch(r){}n.documentElement.doSc
roll&&t&&H()}},isFunction:function(e){return i.type(e)==="function"},isArray:Array.isArray||function(e){return i.type(e
)==="array"},isWindow:function(e){return e&&typeof e=="object"&&"setInterval"in e},isNumeric:function(e){return!isNaN(p
arseFloat(e))&&isFinite(e)},type:function(e){return e==null?String(e):P[L.call(e)]||"object"},isPlainObject:function(e)
{if(!e||i.type(e)!=="object"||e.nodeType||i.isWindow(e))return!1;try{if(e.constructor&&!A.call(e,"constructor")&&!A.cal
l(e.constructor.prototype,"isPrototypeOf"))return!1}catch(n){return!1}var r;for(r in e);return r===t||A.call(e,r)},isEm
ptyObject:function(e){for(var t in e)return!1;return!0},error:function(e){throw new Error(e)},parseJSON:function(t){if(
typeof t!="string"||!t)return null;t=i.trim(t);if(e.JSON&&e.JSON.parse)return e.JSON.parse(t);if(p.test(t.replace(d,"@"
).replace(v,"]").replace(m,"")))return(new Function("return "+t))();i.error("Invalid JSON: "+t)},parseXML:function(n){v
ar r,s;try{e.DOMParser?(s=new DOMParser,r=s.parseFromString(n,"text/xml")):(r=new ActiveXObject("Microsoft.XMLDOM"),r.a
sync="false",r.loadXML(n))}catch(o){r=t}return(!r||!r.documentElement||r.getElementsByTagName("parsererror").length)&&i
.error("Invalid XML: "+n),r},noop:function(){},globalEval:function(t){t&&f.test(t)&&(e.execScript||function(t){e.eval.c
all(e,t)})(t)},camelCase:function(e){return e.replace(S,"ms-").replace(E,x)},nodeName:function(e,t){return e.nodeName&&
e.nodeName.toUpperCase()===t.toUpperCase()},each:function(e,n,r){var s,o=0,u=e.length,a=u===t||i.isFunction(e);if(r){if
(a){for(s in e)if(n.apply(e[s],r)===!1)break}else for(;o<u;)if(n.apply(e[o++],r)===!1)break}else if(a){for(s in e)if(n.
call(e[s],s,e[s])===!1)break}else for(;o<u;)if(n.call(e[o],o,e[o++])===!1)break;return e},trim:_?function(e){return e==
null?"":_.call(e)}:function(e){return e==null?"":e.toString().replace(l,"").replace(c,"")},makeArray:function(e,t){var 
n=t||[];if(e!=null){var r=i.type(e);e.length==null||r==="string"||r==="function"||r==="regexp"||i.isWindow(e)?O.call(n,
e):i.merge(n,e)}return n},inArray:function(e,t,n){var r;if(t){if(D)return D.call(t,e,n);r=t.length,n=n?n<0?Math.max(0,r
+n):n:0;for(;n<r;n++)if(n in t&&t[n]===e)return n}return-1},merge:function(e,n){var r=e.length,i=0;if(typeof n.length==
"number")for(var s=n.length;i<s;i++)e[r++]=n[i];else while(n[i]!==t)e[r++]=n[i++];return e.length=r,e},grep:function(e,
t,n){var r=[],i;n=!!n;for(var s=0,o=e.length;s<o;s++)i=!!t(e[s],s),n!==i&&r.push(e[s]);return r},map:function(e,n,r){va
r s,o,u=[],a=0,f=e.length,l=e instanceof i||f!==t&&typeof f=="number"&&(f>0&&e[0]&&e[f-1]||f===0||i.isArray(e));if(l)fo
r(;a<f;a++)s=n(e[a],a,r),s!=null&&(u[u.length]=s);else for(o in e)s=n(e[o],o,r),s!=null&&(u[u.length]=s);return u.conca
t.apply([],u)},guid:1,proxy:function(e,n){if(typeof n=="string"){var r=e[n];n=e,e=r}if(!i.isFunction(e))return t;var s=
M.call(arguments,2),o=function(){return e.apply(n,s.concat(M.call(arguments)))};return o.guid=e.guid=e.guid||o.guid||i.
guid++,o},access:function(e,n,r,s,o,u){var a=e.length;if(typeof n=="object"){for(var f in n)i.access(e,f,n[f],s,o,r);re
turn e}if(r!==t){s=!u&&s&&i.isFunction(r);for(var l=0;l<a;l++)o(e[l],n,s?r.call(e[l],l,o(e[l],n)):r,u);return e}return 
a?o(e[0],n):t},now:function(){return(new Date).getTime()},uaMatch:function(e){e=e.toLowerCase();var t=g.exec(e)||y.exec
(e)||b.exec(e)||e.indexOf("compatible")<0&&w.exec(e)||[];return{browser:t[1]||"",version:t[2]||"0"}},sub:function(){fun
ction e(t,n){return new e.fn.init(t,n)}i.extend(!0,e,this),e.superclass=this,e.fn=e.prototype=this(),e.fn.constructor=e
,e.sub=this.sub,e.fn.init=function(r,s){return s&&s instanceof i&&!(s instanceof e)&&(s=e(s)),i.fn.init.call(this,r,s,t
)},e.fn.init.prototype=e.fn;var t=e(n);return e},browser:{}}),i.each("Boolean Number String Function Array Date RegExp 
Object".split(" "),function(e,t){P["[object "+t+"]"]=t.toLowerCase()}),N=i.uaMatch(T),N.browser&&(i.browser[N.browser]=
!0,i.browser.version=N.version),i.browser.webkit&&(i.browser.safari=!0),f.test("Aÿ")&&(l=/^[\s\xA0]+/,c=/[\s\xA0]+$/),u
=i(n),n.addEventListener?k=function(){n.removeEventListener("DOMContentLoaded",k,!1),i.ready()}:n.attachEvent&&(k=funct
ion(){n.readyState==="complete"&&(n.detachEvent("onreadystatechange",k),i.ready())}),i}(),o={};s.Callbacks=function(e){
e=e?o[e]||u(e):{};var n=[],r=[],i,a,f,l,c,h=function(t){var r,i,o,u,a;for(r=0,i=t.length;r<i;r++)o=t[r],u=s.type(o),u==
="array"?h(o):u==="function"&&(!e.unique||!d.has(o))&&n.push(o)},p=function(t,s){s=s||[],i=!e.memory||[t,s],a=!0,c=f||0
,f=0,l=n.length;for(;n&&c<l;c++)if(n[c].apply(t,s)===!1&&e.stopOnFalse){i=!0;break}a=!1,n&&(e.once?i===!0?d.disable():n
=[]:r&&r.length&&(i=r.shift(),d.fireWith(i[0],i[1])))},d={add:function(){if(n){var e=n.length;h(arguments),a?l=n.length
:i&&i!==!0&&(f=e,p(i[0],i[1]))}return this},remove:function(){if(n){var t=arguments,r=0,i=t.length;for(;r<i;r++)for(var
 s=0;s<n.length;s++)if(t[r]===n[s]){a&&s<=l&&(l--,s<=c&&c--),n.splice(s--,1);if(e.unique)break}}return this},has:functi
on(e){if(n){var t=0,r=n.length;for(;t<r;t++)if(e===n[t])return!0}return!1},empty:function(){return n=[],this},disable:f
unction(){return n=r=i=t,this},disabled:function(){return!n},lock:function(){return r=t,(!i||i===!0)&&d.disable(),this}
,locked:function(){return!r},fireWith:function(t,n){return r&&(a?e.once||r.push([t,n]):(!e.once||!i)&&p(t,n)),this},fir
e:function(){return d.fireWith(this,arguments),this},fired:function(){return!!i}};return d};var a=[].slice;s.extend({De
ferred:function(e){var t=s.Callbacks("once memory"),n=s.Callbacks("once memory"),r=s.Callbacks("memory"),i="pending",o=
{resolve:t,reject:n,notify:r},u={done:t.add,fail:n.add,progress:r.add,state:function(){return i},isResolved:t.fired,isR
ejected:n.fired,then:function(e,t,n){return a.done(e).fail(t).progress(n),this},always:function(){return a.done.apply(a
,arguments).fail.apply(a,arguments),this},pipe:function(e,t,n){return s.Deferred(function(r){s.each({done:[e,"resolve"]
,fail:[t,"reject"],progress:[n,"notify"]},function(e,t){var n=t[0],i=t[1],o;s.isFunction(n)?a[e](function(){o=n.apply(t
his,arguments),o&&s.isFunction(o.promise)?o.promise().then(r.resolve,r.reject,r.notify):r[i+"With"](this===a?r:this,[o]
)}):a[e](r[i])})}).promise()},promise:function(e){if(e==null)e=u;else for(var t in u)e[t]=u[t];return e}},a=u.promise({
}),f;for(f in o)a[f]=o[f].fire,a[f+"With"]=o[f].fireWith;return a.done(function(){i="resolved"},n.disable,r.lock).fail(
function(){i="rejected"},t.disable,r.lock),e&&e.call(a,a),a},when:function(e){function c(e){return function(n){t[e]=arg
uments.length>1?a.call(arguments,0):n,--o||f.resolveWith(f,t)}}function h(e){return function(t){i[e]=arguments.length>1
?a.call(arguments,0):t,f.notifyWith(l,i)}}var t=a.call(arguments,0),n=0,r=t.length,i=new Array(r),o=r,u=r,f=r<=1&&e&&s.
isFunction(e.promise)?e:s.Deferred(),l=f.promise();if(r>1){for(;n<r;n++)t[n]&&t[n].promise&&s.isFunction(t[n].promise)?
t[n].promise().then(c(n),f.reject,h(n)):--o;o||f.resolveWith(f,t)}else f!==e&&f.resolveWith(f,r?[e]:[]);return l}}),s.s
upport=function(){var t,r,i,o,u,a,f,l,c,h,p,d,v,m=n.createElement("div"),g=n.documentElement;m.setAttribute("className"
,"t"),m.innerHTML="   <link/><table></table><a href='/a' style='top:1px;float:left;opacity:.55;'>a</a><input type='chec
kbox'/>",r=m.getElementsByTagName("*"),i=m.getElementsByTagName("a")[0];if(!r||!r.length||!i)return{};o=n.createElement
("select"),u=o.appendChild(n.createElement("option")),a=m.getElementsByTagName("input")[0],t={leadingWhitespace:m.first
Child.nodeType===3,tbody:!m.getElementsByTagName("tbody").length,htmlSerialize:!!m.getElementsByTagName("link").length,
style:/top/.test(i.getAttribute("style")),hrefNormalized:i.getAttribute("href")==="/a",opacity:/^0.55/.test(i.style.opa
city),cssFloat:!!i.style.cssFloat,checkOn:a.value==="on",optSelected:u.selected,getSetAttribute:m.className!=="t",encty
pe:!!n.createElement("form").enctype,html5Clone:n.createElement("nav").cloneNode(!0).outerHTML!=="<:nav></:nav>",submit
Bubbles:!0,changeBubbles:!0,focusinBubbles:!1,deleteExpando:!0,noCloneEvent:!0,inlineBlockNeedsLayout:!1,shrinkWrapBloc
ks:!1,reliableMarginRight:!0},a.checked=!0,t.noCloneChecked=a.cloneNode(!0).checked,o.disabled=!0,t.optDisabled=!u.disa
bled;try{delete m.test}catch(y){t.deleteExpando=!1}!m.addEventListener&&m.attachEvent&&m.fireEvent&&(m.attachEvent("onc
lick",function(){t.noCloneEvent=!1}),m.cloneNode(!0).fireEvent("onclick")),a=n.createElement("input"),a.value="t",a.set
Attribute("type","radio"),t.radioValue=a.value==="t",a.setAttribute("checked","checked"),m.appendChild(a),l=n.createDoc
umentFragment(),l.appendChild(m.lastChild),t.checkClone=l.cloneNode(!0).cloneNode(!0).lastChild.checked,t.appendChecked
=a.checked,l.removeChild(a),l.appendChild(m),m.innerHTML="",e.getComputedStyle&&(f=n.createElement("div"),f.style.width
="0",f.style.marginRight="0",m.style.width="2px",m.appendChild(f),t.reliableMarginRight=(parseInt((e.getComputedStyle(f
,null)||{marginRight:0}).marginRight,10)||0)===0);if(m.attachEvent)for(d in{submit:1,change:1,focusin:1})p="on"+d,v=p i
n m,v||(m.setAttribute(p,"return;"),v=typeof m[p]=="function"),t[d+"Bubbles"]=v;return l.removeChild(m),l=o=u=f=m=a=nul
l,s(function(){var e,r,i,o,u,a,f,l,h,p,d,g=n.getElementsByTagName("body")[0];if(!g)return;f=1,l="position:absolute;top:
0;left:0;width:1px;height:1px;margin:0;",h="visibility:hidden;border:0;",p="style='"+l+"border:5px solid #000;padding:0
;'",d="<div "+p+"><div></div></div>"+"<table "+p+" cellpadding='0' cellspacing='0'>"+"<tr><td></td></tr></table>",e=n.c
reateElement("div"),e.style.cssText=h+"width:0;height:0;position:static;top:0;margin-top:"+f+"px",g.insertBefore(e,g.fi
rstChild),m=n.createElement("div"),e.appendChild(m),m.innerHTML="<table><tr><td style='padding:0;border:0;display:none'
></td><td>t</td></tr></table>",c=m.getElementsByTagName("td"),v=c[0].offsetHeight===0,c[0].style.display="",c[1].style.
display="none",t.reliableHiddenOffsets=v&&c[0].offsetHeight===0,m.innerHTML="",m.style.width=m.style.paddingLeft="1px",
s.boxModel=t.boxModel=m.offsetWidth===2,typeof m.style.zoom!="undefined"&&(m.style.display="inline",m.style.zoom=1,t.in
lineBlockNeedsLayout=m.offsetWidth===2,m.style.display="",m.innerHTML="<div style='width:4px;'></div>",t.shrinkWrapBloc
ks=m.offsetWidth!==2),m.style.cssText=l+h,m.innerHTML=d,r=m.firstChild,i=r.firstChild,u=r.nextSibling.firstChild.firstC
hild,a={doesNotAddBorder:i.offsetTop!==5,doesAddBorderForTableAndCells:u.offsetTop===5},i.style.position="fixed",i.styl
e.top="20px",a.fixedPosition=i.offsetTop===20||i.offsetTop===15,i.style.position=i.style.top="",r.style.overflow="hidde
n",r.style.position="relative",a.subtractsBorderForOverflowNotVisible=i.offsetTop===-5,a.doesNotIncludeMarginInBodyOffs
et=g.offsetTop!==f,g.removeChild(e),m=e=null,s.extend(t,a)}),t}();var f=/^(?:\{.*\}|\[.*\])$/,l=/([A-Z])/g;s.extend({ca
che:{},uuid:0,expando:"jQuery"+(s.fn.jquery+Math.random()).replace(/\D/g,""),noData:{embed:!0,object:"clsid:D27CDB6E-AE
6D-11cf-96B8-444553540000",applet:!0},hasData:function(e){return e=e.nodeType?s.cache[e[s.expando]]:e[s.expando],!!e&&!
h(e)},data:function(e,n,r,i){if(!s.acceptData(e))return;var o,u,a,f=s.expando,l=typeof n=="string",c=e.nodeType,h=c?s.c
ache:e,p=c?e[f]:e[f]&&f,d=n==="events";if((!p||!h[p]||!d&&!i&&!h[p].data)&&l&&r===t)return;p||(c?e[f]=p=++s.uuid:p=f),h
[p]||(h[p]={},c||(h[p].toJSON=s.noop));if(typeof n=="object"||typeof n=="function")i?h[p]=s.extend(h[p],n):h[p].data=s.
extend(h[p].data,n);return o=u=h[p],i||(u.data||(u.data={}),u=u.data),r!==t&&(u[s.camelCase(n)]=r),d&&!u[n]?o.events:(l
?(a=u[n],a==null&&(a=u[s.camelCase(n)])):a=u,a)},removeData:function(e,t,n){if(!s.acceptData(e))return;var r,i,o,u=s.ex
pando,a=e.nodeType,f=a?s.cache:e,l=a?e[u]:u;if(!f[l])return;if(t){r=n?f[l]:f[l].data;if(r){s.isArray(t)||(t in r?t=[t]:
(t=s.camelCase(t),t in r?t=[t]:t=t.split(" ")));for(i=0,o=t.length;i<o;i++)delete r[t[i]];if(!(n?h:s.isEmptyObject)(r))
return}}if(!n){delete f[l].data;if(!h(f[l]))return}s.support.deleteExpando||!f.setInterval?delete f[l]:f[l]=null,a&&(s.
support.deleteExpando?delete e[u]:e.removeAttribute?e.removeAttribute(u):e[u]=null)},_data:function(e,t,n){return s.dat
a(e,t,n,!0)},acceptData:function(e){if(e.nodeName){var t=s.noData[e.nodeName.toLowerCase()];if(t)return t!==!0&&e.getAt
tribute("classid")===t}return!0}}),s.fn.extend({data:function(e,n){var r,i,o,u=null;if(typeof e=="undefined"){if(this.l
ength){u=s.data(this[0]);if(this[0].nodeType===1&&!s._data(this[0],"parsedAttrs")){i=this[0].attributes;for(var a=0,f=i
.length;a<f;a++)o=i[a].name,o.indexOf("data-")===0&&(o=s.camelCase(o.substring(5)),c(this[0],o,u[o]));s._data(this[0],"
parsedAttrs",!0)}}return u}return typeof e=="object"?this.each(function(){s.data(this,e)}):(r=e.split("."),r[1]=r[1]?".
"+r[1]:"",n===t?(u=this.triggerHandler("getData"+r[1]+"!",[r[0]]),u===t&&this.length&&(u=s.data(this[0],e),u=c(this[0],
e,u)),u===t&&r[1]?this.data(r[0]):u):this.each(function(){var t=s(this),i=[r[0],n];t.triggerHandler("setData"+r[1]+"!",
i),s.data(this,e,n),t.triggerHandler("changeData"+r[1]+"!",i)}))},removeData:function(e){return this.each(function(){s.
removeData(this,e)})}}),s.extend({_mark:function(e,t){e&&(t=(t||"fx")+"mark",s._data(e,t,(s._data(e,t)||0)+1))},_unmark
:function(e,t,n){e!==!0&&(n=t,t=e,e=!1);if(t){n=n||"fx";var r=n+"mark",i=e?0:(s._data(t,r)||1)-1;i?s._data(t,r,i):(s.re
moveData(t,r,!0),p(t,n,"mark"))}},queue:function(e,t,n){var r;if(e)return t=(t||"fx")+"queue",r=s._data(e,t),n&&(!r||s.
isArray(n)?r=s._data(e,t,s.makeArray(n)):r.push(n)),r||[]},dequeue:function(e,t){t=t||"fx";var n=s.queue(e,t),r=n.shift
(),i={};r==="inprogress"&&(r=n.shift()),r&&(t==="fx"&&n.unshift("inprogress"),s._data(e,t+".run",i),r.call(e,function()
{s.dequeue(e,t)},i)),n.length||(s.removeData(e,t+"queue "+t+".run",!0),p(e,t,"queue"))}}),s.fn.extend({queue:function(e
,n){return typeof e!="string"&&(n=e,e="fx"),n===t?s.queue(this[0],e):this.each(function(){var t=s.queue(this,e,n);e==="
fx"&&t[0]!=="inprogress"&&s.dequeue(this,e)})},dequeue:function(e){return this.each(function(){s.dequeue(this,e)})},del
ay:function(e,t){return e=s.fx?s.fx.speeds[e]||e:e,t=t||"fx",this.queue(t,function(t,n){var r=setTimeout(t,e);n.stop=fu
nction(){clearTimeout(r)}})},clearQueue:function(e){return this.queue(e||"fx",[])},promise:function(e,n){function h(){-
-u||r.resolveWith(i,[i])}typeof e!="string"&&(n=e,e=t),e=e||"fx";var r=s.Deferred(),i=this,o=i.length,u=1,a=e+"defer",f
=e+"queue",l=e+"mark",c;while(o--)if(c=s.data(i[o],a,t,!0)||(s.data(i[o],f,t,!0)||s.data(i[o],l,t,!0))&&s.data(i[o],a,s
.Callbacks("once memory"),!0))u++,c.add(h);return h(),r.promise()}});var d=/[\n\t\r]/g,v=/\s+/,m=/\r/g,g=/^(?:button|in
put)$/i,y=/^(?:button|input|object|select|textarea)$/i,b=/^a(?:rea)?$/i,w=/^(?:autofocus|autoplay|async|checked|control
s|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,E=s.support.getSetAttribute,S,x,T;s.fn
.extend({attr:function(e,t){return s.access(this,e,t,!0,s.attr)},removeAttr:function(e){return this.each(function(){s.r
emoveAttr(this,e)})},prop:function(e,t){return s.access(this,e,t,!0,s.prop)},removeProp:function(e){return e=s.propFix[
e]||e,this.each(function(){try{this[e]=t,delete this[e]}catch(n){}})},addClass:function(e){var t,n,r,i,o,u,a;if(s.isFun
ction(e))return this.each(function(t){s(this).addClass(e.call(this,t,this.className))});if(e&&typeof e=="string"){t=e.s
plit(v);for(n=0,r=this.length;n<r;n++){i=this[n];if(i.nodeType===1)if(!i.className&&t.length===1)i.className=e;else{o="
 "+i.className+" ";for(u=0,a=t.length;u<a;u++)~o.indexOf(" "+t[u]+" ")||(o+=t[u]+" ");i.className=s.trim(o)}}}return th
is},removeClass:function(e){var n,r,i,o,u,a,f;if(s.isFunction(e))return this.each(function(t){s(this).removeClass(e.cal
l(this,t,this.className))});if(e&&typeof e=="string"||e===t){n=(e||"").split(v);for(r=0,i=this.length;r<i;r++){o=this[r
];if(o.nodeType===1&&o.className)if(e){u=(" "+o.className+" ").replace(d," ");for(a=0,f=n.length;a<f;a++)u=u.replace(" 
"+n[a]+" "," ");o.className=s.trim(u)}else o.className=""}}return this},toggleClass:function(e,t){var n=typeof e,r=type
of t=="boolean";return s.isFunction(e)?this.each(function(n){s(this).toggleClass(e.call(this,n,this.className,t),t)}):t
his.each(function(){if(n==="string"){var i,o=0,u=s(this),a=t,f=e.split(v);while(i=f[o++])a=r?a:!u.hasClass(i),u[a?"addC
lass":"removeClass"](i)}else if(n==="undefined"||n==="boolean")this.className&&s._data(this,"__className__",this.classN
ame),this.className=this.className||e===!1?"":s._data(this,"__className__")||""})},hasClass:function(e){var t=" "+e+" "
,n=0,r=this.length;for(;n<r;n++)if(this[n].nodeType===1&&(" "+this[n].className+" ").replace(d," ").indexOf(t)>-1)retur
n!0;return!1},val:function(e){var n,r,i,o=this[0];if(!arguments.length){if(o)return n=s.valHooks[o.nodeName.toLowerCase
()]||s.valHooks[o.type],n&&"get"in n&&(r=n.get(o,"value"))!==t?r:(r=o.value,typeof r=="string"?r.replace(m,""):r==null?
"":r);return}return i=s.isFunction(e),this.each(function(r){var o=s(this),u;if(this.nodeType!==1)return;i?u=e.call(this
,r,o.val()):u=e,u==null?u="":typeof u=="number"?u+="":s.isArray(u)&&(u=s.map(u,function(e){return e==null?"":e+""})),n=
s.valHooks[this.nodeName.toLowerCase()]||s.valHooks[this.type];if(!n||!("set"in n)||n.set(this,u,"value")===t)this.valu
e=u})}}),s.extend({valHooks:{option:{get:function(e){var t=e.attributes.value;return!t||t.specified?e.value:e.text}},se
lect:{get:function(e){var t,n,r,i,o=e.selectedIndex,u=[],a=e.options,f=e.type==="select-one";if(o<0)return null;n=f?o:0
,r=f?o+1:a.length;for(;n<r;n++){i=a[n];if(i.selected&&(s.support.optDisabled?!i.disabled:i.getAttribute("disabled")===n
ull)&&(!i.parentNode.disabled||!s.nodeName(i.parentNode,"optgroup"))){t=s(i).val();if(f)return t;u.push(t)}}return f&&!
u.length&&a.length?s(a[o]).val():u},set:function(e,t){var n=s.makeArray(t);return s(e).find("option").each(function(){t
his.selected=s.inArray(s(this).val(),n)>=0}),n.length||(e.selectedIndex=-1),n}}},attrFn:{val:!0,css:!0,html:!0,text:!0,
data:!0,width:!0,height:!0,offset:!0},attr:function(e,n,r,i){var o,u,a,f=e.nodeType;if(!e||f===3||f===8||f===2)return;i
f(i&&n in s.attrFn)return s(e)[n](r);if(typeof e.getAttribute=="undefined")return s.prop(e,n,r);a=f!==1||!s.isXMLDoc(e)
,a&&(n=n.toLowerCase(),u=s.attrHooks[n]||(w.test(n)?x:S));if(r!==t){if(r===null){s.removeAttr(e,n);return}return u&&"se
t"in u&&a&&(o=u.set(e,r,n))!==t?o:(e.setAttribute(n,""+r),r)}return u&&"get"in u&&a&&(o=u.get(e,n))!==null?o:(o=e.getAt
tribute(n),o===null?t:o)},removeAttr:function(e,t){var n,r,i,o,u=0;if(t&&e.nodeType===1){r=t.toLowerCase().split(v),o=r
.length;for(;u<o;u++)i=r[u],i&&(n=s.propFix[i]||i,s.attr(e,i,""),e.removeAttribute(E?i:n),w.test(i)&&n in e&&(e[n]=!1))
}},attrHooks:{type:{set:function(e,t){if(g.test(e.nodeName)&&e.parentNode)s.error("type property can't be changed");els
e if(!s.support.radioValue&&t==="radio"&&s.nodeName(e,"input")){var n=e.value;return e.setAttribute("type",t),n&&(e.val
ue=n),t}}},value:{get:function(e,t){return S&&s.nodeName(e,"button")?S.get(e,t):t in e?e.value:null},set:function(e,t,n
){if(S&&s.nodeName(e,"button"))return S.set(e,t,n);e.value=t}}},propFix:{tabindex:"tabIndex",readonly:"readOnly","for":
"htmlFor","class":"className",maxlength:"maxLength",cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpa
n",colspan:"colSpan",usemap:"useMap",frameborder:"frameBorder",contenteditable:"contentEditable"},prop:function(e,n,r){
var i,o,u,a=e.nodeType;if(!e||a===3||a===8||a===2)return;return u=a!==1||!s.isXMLDoc(e),u&&(n=s.propFix[n]||n,o=s.propH
ooks[n]),r!==t?o&&"set"in o&&(i=o.set(e,r,n))!==t?i:e[n]=r:o&&"get"in o&&(i=o.get(e,n))!==null?i:e[n]},propHooks:{tabIn
dex:{get:function(e){var n=e.getAttributeNode("tabindex");return n&&n.specified?parseInt(n.value,10):y.test(e.nodeName)
||b.test(e.nodeName)&&e.href?0:t}}}}),s.attrHooks.tabindex=s.propHooks.tabIndex,x={get:function(e,n){var r,i=s.prop(e,n
);return i===!0||typeof i!="boolean"&&(r=e.getAttributeNode(n))&&r.nodeValue!==!1?n.toLowerCase():t},set:function(e,t,n
){var r;return t===!1?s.removeAttr(e,n):(r=s.propFix[n]||n,r in e&&(e[r]=!0),e.setAttribute(n,n.toLowerCase())),n}},E||
(T={name:!0,id:!0},S=s.valHooks.button={get:function(e,n){var r;return r=e.getAttributeNode(n),r&&(T[n]?r.nodeValue!=="
":r.specified)?r.nodeValue:t},set:function(e,t,r){var i=e.getAttributeNode(r);return i||(i=n.createAttribute(r),e.setAt
tributeNode(i)),i.nodeValue=t+""}},s.attrHooks.tabindex.set=S.set,s.each(["width","height"],function(e,t){s.attrHooks[t
]=s.extend(s.attrHooks[t],{set:function(e,n){if(n==="")return e.setAttribute(t,"auto"),n}})}),s.attrHooks.contenteditab
le={get:S.get,set:function(e,t,n){t===""&&(t="false"),S.set(e,t,n)}}),s.support.hrefNormalized||s.each(["href","src","w
idth","height"],function(e,n){s.attrHooks[n]=s.extend(s.attrHooks[n],{get:function(e){var r=e.getAttribute(n,2);return 
r===null?t:r}})}),s.support.style||(s.attrHooks.style={get:function(e){return e.style.cssText.toLowerCase()||t},set:fun
ction(e,t){return e.style.cssText=""+t}}),s.support.optSelected||(s.propHooks.selected=s.extend(s.propHooks.selected,{g
et:function(e){var t=e.parentNode;return t&&(t.selectedIndex,t.parentNode&&t.parentNode.selectedIndex),null}})),s.suppo
rt.enctype||(s.propFix.enctype="encoding"),s.support.checkOn||s.each(["radio","checkbox"],function(){s.valHooks[this]={
get:function(e){return e.getAttribute("value")===null?"on":e.value}}}),s.each(["radio","checkbox"],function(){s.valHook
s[this]=s.extend(s.valHooks[this],{set:function(e,t){if(s.isArray(t))return e.checked=s.inArray(s(e).val(),t)>=0}})});v
ar N=/^(?:textarea|input|select)$/i,C=/^([^\.]*)?(?:\.(.+))?$/,k=/\bhover(\.\S+)?\b/,L=/^key/,A=/^(?:mouse|contextmenu)
|click/,O=/^(?:focusinfocus|focusoutblur)$/,M=/^(\w*)(?:#([\w\-]+))?(?:\.([\w\-]+))?$/,_=function(e){var t=M.exec(e);re
turn t&&(t[1]=(t[1]||"").toLowerCase(),t[3]=t[3]&&new RegExp("(?:^|\\s)"+t[3]+"(?:\\s|$)")),t},D=function(e,t){var n=e.
attributes||{};return(!t[1]||e.nodeName.toLowerCase()===t[1])&&(!t[2]||(n.id||{}).value===t[2])&&(!t[3]||t[3].test((n["
class"]||{}).value))},P=function(e){return s.event.special.hover?e:e.replace(k,"mouseenter$1 mouseleave$1")};s.event={a
dd:function(e,n,r,i,o){var u,a,f,l,c,h,
p,d,v,m,g,y;if(e.nodeType===3||e.nodeType===8||!n||!r||!(u=s._data(e)))return;r.handler&&(v=r,r=v.handler),r.guid||(r.g
uid=s.guid++),f=u.events,f||(u.events=f={}),a=u.handle,a||(u.handle=a=function(e){return typeof s=="undefined"||!!e&&s.
event.triggered===e.type?t:s.event.dispatch.apply(a.elem,arguments)},a.elem=e),n=s.trim(P(n)).split(" ");for(l=0;l<n.le
ngth;l++){c=C.exec(n[l])||[],h=c[1],p=(c[2]||"").split(".").sort(),y=s.event.special[h]||{},h=(o?y.delegateType:y.bindT
ype)||h,y=s.event.special[h]||{},d=s.extend({type:h,origType:c[1],data:i,handler:r,guid:r.guid,selector:o,quick:_(o),na
mespace:p.join(".")},v),g=f[h];if(!g){g=f[h]=[],g.delegateCount=0;if(!y.setup||y.setup.call(e,i,p,a)===!1)e.addEventLis
tener?e.addEventListener(h,a,!1):e.attachEvent&&e.attachEvent("on"+h,a)}y.add&&(y.add.call(e,d),d.handler.guid||(d.hand
ler.guid=r.guid)),o?g.splice(g.delegateCount++,0,d):g.push(d),s.event.global[h]=!0}e=null},global:{},remove:function(e,
t,n,r,i){var o=s.hasData(e)&&s._data(e),u,a,f,l,c,h,p,d,v,m,g,y;if(!o||!(d=o.events))return;t=s.trim(P(t||"")).split(" 
");for(u=0;u<t.length;u++){a=C.exec(t[u])||[],f=l=a[1],c=a[2];if(!f){for(f in d)s.event.remove(e,f+t[u],n,r,!0);continu
e}v=s.event.special[f]||{},f=(r?v.delegateType:v.bindType)||f,g=d[f]||[],h=g.length,c=c?new RegExp("(^|\\.)"+c.split(".
").sort().join("\\.(?:.*\\.)?")+"(\\.|$)"):null;for(p=0;p<g.length;p++)y=g[p],(i||l===y.origType)&&(!n||n.guid===y.guid
)&&(!c||c.test(y.namespace))&&(!r||r===y.selector||r==="**"&&y.selector)&&(g.splice(p--,1),y.selector&&g.delegateCount-
-,v.remove&&v.remove.call(e,y));g.length===0&&h!==g.length&&((!v.teardown||v.teardown.call(e,c)===!1)&&s.removeEvent(e,
f,o.handle),delete d[f])}s.isEmptyObject(d)&&(m=o.handle,m&&(m.elem=null),s.removeData(e,["events","handle"],!0))},cust
omEvent:{getData:!0,setData:!0,changeData:!0},trigger:function(n,r,i,o){if(!i||i.nodeType!==3&&i.nodeType!==8){var u=n.
type||n,a=[],f,l,c,h,p,d,v,m,g,y;if(O.test(u+s.event.triggered))return;u.indexOf("!")>=0&&(u=u.slice(0,-1),l=!0),u.inde
xOf(".")>=0&&(a=u.split("."),u=a.shift(),a.sort());if((!i||s.event.customEvent[u])&&!s.event.global[u])return;n=typeof 
n=="object"?n[s.expando]?n:new s.Event(u,n):new s.Event(u),n.type=u,n.isTrigger=!0,n.exclusive=l,n.namespace=a.join("."
),n.namespace_re=n.namespace?new RegExp("(^|\\.)"+a.join("\\.(?:.*\\.)?")+"(\\.|$)"):null,d=u.indexOf(":")<0?"on"+u:"";
if(!i){f=s.cache;for(c in f)f[c].events&&f[c].events[u]&&s.event.trigger(n,r,f[c].handle.elem,!0);return}n.result=t,n.t
arget||(n.target=i),r=r!=null?s.makeArray(r):[],r.unshift(n),v=s.event.special[u]||{};if(v.trigger&&v.trigger.apply(i,r
)===!1)return;g=[[i,v.bindType||u]];if(!o&&!v.noBubble&&!s.isWindow(i)){y=v.delegateType||u,h=O.test(y+u)?i:i.parentNod
e,p=null;for(;h;h=h.parentNode)g.push([h,y]),p=h;p&&p===i.ownerDocument&&g.push([p.defaultView||p.parentWindow||e,y])}f
or(c=0;c<g.length&&!n.isPropagationStopped();c++)h=g[c][0],n.type=g[c][1],m=(s._data(h,"events")||{})[n.type]&&s._data(
h,"handle"),m&&m.apply(h,r),m=d&&h[d],m&&s.acceptData(h)&&m.apply(h,r)===!1&&n.preventDefault();return n.type=u,!o&&!n.
isDefaultPrevented()&&(!v._default||v._default.apply(i.ownerDocument,r)===!1)&&(u!=="click"||!s.nodeName(i,"a"))&&s.acc
eptData(i)&&d&&i[u]&&(u!=="focus"&&u!=="blur"||n.target.offsetWidth!==0)&&!s.isWindow(i)&&(p=i[d],p&&(i[d]=null),s.even
t.triggered=u,i[u](),s.event.triggered=t,p&&(i[d]=p)),n.result}return},dispatch:function(n){n=s.event.fix(n||e.event);v
ar r=(s._data(this,"events")||{})[n.type]||[],i=r.delegateCount,o=[].slice.call(arguments,0),u=!n.exclusive&&!n.namespa
ce,a=[],f,l,c,h,p,d,v,m,g,y,b;o[0]=n,n.delegateTarget=this;if(i&&!n.target.disabled&&(!n.button||n.type!=="click")){h=s
(this),h.context=this.ownerDocument||this;for(c=n.target;c!=this;c=c.parentNode||this){d={},m=[],h[0]=c;for(f=0;f<i;f++
)g=r[f],y=g.selector,d[y]===t&&(d[y]=g.quick?D(c,g.quick):h.is(y)),d[y]&&m.push(g);m.length&&a.push({elem:c,matches:m})
}}r.length>i&&a.push({elem:this,matches:r.slice(i)});for(f=0;f<a.length&&!n.isPropagationStopped();f++){v=a[f],n.curren
tTarget=v.elem;for(l=0;l<v.matches.length&&!n.isImmediatePropagationStopped();l++){g=v.matches[l];if(u||!n.namespace&&!
g.namespace||n.namespace_re&&n.namespace_re.test(g.namespace))n.data=g.data,n.handleObj=g,p=((s.event.special[g.origTyp
e]||{}).handle||g.handler).apply(v.elem,o),p!==t&&(n.result=p,p===!1&&(n.preventDefault(),n.stopPropagation()))}}return
 n.result},props:"attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase
 metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key 
keyCode".split(" "),filter:function(e,t){return e.which==null&&(e.which=t.charCode!=null?t.charCode:t.keyCode),e}},mous
eHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(
" "),filter:function(e,r){var i,s,o,u=r.button,a=r.fromElement;return e.pageX==null&&r.clientX!=null&&(i=e.target.owner
Document||n,s=i.documentElement,o=i.body,e.pageX=r.clientX+(s&&s.scrollLeft||o&&o.scrollLeft||0)-(s&&s.clientLeft||o&&o
.clientLeft||0),e.pageY=r.clientY+(s&&s.scrollTop||o&&o.scrollTop||0)-(s&&s.clientTop||o&&o.clientTop||0)),!e.relatedTa
rget&&a&&(e.relatedTarget=a===e.target?r.toElement:a),!e.which&&u!==t&&(e.which=u&1?1:u&2?3:u&4?2:0),e}},fix:function(e
){if(e[s.expando])return e;var r,i,o=e,u=s.event.fixHooks[e.type]||{},a=u.props?this.props.concat(u.props):this.props;e
=s.Event(o);for(r=a.length;r;)i=a[--r],e[i]=o[i];return o.offsetX===t&&(e.offsetX=o.layerX,e.offsetY=o.layerY),e.layerX
=e.offsetX,e.layerY=e.offsetY,e.target||(e.target=o.srcElement||n),e.target.nodeType===3&&(e.target=e.target.parentNode
),e.metaKey===t&&(e.metaKey=e.ctrlKey),u.filter?u.filter(e,o):e},special:{ready:{setup:s.bindReady},load:{noBubble:!0},
focus:{delegateType:"focusin"},blur:{delegateType:"focusout"},beforeunload:{setup:function(e,t,n){s.isWindow(this)&&(th
is.onbeforeunload=n)},teardown:function(e,t){this.onbeforeunload===t&&(this.onbeforeunload=null)}}},simulate:function(e
,t,n,r){var i=s.extend(new s.Event,n,{type:e,isSimulated:!0,originalEvent:{}});r?s.event.trigger(i,null,t):s.event.disp
atch.call(t,i),i.isDefaultPrevented()&&n.preventDefault()}},s.event.handle=s.event.dispatch,s.removeEvent=n.removeEvent
Listener?function(e,t,n){e.removeEventListener&&e.removeEventListener(t,n,!1)}:function(e,t,n){e.detachEvent&&e.detachE
vent("on"+t,n)},s.Event=function(e,t){if(!(this instanceof s.Event))return new s.Event(e,t);e&&e.type?(this.originalEve
nt=e,this.type=e.type,this.isDefaultPrevented=e.defaultPrevented||e.returnValue===!1||e.getPreventDefault&&e.getPrevent
Default()?B:H):this.type=e,t&&s.extend(this,t),this.timeStamp=e&&e.timeStamp||s.now(),this[s.expando]=!0},s.Event.proto
type={preventDefault:function(){this.isDefaultPrevented=B;var e=this.originalEvent;if(!e)return;e.preventDefault?e.prev
entDefault():e.returnValue=!1},stopPropagation:function(){this.isPropagationStopped=B;var e=this.originalEvent;if(!e)re
turn;e.stopPropagation&&e.stopPropagation(),e.cancelBubble=!0},stopImmediatePropagation:function(){this.isImmediateProp
agationStopped=B,this.stopPropagation()},isDefaultPrevented:H,isPropagationStopped:H,isImmediatePropagationStopped:H},s
.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(e,t){s.event.special[e]={delegateType:t,bindType:t,handle
:function(e){var n=this,r=e.relatedTarget,i=e.handleObj,o=i.selector,u;if(!r||r!==n&&!s.contains(n,r))e.type=i.origType
,u=i.handler.apply(this,arguments),e.type=t;return u}}}),s.support.submitBubbles||(s.event.special.submit={setup:functi
on(){if(s.nodeName(this,"form"))return!1;s.event.add(this,"click._submit keypress._submit",function(e){var n=e.target,r
=s.nodeName(n,"input")||s.nodeName(n,"button")?n.form:t;r&&!r._submit_attached&&(s.event.add(r,"submit._submit",functio
n(e){this.parentNode&&!e.isTrigger&&s.event.simulate("submit",this.parentNode,e,!0)}),r._submit_attached=!0)})},teardow
n:function(){if(s.nodeName(this,"form"))return!1;s.event.remove(this,"._submit")}}),s.support.changeBubbles||(s.event.s
pecial.change={setup:function(){if(N.test(this.nodeName)){if(this.type==="checkbox"||this.type==="radio")s.event.add(th
is,"propertychange._change",function(e){e.originalEvent.propertyName==="checked"&&(this._just_changed=!0)}),s.event.add
(this,"click._change",function(e){this._just_changed&&!e.isTrigger&&(this._just_changed=!1,s.event.simulate("change",th
is,e,!0))});return!1}s.event.add(this,"beforeactivate._change",function(e){var t=e.target;N.test(t.nodeName)&&!t._chang
e_attached&&(s.event.add(t,"change._change",function(e){this.parentNode&&!e.isSimulated&&!e.isTrigger&&s.event.simulate
("change",this.parentNode,e,!0)}),t._change_attached=!0)})},handle:function(e){var t=e.target;if(this!==t||e.isSimulate
d||e.isTrigger||t.type!=="radio"&&t.type!=="checkbox")return e.handleObj.handler.apply(this,arguments)},teardown:functi
on(){return s.event.remove(this,"._change"),N.test(this.nodeName)}}),s.support.focusinBubbles||s.each({focus:"focusin",
blur:"focusout"},function(e,t){var r=0,i=function(e){s.event.simulate(t,e.target,s.event.fix(e),!0)};s.event.special[t]
={setup:function(){r++===0&&n.addEventListener(e,i,!0)},teardown:function(){--r===0&&n.removeEventListener(e,i,!0)}}}),
s.fn.extend({on:function(e,n,r,i,o){var u,a;if(typeof e=="object"){typeof n!="string"&&(r=n,n=t);for(a in e)this.on(a,n
,r,e[a],o);return this}r==null&&i==null?(i=n,r=n=t):i==null&&(typeof n=="string"?(i=r,r=t):(i=r,r=n,n=t));if(i===!1)i=H
;else if(!i)return this;return o===1&&(u=i,i=function(e){return s().off(e),u.apply(this,arguments)},i.guid=u.guid||(u.g
uid=s.guid++)),this.each(function(){s.event.add(this,e,i,r,n)})},one:function(e,t,n,r){return this.on.call(this,e,t,n,r
,1)},off:function(e,n,r){if(e&&e.preventDefault&&e.handleObj){var i=e.handleObj;return s(e.delegateTarget).off(i.namesp
ace?i.type+"."+i.namespace:i.type,i.selector,i.handler),this}if(typeof e=="object"){for(var o in e)this.off(o,n,e[o]);r
eturn this}if(n===!1||typeof n=="function")r=n,n=t;return r===!1&&(r=H),this.each(function(){s.event.remove(this,e,r,n)
})},bind:function(e,t,n){return this.on(e,null,t,n)},unbind:function(e,t){return this.off(e,null,t)},live:function(e,t,
n){return s(this.context).on(e,this.selector,t,n),this},die:function(e,t){return s(this.context).off(e,this.selector||"
**",t),this},delegate:function(e,t,n,r){return this.on(t,e,n,r)},undelegate:function(e,t,n){return arguments.length==1?
this.off(e,"**"):this.off(t,e,n)},trigger:function(e,t){return this.each(function(){s.event.trigger(e,t,this)})},trigge
rHandler:function(e,t){if(this[0])return s.event.trigger(e,t,this[0],!0)},toggle:function(e){var t=arguments,n=e.guid||
s.guid++,r=0,i=function(n){var i=(s._data(this,"lastToggle"+e.guid)||0)%r;return s._data(this,"lastToggle"+e.guid,i+1),
n.preventDefault(),t[i].apply(this,arguments)||!1};i.guid=n;while(r<t.length)t[r++].guid=n;return this.click(i)},hover:
function(e,t){return this.mouseenter(e).mouseleave(t||e)}}),s.each("blur focus focusin focusout load resize scroll unlo
ad click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown key
press keyup error contextmenu".split(" "),function(e,t){s.fn[t]=function(e,n){return n==null&&(n=e,e=null),arguments.le
ngth>0?this.on(t,null,e,n):this.trigger(t)},s.attrFn&&(s.attrFn[t]=!0),L.test(t)&&(s.event.fixHooks[t]=s.event.keyHooks
),A.test(t)&&(s.event.fixHooks[t]=s.event.mouseHooks)}),function(){function S(e,t,n,i,s,o){for(var u=0,a=i.length;u<a;u
++){var f=i[u];if(f){var l=!1;f=f[e];while(f){if(f[r]===n){l=i[f.sizset];break}f.nodeType===1&&!o&&(f[r]=n,f.sizset=u);
if(f.nodeName.toLowerCase()===t){l=f;break}f=f[e]}i[u]=l}}}function x(e,t,n,i,s,o){for(var u=0,a=i.length;u<a;u++){var 
f=i[u];if(f){var l=!1;f=f[e];while(f){if(f[r]===n){l=i[f.sizset];break}if(f.nodeType===1){o||(f[r]=n,f.sizset=u);if(typ
eof t!="string"){if(f===t){l=!0;break}}else if(h.filter(t,[f]).length>0){l=f;break}}f=f[e]}i[u]=l}}}var e=/((?:\((?:\([
^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/
g,r="sizcache"+(Math.random()+"").replace(".",""),i=0,o=Object.prototype.toString,u=!1,a=!0,f=/\\/g,l=/\r\n/g,c=/\W/;[0
,0].sort(function(){return a=!1,0});var h=function(t,r,i,s){i=i||[],r=r||n;var u=r;if(r.nodeType!==1&&r.nodeType!==9)re
turn[];if(!t||typeof t!="string")return i;var a,f,l,c,p,m,g,b,w=!0,E=h.isXML(r),S=[],x=t;do{e.exec(""),a=e.exec(x);if(a
){x=a[3],S.push(a[1]);if(a[2]){c=a[3];break}}}while(a);if(S.length>1&&v.exec(t))if(S.length===2&&d.relative[S[0]])f=T(S
[0]+S[1],r,s);else{f=d.relative[S[0]]?[r]:h(S.shift(),r);while(S.length)t=S.shift(),d.relative[t]&&(t+=S.shift()),f=T(t
,f,s)}else{!s&&S.length>1&&r.nodeType===9&&!E&&d.match.ID.test(S[0])&&!d.match.ID.test(S[S.length-1])&&(p=h.find(S.shif
t(),r,E),r=p.expr?h.filter(p.expr,p.set)[0]:p.set[0]);if(r){p=s?{expr:S.pop(),set:y(s)}:h.find(S.pop(),S.length!==1||S[
0]!=="~"&&S[0]!=="+"||!r.parentNode?r:r.parentNode,E),f=p.expr?h.filter(p.expr,p.set):p.set,S.length>0?l=y(f):w=!1;whil
e(S.length)m=S.pop(),g=m,d.relative[m]?g=S.pop():m="",g==null&&(g=r),d.relative[m](l,g,E)}else l=S=[]}l||(l=f),l||h.err
or(m||t);if(o.call(l)==="[object Array]")if(!w)i.push.apply(i,l);else if(r&&r.nodeType===1)for(b=0;l[b]!=null;b++)l[b]&
&(l[b]===!0||l[b].nodeType===1&&h.contains(r,l[b]))&&i.push(f[b]);else for(b=0;l[b]!=null;b++)l[b]&&l[b].nodeType===1&&
i.push(f[b]);else y(l,i);return c&&(h(c,u,i,s),h.uniqueSort(i)),i};h.uniqueSort=function(e){if(w){u=a,e.sort(w);if(u)fo
r(var t=1;t<e.length;t++)e[t]===e[t-1]&&e.splice(t--,1)}return e},h.matches=function(e,t){return h(e,null,null,t)},h.ma
tchesSelector=function(e,t){return h(t,null,null,[e]).length>0},h.find=function(e,t,n){var r,i,s,o,u,a;if(!e)return[];f
or(i=0,s=d.order.length;i<s;i++){u=d.order[i];if(o=d.leftMatch[u].exec(e)){a=o[1],o.splice(1,1);if(a.substr(a.length-1)
!=="\\"){o[1]=(o[1]||"").replace(f,""),r=d.find[u](o,t,n);if(r!=null){e=e.replace(d.match[u],"");break}}}}return r||(r=
typeof t.getElementsByTagName!="undefined"?t.getElementsByTagName("*"):[]),{set:r,expr:e}},h.filter=function(e,n,r,i){v
ar s,o,u,a,f,l,c,p,v,m=e,g=[],y=n,b=n&&n[0]&&h.isXML(n[0]);while(e&&n.length){for(u in d.filter)if((s=d.leftMatch[u].ex
ec(e))!=null&&s[2]){l=d.filter[u],c=s[1],o=!1,s.splice(1,1);if(c.substr(c.length-1)==="\\")continue;y===g&&(g=[]);if(d.
preFilter[u]){s=d.preFilter[u](s,y,r,g,i,b);if(!s)o=a=!0;else if(s===!0)continue}if(s)for(p=0;(f=y[p])!=null;p++)f&&(a=
l(f,s,p,y),v=i^a,r&&a!=null?v?o=!0:y[p]=!1:v&&(g.push(f),o=!0));if(a!==t){r||(y=g),e=e.replace(d.match[u],"");if(!o)ret
urn[];break}}if(e===m){if(o!=null)break;h.error(e)}m=e}return y},h.error=function(e){throw new Error("Syntax error, unr
ecognized expression: "+e)};var p=h.getText=function(e){var t,n,r=e.nodeType,i="";if(r){if(r===1||r===9){if(typeof e.te
xtContent=="string")return e.textContent;if(typeof e.innerText=="string")return e.innerText.replace(l,"");for(e=e.first
Child;e;e=e.nextSibling)i+=p(e)}else if(r===3||r===4)return e.nodeValue}else for(t=0;n=e[t];t++)n.nodeType!==8&&(i+=p(n
));return i},d=h.selectors={order:["ID","NAME","TAG"],match:{ID:/#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,CLASS:/\.((?:[\w\u00c
0-\uFFFF\-]|\\.)+)/,NAME:/\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,ATTR:/\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\
s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,TAG:/^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,CHILD
:/:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,POS:/:(nth|eq
|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,PSEUDO:/:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)
|[^\(\)]*)+)\2\))?/},leftMatch:{},attrMap:{"class":"className","for":"htmlFor"},attrHandle:{href:function(e){return e.g
etAttribute("href")},type:function(e){return e.getAttribute("type")}},relative:{"+":function(e,t){var n=typeof t=="stri
ng",r=n&&!c.test(t),i=n&&!r;r&&(t=t.toLowerCase());for(var s=0,o=e.length,u;s<o;s++)if(u=e[s]){while((u=u.previousSibli
ng)&&u.nodeType!==1);e[s]=i||u&&u.nodeName.toLowerCase()===t?u||!1:u===t}i&&h.filter(t,e,!0)},">":function(e,t){var n,r
=typeof t=="string",i=0,s=e.length;if(r&&!c.test(t)){t=t.toLowerCase();for(;i<s;i++){n=e[i];if(n){var o=n.parentNode;e[
i]=o.nodeName.toLowerCase()===t?o:!1}}}else{for(;i<s;i++)n=e[i],n&&(e[i]=r?n.parentNode:n.parentNode===t);r&&h.filter(t
,e,!0)}},"":function(e,t,n){var r,s=i++,o=x;typeof t=="string"&&!c.test(t)&&(t=t.toLowerCase(),r=t,o=S),o("parentNode",
t,s,e,r,n)},"~":function(e,t,n){var r,s=i++,o=x;typeof t=="string"&&!c.test(t)&&(t=t.toLowerCase(),r=t,o=S),o("previous
Sibling",t,s,e,r,n)}},find:{ID:function(e,t,n){if(typeof t.getElementById!="undefined"&&!n){var r=t.getElementById(e[1]
);return r&&r.parentNode?[r]:[]}},NAME:function(e,t){if(typeof t.getElementsByName!="undefined"){var n=[],r=t.getElemen
tsByName(e[1]);for(var i=0,s=r.length;i<s;i++)r[i].getAttribute("name")===e[1]&&n.push(r[i]);return n.length===0?null:n
}},TAG:function(e,t){if(typeof t.getElementsByTagName!="undefined")return t.getElementsByTagName(e[1])}},preFilter:{CLA
SS:function(e,t,n,r,i,s){e=" "+e[1].replace(f,"")+" ";if(s)return e;for(var o=0,u;(u=t[o])!=null;o++)u&&(i^(u.className
&&(" "+u.className+" ").replace(/[\t\n\r]/g," ").indexOf(e)>=0)?n||r.push(u):n&&(t[o]=!1));return!1},ID:function(e){ret
urn e[1].replace(f,"")},TAG:function(e,t){return e[1].replace(f,"").toLowerCase()},CHILD:function(e){if(e[1]==="nth"){e
[2]||h.error(e[0]),e[2]=e[2].replace(/^\+|\s*/g,"");var t=/(-?)(\d*)(?:n([+\-]?\d*))?/.exec(e[2]==="even"&&"2n"||e[2]==
="odd"&&"2n+1"||!/\D/.test(e[2])&&"0n+"+e[2]||e[2]);e[2]=t[1]+(t[2]||1)-0,e[3]=t[3]-0}else e[2]&&h.error(e[0]);return e
[0]=i++,e},ATTR:function(e,t,n,r,i,s){var o=e[1]=e[1].replace(f,"");return!s&&d.attrMap[o]&&(e[1]=d.attrMap[o]),e[4]=(e
[4]||e[5]||"").replace(f,""),e[2]==="~="&&(e[4]=" "+e[4]+" "),e},PSEUDO:function(t,n,r,i,s){if(t[1]==="not"){if(!((e.ex
ec(t[3])||"").length>1||/^\w/.test(t[3]))){var o=h.filter(t[3],n,r,!0^s);return r||i.push.apply(i,o),!1}t[3]=h(t[3],nul
l,null,n)}else if(d.match.POS.test(t[0])||d.match.CHILD.test(t[0]))return!0;return t},POS:function(e){return e.unshift(
!0),e}},filters:{enabled:function(e){return e.disabled===!1&&e.type!=="hidden"},disabled:function(e){return e.disabled=
==!0},checked:function(e){return e.checked===!0},selected:function(e){return e.parentNode&&e.parentNode.selectedIndex,e
.selected===!0},parent:function(e){return!!e.firstChild},empty:function(e){return!e.firstChild},has:function(e,t,n){ret
urn!!h(n[3],e).length},header:function(e){return/h\d/i.test(e.nodeName)},text:function(e){var t=e.getAttribute("type"),
n=e.type;return e.nodeName.toLowerCase()==="input"&&"text"===n&&(t===n||t===null)},radio:function(e){return e.nodeName.
toLowerCase()==="input"&&"radio"===e.type},checkbox:function(e){return e.nodeName.toLowerCase()==="input"&&"checkbox"==
=e.type},file:function(e){return e.nodeName.toLowerCase()==="input"&&"file"===e.type},password:function(e){return e.nod
eName.toLowerCase()==="input"&&"password"===e.type},submit:function(e){var t=e.nodeName.toLowerCase();return(t==="input
"||t==="button")&&"submit"===e.type},image:function(e){return e.nodeName.toLowerCase()==="input"&&"image"===e.type},res
et:function(e){var t=e.nodeName.toLowerCase();return(t==="input"||t==="button")&&"reset"===e.type},button:function(e){v
ar t=e.nodeName.toLowerCase();return t==="input"&&"button"===e.type||t==="button"},input:function(e){return/input|selec
t|textarea|button/i.test(e.nodeName)},focus:function(e){return e===e.ownerDocument.activeElement}},setFilters:{first:fu
nction(e,t){return t===0},last:function(e,t,n,r){return t===r.length-1},even:function(e,t){return t%2===0},odd:function
(e,t){return t%2===1},lt:function(e,t,n){return t<n[3]-0},gt:function(e,t,n){return t>n[3]-0},nth:function(e,t,n){retur
n n[3]-0===t},eq:function(e,t,n){return n[3]-0===t}},filter:{PSEUDO:function(e,t,n,r){var i=t[1],s=d.filters[i];if(s)re
turn s(e,n,t,r);if(i==="contains")return(e.textContent||e.innerText||p([e])||"").indexOf(t[3])>=0;if(i==="not"){var o=t
[3];for(var u=0,a=o.length;u<a;u++)if(o[u]===e)return!1;return!0}h.error(i)},CHILD:function(e,t){var n,i,s,o,u,a,f,l=t[
1],c=e;switch(l){case"only":case"first":while(c=c.previousSibling)if(c.nodeType===1)return!1;if(l==="first")return!0;c=
e;case"last":while(c=c.nextSibling)if(c.nodeType===1)return!1;return!0;case"nth":n=t[2],i=t[3];if(n===1&&i===0)return!0
;s=t[0],o=e.parentNode;if(o&&(o[r]!==s||!e.nodeIndex)){a=0;for(c=o.firstChild;c;c=c.nextSibling)c.nodeType===1&&(c.node
Index=++a);o[r]=s}return f=e.nodeIndex-i,n===0?f===0:f%n===0&&f/n>=0}},ID:function(e,t){return e.nodeType===1&&e.getAtt
ribute("id")===t},TAG:function(e,t){return t==="*"&&e.nodeType===1||!!e.nodeName&&e.nodeName.toLowerCase()===t},CLASS:f
unction(e,t){return(" "+(e.className||e.getAttribute("class"))+" ").indexOf(t)>-1},ATTR:function(e,t){var n=t[1],r=h.at
tr?h.attr(e,n):d.attrHandle[n]?d.attrHandle[n](e):e[n]!=null?e[n]:e.getAttribute(n),i=r+"",s=t[2],o=t[4];return r==null
?s==="!=":!s&&h.attr?r!=null:s==="="?i===o:s==="*="?i.indexOf(o)>=0:s==="~="?(" "+i+" ").indexOf(o)>=0:o?s==="!="?i!==o
:s==="^="?i.indexOf(o)===0:s==="$="?i.substr(i.length-o.length)===o:s==="|="?i===o||i.substr(0,o.length+1)===o+"-":!1:i
&&r!==!1},POS:function(e,t,n,r){var i=t[2],s=d.setFilters[i];if(s)return s(e,n,t,r)}}},v=d.match.POS,m=function(e,t){re
turn"\\"+(t-0+1)};for(var g in d.match)d.match[g]=new RegExp(d.match[g].source+/(?![^\[]*\])(?![^\(]*\))/.source),d.lef
tMatch[g]=new RegExp(/(^(?:.|\r|\n)*?)/.source+d.match[g].source.replace(/\\(\d+)/g,m));var y=function(e,t){return e=Ar
ray.prototype.slice.call(e,0),t?(t.push.apply(t,e),t):e};try{Array.prototype.slice.call(n.documentElement.childNodes,0)
[0].nodeType}catch(b){y=function(e,t){var n=0,r=t||[];if(o.call(e)==="[object Array]")Array.prototype.push.apply(r,e);e
lse if(typeof e.length=="number")for(var i=e.length;n<i;n++)r.push(e[n]);else for(;e[n];n++)r.push(e[n]);return r}}var 
w,E;n.documentElement.compareDocumentPosition?w=function(e,t){return e===t?(u=!0,0):!e.compareDocumentPosition||!t.comp
areDocumentPosition?e.compareDocumentPosition?-1:1:e.compareDocumentPosition(t)&4?-1:1}:(w=function(e,t){if(e===t)retur
n u=!0,0;if(e.sourceIndex&&t.sourceIndex)return e.sourceIndex-t.sourceIndex;var n,r,i=[],s=[],o=e.parentNode,a=t.parent
Node,f=o;if(o===a)return E(e,t);if(!o)return-1;if(!a)return 1;while(f)i.unshift(f),f=f.parentNode;f=a;while(f)s.unshift
(f),f=f.parentNode;n=i.length,r=s.length;for(var l=0;l<n&&l<r;l++)if(i[l]!==s[l])return E(i[l],s[l]);return l===n?E(e,s
[l],-1):E(i[l],t,1)},E=function(e,t,n){if(e===t)return n;var r=e.nextSibling;while(r){if(r===t)return-1;r=r.nextSibling
}return 1}),function(){var e=n.createElement("div"),r="script"+(new Date).getTime(),i=n.documentElement;e.innerHTML="<a
 name='"+r+"'/>",i.insertBefore(e,i.firstChild),n.getElementById(r)&&(d.find.ID=function(e,n,r){if(typeof n.getElementB
yId!="undefined"&&!r){var i=n.getElementById(e[1]);return i?i.id===e[1]||typeof i.getAttributeNode!="undefined"&&i.getA
ttributeNode("id").nodeValue===e[1]?[i]:t:[]}},d.filter.ID=function(e,t){var n=typeof e.getAttributeNode!="undefined"&&
e.getAttributeNode("id");return e.nodeType===1&&n&&n.nodeValue===t}),i.removeChild(e),i=e=null}(),function(){var e=n.cr
eateElement("div");e.appendChild(n.createComment("")),e.getElementsByTagName("*").length>0&&(d.find.TAG=function(e,t){v
ar n=t.getElementsByTagName(e[1]);if(e[1]==="*"){var r=[];for(var i=0;n[i];i++)n[i].nodeType===1&&r.push(n[i]);n=r}retu
rn n}),e.innerHTML="<a href='#'></a>",e.firstChild&&typeof e.firstChild.getAttribute!="undefined"&&e.firstChild.getAttr
ibute("href")!=="#"&&(d.attrHandle.href=function(e){return e.getAttribute("href",2)}),e=null}(),n.querySelectorAll&&fun
ction(){var e=h,t=n.createElement("div"),r="__sizzle__";t.innerHTML="<p class='TEST'></p>";if(t.querySelectorAll&&t.que
rySelectorAll(".TEST").length===0)return;h=function(t,i,s,o){i=i||n;if(!o&&!h.isXML(i)){var u=/^(\w+$)|^\.([\w\-]+$)|^#
([\w\-]+$)/.exec(t);if(u&&(i.nodeType===1||i.nodeType===9)){if(u[1])return y(i.getElementsByTagName(t),s);if(u[2]&&d.fi
nd.CLASS&&i.getElementsByClassName)return y(i.getElementsByClassName(u[2]),s)}if(i.nodeType===9){if(t==="body"&&i.body)
return y([i.body],s);if(u&&u[3]){var a=i.getElementById(u[3]);if(!a||!a.parentNode)return y([],s);if(a.id===u[3])return
 y([a],s)}try{return y(i.querySelectorAll(t),s)}catch(f){}}else if(i.nodeType===1&&i.nodeName.toLowerCase()!=="object")
{var l=i,c=i.getAttribute("id"),p=c||r,v=i.parentNode,m=/^\s*[+~]/.test(t);c?p=p.replace(/'/g,"\\$&"):i.setAttribute("i
d",p),m&&v&&(i=i.parentNode);try{if(!m||v)return y(i.querySelectorAll("[id='"+p+"'] "+t),s)}catch(g){}finally{c||l.remo
veAttribute("id")}}}return e(t,i,s,o)};for(var i in e)h[i]=e[i];t=null}(),function(){var e=n.documentElement,t=e.matche
sSelector||e.mozMatchesSelector||e.webkitMatchesSelector||e.msMatchesSelector;if(t){var r=!t.call(n.createElement("div"
),"div"),i=!1;try{t.call(n.documentElement,"[test!='']:sizzle")}catch(s){i=!0}h.matchesSelector=function(e,n){n=n.repla
ce(/\=\s*([^'"\]]*)\s*\]/g,"='$1']");if(!h.isXML(e))try{if(i||!d.match.PSEUDO.test(n)&&!/!=/.test(n)){var s=t.call(e,n)
;if(s||!r||e.document&&e.document.nodeType!==11)return s}}catch(o){}return h(n,null,null,[e]).length>0}}}(),function(){
var e=n.createElement("div");e.innerHTML="<div class='test e'></div><div class='test'></div>";if(!e.getElementsByClassN
ame||e.getElementsByClassName("e").length===0)return;e.lastChild.className="e";if(e.getElementsByClassName("e").length=
==1)return;d.order.splice(1,0,"CLASS"),d.find.CLASS=function(e,t,n){if(typeof t.getElementsByClassName!="undefined"&&!n
)return t.getElementsByClassName(e[1])},e=null}(),n.documentElement.contains?h.contains=function(e,t){return e!==t&&(e.
contains?e.contains(t):!0)}:n.documentElement.compareDocumentPosition?h.contains=function(e,t){return!!(e.compareDocume
ntPosition(t)&16)}:h.contains=function(){return!1},h.isXML=function(e){var t=(e?e.ownerDocument||e:0).documentElement;r
eturn t?t.nodeName!=="HTML":!1};var T=function(e,t,n){var r,i=[],s="",o=t.nodeType?[t]:t;while(r=d.match.PSEUDO.exec(e)
)s+=r[0],e=e.replace(d.match.PSEUDO,"");e=d.relative[e]?e+"*":e;for(var u=0,a=o.length;u<a;u++)h(e,o[u],i,n);return h.f
ilter(s,i)};h.attr=s.attr,h.selectors.attrMap={},s.find=h,s.expr=h.selectors,s.expr[":"]=s.expr.filters,s.unique=h.uniq
ueSort,s.text=h.getText,s.isXMLDoc=h.isXML,s.contains=h.contains}();var j=/Until$/,F=/^(?:parents|prevUntil|prevAll)/,I
=/,/,q=/^.[^:#\[\.,]*$/,R=Array.prototype.slice,U=s.expr.match.POS,z={children:!0,contents:!0,next:!0,prev:!0};s.fn.ext
end({find:function(e){var t=this,n,r;if(typeof e!="string")return s(e).filter(function(){for(n=0,r=t.length;n<r;n++)if(
s.contains(t[n],this))return!0});var i=this.pushStack("","find",e),o,u,a;for(n=0,r=this.length;n<r;n++){o=i.length,s.fi
nd(e,this[n],i);if(n>0)for(u=o;u<i.length;u++)for(a=0;a<o;a++)if(i[a]===i[u]){i.splice(u--,1);break}}return i},has:func
tion(e){var t=s(e);return this.filter(function(){for(var e=0,n=t.length;e<n;e++)if(s.contains(this,t[e]))return!0})},no
t:function(e){return this.pushStack(X(this,e,!1),"not",e)},filter:function(e){return this.pushStack(X(this,e,!0),"filte
r",e)},is:function(e){return!!e&&(typeof e=="string"?U.test(e)?s(e,this.context).index(this[0])>=0:s.filter(e,this).len
gth>0:this.filter(e).length>0)},closest:function(e,t){var n=[],r,i,o=this[0];if(s.isArray(e)){var u=1;while(o&&o.ownerD
ocument&&o!==t){for(r=0;r<e.length;r++)s(o).is(e[r])&&n.push({selector:e[r],elem:o,level:u});o=o.parentNode,u++}return 
n}var a=U.test(e)||typeof e!="string"?s(e,t||this.context):0;for(r=0,i=this.length;r<i;r++){o=this[r];while(o){if(a?a.i
ndex(o)>-1:s.find.matchesSelector(o,e)){n.push(o);break}o=o.parentNode;if(!o||!o.ownerDocument||o===t||o.nodeType===11)
break}}return n=n.length>1?s.unique(n):n,this.pushStack(n,"closest",e)},index:function(e){return e?typeof e=="string"?s
.inArray(this[0],s(e)):s.inArray(e.jquery?e[0]:e,this):this[0]&&this[0].parentNode?this.prevAll().length:-1},add:functi
on(e,t){var n=typeof e=="string"?s(e,t):s.makeArray(e&&e.nodeType?[e]:e),r=s.merge(this.get(),n);return this.pushStack(
W(n[0])||W(r[0])?r:s.unique(r))},andSelf:function(){return this.add(this.prevObject)}}),s.each({parent:function(e){var 
t=e.parentNode;return t&&t.nodeType!==11?t:null},parents:function(e){return s.dir(e,"parentNode")},parentsUntil:functio
n(e,t,n){return s.dir(e,"parentNode",n)},next:function(e){return s.nth(e,2,"nextSibling")},prev:function(e){return s.nt
h(e,2,"previousSibling")},nextAll:function(e){return s.dir(e,"nextSibling")},prevAll:function(e){return s.dir(e,"previo
usSibling")},nextUntil:function(e,t,n){return s.dir(e,"nextSibling",n)},prevUntil:function(e,t,n){return s.dir(e,"previ
ousSibling",n)},siblings:function(e){return s.sibling(e.parentNode.firstChild,e)},children:function(e){return s.sibling
(e.firstChild)},contents:function(e){return s.nodeName(e,"iframe")?e.contentDocument||e.contentWindow.document:s.makeAr
ray(e.childNodes)}},function(e,t){s.fn[e]=function(n,r){var i=s.map(this,t,n);return j.test(e)||(r=n),r&&typeof r=="str
ing"&&(i=s.filter(r,i)),i=this.length>1&&!z[e]?s.unique(i):i,(this.length>1||I.test(r))&&F.test(e)&&(i=i.reverse()),thi
s.pushStack(i,e,R.call(arguments).join(","))}}),s.extend({filter:function(e,t,n){return n&&(e=":not("+e+")"),t.length==
=1?s.find.matchesSelector(t[0],e)?[t[0]]:[]:s.find.matches(e,t)},dir:function(e,n,r){var i=[],o=e[n];while(o&&o.nodeTyp
e!==9&&(r===t||o.nodeType!==1||!s(o).is(r)))o.nodeType===1&&i.push(o),o=o[n];return i},nth:function(e,t,n,r){t=t||1;var
 i=0;for(;e;e=e[n])if(e.nodeType===1&&++i===t)break;return e},sibling:function(e,t){var n=[];for(;e;e=e.nextSibling)e.n
odeType===1&&e!==t&&n.push(e);return n}});var $="abbr|article|aside|audio|canvas|datalist|details|figcaption|figure|foo
ter|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",J=/ jQuery\d+="(?:\d+|null)"/g,K=/^\s+/,Q=
/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,G=/<([\w:]+)/,Y=/<tbody/i,Z=/<|&#?\w+;/,et=/<
(?:script|style)/i,tt=/<(?:script|object|embed|option|style)/i,nt=new RegExp("<(?:"+$+")","i"),rt=/checked\s*(?:[^=]|=\
s*.checked.)/i,it=/\/(java|ecma)script/i,st=/^\s*<!(?:\[CDATA\[|\-\-)/,ot={option:[1,"<select multiple='multiple'>","</
select>"],legend:[1,"<fieldset>","</fieldset>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>
"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"]
,area:[1,"<map>","</map>"],_default:[0,"",""]},ut=V(n);ot.optgroup=ot.option,ot.tbody=ot.tfoot=ot.colgroup=ot.caption=o
t.thead,ot.th=ot.td,s.support.htmlSerialize||(ot._default=[1,"div<div>","</div>"]),s.fn.extend({text:function(e){return
 s.isFunction(e)?this.each(function(t){var n=s(this);n.text(e.call(this,t,n.text()))}):typeof e!="object"&&e!==t?this.e
mpty().append((this[0]&&this[0].ownerDocument||n).createTextNode(e)):s.text(this)},wrapAll:function(e){if(s.isFunction(
e))return this.each(function(t){s(this).wrapAll(e.call(this,t))});if(this[0]){var t=s(e,this[0].ownerDocument).eq(0).cl
one(!0);this[0].parentNode&&t.insertBefore(this[0]),t.map(function(){var e=this;while(e.firstChild&&e.firstChild.nodeTy
pe===1)e=e.firstChild;return e}).append(this)}return this},wrapInner:function(e){return s.isFunction(e)?this.each(funct
ion(t){s(this).wrapInner(e.call(this,t))}):this.each(function(){var t=s(this),n=t.contents();n.length?n.wrapAll(e):t.ap
pend(e)})},wrap:function(e){var t=s.isFunction(e);return this.each(function(n){s(this).wrapAll(t?e.call(this,n):e)})},u
nwrap:function(){return this.parent().each(function(){s.nodeName(this,"body")||s(this).replaceWith(this.childNodes)}).e
nd()},append:function(){return this.domManip(arguments,!0,function(e){this.nodeType===1&&this.appendChild(e)})},prepend
:function(){return this.domManip(arguments,!0,function(e){this.nodeType===1&&this.insertBefore(e,this.firstChild)})},be
fore:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,!1,function(e){this.parentNode.insertBefo
re(e,this)});if(arguments.length){var e=s.clean(arguments);return e.push.apply(e,this.toArray()),this.pushStack(e,"befo
re",arguments)}},after:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,!1,function(e){this.par
entNode.insertBefore(e,this.nextSibling)});if(arguments.length){var e=this.pushStack(this,"after",arguments);return e.p
ush.apply(e,s.clean(arguments)),e}},remove:function(e,t){for(var n=0,r;(r=this[n])!=null;n++)if(!e||s.filter(e,[r]).len
gth)!t&&r.nodeType===1&&(s.cleanData(r.getElementsByTagName("*")),s.cleanData([r])),r.parentNode&&r.parentNode.removeCh
ild(r);return this},empty:function(){for(var e=0
,t;(t=this[e])!=null;e++){t.nodeType===1&&s.cleanData(t.getElementsByTagName("*"));while(t.firstChild)t.removeChild(t.f
irstChild)}return this},clone:function(e,t){return e=e==null?!1:e,t=t==null?e:t,this.map(function(){return s.clone(this
,e,t)})},html:function(e){if(e===t)return this[0]&&this[0].nodeType===1?this[0].innerHTML.replace(J,""):null;if(typeof 
e=="string"&&!et.test(e)&&(s.support.leadingWhitespace||!K.test(e))&&!ot[(G.exec(e)||["",""])[1].toLowerCase()]){e=e.re
place(Q,"<$1></$2>");try{for(var n=0,r=this.length;n<r;n++)this[n].nodeType===1&&(s.cleanData(this[n].getElementsByTagN
ame("*")),this[n].innerHTML=e)}catch(i){this.empty().append(e)}}else s.isFunction(e)?this.each(function(t){var n=s(this
);n.html(e.call(this,t,n.html()))}):this.empty().append(e);return this},replaceWith:function(e){return this[0]&&this[0]
.parentNode?s.isFunction(e)?this.each(function(t){var n=s(this),r=n.html();n.replaceWith(e.call(this,t,r))}):(typeof e!
="string"&&(e=s(e).detach()),this.each(function(){var t=this.nextSibling,n=this.parentNode;s(this).remove(),t?s(t).befo
re(e):s(n).append(e)})):this.length?this.pushStack(s(s.isFunction(e)?e():e),"replaceWith",e):this},detach:function(e){r
eturn this.remove(e,!0)},domManip:function(e,n,r){var i,o,u,a,f=e[0],l=[];if(!s.support.checkClone&&arguments.length===
3&&typeof f=="string"&&rt.test(f))return this.each(function(){s(this).domManip(e,n,r,!0)});if(s.isFunction(f))return th
is.each(function(i){var o=s(this);e[0]=f.call(this,i,n?o.html():t),o.domManip(e,n,r)});if(this[0]){a=f&&f.parentNode,s.
support.parentNode&&a&&a.nodeType===11&&a.childNodes.length===this.length?i={fragment:a}:i=s.buildFragment(e,this,l),u=
i.fragment,u.childNodes.length===1?o=u=u.firstChild:o=u.firstChild;if(o){n=n&&s.nodeName(o,"tr");for(var c=0,h=this.len
gth,p=h-1;c<h;c++)r.call(n?at(this[c],o):this[c],i.cacheable||h>1&&c<p?s.clone(u,!0,!0):u)}l.length&&s.each(l,vt)}retur
n this}}),s.buildFragment=function(e,t,r){var i,o,u,a,f=e[0];return t&&t[0]&&(a=t[0].ownerDocument||t[0]),a.createDocum
entFragment||(a=n),e.length===1&&typeof f=="string"&&f.length<512&&a===n&&f.charAt(0)==="<"&&!tt.test(f)&&(s.support.ch
eckClone||!rt.test(f))&&(s.support.html5Clone||!nt.test(f))&&(o=!0,u=s.fragments[f],u&&u!==1&&(i=u)),i||(i=a.createDocu
mentFragment(),s.clean(e,a,i,r)),o&&(s.fragments[f]=u?i:1),{fragment:i,cacheable:o}},s.fragments={},s.each({appendTo:"a
ppend",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(e,t){s.fn[e]=fu
nction(n){var r=[],i=s(n),o=this.length===1&&this[0].parentNode;if(o&&o.nodeType===11&&o.childNodes.length===1&&i.lengt
h===1)return i[t](this[0]),this;for(var u=0,a=i.length;u<a;u++){var f=(u>0?this.clone(!0):this).get();s(i[u])[t](f),r=r
.concat(f)}return this.pushStack(r,e,i.selector)}}),s.extend({clone:function(e,t,n){var r,i,o,u=s.support.html5Clone||!
nt.test("<"+e.nodeName)?e.cloneNode(!0):dt(e);if((!s.support.noCloneEvent||!s.support.noCloneChecked)&&(e.nodeType===1|
|e.nodeType===11)&&!s.isXMLDoc(e)){lt(e,u),r=ct(e),i=ct(u);for(o=0;r[o];++o)i[o]&&lt(r[o],i[o])}if(t){ft(e,u);if(n){r=c
t(e),i=ct(u);for(o=0;r[o];++o)ft(r[o],i[o])}}return r=i=null,u},clean:function(e,t,r,i){var o;t=t||n,typeof t.createEle
ment=="undefined"&&(t=t.ownerDocument||t[0]&&t[0].ownerDocument||n);var u=[],a;for(var f=0,l;(l=e[f])!=null;f++){typeof
 l=="number"&&(l+="");if(!l)continue;if(typeof l=="string")if(!Z.test(l))l=t.createTextNode(l);else{l=l.replace(Q,"<$1>
</$2>");var c=(G.exec(l)||["",""])[1].toLowerCase(),h=ot[c]||ot._default,p=h[0],d=t.createElement("div");t===n?ut.appen
dChild(d):V(t).appendChild(d),d.innerHTML=h[1]+l+h[2];while(p--)d=d.lastChild;if(!s.support.tbody){var v=Y.test(l),m=c=
=="table"&&!v?d.firstChild&&d.firstChild.childNodes:h[1]==="<table>"&&!v?d.childNodes:[];for(a=m.length-1;a>=0;--a)s.no
deName(m[a],"tbody")&&!m[a].childNodes.length&&m[a].parentNode.removeChild(m[a])}!s.support.leadingWhitespace&&K.test(l
)&&d.insertBefore(t.createTextNode(K.exec(l)[0]),d.firstChild),l=d.childNodes}var g;if(!s.support.appendChecked)if(l[0]
&&typeof (g=l.length)=="number")for(a=0;a<g;a++)pt(l[a]);else pt(l);l.nodeType?u.push(l):u=s.merge(u,l)}if(r){o=functio
n(e){return!e.type||it.test(e.type)};for(f=0;u[f];f++)if(i&&s.nodeName(u[f],"script")&&(!u[f].type||u[f].type.toLowerCa
se()==="text/javascript"))i.push(u[f].parentNode?u[f].parentNode.removeChild(u[f]):u[f]);else{if(u[f].nodeType===1){var
 y=s.grep(u[f].getElementsByTagName("script"),o);u.splice.apply(u,[f+1,0].concat(y))}r.appendChild(u[f])}}return u},cle
anData:function(e){var t,n,r=s.cache,i=s.event.special,o=s.support.deleteExpando;for(var u=0,a;(a=e[u])!=null;u++){if(a
.nodeName&&s.noData[a.nodeName.toLowerCase()])continue;n=a[s.expando];if(n){t=r[n];if(t&&t.events){for(var f in t.event
s)i[f]?s.event.remove(a,f):s.removeEvent(a,f,t.handle);t.handle&&(t.handle.elem=null)}o?delete a[s.expando]:a.removeAtt
ribute&&a.removeAttribute(s.expando),delete r[n]}}}});var mt=/alpha\([^)]*\)/i,gt=/opacity=([^)]*)/,yt=/([A-Z]|^ms)/g,b
t=/^-?\d+(?:px)?$/i,wt=/^-?\d/,Et=/^([\-+])=([\-+.\de]+)/,St={position:"absolute",visibility:"hidden",display:"block"},
xt=["Left","Right"],Tt=["Top","Bottom"],Nt,Ct,kt;s.fn.css=function(e,n){return arguments.length===2&&n===t?this:s.acces
s(this,e,n,!0,function(e,n,r){return r!==t?s.style(e,n,r):s.css(e,n)})},s.extend({cssHooks:{opacity:{get:function(e,t){
if(t){var n=Nt(e,"opacity","opacity");return n===""?"1":n}return e.style.opacity}}},cssNumber:{fillOpacity:!0,fontWeigh
t:!0,lineHeight:!0,opacity:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":s.support.cssFloat?"cssFloat":"
styleFloat"},style:function(e,n,r,i){if(!e||e.nodeType===3||e.nodeType===8||!e.style)return;var o,u,a=s.camelCase(n),f=
e.style,l=s.cssHooks[a];n=s.cssProps[a]||a;if(r===t)return l&&"get"in l&&(o=l.get(e,!1,i))!==t?o:f[n];u=typeof r,u==="s
tring"&&(o=Et.exec(r))&&(r=+(o[1]+1)*+o[2]+parseFloat(s.css(e,n)),u="number");if(r==null||u==="number"&&isNaN(r))return
;u==="number"&&!s.cssNumber[a]&&(r+="px");if(!l||!("set"in l)||(r=l.set(e,r))!==t)try{f[n]=r}catch(c){}},css:function(e
,n,r){var i,o;n=s.camelCase(n),o=s.cssHooks[n],n=s.cssProps[n]||n,n==="cssFloat"&&(n="float");if(o&&"get"in o&&(i=o.get
(e,!0,r))!==t)return i;if(Nt)return Nt(e,n)},swap:function(e,t,n){var r={};for(var i in t)r[i]=e.style[i],e.style[i]=t[
i];n.call(e);for(i in t)e.style[i]=r[i]}}),s.curCSS=s.css,s.each(["height","width"],function(e,t){s.cssHooks[t]={get:fu
nction(e,n,r){var i;if(n)return e.offsetWidth!==0?Lt(e,t,r):(s.swap(e,St,function(){i=Lt(e,t,r)}),i)},set:function(e,t)
{if(!bt.test(t))return t;t=parseFloat(t);if(t>=0)return t+"px"}}}),s.support.opacity||(s.cssHooks.opacity={get:function
(e,t){return gt.test((t&&e.currentStyle?e.currentStyle.filter:e.style.filter)||"")?parseFloat(RegExp.$1)/100+"":t?"1":"
"},set:function(e,t){var n=e.style,r=e.currentStyle,i=s.isNumeric(t)?"alpha(opacity="+t*100+")":"",o=r&&r.filter||n.fil
ter||"";n.zoom=1;if(t>=1&&s.trim(o.replace(mt,""))===""){n.removeAttribute("filter");if(r&&!r.filter)return}n.filter=mt
.test(o)?o.replace(mt,i):o+" "+i}}),s(function(){s.support.reliableMarginRight||(s.cssHooks.marginRight={get:function(e
,t){var n;return s.swap(e,{display:"inline-block"},function(){t?n=Nt(e,"margin-right","marginRight"):n=e.style.marginRi
ght}),n}})}),n.defaultView&&n.defaultView.getComputedStyle&&(Ct=function(e,t){var n,r,i;return t=t.replace(yt,"-$1").to
LowerCase(),(r=e.ownerDocument.defaultView)&&(i=r.getComputedStyle(e,null))&&(n=i.getPropertyValue(t),n===""&&!s.contai
ns(e.ownerDocument.documentElement,e)&&(n=s.style(e,t))),n}),n.documentElement.currentStyle&&(kt=function(e,t){var n,r,
i,s=e.currentStyle&&e.currentStyle[t],o=e.style;return s===null&&o&&(i=o[t])&&(s=i),!bt.test(s)&&wt.test(s)&&(n=o.left,
r=e.runtimeStyle&&e.runtimeStyle.left,r&&(e.runtimeStyle.left=e.currentStyle.left),o.left=t==="fontSize"?"1em":s||0,s=o
.pixelLeft+"px",o.left=n,r&&(e.runtimeStyle.left=r)),s===""?"auto":s}),Nt=Ct||kt,s.expr&&s.expr.filters&&(s.expr.filter
s.hidden=function(e){var t=e.offsetWidth,n=e.offsetHeight;return t===0&&n===0||!s.support.reliableHiddenOffsets&&(e.sty
le&&e.style.display||s.css(e,"display"))==="none"},s.expr.filters.visible=function(e){return!s.expr.filters.hidden(e)})
;var At=/%20/g,Ot=/\[\]$/,Mt=/\r?\n/g,_t=/#.*$/,Dt=/^(.*?):[ \t]*([^\r\n]*)\r?$/mg,Pt=/^(?:color|date|datetime|datetime
-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,Ht=/^(?:about|app|app\-storage|.+\-ex
tension|file|res|widget):$/,Bt=/^(?:GET|HEAD)$/,jt=/^\/\//,Ft=/\?/,It=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script
>/gi,qt=/^(?:select|textarea)/i,Rt=/\s+/,Ut=/([?&])_=[^&]*/,zt=/^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/,Wt=s.fn
.load,Xt={},Vt={},$t,Jt,Kt=["*/"]+["*"];try{$t=i.href}catch(Qt){$t=n.createElement("a"),$t.href="",$t=$t.href}Jt=zt.exe
c($t.toLowerCase())||[],s.fn.extend({load:function(e,n,r){if(typeof e!="string"&&Wt)return Wt.apply(this,arguments);if(
!this.length)return this;var i=e.indexOf(" ");if(i>=0){var o=e.slice(i,e.length);e=e.slice(0,i)}var u="GET";n&&(s.isFun
ction(n)?(r=n,n=t):typeof n=="object"&&(n=s.param(n,s.ajaxSettings.traditional),u="POST"));var a=this;return s.ajax({ur
l:e,type:u,dataType:"html",data:n,complete:function(e,t,n){n=e.responseText,e.isResolved()&&(e.done(function(e){n=e}),a
.html(o?s("<div>").append(n.replace(It,"")).find(o):n)),r&&a.each(r,[n,t,e])}}),this},serialize:function(){return s.par
am(this.serializeArray())},serializeArray:function(){return this.map(function(){return this.elements?s.makeArray(this.e
lements):this}).filter(function(){return this.name&&!this.disabled&&(this.checked||qt.test(this.nodeName)||Pt.test(this
.type))}).map(function(e,t){var n=s(this).val();return n==null?null:s.isArray(n)?s.map(n,function(e,n){return{name:t.na
me,value:e.replace(Mt,"\r\n")}}):{name:t.name,value:n.replace(Mt,"\r\n")}}).get()}}),s.each("ajaxStart ajaxStop ajaxCom
plete ajaxError ajaxSuccess ajaxSend".split(" "),function(e,t){s.fn[t]=function(e){return this.on(t,e)}}),s.each(["get"
,"post"],function(e,n){s[n]=function(e,r,i,o){return s.isFunction(r)&&(o=o||i,i=r,r=t),s.ajax({type:n,url:e,data:r,succ
ess:i,dataType:o})}}),s.extend({getScript:function(e,n){return s.get(e,t,n,"script")},getJSON:function(e,t,n){return s.
get(e,t,n,"json")},ajaxSetup:function(e,t){return t?Zt(e,s.ajaxSettings):(t=e,e=s.ajaxSettings),Zt(e,t),e},ajaxSettings
:{url:$t,isLocal:Ht.test(Jt[1]),global:!0,type:"GET",contentType:"application/x-www-form-urlencoded",processData:!0,asy
nc:!0,accepts:{xml:"application/xml, text/xml",html:"text/html",text:"text/plain",json:"application/json, text/javascri
pt","*":Kt},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText"},convert
ers:{"* text":e.String,"text html":!0,"text json":s.parseJSON,"text xml":s.parseXML},flatOptions:{context:!0,url:!0}},a
jaxPrefilter:Gt(Xt),ajaxTransport:Gt(Vt),ajax:function(e,n){function S(e,n,c,h){if(y===2)return;y=2,m&&clearTimeout(m),
v=t,p=h||"",E.readyState=e>0?4:0;var d,g,w,S=n,x=c?tn(r,E,c):t,T,N;if(e>=200&&e<300||e===304){if(r.ifModified){if(T=E.g
etResponseHeader("Last-Modified"))s.lastModified[l]=T;if(N=E.getResponseHeader("Etag"))s.etag[l]=N}if(e===304)S="notmod
ified",d=!0;else try{g=nn(r,x),S="success",d=!0}catch(C){S="parsererror",w=C}}else{w=S;if(!S||e)S="error",e<0&&(e=0)}E.
status=e,E.statusText=""+(n||S),d?u.resolveWith(i,[g,S,E]):u.rejectWith(i,[E,S,w]),E.statusCode(f),f=t,b&&o.trigger("aj
ax"+(d?"Success":"Error"),[E,r,d?g:w]),a.fireWith(i,[E,S]),b&&(o.trigger("ajaxComplete",[E,r]),--s.active||s.event.trig
ger("ajaxStop"))}typeof e=="object"&&(n=e,e=t),n=n||{};var r=s.ajaxSetup({},n),i=r.context||r,o=i!==r&&(i.nodeType||i i
nstanceof s)?s(i):s.event,u=s.Deferred(),a=s.Callbacks("once memory"),f=r.statusCode||{},l,c={},h={},p,d,v,m,g,y=0,b,w,
E={readyState:0,setRequestHeader:function(e,t){if(!y){var n=e.toLowerCase();e=h[n]=h[n]||e,c[e]=t}return this},getAllRe
sponseHeaders:function(){return y===2?p:null},getResponseHeader:function(e){var n;if(y===2){if(!d){d={};while(n=Dt.exec
(p))d[n[1].toLowerCase()]=n[2]}n=d[e.toLowerCase()]}return n===t?null:n},overrideMimeType:function(e){return y||(r.mime
Type=e),this},abort:function(e){return e=e||"abort",v&&v.abort(e),S(0,e),this}};u.promise(E),E.success=E.done,E.error=E
.fail,E.complete=a.add,E.statusCode=function(e){if(e){var t;if(y<2)for(t in e)f[t]=[f[t],e[t]];else t=e[E.status],E.the
n(t,t)}return this},r.url=((e||r.url)+"").replace(_t,"").replace(jt,Jt[1]+"//"),r.dataTypes=s.trim(r.dataType||"*").toL
owerCase().split(Rt),r.crossDomain==null&&(g=zt.exec(r.url.toLowerCase()),r.crossDomain=!(!g||g[1]==Jt[1]&&g[2]==Jt[2]&
&(g[3]||(g[1]==="http:"?80:443))==(Jt[3]||(Jt[1]==="http:"?80:443)))),r.data&&r.processData&&typeof r.data!="string"&&(
r.data=s.param(r.data,r.traditional)),Yt(Xt,r,n,E);if(y===2)return!1;b=r.global,r.type=r.type.toUpperCase(),r.hasConten
t=!Bt.test(r.type),b&&s.active++===0&&s.event.trigger("ajaxStart");if(!r.hasContent){r.data&&(r.url+=(Ft.test(r.url)?"&
":"?")+r.data,delete r.data),l=r.url;if(r.cache===!1){var x=s.now(),T=r.url.replace(Ut,"$1_="+x);r.url=T+(T===r.url?(Ft
.test(r.url)?"&":"?")+"_="+x:"")}}(r.data&&r.hasContent&&r.contentType!==!1||n.contentType)&&E.setRequestHeader("Conten
t-Type",r.contentType),r.ifModified&&(l=l||r.url,s.lastModified[l]&&E.setRequestHeader("If-Modified-Since",s.lastModifi
ed[l]),s.etag[l]&&E.setRequestHeader("If-None-Match",s.etag[l])),E.setRequestHeader("Accept",r.dataTypes[0]&&r.accepts[
r.dataTypes[0]]?r.accepts[r.dataTypes[0]]+(r.dataTypes[0]!=="*"?", "+Kt+"; q=0.01":""):r.accepts["*"]);for(w in r.heade
rs)E.setRequestHeader(w,r.headers[w]);if(!r.beforeSend||r.beforeSend.call(i,E,r)!==!1&&y!==2){for(w in{success:1,error:
1,complete:1})E[w](r[w]);v=Yt(Vt,r,n,E);if(!v)S(-1,"No Transport");else{E.readyState=1,b&&o.trigger("ajaxSend",[E,r]),r
.async&&r.timeout>0&&(m=setTimeout(function(){E.abort("timeout")},r.timeout));try{y=1,v.send(c,S)}catch(N){if(!(y<2))th
row N;S(-1,N)}}return E}return E.abort(),!1},param:function(e,n){var r=[],i=function(e,t){t=s.isFunction(t)?t():t,r[r.l
ength]=encodeURIComponent(e)+"="+encodeURIComponent(t)};n===t&&(n=s.ajaxSettings.traditional);if(s.isArray(e)||e.jquery
&&!s.isPlainObject(e))s.each(e,function(){i(this.name,this.value)});else for(var o in e)en(o,e[o],n,i);return r.join("&
").replace(At,"+")}}),s.extend({active:0,lastModified:{},etag:{}});var rn=s.now(),sn=/(\=)\?(&|$)|\?\?/i;s.ajaxSetup({j
sonp:"callback",jsonpCallback:function(){return s.expando+"_"+rn++}}),s.ajaxPrefilter("json jsonp",function(t,n,r){var 
i=t.contentType==="application/x-www-form-urlencoded"&&typeof t.data=="string";if(t.dataTypes[0]==="jsonp"||t.jsonp!==!
1&&(sn.test(t.url)||i&&sn.test(t.data))){var o,u=t.jsonpCallback=s.isFunction(t.jsonpCallback)?t.jsonpCallback():t.json
pCallback,a=e[u],f=t.url,l=t.data,c="$1"+u+"$2";return t.jsonp!==!1&&(f=f.replace(sn,c),t.url===f&&(i&&(l=l.replace(sn,
c)),t.data===l&&(f+=(/\?/.test(f)?"&":"?")+t.jsonp+"="+u))),t.url=f,t.data=l,e[u]=function(e){o=[e]},r.always(function(
){e[u]=a,o&&s.isFunction(a)&&e[u](o[0])}),t.converters["script json"]=function(){return o||s.error(u+" was not called")
,o[0]},t.dataTypes[0]="json","script"}}),s.ajaxSetup({accepts:{script:"text/javascript, application/javascript, applica
tion/ecmascript, application/x-ecmascript"},contents:{script:/javascript|ecmascript/},converters:{"text script":functio
n(e){return s.globalEval(e),e}}}),s.ajaxPrefilter("script",function(e){e.cache===t&&(e.cache=!1),e.crossDomain&&(e.type
="GET",e.global=!1)}),s.ajaxTransport("script",function(e){if(e.crossDomain){var r,i=n.head||n.getElementsByTagName("he
ad")[0]||n.documentElement;return{send:function(s,o){r=n.createElement("script"),r.async="async",e.scriptCharset&&(r.ch
arset=e.scriptCharset),r.src=e.url,r.onload=r.onreadystatechange=function(e,n){if(n||!r.readyState||/loaded|complete/.t
est(r.readyState))r.onload=r.onreadystatechange=null,i&&r.parentNode&&i.removeChild(r),r=t,n||o(200,"success")},i.inser
tBefore(r,i.firstChild)},abort:function(){r&&r.onload(0,1)}}}});var on=e.ActiveXObject?function(){for(var e in an)an[e]
(0,1)}:!1,un=0,an;s.ajaxSettings.xhr=e.ActiveXObject?function(){return!this.isLocal&&fn()||ln()}:fn,function(e){s.exten
d(s.support,{ajax:!!e,cors:!!e&&"withCredentials"in e})}(s.ajaxSettings.xhr()),s.support.ajax&&s.ajaxTransport(function
(n){if(!n.crossDomain||s.support.cors){var r;return{send:function(i,o){var u=n.xhr(),a,f;n.username?u.open(n.type,n.url
,n.async,n.username,n.password):u.open(n.type,n.url,n.async);if(n.xhrFields)for(f in n.xhrFields)u[f]=n.xhrFields[f];n.
mimeType&&u.overrideMimeType&&u.overrideMimeType(n.mimeType),!n.crossDomain&&!i["X-Requested-With"]&&(i["X-Requested-Wi
th"]="XMLHttpRequest");try{for(f in i)u.setRequestHeader(f,i[f])}catch(l){}u.send(n.hasContent&&n.data||null),r=functio
n(e,i){var f,l,c,h,p;try{if(r&&(i||u.readyState===4)){r=t,a&&(u.onreadystatechange=s.noop,on&&delete an[a]);if(i)u.read
yState!==4&&u.abort();else{f=u.status,c=u.getAllResponseHeaders(),h={},p=u.responseXML,p&&p.documentElement&&(h.xml=p),
h.text=u.responseText;try{l=u.statusText}catch(d){l=""}!f&&n.isLocal&&!n.crossDomain?f=h.text?200:404:f===1223&&(f=204)
}}}catch(v){i||o(-1,v)}h&&o(f,l,h,c)},!n.async||u.readyState===4?r():(a=++un,on&&(an||(an={},s(e).unload(on)),an[a]=r),
u.onreadystatechange=r)},abort:function(){r&&r(0,1)}}}});var cn={},hn,pn,dn=/^(?:toggle|show|hide)$/,vn=/^([+\-]=)?([\d
+.\-]+)([a-z%]*)$/i,mn,gn=[["height","marginTop","marginBottom","paddingTop","paddingBottom"],["width","marginLeft","ma
rginRight","paddingLeft","paddingRight"],["opacity"]],yn;s.fn.extend({show:function(e,t,n){var r,i;if(e||e===0)return t
his.animate(En("show",3),e,t,n);for(var o=0,u=this.length;o<u;o++)r=this[o],r.style&&(i=r.style.display,!s._data(r,"old
display")&&i==="none"&&(i=r.style.display=""),i===""&&s.css(r,"display")==="none"&&s._data(r,"olddisplay",Sn(r.nodeName
)));for(o=0;o<u;o++){r=this[o];if(r.style){i=r.style.display;if(i===""||i==="none")r.style.display=s._data(r,"olddispla
y")||""}}return this},hide:function(e,t,n){if(e||e===0)return this.animate(En("hide",3),e,t,n);var r,i,o=0,u=this.lengt
h;for(;o<u;o++)r=this[o],r.style&&(i=s.css(r,"display"),i!=="none"&&!s._data(r,"olddisplay")&&s._data(r,"olddisplay",i)
);for(o=0;o<u;o++)this[o].style&&(this[o].style.display="none");return this},_toggle:s.fn.toggle,toggle:function(e,t,n)
{var r=typeof e=="boolean";return s.isFunction(e)&&s.isFunction(t)?this._toggle.apply(this,arguments):e==null||r?this.e
ach(function(){var t=r?e:s(this).is(":hidden");s(this)[t?"show":"hide"]()}):this.animate(En("toggle",3),e,t,n),this},fa
deTo:function(e,t,n,r){return this.filter(":hidden").css("opacity",0).show().end().animate({opacity:t},e,n,r)},animate:
function(e,t,n,r){function o(){i.queue===!1&&s._mark(this);var t=s.extend({},i),n=this.nodeType===1,r=n&&s(this).is(":h
idden"),o,u,a,f,l,c,h,p,d;t.animatedProperties={};for(a in e){o=s.camelCase(a),a!==o&&(e[o]=e[a],delete e[a]),u=e[o],s.
isArray(u)?(t.animatedProperties[o]=u[1],u=e[o]=u[0]):t.animatedProperties[o]=t.specialEasing&&t.specialEasing[o]||t.ea
sing||"swing";if(u==="hide"&&r||u==="show"&&!r)return t.complete.call(this);n&&(o==="height"||o==="width")&&(t.overflow
=[this.style.overflow,this.style.overflowX,this.style.overflowY],s.css(this,"display")==="inline"&&s.css(this,"float")=
=="none"&&(!s.support.inlineBlockNeedsLayout||Sn(this.nodeName)==="inline"?this.style.display="inline-block":this.style
.zoom=1))}t.overflow!=null&&(this.style.overflow="hidden");for(a in e)f=new s.fx(this,t,a),u=e[a],dn.test(u)?(d=s._data
(this,"toggle"+a)||(u==="toggle"?r?"show":"hide":0),d?(s._data(this,"toggle"+a,d==="show"?"hide":"show"),f[d]()):f[u]()
):(l=vn.exec(u),c=f.cur(),l?(h=parseFloat(l[2]),p=l[3]||(s.cssNumber[a]?"":"px"),p!=="px"&&(s.style(this,a,(h||1)+p),c=
(h||1)/f.cur()*c,s.style(this,a,c+p)),l[1]&&(h=(l[1]==="-="?-1:1)*h+c),f.custom(c,h,p)):f.custom(c,u,""));return!0}var 
i=s.speed(t,n,r);return s.isEmptyObject(e)?this.each(i.complete,[!1]):(e=s.extend({},e),i.queue===!1?this.each(o):this.
queue(i.queue,o))},stop:function(e,n,r){return typeof e!="string"&&(r=n,n=e,e=t),n&&e!==!1&&this.queue(e||"fx",[]),this
.each(function(){function u(e,t,n){var i=t[n];s.removeData(e,n,!0),i.stop(r)}var t,n=!1,i=s.timers,o=s._data(this);r||s
._unmark(!0,this);if(e==null)for(t in o)o[t]&&o[t].stop&&t.indexOf(".run")===t.length-4&&u(this,o,t);else o[t=e+".run"]
&&o[t].stop&&u(this,o,t);for(t=i.length;t--;)i[t].elem===this&&(e==null||i[t].queue===e)&&(r?i[t](!0):i[t].saveState(),
n=!0,i.splice(t,1));(!r||!n)&&s.dequeue(this,e)})}}),s.each({slideDown:En("show",1),slideUp:En("hide",1),slideToggle:En
("toggle",1),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(e,t){s.fn[e]=func
tion(e,n,r){return this.animate(t,e,n,r)}}),s.extend({speed:function(e,t,n){var r=e&&typeof e=="object"?s.extend({},e):
{complete:n||!n&&t||s.isFunction(e)&&e,duration:e,easing:n&&t||t&&!s.isFunction(t)&&t};r.duration=s.fx.off?0:typeof r.d
uration=="number"?r.duration:r.duration in s.fx.speeds?s.fx.speeds[r.duration]:s.fx.speeds._default;if(r.queue==null||r
.queue===!0)r.queue="fx";return r.old=r.complete,r.complete=function(e){s.isFunction(r.old)&&r.old.call(this),r.queue?s
.dequeue(this,r.queue):e!==!1&&s._unmark(this)},r},easing:{linear:function(e,t,n,r){return n+r*e},swing:function(e,t,n,
r){return(-Math.cos(e*Math.PI)/2+.5)*r+n}},timers:[],fx:function(e,t,n){this.options=t,this.elem=e,this.prop=n,t.orig=t
.orig||{}}}),s.fx.prototype={update:function(){this.options.step&&this.options.step.call(this.elem,this.now,this),(s.fx
.step[this.prop]||s.fx.step._default)(this)},cur:function(){if(this.elem[this.prop]==null||!!this.elem.style&&this.elem
.style[this.prop]!=null){var e,t=s.css(this.elem,this.prop);return isNaN(e=parseFloat(t))?!t||t==="auto"?0:t:e}return t
his.elem[this.prop]},custom:function(e,n,r){function u(e){return i.step(e)}var i=this,o=s.fx;this.startTime=yn||bn(),th
is.end=n,this.now=this.start=e,this.pos=this.state=0,this.unit=r||this.unit||(s.cssNumber[this.prop]?"":"px"),u.queue=t
his.options.queue,u.elem=this.elem,u.saveState=function(){i.options.hide&&s._data(i.elem,"fxshow"+i.prop)===t&&s._data(
i.elem,"fxshow"+i.prop,i.start)},u()&&s.timers.push(u)&&!mn&&(mn=setInterval(o.tick,o.interval))},show:function(){var e
=s._data(this.elem,"fxshow"+this.prop);this.options.orig[this.prop]=e||s.style(this.elem,this.prop),this.options.show=!
0,e!==t?this.custom(this.cur(),e):this.custom(this.prop==="width"||this.prop==="height"?1:0,this.cur()),s(this.elem).sh
ow()},hide:function(){this.options.orig[this.prop]=s._data(this.elem,"fxshow"+this.prop)||s.style(this.elem,this.prop),
this.options.hide=!0,this.custom(this.cur(),0)},step:function(e){var t,n,r,i=yn||bn(),o=!0,u=this.elem,a=this.options;i
f(e||i>=a.duration+this.startTime){this.now=this.end,this.pos=this.state=1,this.update(),a.animatedProperties[this.prop
]=!0;for(t in a.animatedProperties)a.animatedProperties[t]!==!0&&(o=!1);if(o){a.overflow!=null&&!s.support.shrinkWrapBl
ocks&&s.each(["","X","Y"],function(e,t){u.style["overflow"+t]=a.overflow[e]}),a.hide&&s(u).hide();if(a.hide||a.show)for
(t in a.animatedProperties)s.style(u,t,a.orig[t]),s.removeData(u,"fxshow"+t,!0),s.removeData(u,"toggle"+t,!0);r=a.compl
ete,r&&(a.complete=!1,r.call(u))}return!1}return a.duration==Infinity?this.now=i:(n=i-this.startTime,this.state=n/a.dur
ation,this.pos=s.easing[a.animatedProperties[this.prop]](this.state,n,0,1,a.duration),this.now=this.start+(this.end-thi
s.start)*this.pos),this.update(),!0}},s.extend(s.fx,{tick:function(){var e,t=s.timers,n=0;for(;n<t.length;n++)e=t[n],!e
()&&t[n]===e&&t.splice(n--,1);t.length||s.fx.stop()},interval:13,stop:function(){clearInterval(mn),mn=null},speeds:{slo
w:600,fast:200,_default:400},step:{opacity:function(e){s.style(e.elem,"opacity",e.now)},_default:function(e){e.elem.sty
le&&e.elem.style[e.prop]!=null?e.elem.style[e.prop]=e.now+e.unit:e.elem[e.prop]=e.now}}}),s.each(["width","height"],fun
ction(e,t){s.fx.step[t]=function(e){s.style(e.elem,t,Math.max(0,e.now)+e.unit)}}),s.expr&&s.expr.filters&&(s.expr.filte
rs.animated=function(e){return s.grep(s.timers,function(t){return e===t.elem}).length});var xn=/^t(?:able|d|h)$/i,Tn=/^
(?:body|html)$/i;"getBoundingClientRect"in n.documentElement?s.fn.offset=function(e){var t=this[0],n;if(e)return this.e
ach(function(t){s.offset.setOffset(this,e,t)});if(!t||!t.ownerDocument)return null;if(t===t.ownerDocument.body)return s
.offset.bodyOffset(t);try{n=t.getBoundingClientRect()}catch(r){}var i=t.ownerDocument,o=i.documentElement;if(!n||!s.con
tains(o,t))return n?{top:n.top,left:n.left}:{top:0,left:0};var u=i.body,a=Nn(i),f=o.clientTop||u.clientTop||0,l=o.clien
tLeft||u.clientLeft||0,c=a.pageYOffset||s.support.boxModel&&o.scrollTop||u.scrollTop,h=a.pageXOffset||s.support.boxMode
l&&o.scrollLeft||u.scrollLeft,p=n.top+c-f,d=n.left+h-l;return{top:p,left:d}}:s.fn.offset=function(e){var t=this[0];if(e
)return this.each(function(t){s.offset.setOffset(this,e,t)});if(!t||!t.ownerDocument)return null;if(t===t.ownerDocument
.body)return s.offset.bodyOffset(t);var n,r=t.offsetParent,i=t,o=t.ownerDocument,u=o.documentElement,a=o.body,f=o.defau
ltView,l=f?f.getComputedStyle(t,null):t.currentStyle,c=t.offsetTop,h=t.offsetLeft;while((t=t.parentNode)&&t!==a&&t!==u)
{if(s.support.fixedPosition&&l.position==="fixed")break;n=f?f.getComputedStyle(t,null):t.currentStyle,c-=t.scrollTop,h-
=t.scrollLeft,t===r&&(c+=t.offsetTop,h+=t.offsetLeft,s.support.doesNotAddBorder&&(!s.support.doesAddBorderForTableAndCe
lls||!xn.test(t.nodeName))&&(c+=parseFloat(n.borderTopWidth)||0,h+=parseFloat(n.borderLeftWidth)||0),i=r,r=t.offsetPare
nt),s.support.subtractsBorderForOverflowNotVisible&&n.overflow!=="visible"&&(c+=parseFloat(n.borderTopWidth)||0,h+=pars
eFloat(n.borderLeftWidth)||0),l=n}if(l.position==="relative"||l.position==="static")c+=a.offsetTop,h+=a.offsetLeft;retu
rn s.support.fixedPosition&&l.position==="fixed"&&(c+=Math.max(u.scrollTop,a.scrollTop),h+=Math.max(u.scrollLeft,a.scro
llLeft)),{top:c,left:h}},s.offset={bodyOffset:function(e){var t=e.offsetTop,n=e.offsetLeft;return s.support.doesNotIncl
udeMarginInBodyOffset&&(t+=parseFloat(s.css(e,"marginTop"))||0,n+=parseFloat(s.css(e,"marginLeft"))||0),{top:t,left:n}}
,setOffset:function(e,t,n){var r=s.css(e,"position");r==="static"&&(e.style.position="relative");var i=s(e),o=i.offset(
),u=s.css(e,"top"),a=s.css(e,"left"),f=(r==="absolute"||r==="fixed")&&s.inArray("auto",[u,a])>-1,l={},c={},h,p;f?(c=i.p
osition(),h=c.top,p=c.left):(h=parseFloat(u)||0,p=parseFloat(a)||0),s.isFunction(t)&&(t=t.call(e,n,o)),t.top!=null&&(l.
top=t.top-o.top+h),t.left!=null&&(l.left=t.left-o.left+p),"using"in t?t.using.call(e,l):i.css(l)}},s.fn.extend({positio
n:function(){if(!this[0])return null;var e=this[0],t=this.offsetParent(),n=this.offset(),r=Tn.test(t[0].nodeName)?{top:
0,left:0}:t.offset();return n.top-=parseFloat(s.css(e,"marginTop"))||0,n.left-=parseFloat(s.css(e,"marginLeft"))||0,r.t
op+=parseFloat(s.css(t[0],"borderTopWidth"))||0,r.left+=parseFloat(s.css(t[0],"borderLeftWidth"))||0,{top:n.top-r.top,l
eft:n.left-r.left}},offsetParent:function(){return this.map(function(){var e=this.offsetParent||n.body;while(e&&!Tn.tes
t(e.nodeName)&&s.css(e,"position")==="static")e=e.offsetParent;return e})}}),s.each(["Left","Top"],function(e,n){var r=
"scroll"+n;s.fn[r]=function(n){var i,o;return n===t?(i=this[0],i?(o=Nn(i),o?"pageXOffset"in o?o[e?"pageYOffset":"pageXO
ffset"]:s.support.boxModel&&o.document.documentElement[r]||o.document.body[r]:i[r]):null):this.each(function(){o=Nn(thi
s),o?o.scrollTo(e?s(o).scrollLeft():n,e?n:s(o).scrollTop()):this[r]=n})}}),s.each(["Height","Width"],function(e,n){var 
r=n.toLowerCase();s.fn["inner"+n]=function(){var e=this[0];return e?e.style?parseFloat(s.css(e,r,"padding")):this[r]():
null},s.fn["outer"+n]=function(e){var t=this[0];return t?t.style?parseFloat(s.css(t,r,e?"margin":"border")):this[r]():n
ull},s.fn[r]=function(e){var i=this[0];if(!i)return e==null?null:this;if(s.isFunction(e))return this.each(function(t){v
ar n=s(this);n[r](e.call(this,t,n[r]()))});if(s.isWindow(i)){var o=i.document.documentElement["client"+n],u=i.document.
body;return i.document.compatMode==="CSS1Compat"&&o||u&&u["client"+n]||o}if(i.nodeType===9)return Math.max(i.documentEl
ement["client"+n],i.body["scroll"+n],i.documentElement["scroll"+n],i.body["offset"+n],i.documentElement["offset"+n]);if
(e===t){var a=s.css(i,r),f=parseFloat(a);return s.isNumeric(f)?f:a}return this.css(r,typeof e=="string"?e:e+"px")}}),e.
jQuery=e.$=s,typeof define=="function"&&define.amd&&define.amd.jQuery&&define("jquery",[],function(){return s})})(windo
w);
/*!
 * jQuery UI 1.8.17
 *
 * Copyright 2011, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI
 */(function(e,t){function n(t){return!e(t).parents().andSelf().filter(function(){return e.curCSS(this,"visibility")===
"hidden"||e.expr.filters.hidden(this)}).length}function r(t,r){var i=t.nodeName.toLowerCase();if("area"===i){var s=t.pa
rentNode,o=s.name,u;return!t.href||!o||s.nodeName.toLowerCase()!=="map"?!1:(u=e("img[usemap=#"+o+"]")[0],!!u&&n(u))}ret
urn(/input|select|textarea|button|object/.test(i)?!t.disabled:"a"==i?t.href||r:r)&&n(t)}e.ui=e.ui||{},e.ui.version||(e.
extend(e.ui,{version:"1.8.17",keyCode:{ALT:18,BACKSPACE:8,CAPS_LOCK:20,COMMA:188,COMMAND:91,COMMAND_LEFT:91,COMMAND_RIG
HT:93,CONTROL:17,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,INSERT:45,LEFT:37,MENU:93,NUMPAD_ADD:107,NUMPAD_DE
CIMAL:110,NUMPAD_DIVIDE:111,NUMPAD_ENTER:108,NUMPAD_MULTIPLY:106,NUMPAD_SUBTRACT:109,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190
,RIGHT:39,SHIFT:16,SPACE:32,TAB:9,UP:38,WINDOWS:91}}),e.fn.extend({propAttr:e.fn.prop||e.fn.attr,_focus:e.fn.focus,focu
s:function(t,n){return typeof t=="number"?this.each(function(){var r=this;setTimeout(function(){e(r).focus(),n&&n.call(
r)},t)}):this._focus.apply(this,arguments)},scrollParent:function(){var t;return e.browser.msie&&/(static|relative)/.te
st(this.css("position"))||/absolute/.test(this.css("position"))?t=this.parents().filter(function(){return/(relative|abs
olute|fixed)/.test(e.curCSS(this,"position",1))&&/(auto|scroll)/.test(e.curCSS(this,"overflow",1)+e.curCSS(this,"overfl
ow-y",1)+e.curCSS(this,"overflow-x",1))}).eq(0):t=this.parents().filter(function(){return/(auto|scroll)/.test(e.curCSS(
this,"overflow",1)+e.curCSS(this,"overflow-y",1)+e.curCSS(this,"overflow-x",1))}).eq(0),/fixed/.test(this.css("position
"))||!t.length?e(document):t},zIndex:function(n){if(n!==t)return this.css("zIndex",n);if(this.length){var r=e(this[0]),
i,s;while(r.length&&r[0]!==document){i=r.css("position");if(i==="absolute"||i==="relative"||i==="fixed"){s=parseInt(r.c
ss("zIndex"),10);if(!isNaN(s)&&s!==0)return s}r=r.parent()}}return 0},disableSelection:function(){return this.bind((e.s
upport.selectstart?"selectstart":"mousedown")+".ui-disableSelection",function(e){e.preventDefault()})},enableSelection:
function(){return this.unbind(".ui-disableSelection")}}),e.each(["Width","Height"],function(n,r){function i(t,n,r,i){re
turn e.each(s,function(){n-=parseFloat(e.curCSS(t,"padding"+this,!0))||0,r&&(n-=parseFloat(e.curCSS(t,"border"+this+"Wi
dth",!0))||0),i&&(n-=parseFloat(e.curCSS(t,"margin"+this,!0))||0)}),n}var s=r==="Width"?["Left","Right"]:["Top","Bottom
"],o=r.toLowerCase(),u={innerWidth:e.fn.innerWidth,innerHeight:e.fn.innerHeight,outerWidth:e.fn.outerWidth,outerHeight:
e.fn.outerHeight};e.fn["inner"+r]=function(n){return n===t?u["inner"+r].call(this):this.each(function(){e(this).css(o,i
(this,n)+"px")})},e.fn["outer"+r]=function(t,n){return typeof t!="number"?u["outer"+r].call(this,t):this.each(function(
){e(this).css(o,i(this,t,!0,n)+"px")})}}),e.extend(e.expr[":"],{data:function(t,n,r){return!!e.data(t,r[3])},focusable:
function(t){return r(t,!isNaN(e.attr(t,"tabindex")))},tabbable:function(t){var n=e.attr(t,"tabindex"),i=isNaN(n);return
(i||n>=0)&&r(t,!i)}}),e(function(){var t=document.body,n=t.appendChild(n=document.createElement("div"));e.extend(n.styl
e,{minHeight:"100px",height:"auto",padding:0,borderWidth:0}),e.support.minHeight=n.offsetHeight===100,e.support.selects
tart="onselectstart"in n,t.removeChild(n).style.display="none"}),e.extend(e.ui,{plugin:{add:function(t,n,r){var i=e.ui[
t].prototype;for(var s in r)i.plugins[s]=i.plugins[s]||[],i.plugins[s].push([n,r[s]])},call:function(e,t,n){var r=e.plu
gins[t];if(!!r&&!!e.element[0].parentNode)for(var i=0;i<r.length;i++)e.options[r[i][0]]&&r[i][1].apply(e.element,n)}},c
ontains:function(e,t){return document.compareDocumentPosition?e.compareDocumentPosition(t)&16:e!==t&&e.contains(t)},has
Scroll:function(t,n){if(e(t).css("overflow")==="hidden")return!1;var r=n&&n==="left"?"scrollLeft":"scrollTop",i=!1;retu
rn t[r]>0?!0:(t[r]=1,i=t[r]>0,t[r]=0,i)},isOverAxis:function(e,t,n){return e>t&&e<t+n},isOver:function(t,n,r,i,s,o){ret
urn e.ui.isOverAxis(t,r,s)&&e.ui.isOverAxis(n,i,o)}}))})(jQuery),function(e,t){if(e.cleanData){var n=e.cleanData;e.clea
nData=function(t){for(var r=0,i;(i=t[r])!=null;r++)try{e(i).triggerHandler("remove")}catch(s){}n(t)}}else{var r=e.fn.re
move;e.fn.remove=function(t,n){return this.each(function(){return n||(!t||e.filter(t,[this]).length)&&e("*",this).add([
this]).each(function(){try{e(this).triggerHandler("remove")}catch(t){}}),r.call(e(this),t,n)})}}e.widget=function(t,n,r
){var i=t.split(".")[0],s;t=t.split(".")[1],s=i+"-"+t,r||(r=n,n=e.Widget),e.expr[":"][s]=function(n){return!!e.data(n,t
)},e[i]=e[i]||{},e[i][t]=function(e,t){arguments.length&&this._createWidget(e,t)};var o=new n;o.options=e.extend(!0,{},
o.options),e[i][t].prototype=e.extend(!0,o,{namespace:i,widgetName:t,widgetEventPrefix:e[i][t].prototype.widgetEventPre
fix||t,widgetBaseClass:s},r),e.widget.bridge(t,e[i][t])},e.widget.bridge=function(n,r){e.fn[n]=function(i){var s=typeof
 i=="string",o=Array.prototype.slice.call(arguments,1),u=this;return i=!s&&o.length?e.extend.apply(null,[!0,i].concat(o
)):i,s&&i.charAt(0)==="_"?u:(s?this.each(function(){var r=e.data(this,n),s=r&&e.isFunction(r[i])?r[i].apply(r,o):r;if(s
!==r&&s!==t)return u=s,!1}):this.each(function(){var t=e.data(this,n);t?t.option(i||{})._init():e.data(this,n,new r(i,t
his))}),u)}},e.Widget=function(e,t){arguments.length&&this._createWidget(e,t)},e.Widget.prototype={widgetName:"widget",
widgetEventPrefix:"",options:{disabled:!1},_createWidget:function(t,n){e.data(n,this.widgetName,this),this.element=e(n)
,this.options=e.extend(!0,{},this.options,this._getCreateOptions(),t);var r=this;this.element.bind("remove."+this.widge
tName,function(){r.destroy()}),this._create(),this._trigger("create"),this._init()},_getCreateOptions:function(){return
 e.metadata&&e.metadata.get(this.element[0])[this.widgetName]},_create:function(){},_init:function(){},destroy:function
(){this.element.unbind("."+this.widgetName).removeData(this.widgetName),this.widget().unbind("."+this.widgetName).remov
eAttr("aria-disabled").removeClass(this.widgetBaseClass+"-disabled "+"ui-state-disabled")},widget:function(){return thi
s.element},option:function(n,r){var i=n;if(arguments.length===0)return e.extend({},this.options);if(typeof n=="string")
{if(r===t)return this.options[n];i={},i[n]=r}return this._setOptions(i),this},_setOptions:function(t){var n=this;return
 e.each(t,function(e,t){n._setOption(e,t)}),this},_setOption:function(e,t){return this.options[e]=t,e==="disabled"&&thi
s.widget()[t?"addClass":"removeClass"](this.widgetBaseClass+"-disabled"+" "+"ui-state-disabled").attr("aria-disabled",t
),this},enable:function(){return this._setOption("disabled",!1)},disable:function(){return this._setOption("disabled",!
0)},_trigger:function(t,n,r){var i,s,o=this.options[t];r=r||{},n=e.Event(n),n.type=(t===this.widgetEventPrefix?t:this.w
idgetEventPrefix+t).toLowerCase(),n.target=this.element[0],s=n.originalEvent;if(s)for(i in s)i in n||(n[i]=s[i]);return
 this.element.trigger(n,r),!(e.isFunction(o)&&o.call(this.element[0],n,r)===!1||n.isDefaultPrevented())}}}(jQuery),func
tion(e,t){var n=!1;e(document).mouseup(function(e){n=!1}),e.widget("ui.mouse",{options:{cancel:":input,option",distance
:1,delay:0},_mouseInit:function(){var t=this;this.element.bind("mousedown."+this.widgetName,function(e){return t._mouse
Down(e)}).bind("click."+this.widgetName,function(n){if(!0===e.data(n.target,t.widgetName+".preventClickEvent"))return e
.removeData(n.target,t.widgetName+".preventClickEvent"),n.stopImmediatePropagation(),!1}),this.started=!1},_mouseDestro
y:function(){this.element.unbind("."+this.widgetName)},_mouseDown:function(t){if(!n){this._mouseStarted&&this._mouseUp(
t),this._mouseDownEvent=t;var r=this,i=t.which==1,s=typeof this.options.cancel=="string"&&t.target.nodeName?e(t.target)
.closest(this.options.cancel).length:!1;if(!i||s||!this._mouseCapture(t))return!0;this.mouseDelayMet=!this.options.dela
y,this.mouseDelayMet||(this._mouseDelayTimer=setTimeout(function(){r.mouseDelayMet=!0},this.options.delay));if(this._mo
useDistanceMet(t)&&this._mouseDelayMet(t)){this._mouseStarted=this._mouseStart(t)!==!1;if(!this._mouseStarted)return t.
preventDefault(),!0}return!0===e.data(t.target,this.widgetName+".preventClickEvent")&&e.removeData(t.target,this.widget
Name+".preventClickEvent"),this._mouseMoveDelegate=function(e){return r._mouseMove(e)},this._mouseUpDelegate=function(e
){return r._mouseUp(e)},e(document).bind("mousemove."+this.widgetName,this._mouseMoveDelegate).bind("mouseup."+this.wid
getName,this._mouseUpDelegate),t.preventDefault(),n=!0,!0}},_mouseMove:function(t){return!e.browser.msie||document.docu
mentMode>=9||!!t.button?this._mouseStarted?(this._mouseDrag(t),t.preventDefault()):(this._mouseDistanceMet(t)&&this._mo
useDelayMet(t)&&(this._mouseStarted=this._mouseStart(this._mouseDownEvent,t)!==!1,this._mouseStarted?this._mouseDrag(t)
:this._mouseUp(t)),!this._mouseStarted):this._mouseUp(t)},_mouseUp:function(t){return e(document).unbind("mousemove."+t
his.widgetName,this._mouseMoveDelegate).unbind("mouseup."+this.widgetName,this._mouseUpDelegate),this._mouseStarted&&(t
his._mouseStarted=!1,t.target==this._mouseDownEvent.target&&e.data(t.target,this.widgetName+".preventClickEvent",!0),th
is._mouseStop(t)),!1},_mouseDistanceMet:function(e){return Math.max(Math.abs(this._mouseDownEvent.pageX-e.pageX),Math.a
bs(this._mouseDownEvent.pageY-e.pageY))>=this.options.distance},_mouseDelayMet:function(e){return this.mouseDelayMet},_
mouseStart:function(e){},_mouseDrag:function(e){},_mouseStop:function(e){},_mouseCapture:function(e){return!0}})}(jQuer
y),function(e,t){e.ui=e.ui||{};var n=/left|center|right/,r=/top|center|bottom/,i="center",s={},o=e.fn.position,u=e.fn.o
ffset;e.fn.position=function(t){if(!t||!t.of)return o.apply(this,arguments);t=e.extend({},t);var u=e(t.of),l=u[0],h=(t.
collision||"flip").split(" "),p=t.offset?t.offset.split(" "):[0,0],v,m,y;return l.nodeType===9?(v=u.width(),m=u.height(
),y={top:0,left:0}):l.setTimeout?(v=u.width(),m=u.height(),y={top:u.scrollTop(),left:u.scrollLeft()}):l.preventDefault?
(t.at="left top",v=m=0,y={top:t.of.pageY,left:t.of.pageX}):(v=u.outerWidth(),m=u.outerHeight(),y=u.offset()),e.each(["m
y","at"],function(){var e=(t[this]||"").split(" ");e.length===1&&(e=n.test(e[0])?e.concat([i]):r.test(e[0])?[i].concat(
e):[i,i]),e[0]=n.test(e[0])?e[0]:i,e[1]=r.test(e[1])?e[1]:i,t[this]=e}),h.length===1&&(h[1]=h[0]),p[0]=parseInt(p[0],10
)||0,p.length===1&&(p[1]=p[0]),p[1]=parseInt(p[1],10)||0,t.at[0]==="right"?y.left+=v:t.at[0]===i&&(y.left+=v/2),t.at[1]
==="bottom"?y.top+=m:t.at[1]===i&&(y.top+=m/2),y.left+=p[0],y.top+=p[1],this.each(function(){var n=e(this),r=n.outerWid
th(),o=n.outerHeight(),u=parseInt(e.curCSS(this,"marginLeft",!0))||0,l=parseInt(e.curCSS(this,"marginTop",!0))||0,c=r+u
+(parseInt(e.curCSS(this,"marginRight",!0))||0),d=o+l+(parseInt(e.curCSS(this,"marginBottom",!0))||0),g=e.extend({},y),
w;t.my[0]==="right"?g.left-=r:t.my[0]===i&&(g.left-=r/2),t.my[1]==="bottom"?g.top-=o:t.my[1]===i&&(g.top-=o/2),s.fracti
ons||(g.left=Math.round(g.left),g.top=Math.round(g.top)),w={left:g.left-u,top:g.top-l},e.each(["left","top"],function(n
,i){e.ui.position[h[n]]&&e.ui.position[h[n]][i](g,{targetWidth:v,targetHeight:m,elemWidth:r,elemHeight:o,collisionPosit
ion:w,collisionWidth:c,collisionHeight:d,offset:p,my:t.my,at:t.at})}),e.fn.bgiframe&&n.bgiframe(),n.offset(e.extend(g,{
using:t.using}))})},e.ui.position={fit:{left:function(t,n){var r=e(window),i=n.collisionPosition.left+n.collisionWidth-
r.width()-r.scrollLeft();t.left=i>0?t.left-i:Math.max(t.left-n.collisionPosition.left,t.left)},top:function(t,n){var r=
e(window),i=n.collisionPosition.top+n.collisionHeight-r.height()-r.scrollTop();t.top=i>0?t.top-i:Math.max(t.top-n.colli
sionPosition.top,t.top)}},flip:{left:function(t,n){if(n.at[0]!==i){var r=e(window),s=n.collisionPosition.left+n.collisi
onWidth-r.width()-r.scrollLeft(),o=n.my[0]==="left"?-n.elemWidth:n.my[0]==="right"?n.elemWidth:0,u=n.at[0]==="left"?n.t
argetWidth:-n.targetWidth,f=-2*n.offset[0];t.left+=n.collisionPosition.left<0?o+u+f:s>0?o+u+f:0}},top:function(t,n){if(
n.at[1]!==i){var r=e(window),s=n.collisionPosition.top+n.collisionHeight-r.height()-r.scrollTop(),o=n.my[1]==="top"?-n.
elemHeight:n.my[1]==="bottom"?n.elemHeight:0,u=n.at[1]==="top"?n.targetHeight:-n.targetHeight,f=-2*n.offset[1];t.top+=n
.collisionPosition.top<0?o+u+f:s>0?o+u+f:0}}}},e.offset.setOffset||(e.offset.setOffset=function(t,n){/static/.test(e.cu
rCSS(t,"position"))&&(t.style.position="relative");var r=e(t),i=r.offset(),s=parseInt(e.curCSS(t,"top",!0),10)||0,o=par
seInt(e.curCSS(t,"left",!0),10)||0,u={top:n.top-i.top+s,left:n.left-i.left+o};"using"in n?n.using.call(t,u):r.css(u)},e
.fn.offset=function(t){var n=this[0];return!n||!n.ownerDocument?null:t?this.each(function(){e.offset.setOffset(this,t)}
):u.call(this)}),function(){var t=document.getElementsByTagName("body")[0],n=document.createElement("div"),r,i,o,u,l;r=
document.createElement(t?"div":"body"),o={visibility:"hidden",width:0,height:0,border:0,margin:0,background:"none"},t&&
jQuery.extend(o,{position:"absolute",left:"-1000px",top:"-1000px"});for(var c in o)r.style[c]=o[c];r.appendChild(n),i=t
||document.documentElement,i.insertBefore(r,i.firstChild),n.style.cssText="position: absolute; left: 10.7432222px; top:
 10.432325px; height: 30px; width: 201px;",u=e(n).offset(function(e,t){return t}).offset(),r.innerHTML="",i.removeChild
(r),l=u.top+u.left+(t?2e3:0),s.fractions=l>21&&l<22}()}(jQuery),function(e,t){e.widget("ui.draggable",e.ui.mouse,{widge
tEventPrefix:"drag",options:{addClasses:!0,appendTo:"parent",axis:!1,connectToSortable:!1,containment:!1,cursor:"auto",
cursorAt:!1,grid:!1,handle:!1,helper:"original",iframeFix:!1,opacity:!1,refreshPositions:!1,revert:!1,revertDuration:50
0,scope:"default",scroll:!0,scrollSensitivity:20,scrollSpeed:20,snap:!1,snapMode:"both",snapTolerance:20,stack:!1,zInde
x:!1},_create:function(){this.options.helper=="original"&&!/^(?:r|a|f)/.test(this.element.css("position"))&&(this.eleme
nt[0].style.position="relative"),this.options.addClasses&&this.element.addClass("ui-draggable"),this.options.disabled&&
this.element.addClass("ui-draggable-disabled"),this._mouseInit()},destroy:function(){if(!!this.element.data("draggable"
))return this.element.removeData("draggable").unbind(".draggable").removeClass("ui-draggable ui-draggable-dragging ui-d
raggable-disabled"),this._mouseDestroy(),this},_mouseCapture:function(t){var n=this.options;return this.helper||n.disab
led||e(t.target).is(".ui-resizable-handle")?!1:(this.handle=this._getHandle(t),this.handle?(n.iframeFix&&e(n.iframeFix=
==!0?"iframe":n.iframeFix).each(function(){e('<div class="ui-draggable-iframeFix" style="background: #fff;"></div>').cs
s({width:this.offsetWidth+"px",height:this.offsetHeight+"px",position:"absolute",opacity:"0.001",zIndex:1e3}).css(e(thi
s).offset()).appendTo("body")}),!0):!1)},_mouseStart:function(t){var n=this.options;return this.helper=this._createHelp
er(t),this._cacheHelperProportions(),e.ui.ddmanager&&(e.ui.ddmanager.current=this),this._cacheMargins(),this.cssPositio
n=this.helper.css("position"),this.scrollParent=this.helper.scrollParent(),this.offset=this.positionAbs=this.element.of
fset(),this.offset={top:this.offset.top-this.margins.top,left:this.offset.left-this.margins.left},e.extend(this.offset,
{click:{left:t.pageX-this.offset.left,top:t.pageY-this.offset.top},parent:this._getParentOffset(),relative:this._getRel
ativeOffset()}),this.originalPosition=this.position=this._generatePosition(t),this.originalPageX=t.pageX,this.originalP
ageY=t.pageY,n.cursorAt&&this._adjustOffsetFromHelper(n.cursorAt),n.containment&&this._setContainment(),this._trigger("
start",t)===!1?(this._clear(),!1):(this._cacheHelperProportions(),e.ui.ddmanager&&!n.dropBehaviour&&e.ui.ddmanager.prep
areOffsets(this,t),this.helper.addClass("ui-draggable-dragging"),this._mouseDrag(t,!0),e.ui.ddmanager&&e.ui.ddmanager.d
ragStart(this,t),!0)},_mouseDrag:function(t,n){this.position=this._generatePosition(t),this.positionAbs=this._convertPo
sitionTo("absolute");if(!n){var r=this._uiHash();if(this._trigger("drag",t,r)===!1)return this._mouseUp({}),!1;this.pos
ition=r.position}if(!this.options.axis||this.options.axis!="y")this.helper[0].style.left=this.position.left+"px";if(!th
is.options.axis||this.options.axis!="x")this.helper[0].style.top=this.position.top+"px";return e.ui.ddmanager&&e.ui.ddm
anager.drag(this,t),!1},_mouseStop:function(t){var n=!1;e.ui.ddmanager&&!this.options.dropBehaviour&&(n=e.ui.ddmanager.
drop(this,t)),this.dropped&&(n=this.dropped,this.dropped=!1);if((!this.element[0]||!this.element[0].parentNode)&&this.o
ptions.helper=="original")return!1;if(this.options.revert=="invalid"&&!n||this.options.revert=="valid"&&n||this.options
.revert===!0||e.isFunction(this.options.revert)&&this.options.revert.call(this.element,n)){var r=this;e(this.helper).an
imate(this.originalPosition,parseInt(this.options.revertDuration,10),function(){r._trigger("stop",t)!==!1&&r._clear()})
}else this._trigger("stop",t)!==!1&&this._clear();return!1},_mouseUp:function(t){return this.options.iframeFix===!0&&e(
"div.ui-draggable-iframeFix").each(function(){this.parentNode.removeChild(this)}),e.ui.ddmanager&&e.ui.ddmanager.dragSt
op(this,t),e.ui.mouse.prototype._mouseUp.call(this,t)},cancel:function(){return this.helper.is(".ui-draggable-dragging"
)?this._mouseUp({}):this._clear(),this},_getHandle:function(t){var n=!this.options.handle||!e(this.options.handle,this.
element).length?!0:!1;return e(this.options.handle,this.element).find("*").andSelf().each(function(){this==t.target&&(n
=!0)}),n},_createHelper:function(t){var n=this.options,r=e.isFunction(n.helper)?e(n.helper.apply(this.element[0],[t])):
n.helper=="clone"?this.element.clone().removeAttr("id"):this.element;return r.parents("body").length||r.appendTo(n.appe
ndTo=="parent"?this.element[0].parentNode:n.appendTo),r[0]!=this.element[0]&&!/(fixed|absolute)/.test(r.css("position")
)&&r.css("position","absolute"),r},_adjustOffsetFromHelper:function(t){typeof t=="string"&&(t=t.split(" ")),e.isArray(t
)&&(t={left:+t[0],top:+t[1]||0}),"left"in t&&(this.offset.click.left=t.left+this.margins.left),"right"in t&&(this.offse
t.click.left=this.helperProportions.width-t.right+this.margins.left),"top"in t&&(this.offset.click.top=t.top+this.margi
ns.top),"bottom"in t&&(this.offset.click.top=this.helperProportions.height-t.bottom+this.margins.top)},_getParentOffset
:function(){this.offsetParent=this.helper.offsetParent();var t=this.offsetParent.offset();this.cssPosition=="absolute"&
&this.scrollParent[0]!=document&&e.ui.contains(this.scrollParent[0],this.offsetParent[0])&&(t.left+=this.scrollParent.s
crollLeft(),t.top+=this.scrollParent.scrollTop());if(this.offsetParent[0]==document.body||this.offsetParent[0].tagName&
&this.offsetParent[0].tagName.toLowerCase()=="html"&&e.browser.msie)t={top:0,left:0};return{top:t.top+(parseInt(this.of
fsetParent.css("borderTopWidth"),10)||0),left:t.left+(parseInt(this.offsetParent.css("borderLeftWidth"),10)||0)}},_getR
elativeOffset:function(){if(this.cssPosition=="relative"){var e=this.element.position();return{top:e.top-(parseInt(this
.helper.css("top"),10)||0)+this.scrollParent.scrollTop(),left:e.left-(parseInt(this.helper.css("left"),10)||0)+this.scr
ollParent.scrollLeft()}}return{top:0,left:0}},_cacheMargins:function(){this.margins={left:parseInt(this.element.css("ma
rginLeft"),10)||0,top:parseInt(this.element.css("marginTop"),10)||0,right:parseInt(this.element.css("marginRight"),10)|
|0,bottom:parseInt(this.element.css("marginBottom"),10)||0}},_cacheHelperProportions:function(){this.helperProportions=
{width:this.helper.outerWidth(),height:this.helper.outerHeight()}},_setContainment:function(){var t=this.options;t.cont
ainment=="parent"&&(t.containment=this.helper[0].parentNode);if(t.containment=="document"||t.containment=="window")this
.containment=[t.containment=="document"?0:e(window).scrollLeft()-this.offset.relative.left-this.offset.parent.left,t.co
ntainment=="document"?0:e(window).scrollTop()-this.offset.relative.top-this.offset.parent.top,(t.containment=="document
"?0:e(window).scrollLeft())+e(t.containment=="document"?document:window).width()-this.helperProportions.width-this.marg
ins.left,(t.containment=="document"?0:e(window).scrollTop())+(e(t.containment=="document"?document:window).height()||do
cument.body.parentNode.scrollHeight)-this.helperProportions.height-this.margins.top];if(!/^(document|window|parent)$/.t
est(t.containment)&&t.containment.constructor!=Array){var n=e(t.containment),r=n[0];if(!r)return;var i=n.offset(),s=e(r
).css("overflow")!="hidden";this.containment=[(parseInt(e(r).css("borderLeftWidth"),10)||0)+(parseInt(e(r).css("padding
Left"),10)||0),(parseInt(e(r).css("borderTopWidth"),10)||0)+(parseInt(e(r).css("paddingTop"),10)||0),(s?Math.max(r.scro
llWidth,r.offsetWidth):r.offsetWidth)-(parseInt(e(r).css("borderLeftWidth"),10)||0)-(parseInt(e(r).css("paddingRight"),
10)||0)-this.helperProportions.width-this.margins.left-this.margins.right,(s?Math.max(r.scrollHeight,r.offsetHeight):r.
offsetHeight)-(parseInt(e(r).css("borderTopWidth"),10)||0)-(parseInt(e(r).css("paddingBottom"),10)||0)-this.helperPropo
rtions.height-this.margins.top-this.margins.bottom],this.relative_container=n}else t.containment.constructor==Array&&(t
his.containment=t.containment)},_convertPositionTo:function(t,n){n||(n=this.position);var r=t=="absolute"?1:-1,i=this.o
ptions,s=this.cssPosition!="absolute"||this.scrollParent[0]!=document&&!!e.ui.contains(this.scrollParent[0],this.offset
Parent[0])?this.scrollParent:this.offsetParent,o=/(html|body)/i.test(s[0].tagName);return{top:n.top+this.offset.relativ
e.top*r+this.offset.parent.top*r-(e.browser.safari&&e.browser.version<526&&this.cssPosition=="fixed"?0:(this.cssPositio
n=="fixed"?-this.scrollParent.scrollTop():o?0:s.scrollTop())*r),left:n.left+this.offset.relative.left*r+this.offset.par
ent.left*r-(e.browser.safari&&e.browser.version<526&&this.cssPosition=="fixed"?0:(this.cssPosition=="fixed"?-this.scrol
lParent.scrollLeft():o?0:s.scrollLeft())*r)}},_generatePosition:function(t){var n=this.options,r=this.cssPosition!="abs
olute"||this.scrollParent[0]!=document&&!!e.ui.contains(this.scrollParent[0],this.offsetParent[0])?this.scrollParent:th
is.offsetParent,i=/(html|body)/i.test(r[0].tagName),s=t.pageX,o=t.pageY;if(this.originalPosition){var u;if(this.contain
ment){if(this.relative_container){var f=this.relative_container.offset();u=[this.containment[0]+f.left,this.containment
[1]+f.top,this.containment[2]+f.left,this.containment[3]+f.top]}else u=this.containment;t.pageX-this.offset.click.left<
u[0]&&(s=u[0]+this.offset.click.left),t.pageY-this.offset.click.top<u[1]&&(o=u[1]+this.offset.click.top),t.pageX-this.o
ffset.click.left>u[2]&&(s=u[2]+this.offset.click.left),t.pageY-this.offset.click.top>u[3]&&(o=u[3]+this.offset.click.to
p)}if(n.grid){var l=n.grid[1]?this.originalPageY+Math.round((o-this.originalPageY)/n.grid[1])*n.grid[1]:this.originalPa
geY;o=u?l-this.offset.click.top<u[1]||l-this.offset.click.top>u[3]?l-this.offset.click.top<u[1]?l+n.grid[1]:l-n.grid[1]
:l:l;var c=n.grid[0]?this.originalPageX+Math.round((s-this.originalPageX)/n.grid[0])*n.grid[0]:this.originalPageX;s=u?c
-this.offset.click.left<u[0]||c-this.offset.click.left>u[2]?c-this.offset.click.left<u[0]?c+n.grid[0]:c-n.grid[0]:c:c}}
return{top:o-this.offset.click.top-this.offset.relative.top-this.offset.parent.top+(e.browser.safari&&e.browser.version
<526&&this.cssPosition=="fixed"?0:this.cssPosition=="fixed"?-this.scrollParent.scrollTop():i?0:r.scrollTop()),left:s-th
is.offset.click.left-this.offset.relative.left-this.offset.parent.left+(e.browser.safari&&e.browser.version<526&&this.c
ssPosition=="fixed"?0:this.cssPosition=="fixed"?-this.scrollParent.scrollLeft():i?0:r.scrollLeft())}},_clear:function()
{this.helper.removeClass("ui-draggable-dragging"),this.helper[0]!=this.element[0]&&!this.cancelHelperRemoval&&this.help
er.remove(),this.helper=null,this.cancelHelperRemoval=!1},_trigger:function(t,n,r){return r=r||this._uiHash(),e.ui.plug
in.call(this,t,[n,r]),t=="drag"&&(this.positionAbs=this._convertPositionTo("absolute")),e.Widget.prototype._trigger.cal
l(this,t,n,r)},plugins:{},_uiHash:function(e){return{helper:this.helper,position:this.position,originalPosition:this.or
iginalPosition,offset:this.positionAbs}}}),e.extend(e.ui.draggable,{version:"1.8.17"}),e.ui.plugin.add("draggable","con
nectToSortable",{start:function(t,n){var r=e(this).data("draggable"),i=r.options,s=e.extend({},n,{item:r.element});r.so
rtables=[],e(i.connectToSortable).each(function(){var n=e.data(this,"sortable");n&&!n.options.disabled&&(r.sortables.pu
sh({instance:n,shouldRevert:n.options.revert}),n.refreshPositions(),n._trigger("activate",t,s))})},stop:function(t,n){v
ar r=e(this).data("draggable"),i=e.extend({},n,{item:r.element});e.each(r.sortables,function(){this.instance.isOver?(th
is.instance.isOver=0,r.cancelHelperRemoval=!0,this.instance.cancelHelperRemoval=!1,this.shouldRevert&&(this.instance.op
tions.revert=!0),this.instance._mouseStop(t),this.instance.options.helper=this.instance.options._helper,r.options.helpe
r=="original"&&this.instance.currentItem.css({top:"auto",left:"auto"})):(this.instance.cancelHelperRemoval=!1,this.inst
ance._trigger("deactivate",t,i))})},drag:function(t,n){var r=e(this).data("draggable"),i=this,s=function(t){var n=this.
offset.click.top,r=this.offset.click.left,i=this.positionAbs.top,s=this.positionAbs.left,o=t.height,u=t.width,f=t.top,l
=t.left;return e.ui.isOver(i+n,s+r,f,l,o,u)};e.each(r.sortables,function(s){this.instance.positionAbs=r.positionAbs,thi
s.instance.helperProportions=r.helperProportions,this.instance.offset.click=r.offset.click,this.instance._intersectsWit
h(this.instance.containerCache)?(this.instance.isOver||(this.instance.isOver=1,this.instance.currentItem=e(i).clone().r
emoveAttr("id").appendTo(this.instance.element).data("sortable-item",!0),this.instance.options._helper=this.instance.op
tions.helper,this.instance.options.helper=function(){return n.helper[0]},t.target=this.instance.currentItem[0],this.ins
tance._mouseCapture(t,!0),this.instance._mouseStart(t,!0,!0),this.instance.offset.click.top=r.offset.click.top,this.ins
tance.offset.click.left=r.offset.click.left,this.instance.offset.parent.left-=r.offset.parent.left-this.instance.offset
.parent.left,this.instance.offset.parent.top-=r.offset.parent.top-this.instance.offset.parent.top,r._trigger("toSortabl
e",t),r.dropped=this.instance.element,r.currentItem=r.element,this.instance.fromOutside=r),this.instance.currentItem&&t
his.instance._mouseDrag(t)):this.instance.isOver&&(this.instance.isOver=0,this.instance.cancelHelperRemoval=!0,this.ins
tance.options.revert=!1,this.instance._trigger("out",t,this.instance._uiHash(this.instance)),this.instance._mouseStop(t
,!0),this.instance.options.helper=this.instance.options._helper,this.instance.currentItem.remove(),this.instance.placeh
older&&this.instance.placeholder.remove(),r._trigger("fromSortable",t),r.dropped=!1)})}}),e.ui.plugin.add("draggable","
cursor",{start:function(t,n){var r=e("body"),i=e(this).data("draggable").options;r.css("cursor")&&(i._cursor=r.css("cur
sor")),r.css("cursor",i.cursor)},stop:function(t,n){var r=e(this).data("draggable").options;r._cursor&&e("body").css("c
ursor",r._cursor)}}),e.ui.plugin.add("draggable","opacity",{start:function(t,n){var r=e(n.helper),i=e(this).data("dragg
able").options;r.css("opacity")&&(i._opacity=r.css("opacity")),r.css("opacity",i.opacity)},stop:function(t,n){var r=e(t
his).data("draggable").options;r._opacity&&e(n.helper).css("opacity",r._opacity)}}),e.ui.plugin.add("draggable","scroll
",{start:function(t,n){var r=e(this).data("draggable");r.scrollParent[0]!=document&&r.scrollParent[0].tagName!="HTML"&&
(r.overflowOffset=r.scrollParent.offset())},drag:function(t,n){var r=e(this).data("draggable"),i=r.options,s=!1;if(r.sc
rollParent[0]!=document&&r.scrollParent[0].tagName!="HTML"){if(!i.axis||i.axis!="x")r.overflowOffset.top+r.scrollParent
[0].offsetHeight-t.pageY<i.scrollSensitivity?r.scrollParent[0].scrollTop=s=r.scrollParent[0].scrollTop+i.scrollSpeed:t.
pageY-r.overflowOffset.top<i.scrollSensitivity&&(r.scrollParent[0].scrollTop=s=r.scrollParent[0].scrollTop-i.scrollSpee
d);if(!i.axis||i.axis!="y")r.overflowOffset.left+r.scrollParent[0].offsetWidth-t.pageX<i.scrollSensitivity?r.scrollPare
nt[0].scrollLeft=s=r.scrollParent[0].scrollLeft+i.scrollSpeed:t.pageX-r.overflowOffset.left<i.scrollSensitivity&&(r.scr
ollParent[0].scrollLeft=s=r.scrollParent[0].scrollLeft-i.scrollSpeed)}else{if(!i.axis||i.axis!="x")t.pageY-e(document).
scrollTop()<i.scrollSensitivity?s=e(document).scrollTop(e(document).scrollTop()-i.scrollSpeed):e(window).height()-(t.pa
geY-e(document).scrollTop())<i.scrollSensitivity&&(s=e(document).scrollTop(e(document).scrollTop()+i.scrollSpeed));if(!
i.axis||i.axis!="y")t.pageX-e(document).scrollLeft()<i.scrollSensitivity?s=e(document).scrollLeft(e(document).scrollLef
t()-i.scrollSpeed):e(window).width()-(t.pageX-e(document).scrollLeft())<i.scrollSensitivity&&(s=e(document).scrollLeft(
e(document).scrollLeft()+i.scrollSpeed))}s!==!1&&e.ui.ddmanager&&!i.dropBehaviour&&e.ui.ddmanager.prepareOffsets(r,t)}}
),e.ui.plugin.add("draggable","snap",{start:function(t,n){var r=e(this).data("draggable"),i=r.options;r.snapElements=[]
,e(i.snap.constructor!=String?i.snap.items||":data(draggable)":i.snap).each(function(){var t=e(this),n=t.offset();this!
=r.element[0]&&r.snapElements.push({item:this,width:t.outerWidth(),height:t.outerHeight(),top:n.top,left:n.left})})},dr
ag:function(t,n){var r=e(this).data("draggable"),i=r.options,s=i.snapTolerance,o=n.offset.left,u=o+r.helperProportions.
width,f=n.offset.top,l=f+r.helperProportions.height;for(var c=r.snapElements.length-1;c>=0;c--){var h=r.snapElements[c]
.left,p=h+r.snapElements[c].width,d=r.snapElements[c].top,v=d+r.snapElements[c].height;if(!(h-s<o&&o<p+s&&d-s<f&&f<v+s|
|h-s<o&&o<p+s&&d-s<l&&l<v+s||h-s<u&&u<p+s&&d-s<f&&f<v+s||h-s<u&&u<p+s&&d-s<l&&l<v+s)){r.snapElements[c].snapping&&r.opt
ions.snap.release&&r.options.snap.release.call(r.element,t,e.extend(r._uiHash(),{snapItem:r.snapElements[c].item})),r.s
napElements[c].snapping=!1;continue}if(i.snapMode!="inner"){var m=Math.abs(d-l)<=s,g=Math.abs(v-f)<=s,y=Math.abs(h-u)<=
s,b=Math.abs(p-o)<=s;m&&(n.position.top=r._convertPositionTo("relative",{top:d-r.helperProportions.height,left:0}).top-
r.margins.top),g&&(n.position.top=r._convertPositionTo("relative",{top:v,left:0}).top-r.margins.top),y&&(n.position.lef
t=r._convertPositionTo("relative",{top:0,left:h-r.helperProportions.width}).left-r.margins.left),b&&(n.position.left=r.
_convertPositionTo("relative",{top:0,left:p}).left-r.margins.left)}var w=m||g||y||b;if(i.snapMode!="outer"){var m=Math.
abs(d-f)<=s,g=Math.abs(v-l)<=s,y=Math.abs(h-o)<=s,b=Math.abs(p-u)<=s;m&&(n.position.top=r._convertPositionTo("relative"
,{top:d,left:0}).top-r.margins.top),g&&(n.position.top=r._convertPositionTo("relative",{top:v-r.helperProportions.heigh
t,left:0}).top-r.margins.top),y&&(n.position.left=r._convertPositionTo("relative",{top:0,left:h}).left-r.margins.left),
b&&(n.position.left=r._convertPositionTo("relative",{top:0,left:p-r.helperProportions.width}).left-r.margins.left)}!r.s
napElements[c].snapping&&(m||g||y||b||w)&&r.options.snap.snap&&r.options.snap.snap.call(r.element,t,e.extend(r._uiHash(
),{snapItem:r.snapElements[c].item})),r.snapElements[c].snapping=m||g||y||b||w}}}),e.ui.plugin.add("draggable","stack",
{start:function(t,n){var r=e(this).data("draggable").options,i=e.makeArray(e(r.stack)).sort(function(t,n){return(parseI
nt(e(t).css("zIndex"),10)||0)-(parseInt(e(n).css("zIndex"),10)||0)});if(!!i.length){var s=parseInt(i[0].style.zIndex)||
0;e(i).each(function(e){this.style.zIndex=s+e}),this[0].style.zIndex=s+i.length}}}),e.ui.plugin.add("draggable","zIndex
",{start:function(t,n){var r=e(n.helper),i=e(this).data("draggable").options;r.css("zIndex")&&(i._zIndex=r.css("zIndex"
)),r.css("zIndex",i.zIndex)},stop:function(t,n){var r=e(this).data("draggable").options;r._zIndex&&e(n.helper).css("zIn
dex",r._zIndex)}})}(jQuery),function(e,t){e.widget("ui.droppable",{widgetEventPrefix:"drop",options:{accept:"*",activeC
lass:!1,addClasses:!0,greedy:!1,hoverClass:!1,scope:"default",tolerance:"intersect"},_create:function(){var t=this.opti
ons,n=t.accept;this.isover=0,this.isout=1,this.accept=e.isFunction(n)?n:function(e){return e.is(n)},this.proportions={w
idth:this.element[0].offsetWidth,height:this.element[0].offsetHeight},e.ui.ddmanager.droppables[t.scope]=e.ui.ddmanager
.droppables[t.scope]||[],e.ui.ddmanager.droppables[t.scope].push(this),t.addClasses&&
this.element.addClass("ui-droppable")},destroy:function(){var t=e.ui.ddmanager.droppables[this.options.scope];for(var n
=0;n<t.length;n++)t[n]==this&&t.splice(n,1);return this.element.removeClass("ui-droppable ui-droppable-disabled").remov
eData("droppable").unbind(".droppable"),this},_setOption:function(t,n){t=="accept"&&(this.accept=e.isFunction(n)?n:func
tion(e){return e.is(n)}),e.Widget.prototype._setOption.apply(this,arguments)},_activate:function(t){var n=e.ui.ddmanage
r.current;this.options.activeClass&&this.element.addClass(this.options.activeClass),n&&this._trigger("activate",t,this.
ui(n))},_deactivate:function(t){var n=e.ui.ddmanager.current;this.options.activeClass&&this.element.removeClass(this.op
tions.activeClass),n&&this._trigger("deactivate",t,this.ui(n))},_over:function(t){var n=e.ui.ddmanager.current;!!n&&(n.
currentItem||n.element)[0]!=this.element[0]&&this.accept.call(this.element[0],n.currentItem||n.element)&&(this.options.
hoverClass&&this.element.addClass(this.options.hoverClass),this._trigger("over",t,this.ui(n)))},_out:function(t){var n=
e.ui.ddmanager.current;!!n&&(n.currentItem||n.element)[0]!=this.element[0]&&this.accept.call(this.element[0],n.currentI
tem||n.element)&&(this.options.hoverClass&&this.element.removeClass(this.options.hoverClass),this._trigger("out",t,this
.ui(n)))},_drop:function(t,n){var r=n||e.ui.ddmanager.current;if(!r||(r.currentItem||r.element)[0]==this.element[0])ret
urn!1;var i=!1;return this.element.find(":data(droppable)").not(".ui-draggable-dragging").each(function(){var t=e.data(
this,"droppable");if(t.options.greedy&&!t.options.disabled&&t.options.scope==r.options.scope&&t.accept.call(t.element[0
],r.currentItem||r.element)&&e.ui.intersect(r,e.extend(t,{offset:t.element.offset()}),t.options.tolerance))return i=!0,
!1}),i?!1:this.accept.call(this.element[0],r.currentItem||r.element)?(this.options.activeClass&&this.element.removeClas
s(this.options.activeClass),this.options.hoverClass&&this.element.removeClass(this.options.hoverClass),this._trigger("d
rop",t,this.ui(r)),this.element):!1},ui:function(e){return{draggable:e.currentItem||e.element,helper:e.helper,position:
e.position,offset:e.positionAbs}}}),e.extend(e.ui.droppable,{version:"1.8.17"}),e.ui.intersect=function(t,n,r){if(!n.of
fset)return!1;var i=(t.positionAbs||t.position.absolute).left,s=i+t.helperProportions.width,o=(t.positionAbs||t.positio
n.absolute).top,u=o+t.helperProportions.height,f=n.offset.left,l=f+n.proportions.width,c=n.offset.top,h=c+n.proportions
.height;switch(r){case"fit":return f<=i&&s<=l&&c<=o&&u<=h;case"intersect":return f<i+t.helperProportions.width/2&&s-t.h
elperProportions.width/2<l&&c<o+t.helperProportions.height/2&&u-t.helperProportions.height/2<h;case"pointer":var p=(t.p
ositionAbs||t.position.absolute).left+(t.clickOffset||t.offset.click).left,d=(t.positionAbs||t.position.absolute).top+(
t.clickOffset||t.offset.click).top,v=e.ui.isOver(d,p,c,f,n.proportions.height,n.proportions.width);return v;case"touch"
:return(o>=c&&o<=h||u>=c&&u<=h||o<c&&u>h)&&(i>=f&&i<=l||s>=f&&s<=l||i<f&&s>l);default:return!1}},e.ui.ddmanager={curren
t:null,droppables:{"default":[]},prepareOffsets:function(t,n){var r=e.ui.ddmanager.droppables[t.options.scope]||[],i=n?
n.type:null,s=(t.currentItem||t.element).find(":data(droppable)").andSelf();e:for(var o=0;o<r.length;o++){if(r[o].optio
ns.disabled||t&&!r[o].accept.call(r[o].element[0],t.currentItem||t.element))continue;for(var u=0;u<s.length;u++)if(s[u]
==r[o].element[0]){r[o].proportions.height=0;continue e}r[o].visible=r[o].element.css("display")!="none";if(!r[o].visib
le)continue;i=="mousedown"&&r[o]._activate.call(r[o],n),r[o].offset=r[o].element.offset(),r[o].proportions={width:r[o].
element[0].offsetWidth,height:r[o].element[0].offsetHeight}}},drop:function(t,n){var r=!1;return e.each(e.ui.ddmanager.
droppables[t.options.scope]||[],function(){!this.options||(!this.options.disabled&&this.visible&&e.ui.intersect(t,this,
this.options.tolerance)&&(r=this._drop.call(this,n)||r),!this.options.disabled&&this.visible&&this.accept.call(this.ele
ment[0],t.currentItem||t.element)&&(this.isout=1,this.isover=0,this._deactivate.call(this,n)))}),r},dragStart:function(
t,n){t.element.parents(":not(body,html)").bind("scroll.droppable",function(){t.options.refreshPositions||e.ui.ddmanager
.prepareOffsets(t,n)})},drag:function(t,n){t.options.refreshPositions&&e.ui.ddmanager.prepareOffsets(t,n),e.each(e.ui.d
dmanager.droppables[t.options.scope]||[],function(){if(!(this.options.disabled||this.greedyChild||!this.visible)){var r
=e.ui.intersect(t,this,this.options.tolerance),i=!r&&this.isover==1?"isout":r&&this.isover==0?"isover":null;if(!i)retur
n;var s;if(this.options.greedy){var o=this.element.parents(":data(droppable):eq(0)");o.length&&(s=e.data(o[0],"droppabl
e"),s.greedyChild=i=="isover"?1:0)}s&&i=="isover"&&(s.isover=0,s.isout=1,s._out.call(s,n)),this[i]=1,this[i=="isout"?"i
sover":"isout"]=0,this[i=="isover"?"_over":"_out"].call(this,n),s&&i=="isout"&&(s.isout=0,s.isover=1,s._over.call(s,n))
}})},dragStop:function(t,n){t.element.parents(":not(body,html)").unbind("scroll.droppable"),t.options.refreshPositions|
|e.ui.ddmanager.prepareOffsets(t,n)}}}(jQuery),function(e,t){e.widget("ui.resizable",e.ui.mouse,{widgetEventPrefix:"res
ize",options:{alsoResize:!1,animate:!1,animateDuration:"slow",animateEasing:"swing",aspectRatio:!1,autoHide:!1,containm
ent:!1,ghost:!1,grid:!1,handles:"e,s,se",helper:!1,maxHeight:null,maxWidth:null,minHeight:10,minWidth:10,zIndex:1e3},_c
reate:function(){var t=this,n=this.options;this.element.addClass("ui-resizable"),e.extend(this,{_aspectRatio:!!n.aspect
Ratio,aspectRatio:n.aspectRatio,originalElement:this.element,_proportionallyResizeElements:[],_helper:n.helper||n.ghost
||n.animate?n.helper||"ui-resizable-helper":null}),this.element[0].nodeName.match(/canvas|textarea|input|select|button|
img/i)&&(/relative/.test(this.element.css("position"))&&e.browser.opera&&this.element.css({position:"relative",top:"aut
o",left:"auto"}),this.element.wrap(e('<div class="ui-wrapper" style="overflow: hidden;"></div>').css({position:this.ele
ment.css("position"),width:this.element.outerWidth(),height:this.element.outerHeight(),top:this.element.css("top"),left
:this.element.css("left")})),this.element=this.element.parent().data("resizable",this.element.data("resizable")),this.e
lementIsWrapper=!0,this.element.css({marginLeft:this.originalElement.css("marginLeft"),marginTop:this.originalElement.c
ss("marginTop"),marginRight:this.originalElement.css("marginRight"),marginBottom:this.originalElement.css("marginBottom
")}),this.originalElement.css({marginLeft:0,marginTop:0,marginRight:0,marginBottom:0}),this.originalResizeStyle=this.or
iginalElement.css("resize"),this.originalElement.css("resize","none"),this._proportionallyResizeElements.push(this.orig
inalElement.css({position:"static",zoom:1,display:"block"})),this.originalElement.css({margin:this.originalElement.css(
"margin")}),this._proportionallyResize()),this.handles=n.handles||(e(".ui-resizable-handle",this.element).length?{n:".u
i-resizable-n",e:".ui-resizable-e",s:".ui-resizable-s",w:".ui-resizable-w",se:".ui-resizable-se",sw:".ui-resizable-sw",
ne:".ui-resizable-ne",nw:".ui-resizable-nw"}:"e,s,se");if(this.handles.constructor==String){this.handles=="all"&&(this.
handles="n,e,s,w,se,sw,ne,nw");var r=this.handles.split(",");this.handles={};for(var i=0;i<r.length;i++){var s=e.trim(r
[i]),o="ui-resizable-"+s,u=e('<div class="ui-resizable-handle '+o+'"></div>');/sw|se|ne|nw/.test(s)&&u.css({zIndex:++n.
zIndex}),"se"==s&&u.addClass("ui-icon ui-icon-gripsmall-diagonal-se"),this.handles[s]=".ui-resizable-"+s,this.element.a
ppend(u)}}this._renderAxis=function(t){t=t||this.element;for(var n in this.handles){this.handles[n].constructor==String
&&(this.handles[n]=e(this.handles[n],this.element).show());if(this.elementIsWrapper&&this.originalElement[0].nodeName.m
atch(/textarea|input|select|button/i)){var r=e(this.handles[n],this.element),i=0;i=/sw|ne|nw|se|n|s/.test(n)?r.outerHei
ght():r.outerWidth();var s=["padding",/ne|nw|n/.test(n)?"Top":/se|sw|s/.test(n)?"Bottom":/^e$/.test(n)?"Right":"Left"].
join("");t.css(s,i),this._proportionallyResize()}if(!e(this.handles[n]).length)continue}},this._renderAxis(this.element
),this._handles=e(".ui-resizable-handle",this.element).disableSelection(),this._handles.mouseover(function(){if(!t.resi
zing){if(this.className)var e=this.className.match(/ui-resizable-(se|sw|ne|nw|n|e|s|w)/i);t.axis=e&&e[1]?e[1]:"se"}}),n
.autoHide&&(this._handles.hide(),e(this.element).addClass("ui-resizable-autohide").hover(function(){n.disabled||(e(this
).removeClass("ui-resizable-autohide"),t._handles.show())},function(){n.disabled||t.resizing||(e(this).addClass("ui-res
izable-autohide"),t._handles.hide())})),this._mouseInit()},destroy:function(){this._mouseDestroy();var t=function(t){e(
t).removeClass("ui-resizable ui-resizable-disabled ui-resizable-resizing").removeData("resizable").unbind(".resizable")
.find(".ui-resizable-handle").remove()};if(this.elementIsWrapper){t(this.element);var n=this.element;n.after(this.origi
nalElement.css({position:n.css("position"),width:n.outerWidth(),height:n.outerHeight(),top:n.css("top"),left:n.css("lef
t")})).remove()}return this.originalElement.css("resize",this.originalResizeStyle),t(this.originalElement),this},_mouse
Capture:function(t){var n=!1;for(var r in this.handles)e(this.handles[r])[0]==t.target&&(n=!0);return!this.options.disa
bled&&n},_mouseStart:function(t){var r=this.options,i=this.element.position(),s=this.element;this.resizing=!0,this.docu
mentScroll={top:e(document).scrollTop(),left:e(document).scrollLeft()},(s.is(".ui-draggable")||/absolute/.test(s.css("p
osition")))&&s.css({position:"absolute",top:i.top,left:i.left}),e.browser.opera&&/relative/.test(s.css("position"))&&s.
css({position:"relative",top:"auto",left:"auto"}),this._renderProxy();var o=n(this.helper.css("left")),u=n(this.helper.
css("top"));r.containment&&(o+=e(r.containment).scrollLeft()||0,u+=e(r.containment).scrollTop()||0),this.offset=this.he
lper.offset(),this.position={left:o,top:u},this.size=this._helper?{width:s.outerWidth(),height:s.outerHeight()}:{width:
s.width(),height:s.height()},this.originalSize=this._helper?{width:s.outerWidth(),height:s.outerHeight()}:{width:s.widt
h(),height:s.height()},this.originalPosition={left:o,top:u},this.sizeDiff={width:s.outerWidth()-s.width(),height:s.oute
rHeight()-s.height()},this.originalMousePosition={left:t.pageX,top:t.pageY},this.aspectRatio=typeof r.aspectRatio=="num
ber"?r.aspectRatio:this.originalSize.width/this.originalSize.height||1;var f=e(".ui-resizable-"+this.axis).css("cursor"
);return e("body").css("cursor",f=="auto"?this.axis+"-resize":f),s.addClass("ui-resizable-resizing"),this._propagate("s
tart",t),!0},_mouseDrag:function(t){var n=this.helper,r=this.options,i={},s=this,o=this.originalMousePosition,u=this.ax
is,f=t.pageX-o.left||0,l=t.pageY-o.top||0,c=this._change[u];if(!c)return!1;var h=c.apply(this,[t,f,l]),p=e.browser.msie
&&e.browser.version<7,d=this.sizeDiff;this._updateVirtualBoundaries(t.shiftKey);if(this._aspectRatio||t.shiftKey)h=this
._updateRatio(h,t);return h=this._respectSize(h,t),this._propagate("resize",t),n.css({top:this.position.top+"px",left:t
his.position.left+"px",width:this.size.width+"px",height:this.size.height+"px"}),!this._helper&&this._proportionallyRes
izeElements.length&&this._proportionallyResize(),this._updateCache(h),this._trigger("resize",t,this.ui()),!1},_mouseSto
p:function(t){this.resizing=!1;var n=this.options,r=this;if(this._helper){var i=this._proportionallyResizeElements,s=i.
length&&/textarea/i.test(i[0].nodeName),o=s&&e.ui.hasScroll(i[0],"left")?0:r.sizeDiff.height,u=s?0:r.sizeDiff.width,f={
width:r.helper.width()-u,height:r.helper.height()-o},l=parseInt(r.element.css("left"),10)+(r.position.left-r.originalPo
sition.left)||null,c=parseInt(r.element.css("top"),10)+(r.position.top-r.originalPosition.top)||null;n.animate||this.el
ement.css(e.extend(f,{top:c,left:l})),r.helper.height(r.size.height),r.helper.width(r.size.width),this._helper&&!n.anim
ate&&this._proportionallyResize()}return e("body").css("cursor","auto"),this.element.removeClass("ui-resizable-resizing
"),this._propagate("stop",t),this._helper&&this.helper.remove(),!1},_updateVirtualBoundaries:function(e){var t=this.opt
ions,n,i,s,o,u;u={minWidth:r(t.minWidth)?t.minWidth:0,maxWidth:r(t.maxWidth)?t.maxWidth:Infinity,minHeight:r(t.minHeigh
t)?t.minHeight:0,maxHeight:r(t.maxHeight)?t.maxHeight:Infinity};if(this._aspectRatio||e)n=u.minHeight*this.aspectRatio,
s=u.minWidth/this.aspectRatio,i=u.maxHeight*this.aspectRatio,o=u.maxWidth/this.aspectRatio,n>u.minWidth&&(u.minWidth=n)
,s>u.minHeight&&(u.minHeight=s),i<u.maxWidth&&(u.maxWidth=i),o<u.maxHeight&&(u.maxHeight=o);this._vBoundaries=u},_updat
eCache:function(e){var t=this.options;this.offset=this.helper.offset(),r(e.left)&&(this.position.left=e.left),r(e.top)&
&(this.position.top=e.top),r(e.height)&&(this.size.height=e.height),r(e.width)&&(this.size.width=e.width)},_updateRatio
:function(e,t){var n=this.options,i=this.position,s=this.size,o=this.axis;return r(e.height)?e.width=e.height*this.aspe
ctRatio:r(e.width)&&(e.height=e.width/this.aspectRatio),o=="sw"&&(e.left=i.left+(s.width-e.width),e.top=null),o=="nw"&&
(e.top=i.top+(s.height-e.height),e.left=i.left+(s.width-e.width)),e},_respectSize:function(e,t){var n=this.helper,i=thi
s._vBoundaries,s=this._aspectRatio||t.shiftKey,o=this.axis,u=r(e.width)&&i.maxWidth&&i.maxWidth<e.width,a=r(e.height)&&
i.maxHeight&&i.maxHeight<e.height,f=r(e.width)&&i.minWidth&&i.minWidth>e.width,l=r(e.height)&&i.minHeight&&i.minHeight>
e.height;f&&(e.width=i.minWidth),l&&(e.height=i.minHeight),u&&(e.width=i.maxWidth),a&&(e.height=i.maxHeight);var c=this
.originalPosition.left+this.originalSize.width,h=this.position.top+this.size.height,p=/sw|nw|w/.test(o),v=/nw|ne|n/.tes
t(o);f&&p&&(e.left=c-i.minWidth),u&&p&&(e.left=c-i.maxWidth),l&&v&&(e.top=h-i.minHeight),a&&v&&(e.top=h-i.maxHeight);va
r m=!e.width&&!e.height;return m&&!e.left&&e.top?e.top=null:m&&!e.top&&e.left&&(e.left=null),e},_proportionallyResize:f
unction(){var t=this.options;if(!!this._proportionallyResizeElements.length){var n=this.helper||this.element;for(var r=
0;r<this._proportionallyResizeElements.length;r++){var i=this._proportionallyResizeElements[r];if(!this.borderDif){var 
s=[i.css("borderTopWidth"),i.css("borderRightWidth"),i.css("borderBottomWidth"),i.css("borderLeftWidth")],o=[i.css("pad
dingTop"),i.css("paddingRight"),i.css("paddingBottom"),i.css("paddingLeft")];this.borderDif=e.map(s,function(e,t){var n
=parseInt(e,10)||0,r=parseInt(o[t],10)||0;return n+r})}if(!(!e.browser.msie||!e(n).is(":hidden")&&!e(n).parents(":hidde
n").length))continue;i.css({height:n.height()-this.borderDif[0]-this.borderDif[2]||0,width:n.width()-this.borderDif[1]-
this.borderDif[3]||0})}}},_renderProxy:function(){var t=this.element,n=this.options;this.elementOffset=t.offset();if(th
is._helper){this.helper=this.helper||e('<div style="overflow:hidden;"></div>');var r=e.browser.msie&&e.browser.version<
7,i=r?1:0,s=r?2:-1;this.helper.addClass(this._helper).css({width:this.element.outerWidth()+s,height:this.element.outerH
eight()+s,position:"absolute",left:this.elementOffset.left-i+"px",top:this.elementOffset.top-i+"px",zIndex:++n.zIndex})
,this.helper.appendTo("body").disableSelection()}else this.helper=this.element},_change:{e:function(e,t,n){return{width
:this.originalSize.width+t}},w:function(e,t,n){var r=this.options,i=this.originalSize,s=this.originalPosition;return{le
ft:s.left+t,width:i.width-t}},n:function(e,t,n){var r=this.options,i=this.originalSize,s=this.originalPosition;return{t
op:s.top+n,height:i.height-n}},s:function(e,t,n){return{height:this.originalSize.height+n}},se:function(t,n,r){return e
.extend(this._change.s.apply(this,arguments),this._change.e.apply(this,[t,n,r]))},sw:function(t,n,r){return e.extend(th
is._change.s.apply(this,arguments),this._change.w.apply(this,[t,n,r]))},ne:function(t,n,r){return e.extend(this._change
.n.apply(this,arguments),this._change.e.apply(this,[t,n,r]))},nw:function(t,n,r){return e.extend(this._change.n.apply(t
his,arguments),this._change.w.apply(this,[t,n,r]))}},_propagate:function(t,n){e.ui.plugin.call(this,t,[n,this.ui()]),t!
="resize"&&this._trigger(t,n,this.ui())},plugins:{},ui:function(){return{originalElement:this.originalElement,element:t
his.element,helper:this.helper,position:this.position,size:this.size,originalSize:this.originalSize,originalPosition:th
is.originalPosition}}}),e.extend(e.ui.resizable,{version:"1.8.17"}),e.ui.plugin.add("resizable","alsoResize",{start:fun
ction(t,n){var r=e(this).data("resizable"),i=r.options,s=function(t){e(t).each(function(){var t=e(this);t.data("resizab
le-alsoresize",{width:parseInt(t.width(),10),height:parseInt(t.height(),10),left:parseInt(t.css("left"),10),top:parseIn
t(t.css("top"),10),position:t.css("position")})})};typeof i.alsoResize=="object"&&!i.alsoResize.parentNode?i.alsoResize
.length?(i.alsoResize=i.alsoResize[0],s(i.alsoResize)):e.each(i.alsoResize,function(e){s(e)}):s(i.alsoResize)},resize:f
unction(t,n){var r=e(this).data("resizable"),i=r.options,s=r.originalSize,o=r.originalPosition,u={height:r.size.height-
s.height||0,width:r.size.width-s.width||0,top:r.position.top-o.top||0,left:r.position.left-o.left||0},f=function(t,i){e
(t).each(function(){var t=e(this),s=e(this).data("resizable-alsoresize"),o={},f=i&&i.length?i:t.parents(n.originalEleme
nt[0]).length?["width","height"]:["width","height","top","left"];e.each(f,function(e,t){var n=(s[t]||0)+(u[t]||0);n&&n>
=0&&(o[t]=n||null)}),e.browser.opera&&/relative/.test(t.css("position"))&&(r._revertToRelativePosition=!0,t.css({positi
on:"absolute",top:"auto",left:"auto"})),t.css(o)})};typeof i.alsoResize=="object"&&!i.alsoResize.nodeType?e.each(i.also
Resize,function(e,t){f(e,t)}):f(i.alsoResize)},stop:function(t,n){var r=e(this).data("resizable"),i=r.options,s=functio
n(t){e(t).each(function(){var t=e(this);t.css({position:t.data("resizable-alsoresize").position})})};r._revertToRelativ
ePosition&&(r._revertToRelativePosition=!1,typeof i.alsoResize=="object"&&!i.alsoResize.nodeType?e.each(i.alsoResize,fu
nction(e){s(e)}):s(i.alsoResize)),e(this).removeData("resizable-alsoresize")}}),e.ui.plugin.add("resizable","animate",{
stop:function(t,n){var r=e(this).data("resizable"),i=r.options,s=r._proportionallyResizeElements,o=s.length&&/textarea/
i.test(s[0].nodeName),u=o&&e.ui.hasScroll(s[0],"left")?0:r.sizeDiff.height,f=o?0:r.sizeDiff.width,l={width:r.size.width
-f,height:r.size.height-u},c=parseInt(r.element.css("left"),10)+(r.position.left-r.originalPosition.left)||null,h=parse
Int(r.element.css("top"),10)+(r.position.top-r.originalPosition.top)||null;r.element.animate(e.extend(l,h&&c?{top:h,lef
t:c}:{}),{duration:i.animateDuration,easing:i.animateEasing,step:function(){var n={width:parseInt(r.element.css("width"
),10),height:parseInt(r.element.css("height"),10),top:parseInt(r.element.css("top"),10),left:parseInt(r.element.css("le
ft"),10)};s&&s.length&&e(s[0]).css({width:n.width,height:n.height}),r._updateCache(n),r._propagate("resize",t)}})}}),e.
ui.plugin.add("resizable","containment",{start:function(t,r){var i=e(this).data("resizable"),s=i.options,o=i.element,u=
s.containment,f=u instanceof e?u.get(0):/parent/.test(u)?o.parent().get(0):u;if(!!f){i.containerElement=e(f);if(/docume
nt/.test(u)||u==document)i.containerOffset={left:0,top:0},i.containerPosition={left:0,top:0},i.parentData={element:e(do
cument),left:0,top:0,width:e(document).width(),height:e(document).height()||document.body.parentNode.scrollHeight};else
{var l=e(f),h=[];e(["Top","Right","Left","Bottom"]).each(function(e,t){h[e]=n(l.css("padding"+t))}),i.containerOffset=l
.offset(),i.containerPosition=l.position(),i.containerSize={height:l.innerHeight()-h[3],width:l.innerWidth()-h[1]};var 
p=i.containerOffset,d=i.containerSize.height,v=i.containerSize.width,m=e.ui.hasScroll(f,"left")?f.scrollWidth:v,g=e.ui.
hasScroll(f)?f.scrollHeight:d;i.parentData={element:f,left:p.left,top:p.top,width:m,height:g}}}},resize:function(t,n){v
ar r=e(this).data("resizable"),i=r.options,s=r.containerSize,o=r.containerOffset,u=r.size,f=r.position,l=r._aspectRatio
||t.shiftKey,c={top:0,left:0},h=r.containerElement;h[0]!=document&&/static/.test(h.css("position"))&&(c=o),f.left<(r._h
elper?o.left:0)&&(r.size.width=r.size.width+(r._helper?r.position.left-o.left:r.position.left-c.left),l&&(r.size.height
=r.size.width/i.aspectRatio),r.position.left=i.helper?o.left:0),f.top<(r._helper?o.top:0)&&(r.size.height=r.size.height
+(r._helper?r.position.top-o.top:r.position.top),l&&(r.size.width=r.size.height*i.aspectRatio),r.position.top=r._helper
?o.top:0),r.offset.left=r.parentData.left+r.position.left,r.offset.top=r.parentData.top+r.position.top;var p=Math.abs((
r._helper?r.offset.left-c.left:r.offset.left-c.left)+r.sizeDiff.width),d=Math.abs((r._helper?r.offset.top-c.top:r.offse
t.top-o.top)+r.sizeDiff.height),v=r.containerElement.get(0)==r.element.parent().get(0),m=/relative|absolute/.test(r.con
tainerElement.css("position"));v&&m&&(p-=r.parentData.left),p+r.size.width>=r.parentData.width&&(r.size.width=r.parentD
ata.width-p,l&&(r.size.height=r.size.width/r.aspectRatio)),d+r.size.height>=r.parentData.height&&(r.size.height=r.paren
tData.height-d,l&&(r.size.width=r.size.height*r.aspectRatio))},stop:function(t,n){var r=e(this).data("resizable"),i=r.o
ptions,s=r.position,o=r.containerOffset,u=r.containerPosition,f=r.containerElement,l=e(r.helper),c=l.offset(),h=l.outer
Width()-r.sizeDiff.width,p=l.outerHeight()-r.sizeDiff.height;r._helper&&!i.animate&&/relative/.test(f.css("position"))&
&e(this).css({left:c.left-u.left-o.left,width:h,height:p}),r._helper&&!i.animate&&/static/.test(f.css("position"))&&e(t
his).css({left:c.left-u.left-o.left,width:h,height:p})}}),e.ui.plugin.add("resizable","ghost",{start:function(t,n){var 
r=e(this).data("resizable"),i=r.options,s=r.size;r.ghost=r.originalElement.clone(),r.ghost.css({opacity:.25,display:"bl
ock",position:"relative",height:s.height,width:s.width,margin:0,left:0,top:0}).addClass("ui-resizable-ghost").addClass(
typeof i.ghost=="string"?i.ghost:""),r.ghost.appendTo(r.helper)},resize:function(t,n){var r=e(this).data("resizable"),i
=r.options;r.ghost&&r.ghost.css({position:"relative",height:r.size.height,width:r.size.width})},stop:function(t,n){var 
r=e(this).data("resizable"),i=r.options;r.ghost&&r.helper&&r.helper.get(0).removeChild(r.ghost.get(0))}}),e.ui.plugin.a
dd("resizable","grid",{resize:function(t,n){var r=e(this).data("resizable"),i=r.options,s=r.size,o=r.originalSize,u=r.o
riginalPosition,f=r.axis,l=i._aspectRatio||t.shiftKey;i.grid=typeof i.grid=="number"?[i.grid,i.grid]:i.grid;var c=Math.
round((s.width-o.width)/(i.grid[0]||1))*(i.grid[0]||1),h=Math.round((s.height-o.height)/(i.grid[1]||1))*(i.grid[1]||1);
/^(se|s|e)$/.test(f)?(r.size.width=o.width+c,r.size.height=o.height+h):/^(ne)$/.test(f)?(r.size.width=o.width+c,r.size.
height=o.height+h,r.position.top=u.top-h):/^(sw)$/.test(f)?(r.size.width=o.width+c,r.size.height=o.height+h,r.position.
left=u.left-c):(r.size.width=o.width+c,r.size.height=o.height+h,r.position.top=u.top-h,r.position.left=u.left-c)}});var
 n=function(e){return parseInt(e,10)||0},r=function(e){return!isNaN(parseInt(e,10))}}(jQuery),function(e,t){e.widget("u
i.selectable",e.ui.mouse,{options:{appendTo:"body",autoRefresh:!0,distance:0,filter:"*",tolerance:"touch"},_create:func
tion(){var t=this;this.element.addClass("ui-selectable"),this.dragged=!1;var n;this.refresh=function(){n=e(t.options.fi
lter,t.element[0]),n.addClass("ui-selectee"),n.each(function(){var t=e(this),n=t.offset();e.data(this,"selectable-item"
,{element:this,$element:t,left:n.left,top:n.top,right:n.left+t.outerWidth(),bottom:n.top+t.outerHeight(),startselected:
!1,selected:t.hasClass("ui-selected"),selecting:t.hasClass("ui-selecting"),unselecting:t.hasClass("ui-unselecting")})})
},this.refresh(),this.selectees=n.addClass("ui-selectee"),this._mouseInit(),this.helper=e("<div class='ui-selectable-he
lper'></div>")},destroy:function(){return this.selectees.removeClass("ui-selectee").removeData("selectable-item"),this.
element.removeClass("ui-selectable ui-selectable-disabled").removeData("selectable").unbind(".selectable"),this._mouseD
estroy(),this},_mouseStart:function(t){var n=this;this.opos=[t.pageX,t.pageY];if(!this.options.disabled){var r=this.opt
ions;this.selectees=e(r.filter,this.element[0]),this._trigger("start",t),e(r.appendTo).append(this.helper),this.helper.
css({left:t.clientX,top:t.clientY,width:0,height:0}),r.autoRefresh&&this.refresh(),this.selectees.filter(".ui-selected"
).each(function(){var r=e.data(this,"selectable-item");r.startselected=!0,!t.metaKey&&!t.ctrlKey&&(r.$element.removeCla
ss("ui-selected"),r.selected=!1,r.$element.addClass("ui-unselecting"),r.unselecting=!0,n._trigger("unselecting",t,{unse
lecting:r.element}))}),e(t.target).parents().andSelf().each(function(){var r=e.data(this,"selectable-item");if(r){var i
=!t.metaKey&&!t.ctrlKey||!r.$element.hasClass("ui-selected");return r.$element.removeClass(i?"ui-unselecting":"ui-selec
ted").addClass(i?"ui-selecting":"ui-unselecting"),r.unselecting=!i,r.selecting=i,r.selected=i,i?n._trigger("selecting",
t,{selecting:r.element}):n._trigger("unselecting",t,{unselecting:r.element}),!1}})}},_mouseDrag:function(t){var n=this;
this.dragged=!0;if(!this.options.disabled){var r=this.options,i=this.opos[0],s=this.opos[1],o=t.pageX,u=t.pageY;if(i>o)
{var f=o;o=i,i=f}if(s>u){var f=u;u=s,s=f}return this.helper.css({left:i,top:s,width:o-i,height:u-s}),this.selectees.eac
h(function(){var f=e.data(this,"selectable-item");if(!!f&&f.element!=n.element[0]){var l=!1;r.tolerance=="touch"?l=!(f.
left>o||f.right<i||f.top>u||f.bottom<s):r.tolerance=="fit"&&(l=f.left>i&&f.right<o&&f.top>s&&f.bottom<u),l?(f.selected&
&(f.$element.removeClass("ui-selected"),f.selected=!1),f.unselecting&&(f.$element.removeClass("ui-unselecting"),f.unsel
ecting=!1),f.selecting||(f.$element.addClass("ui-selecting"),f.selecting=!0,n._trigger("selecting",t,{selecting:f.eleme
nt}))):(f.selecting&&((t.metaKey||t.ctrlKey)&&f.startselected?(f.$element.removeClass("ui-selecting"),f.selecting=!1,f.
$element.addClass("ui-selected"),f.selected=!0):(f.$element.removeClass("ui-selecting"),f.selecting=!1,f.startselected&
&(f.$element.addClass("ui-unselecting"),f.unselecting=!0),n._trigger("unselecting",t,{unselecting:f.element}))),f.selec
ted&&!t.metaKey&&!t.ctrlKey&&!f.startselected&&(f.$element.removeClass("ui-selected"),f.selected=!1,f.$element.addClass
("ui-unselecting"),f.unselecting=!0,n._trigger("unselecting",t,{unselecting:f.element})))}}),!1}},_mouseStop:function(t
){var n=this;this.dragged=!1;var r=this.options;return e(".ui-unselecting",this.element[0]).each(function(){var r=e.dat
a(this,"selectable-item");r.$element.removeClass("ui-unselecting"),r.unselecting=!1,r.startselected=!1,n._trigger("unse
lected",t,{unselected:r.element})}),e(".ui-selecting",this.element[0]).each(function(){var r=e.data(this,"selectable-it
em");r.$element.removeClass("ui-selecting").addClass("ui-selected"),r.selecting=!1,r.selected=!0,r.startselected=!0,n._
trigger("selected",t,{selected:r.element})}),this._trigger("stop",t),this.helper.remove(),!1}}),e.extend(e.ui.selectabl
e,{version:"1.8.17"})}(jQuery),function(e,t){e.widget("ui.sortable",e.ui.mouse,{widgetEventPrefix:"sort",options:{appen
dTo:"parent",axis:!1,connectWith:!1,containment:!1,cursor:"auto",cursorAt:!1,dropOnEmpty:!0,forcePlaceholderSize:!1,for
ceHelperSize:!1,grid:!1,handle:!1,helper:"original",items:"> *",opacity:!1,placeholder:!1,revert:!1,scroll:!0,scrollSen
sitivity:20,scrollSpeed:20,scope:"default",tolerance:"intersect",zIndex:1e3},_create:function(){var e=this.options;this
.containerCache={},this.element.addClass("ui-sortable"),this.refresh(),this.floating=this.items.length?e.axis==="x"||/l
eft|right/.test(this.items[0].item.css("float"))||/inline|table-cell/.test(this.items[0].item.css("display")):!1,this.o
ffset=this.element.offset(),this._mouseInit()},destroy:function(){this.element.removeClass("ui-sortable ui-sortable-dis
abled"),this._mouseDestroy();for(var e=this.items.length-1;e>=0;e--)this.items[e].item.removeData(this.widgetName+"-ite
m");return this},_setOption:function(t,n){t==="disabled"?(this.options[t]=n,this.widget()[n?"addClass":"removeClass"]("
ui-sortable-disabled")):e.Widget.prototype._setOption.apply(this,arguments)},_mouseCapture:function(t,n){var r=this;if(
this.reverting)return!1;if(this.options.disabled||this.options.type=="static")return!1;this._refreshItems(t);var i=null
,s=this,o=e(t.target).parents().each(function(){if(e.data(this,r.widgetName+"-item")==s)return i=e(this),!1});e.data(t.
target,r.widgetName+"-item")==s&&(i=e(t.target));if(!i)return!1;if(this.options.handle&&!n){var u=!1;e(this.options.han
dle,i).find("*").andSelf().each(function(){this==t.target&&(u=!0)});if(!u)return!1}return this.currentItem=i,this._remo
veCurrentsFromItems(),!0},_mouseStart:function(t,n,r){var i=this.options,s=this;this.currentContainer=this,this.refresh
Positions(),this.helper=this._createHelper(t),this._cacheHelperProportions(),this._cacheMargins(),this.scrollParent=thi
s.helper.scrollParent(),this.offset=this.currentItem.offset(),this.offset={top:this.offset.top-this.margins.top,left:th
is.offset.left-this.margins.left},this.helper.css("position","absolute"),this.cssPosition=this.helper.css("position"),e
.extend(this.offset,{click:{left:t.pageX-this.offset.left,top:t.pageY-this.offset.top},parent:this._getParentOffset(),r
elative:this._getRelativeOffset()}),this.originalPosition=this._generatePosition(t),this.originalPageX=t.pageX,this.ori
ginalPageY=t.pageY,i.cursorAt&&this._adjustOffsetFromHelper(i.cursorAt),this.domPosition={prev:this.currentItem.prev()[
0],parent:this.currentItem.parent()[0]},this.helper[0]!=this.currentItem[0]&&this.currentItem.hide(),this._createPlaceh
older(),i.containment&&this._setContainment(),i.cursor&&(e("body").css("cursor")&&(this._storedCursor=e("body").css("cu
rsor")),e("body").css("cursor",i.cursor)),i.opacity&&(this.helper.css("opacity")&&(this._storedOpacity=this.helper.css(
"opacity")),this.helper.css("opacity",i.opacity)),i.zIndex&&(this.helper.css("zIndex")&&(this._storedZIndex=this.helper
.css("zIndex")),this.helper.css("zIndex",i.zIndex)),this.scrollParent[0]!=document&&this.scrollParent[0].tagName!="HTML
"&&(this.overflowOffset=this.scrollParent.offset()),this._trigger("start",t,this._uiHash()),this._preserveHelperProport
ions||this._cacheHelperProportions();if(!r)for(var o=this.containers.length-1;o>=0;o--)this.containers[o]._trigger("act
ivate",t,s._uiHash(this));return e.ui.ddmanager&&(e.ui.ddmanager.current=this),e.ui.ddmanager&&!i.dropBehaviour&&e.ui.d
dmanager.prepareOffsets(this,t),this.dragging=!0,this.helper.addClass("ui-sortable-helper"),this._mouseDrag(t),!0},_mou
seDrag:function(t){this.position=this._generatePosition(t),this.positionAbs=this._convertPositionTo("absolute"),this.la
stPositionAbs||(this.lastPositionAbs=this.positionAbs);if(this.options.scroll){var n=this.options,r=!1;this.scrollParen
t[0]!=document&&this.scrollParent[0].tagName!="HTML"?(this.overflowOffset.top+this.scrollParent[0].offsetHeight-t.pageY
<n.scrollSensitivity?this.scrollParent[0].scrollTop=r=this.scrollParent[0].scrollTop+n.scrollSpeed:t.pageY-this.overflo
wOffset.top<n.scrollSensitivity&&(this.scrollParent[0].scrollTop=r=this.scrollParent[0].scrollTop-n.scrollSpeed),this.o
verflowOffset.left+this.scrollParent[0].offsetWidth-t.pageX<n.scrollSensitivity?this.scrollParent[0].scrollLeft=r=this.
scrollParent[0].scrollLeft+n.scrollSpeed:t.pageX-this.overflowOffset.left<n.scrollSensitivity&&(this.scrollParent[0].sc
rollLeft=r=this.scrollParent[0].scrollLeft-n.scrollSpeed)):(t.pageY-e(document).scrollTop()<n.scrollSensitivity?r=e(doc
ument).scrollTop(e(document).scrollTop()-n.scrollSpeed):e(window).height()-(t.pageY-e(document).scrollTop())<n.scrollSe
nsitivity&&(r=e(document).scrollTop(e(document).scrollTop()+n.scrollSpeed)),t.pageX-e(document).scrollLeft()<n.scrollSe
nsitivity?r=e(document).scrollLeft(e(document).scrollLeft()-n.scrollSpeed):e(window).width()-(t.pageX-e(document).scrol
lLeft())<n.scrollSensitivity&&(r=e(document).scrollLeft(e(document).scrollLeft()+n.scrollSpeed))),r!==!1&&e.ui.ddmanage
r&&!n.dropBehaviour&&e.ui.ddmanager.prepareOffsets(this,t)}this.positionAbs=this._convertPositionTo("absolute");if(!thi
s.options.axis||this.options.axis!="y")this.helper[0].style.left=this.position.left+"px";if(!this.options.axis||this.op
tions.axis!="x")this.helper[0].style.top=this.position.top+"px";for(var i=this.items.length-1;i>=0;i--){var s=this.item
s[i],o=s.item[0],u=this._intersectsWithPointer(s);if(!u)continue;if(o!=this.currentItem[0]&&this.placeholder[u==1?"next
":"prev"]()[0]!=o&&!e.ui.contains(this.placeholder[0],o)&&(this.options.type=="semi-dynamic"?!e.ui.contains(this.elemen
t[0],o):!0)){this.direction=u==1?"down":"up"
;if(this.options.tolerance!="pointer"&&!this._intersectsWithSides(s))break;this._rearrange(t,s),this._trigger("change",
t,this._uiHash());break}}return this._contactContainers(t),e.ui.ddmanager&&e.ui.ddmanager.drag(this,t),this._trigger("s
ort",t,this._uiHash()),this.lastPositionAbs=this.positionAbs,!1},_mouseStop:function(t,n){if(!!t){e.ui.ddmanager&&!this
.options.dropBehaviour&&e.ui.ddmanager.drop(this,t);if(this.options.revert){var r=this,i=r.placeholder.offset();r.rever
ting=!0,e(this.helper).animate({left:i.left-this.offset.parent.left-r.margins.left+(this.offsetParent[0]==document.body
?0:this.offsetParent[0].scrollLeft),top:i.top-this.offset.parent.top-r.margins.top+(this.offsetParent[0]==document.body
?0:this.offsetParent[0].scrollTop)},parseInt(this.options.revert,10)||500,function(){r._clear(t)})}else this._clear(t,n
);return!1}},cancel:function(){var t=this;if(this.dragging){this._mouseUp({target:null}),this.options.helper=="original
"?this.currentItem.css(this._storedCSS).removeClass("ui-sortable-helper"):this.currentItem.show();for(var n=this.contai
ners.length-1;n>=0;n--)this.containers[n]._trigger("deactivate",null,t._uiHash(this)),this.containers[n].containerCache
.over&&(this.containers[n]._trigger("out",null,t._uiHash(this)),this.containers[n].containerCache.over=0)}return this.p
laceholder&&(this.placeholder[0].parentNode&&this.placeholder[0].parentNode.removeChild(this.placeholder[0]),this.optio
ns.helper!="original"&&this.helper&&this.helper[0].parentNode&&this.helper.remove(),e.extend(this,{helper:null,dragging
:!1,reverting:!1,_noFinalSort:null}),this.domPosition.prev?e(this.domPosition.prev).after(this.currentItem):e(this.domP
osition.parent).prepend(this.currentItem)),this},serialize:function(t){var n=this._getItemsAsjQuery(t&&t.connected),r=[
];return t=t||{},e(n).each(function(){var n=(e(t.item||this).attr(t.attribute||"id")||"").match(t.expression||/(.+)[-=_
](.+)/);n&&r.push((t.key||n[1]+"[]")+"="+(t.key&&t.expression?n[1]:n[2]))}),!r.length&&t.key&&r.push(t.key+"="),r.join(
"&")},toArray:function(t){var n=this._getItemsAsjQuery(t&&t.connected),r=[];return t=t||{},n.each(function(){r.push(e(t
.item||this).attr(t.attribute||"id")||"")}),r},_intersectsWith:function(e){var t=this.positionAbs.left,n=t+this.helperP
roportions.width,r=this.positionAbs.top,i=r+this.helperProportions.height,s=e.left,o=s+e.width,u=e.top,a=u+e.height,f=t
his.offset.click.top,l=this.offset.click.left,c=r+f>u&&r+f<a&&t+l>s&&t+l<o;return this.options.tolerance=="pointer"||th
is.options.forcePointerForContainers||this.options.tolerance!="pointer"&&this.helperProportions[this.floating?"width":"
height"]>e[this.floating?"width":"height"]?c:s<t+this.helperProportions.width/2&&n-this.helperProportions.width/2<o&&u<
r+this.helperProportions.height/2&&i-this.helperProportions.height/2<a},_intersectsWithPointer:function(t){var n=e.ui.i
sOverAxis(this.positionAbs.top+this.offset.click.top,t.top,t.height),r=e.ui.isOverAxis(this.positionAbs.left+this.offse
t.click.left,t.left,t.width),i=n&&r,s=this._getDragVerticalDirection(),o=this._getDragHorizontalDirection();return i?th
is.floating?o&&o=="right"||s=="down"?2:1:s&&(s=="down"?2:1):!1},_intersectsWithSides:function(t){var n=e.ui.isOverAxis(
this.positionAbs.top+this.offset.click.top,t.top+t.height/2,t.height),r=e.ui.isOverAxis(this.positionAbs.left+this.offs
et.click.left,t.left+t.width/2,t.width),i=this._getDragVerticalDirection(),s=this._getDragHorizontalDirection();return 
this.floating&&s?s=="right"&&r||s=="left"&&!r:i&&(i=="down"&&n||i=="up"&&!n)},_getDragVerticalDirection:function(){var 
e=this.positionAbs.top-this.lastPositionAbs.top;return e!=0&&(e>0?"down":"up")},_getDragHorizontalDirection:function(){
var e=this.positionAbs.left-this.lastPositionAbs.left;return e!=0&&(e>0?"right":"left")},refresh:function(e){return thi
s._refreshItems(e),this.refreshPositions(),this},_connectWith:function(){var e=this.options;return e.connectWith.constr
uctor==String?[e.connectWith]:e.connectWith},_getItemsAsjQuery:function(t){var n=this,r=[],i=[],s=this._connectWith();i
f(s&&t)for(var o=s.length-1;o>=0;o--){var u=e(s[o]);for(var f=u.length-1;f>=0;f--){var l=e.data(u[f],this.widgetName);l
&&l!=this&&!l.options.disabled&&i.push([e.isFunction(l.options.items)?l.options.items.call(l.element):e(l.options.items
,l.element).not(".ui-sortable-helper").not(".ui-sortable-placeholder"),l])}}i.push([e.isFunction(this.options.items)?th
is.options.items.call(this.element,null,{options:this.options,item:this.currentItem}):e(this.options.items,this.element
).not(".ui-sortable-helper").not(".ui-sortable-placeholder"),this]);for(var o=i.length-1;o>=0;o--)i[o][0].each(function
(){r.push(this)});return e(r)},_removeCurrentsFromItems:function(){var e=this.currentItem.find(":data("+this.widgetName
+"-item)");for(var t=0;t<this.items.length;t++)for(var n=0;n<e.length;n++)e[n]==this.items[t].item[0]&&this.items.splic
e(t,1)},_refreshItems:function(t){this.items=[],this.containers=[this];var n=this.items,r=this,i=[[e.isFunction(this.op
tions.items)?this.options.items.call(this.element[0],t,{item:this.currentItem}):e(this.options.items,this.element),this
]],s=this._connectWith();if(s)for(var o=s.length-1;o>=0;o--){var u=e(s[o]);for(var f=u.length-1;f>=0;f--){var l=e.data(
u[f],this.widgetName);l&&l!=this&&!l.options.disabled&&(i.push([e.isFunction(l.options.items)?l.options.items.call(l.el
ement[0],t,{item:this.currentItem}):e(l.options.items,l.element),l]),this.containers.push(l))}}for(var o=i.length-1;o>=
0;o--){var c=i[o][1],h=i[o][0];for(var f=0,p=h.length;f<p;f++){var d=e(h[f]);d.data(this.widgetName+"-item",c),n.push({
item:d,instance:c,width:0,height:0,left:0,top:0})}}},refreshPositions:function(t){this.offsetParent&&this.helper&&(this
.offset.parent=this._getParentOffset());for(var n=this.items.length-1;n>=0;n--){var r=this.items[n];if(r.instance!=this
.currentContainer&&this.currentContainer&&r.item[0]!=this.currentItem[0])continue;var i=this.options.toleranceElement?e
(this.options.toleranceElement,r.item):r.item;t||(r.width=i.outerWidth(),r.height=i.outerHeight());var s=i.offset();r.l
eft=s.left,r.top=s.top}if(this.options.custom&&this.options.custom.refreshContainers)this.options.custom.refreshContain
ers.call(this);else for(var n=this.containers.length-1;n>=0;n--){var s=this.containers[n].element.offset();this.contain
ers[n].containerCache.left=s.left,this.containers[n].containerCache.top=s.top,this.containers[n].containerCache.width=t
his.containers[n].element.outerWidth(),this.containers[n].containerCache.height=this.containers[n].element.outerHeight(
)}return this},_createPlaceholder:function(t){var n=t||this,r=n.options;if(!r.placeholder||r.placeholder.constructor==S
tring){var i=r.placeholder;r.placeholder={element:function(){var t=e(document.createElement(n.currentItem[0].nodeName))
.addClass(i||n.currentItem[0].className+" ui-sortable-placeholder").removeClass("ui-sortable-helper")[0];return i||(t.s
tyle.visibility="hidden"),t},update:function(e,t){if(!i||!!r.forcePlaceholderSize)t.height()||t.height(n.currentItem.in
nerHeight()-parseInt(n.currentItem.css("paddingTop")||0,10)-parseInt(n.currentItem.css("paddingBottom")||0,10)),t.width
()||t.width(n.currentItem.innerWidth()-parseInt(n.currentItem.css("paddingLeft")||0,10)-parseInt(n.currentItem.css("pad
dingRight")||0,10))}}}n.placeholder=e(r.placeholder.element.call(n.element,n.currentItem)),n.currentItem.after(n.placeh
older),r.placeholder.update(n,n.placeholder)},_contactContainers:function(t){var n=null,r=null;for(var i=this.container
s.length-1;i>=0;i--){if(e.ui.contains(this.currentItem[0],this.containers[i].element[0]))continue;if(this._intersectsWi
th(this.containers[i].containerCache)){if(n&&e.ui.contains(this.containers[i].element[0],n.element[0]))continue;n=this.
containers[i],r=i}else this.containers[i].containerCache.over&&(this.containers[i]._trigger("out",t,this._uiHash(this))
,this.containers[i].containerCache.over=0)}if(!!n)if(this.containers.length===1)this.containers[r]._trigger("over",t,th
is._uiHash(this)),this.containers[r].containerCache.over=1;else if(this.currentContainer!=this.containers[r]){var s=1e4
,o=null,u=this.positionAbs[this.containers[r].floating?"left":"top"];for(var f=this.items.length-1;f>=0;f--){if(!e.ui.c
ontains(this.containers[r].element[0],this.items[f].item[0]))continue;var l=this.items[f][this.containers[r].floating?"
left":"top"];Math.abs(l-u)<s&&(s=Math.abs(l-u),o=this.items[f])}if(!o&&!this.options.dropOnEmpty)return;this.currentCon
tainer=this.containers[r],o?this._rearrange(t,o,null,!0):this._rearrange(t,null,this.containers[r].element,!0),this._tr
igger("change",t,this._uiHash()),this.containers[r]._trigger("change",t,this._uiHash(this)),this.options.placeholder.up
date(this.currentContainer,this.placeholder),this.containers[r]._trigger("over",t,this._uiHash(this)),this.containers[r
].containerCache.over=1}},_createHelper:function(t){var n=this.options,r=e.isFunction(n.helper)?e(n.helper.apply(this.e
lement[0],[t,this.currentItem])):n.helper=="clone"?this.currentItem.clone():this.currentItem;return r.parents("body").l
ength||e(n.appendTo!="parent"?n.appendTo:this.currentItem[0].parentNode)[0].appendChild(r[0]),r[0]==this.currentItem[0]
&&(this._storedCSS={width:this.currentItem[0].style.width,height:this.currentItem[0].style.height,position:this.current
Item.css("position"),top:this.currentItem.css("top"),left:this.currentItem.css("left")}),(r[0].style.width==""||n.force
HelperSize)&&r.width(this.currentItem.width()),(r[0].style.height==""||n.forceHelperSize)&&r.height(this.currentItem.he
ight()),r},_adjustOffsetFromHelper:function(t){typeof t=="string"&&(t=t.split(" ")),e.isArray(t)&&(t={left:+t[0],top:+t
[1]||0}),"left"in t&&(this.offset.click.left=t.left+this.margins.left),"right"in t&&(this.offset.click.left=this.helper
Proportions.width-t.right+this.margins.left),"top"in t&&(this.offset.click.top=t.top+this.margins.top),"bottom"in t&&(t
his.offset.click.top=this.helperProportions.height-t.bottom+this.margins.top)},_getParentOffset:function(){this.offsetP
arent=this.helper.offsetParent();var t=this.offsetParent.offset();this.cssPosition=="absolute"&&this.scrollParent[0]!=d
ocument&&e.ui.contains(this.scrollParent[0],this.offsetParent[0])&&(t.left+=this.scrollParent.scrollLeft(),t.top+=this.
scrollParent.scrollTop());if(this.offsetParent[0]==document.body||this.offsetParent[0].tagName&&this.offsetParent[0].ta
gName.toLowerCase()=="html"&&e.browser.msie)t={top:0,left:0};return{top:t.top+(parseInt(this.offsetParent.css("borderTo
pWidth"),10)||0),left:t.left+(parseInt(this.offsetParent.css("borderLeftWidth"),10)||0)}},_getRelativeOffset:function()
{if(this.cssPosition=="relative"){var e=this.currentItem.position();return{top:e.top-(parseInt(this.helper.css("top"),1
0)||0)+this.scrollParent.scrollTop(),left:e.left-(parseInt(this.helper.css("left"),10)||0)+this.scrollParent.scrollLeft
()}}return{top:0,left:0}},_cacheMargins:function(){this.margins={left:parseInt(this.currentItem.css("marginLeft"),10)||
0,top:parseInt(this.currentItem.css("marginTop"),10)||0}},_cacheHelperProportions:function(){this.helperProportions={wi
dth:this.helper.outerWidth(),height:this.helper.outerHeight()}},_setContainment:function(){var t=this.options;t.contain
ment=="parent"&&(t.containment=this.helper[0].parentNode);if(t.containment=="document"||t.containment=="window")this.co
ntainment=[0-this.offset.relative.left-this.offset.parent.left,0-this.offset.relative.top-this.offset.parent.top,e(t.co
ntainment=="document"?document:window).width()-this.helperProportions.width-this.margins.left,(e(t.containment=="docume
nt"?document:window).height()||document.body.parentNode.scrollHeight)-this.helperProportions.height-this.margins.top];i
f(!/^(document|window|parent)$/.test(t.containment)){var n=e(t.containment)[0],r=e(t.containment).offset(),i=e(n).css("
overflow")!="hidden";this.containment=[r.left+(parseInt(e(n).css("borderLeftWidth"),10)||0)+(parseInt(e(n).css("padding
Left"),10)||0)-this.margins.left,r.top+(parseInt(e(n).css("borderTopWidth"),10)||0)+(parseInt(e(n).css("paddingTop"),10
)||0)-this.margins.top,r.left+(i?Math.max(n.scrollWidth,n.offsetWidth):n.offsetWidth)-(parseInt(e(n).css("borderLeftWid
th"),10)||0)-(parseInt(e(n).css("paddingRight"),10)||0)-this.helperProportions.width-this.margins.left,r.top+(i?Math.ma
x(n.scrollHeight,n.offsetHeight):n.offsetHeight)-(parseInt(e(n).css("borderTopWidth"),10)||0)-(parseInt(e(n).css("paddi
ngBottom"),10)||0)-this.helperProportions.height-this.margins.top]}},_convertPositionTo:function(t,n){n||(n=this.positi
on);var r=t=="absolute"?1:-1,i=this.options,s=this.cssPosition!="absolute"||this.scrollParent[0]!=document&&!!e.ui.cont
ains(this.scrollParent[0],this.offsetParent[0])?this.scrollParent:this.offsetParent,o=/(html|body)/i.test(s[0].tagName)
;return{top:n.top+this.offset.relative.top*r+this.offset.parent.top*r-(e.browser.safari&&this.cssPosition=="fixed"?0:(t
his.cssPosition=="fixed"?-this.scrollParent.scrollTop():o?0:s.scrollTop())*r),left:n.left+this.offset.relative.left*r+t
his.offset.parent.left*r-(e.browser.safari&&this.cssPosition=="fixed"?0:(this.cssPosition=="fixed"?-this.scrollParent.s
crollLeft():o?0:s.scrollLeft())*r)}},_generatePosition:function(t){var n=this.options,r=this.cssPosition!="absolute"||t
his.scrollParent[0]!=document&&!!e.ui.contains(this.scrollParent[0],this.offsetParent[0])?this.scrollParent:this.offset
Parent,i=/(html|body)/i.test(r[0].tagName);this.cssPosition=="relative"&&(this.scrollParent[0]==document||this.scrollPa
rent[0]==this.offsetParent[0])&&(this.offset.relative=this._getRelativeOffset());var s=t.pageX,o=t.pageY;if(this.origin
alPosition){this.containment&&(t.pageX-this.offset.click.left<this.containment[0]&&(s=this.containment[0]+this.offset.c
lick.left),t.pageY-this.offset.click.top<this.containment[1]&&(o=this.containment[1]+this.offset.click.top),t.pageX-thi
s.offset.click.left>this.containment[2]&&(s=this.containment[2]+this.offset.click.left),t.pageY-this.offset.click.top>t
his.containment[3]&&(o=this.containment[3]+this.offset.click.top));if(n.grid){var u=this.originalPageY+Math.round((o-th
is.originalPageY)/n.grid[1])*n.grid[1];o=this.containment?u-this.offset.click.top<this.containment[1]||u-this.offset.cl
ick.top>this.containment[3]?u-this.offset.click.top<this.containment[1]?u+n.grid[1]:u-n.grid[1]:u:u;var f=this.original
PageX+Math.round((s-this.originalPageX)/n.grid[0])*n.grid[0];s=this.containment?f-this.offset.click.left<this.containme
nt[0]||f-this.offset.click.left>this.containment[2]?f-this.offset.click.left<this.containment[0]?f+n.grid[0]:f-n.grid[0
]:f:f}}return{top:o-this.offset.click.top-this.offset.relative.top-this.offset.parent.top+(e.browser.safari&&this.cssPo
sition=="fixed"?0:this.cssPosition=="fixed"?-this.scrollParent.scrollTop():i?0:r.scrollTop()),left:s-this.offset.click.
left-this.offset.relative.left-this.offset.parent.left+(e.browser.safari&&this.cssPosition=="fixed"?0:this.cssPosition=
="fixed"?-this.scrollParent.scrollLeft():i?0:r.scrollLeft())}},_rearrange:function(e,t,n,r){n?n[0].appendChild(this.pla
ceholder[0]):t.item[0].parentNode.insertBefore(this.placeholder[0],this.direction=="down"?t.item[0]:t.item[0].nextSibli
ng),this.counter=this.counter?++this.counter:1;var i=this,s=this.counter;window.setTimeout(function(){s==i.counter&&i.r
efreshPositions(!r)},0)},_clear:function(t,n){this.reverting=!1;var r=[],i=this;!this._noFinalSort&&this.currentItem.pa
rent().length&&this.placeholder.before(this.currentItem),this._noFinalSort=null;if(this.helper[0]==this.currentItem[0])
{for(var s in this._storedCSS)if(this._storedCSS[s]=="auto"||this._storedCSS[s]=="static")this._storedCSS[s]="";this.cu
rrentItem.css(this._storedCSS).removeClass("ui-sortable-helper")}else this.currentItem.show();this.fromOutside&&!n&&r.p
ush(function(e){this._trigger("receive",e,this._uiHash(this.fromOutside))}),(this.fromOutside||this.domPosition.prev!=t
his.currentItem.prev().not(".ui-sortable-helper")[0]||this.domPosition.parent!=this.currentItem.parent()[0])&&!n&&r.pus
h(function(e){this._trigger("update",e,this._uiHash())});if(!e.ui.contains(this.element[0],this.currentItem[0])){n||r.p
ush(function(e){this._trigger("remove",e,this._uiHash())});for(var s=this.containers.length-1;s>=0;s--)e.ui.contains(th
is.containers[s].element[0],this.currentItem[0])&&!n&&(r.push(function(e){return function(t){e._trigger("receive",t,thi
s._uiHash(this))}}.call(this,this.containers[s])),r.push(function(e){return function(t){e._trigger("update",t,this._uiH
ash(this))}}.call(this,this.containers[s])))}for(var s=this.containers.length-1;s>=0;s--)n||r.push(function(e){return f
unction(t){e._trigger("deactivate",t,this._uiHash(this))}}.call(this,this.containers[s])),this.containers[s].containerC
ache.over&&(r.push(function(e){return function(t){e._trigger("out",t,this._uiHash(this))}}.call(this,this.containers[s]
)),this.containers[s].containerCache.over=0);this._storedCursor&&e("body").css("cursor",this._storedCursor),this._store
dOpacity&&this.helper.css("opacity",this._storedOpacity),this._storedZIndex&&this.helper.css("zIndex",this._storedZInde
x=="auto"?"":this._storedZIndex),this.dragging=!1;if(this.cancelHelperRemoval){if(!n){this._trigger("beforeStop",t,this
._uiHash());for(var s=0;s<r.length;s++)r[s].call(this,t);this._trigger("stop",t,this._uiHash())}return!1}n||this._trigg
er("beforeStop",t,this._uiHash()),this.placeholder[0].parentNode.removeChild(this.placeholder[0]),this.helper[0]!=this.
currentItem[0]&&this.helper.remove(),this.helper=null;if(!n){for(var s=0;s<r.length;s++)r[s].call(this,t);this._trigger
("stop",t,this._uiHash())}return this.fromOutside=!1,!0},_trigger:function(){e.Widget.prototype._trigger.apply(this,arg
uments)===!1&&this.cancel()},_uiHash:function(t){var n=t||this;return{helper:n.helper,placeholder:n.placeholder||e([]),
position:n.position,originalPosition:n.originalPosition,offset:n.positionAbs,item:n.currentItem,sender:t?t.element:null
}}}),e.extend(e.ui.sortable,{version:"1.8.17"})}(jQuery),function(e,t){e.widget("ui.accordion",{options:{active:0,anima
ted:"slide",autoHeight:!0,clearStyle:!1,collapsible:!1,event:"click",fillSpace:!1,header:"> li > :first-child,> :not(li
):even",icons:{header:"ui-icon-triangle-1-e",headerSelected:"ui-icon-triangle-1-s"},navigation:!1,navigationFilter:func
tion(){return this.href.toLowerCase()===location.href.toLowerCase()}},_create:function(){var t=this,n=t.options;t.runni
ng=0,t.element.addClass("ui-accordion ui-widget ui-helper-reset").children("li").addClass("ui-accordion-li-fix"),t.head
ers=t.element.find(n.header).addClass("ui-accordion-header ui-helper-reset ui-state-default ui-corner-all").bind("mouse
enter.accordion",function(){n.disabled||e(this).addClass("ui-state-hover")}).bind("mouseleave.accordion",function(){n.d
isabled||e(this).removeClass("ui-state-hover")}).bind("focus.accordion",function(){n.disabled||e(this).addClass("ui-sta
te-focus")}).bind("blur.accordion",function(){n.disabled||e(this).removeClass("ui-state-focus")}),t.headers.next().addC
lass("ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom");if(n.navigation){var r=t.element.find("
a").filter(n.navigationFilter).eq(0);if(r.length){var i=r.closest(".ui-accordion-header");i.length?t.active=i:t.active=
r.closest(".ui-accordion-content").prev()}}t.active=t._findActive(t.active||n.active).addClass("ui-state-default ui-sta
te-active").toggleClass("ui-corner-all").toggleClass("ui-corner-top"),t.active.next().addClass("ui-accordion-content-ac
tive"),t._createIcons(),t.resize(),t.element.attr("role","tablist"),t.headers.attr("role","tab").bind("keydown.accordio
n",function(e){return t._keydown(e)}).next().attr("role","tabpanel"),t.headers.not(t.active||"").attr({"aria-expanded":
"false","aria-selected":"false",tabIndex:-1}).next().hide(),t.active.length?t.active.attr({"aria-expanded":"true","aria
-selected":"true",tabIndex:0}):t.headers.eq(0).attr("tabIndex",0),e.browser.safari||t.headers.find("a").attr("tabIndex"
,-1),n.event&&t.headers.bind(n.event.split(" ").join(".accordion ")+".accordion",function(e){t._clickHandler.call(t,e,t
his),e.preventDefault()})},_createIcons:function(){var t=this.options;t.icons&&(e("<span></span>").addClass("ui-icon "+
t.icons.header).prependTo(this.headers),this.active.children(".ui-icon").toggleClass(t.icons.header).toggleClass(t.icon
s.headerSelected),this.element.addClass("ui-accordion-icons"))},_destroyIcons:function(){this.headers.children(".ui-ico
n").remove(),this.element.removeClass("ui-accordion-icons")},destroy:function(){var t=this.options;this.element.removeC
lass("ui-accordion ui-widget ui-helper-reset").removeAttr("role"),this.headers.unbind(".accordion").removeClass("ui-acc
ordion-header ui-accordion-disabled ui-helper-reset ui-state-default ui-corner-all ui-state-active ui-state-disabled ui
-corner-top").removeAttr("role").removeAttr("aria-expanded").removeAttr("aria-selected").removeAttr("tabIndex"),this.he
aders.find("a").removeAttr("tabIndex"),this._destroyIcons();var n=this.headers.next().css("display","").removeAttr("rol
e").removeClass("ui-helper-reset ui-widget-content ui-corner-bottom ui-accordion-content ui-accordion-content-active ui
-accordion-disabled ui-state-disabled");return(t.autoHeight||t.fillHeight)&&n.css("height",""),e.Widget.prototype.destr
oy.call(this)},_setOption:function(t,n){e.Widget.prototype._setOption.apply(this,arguments),t=="active"&&this.activate(
n),t=="icons"&&(this._destroyIcons(),n&&this._createIcons()),t=="disabled"&&this.headers.add(this.headers.next())[n?"ad
dClass":"removeClass"]("ui-accordion-disabled ui-state-disabled")},_keydown:function(t){if(!(this.options.disabled||t.a
ltKey||t.ctrlKey)){var n=e.ui.keyCode,r=this.headers.length,i=this.headers.index(t.target),s=!1;switch(t.keyCode){case 
n.RIGHT:case n.DOWN:s=this.headers[(i+1)%r];break;case n.LEFT:case n.UP:s=this.headers[(i-1+r)%r];break;case n.SPACE:ca
se n.ENTER:this._clickHandler({target:t.target},t.target),t.preventDefault()}return s?(e(t.target).attr("tabIndex",-1),
e(s).attr("tabIndex",0),s.focus(),!1):!0}},resize:function(){var t=this.options,n;if(t.fillSpace){if(e.browser.msie){va
r r=this.element.parent().css("overflow");this.element.parent().css("overflow","hidden")}n=this.element.parent().height
(),e.browser.msie&&this.element.parent().css("overflow",r),this.headers.each(function(){n-=e(this).outerHeight(!0)}),th
is.headers.next().each(function(){e(this).height(Math.max(0,n-e(this).innerHeight()+e(this).height()))}).css("overflow"
,"auto")}else t.autoHeight&&(n=0,this.headers.next().each(function(){n=Math.max(n,e(this).height("").height())}).height
(n));return this},activate:function(e){this.options.active=e;var t=this._findActive(e)[0];return this._clickHandler({ta
rget:t},t),this},_findActive:function(t){return t?typeof t=="number"?this.headers.filter(":eq("+t+")"):this.headers.not
(this.headers.not(t)):t===!1?e([]):this.headers.filter(":eq(0)")},_clickHandler:function(t,n){var r=this.options;if(!r.
disabled){if(!t.target){if(!r.collapsible)return;this.active.removeClass("ui-state-active ui-corner-top").addClass("ui-
state-default ui-corner-all").children(".ui-icon").removeClass(r.icons.headerSelected).addClass(r.icons.header),this.ac
tive.next().addClass("ui-accordion-content-active");var i=this.active.next(),s={options:r,newHeader:e([]),oldHeader:r.a
ctive,newContent:e([]),oldContent:i},o=this.active=e([]);this._toggle(o,i,s);return}var u=e(t.currentTarget||n),f=u[0]=
==this.active[0];r.active=r.collapsible&&f?!1:this.headers.index(u);if(this.running||!r.collapsible&&f)return;var l=thi
s.active,o=u.next(),i=this.active.next(),s={options:r,newHeader:f&&r.collapsible?e([]):u,oldHeader:this.active,newConte
nt:f&&r.collapsible?e([]):o,oldContent:i},c=this.headers.index(this.active[0])>this.headers.index(u[0]);this.active=f?e
([]):u,this._toggle(o,i,s,f,c),l.removeClass("ui-state-active ui-corner-top").addClass("ui-state-default ui-corner-all"
).children(".ui-icon").removeClass(r.icons.headerSelected).addClass(r.icons.header),f||(u.removeClass("ui-state-default
 ui-corner-all").addClass("ui-state-active ui-corner-top").children(".ui-icon").removeClass(r.icons.header).addClass(r.
icons.headerSelected),u.next().addClass("ui-accordion-content-active"));return}},_toggle:function(t,n,r,i,s){var o=this
,u=o.options;o.toShow=t,o.toHide=n,o.data=r;var f=function(){if(!!o)return o._completed.apply(o,arguments)};o._trigger(
"changestart",null,o.data),o.running=n.size()===0?t.size():n.size();if(u.animated){var l={};u.collapsible&&i?l={toShow:
e([]),toHide:n,complete:f,down:s,autoHeight:u.autoHeight||u.fillSpace}:l={toShow:t,toHide:n,complete:f,down:s,autoHeigh
t:u.autoHeight||u.fillSpace},u.proxied||(u.proxied=u.animated),u.proxiedDuration||(u.proxiedDuration=u.duration),u.anim
ated=e.isFunction(u.proxied)?u.proxied(l):u.proxied,u.duration=e.isFunction(u.proxiedDuration)?u.proxiedDuration(l):u.p
roxiedDuration;var c=e.ui.accordion.animations,h=u.duration,p=u.animated;p&&!c[p]&&!e.easing[p]&&(p="slide"),c[p]||(c[p
]=function(e){this.slide(e,{easing:p,duration:h||700})}),c[p](l)}else u.collapsible&&i?t.toggle():(n.hide(),t.show()),f
(!0);n.prev().attr({"aria-expanded":"false","aria-selected":"false",tabIndex:-1}).blur(),t.prev().attr({"aria-expanded"
:"true","aria-selected":"true",tabIndex:0}).focus()},_completed:function(e){this.running=e?0:--this.running,this.runnin
g||(this.options.clearStyle&&this.toShow.add(this.toHide).css({height:"",overflow:""}),this.toHide.removeClass("ui-acco
rdion-content-active"),this.toHide.length&&(this.toHide.parent()[0].className=this.toHide.parent()[0].className),this._
trigger("change",null,this.data))}}),e.extend(e.ui.accordion,{version:"1.8.17",animations:{slide:function(t,n){t=e.exte
nd({easing:"swing",duration:300},t,n);if(!t.toHide.size())t.toShow.animate({height:"show",paddingTop:"show",paddingBott
om:"show"},t);else{if(!t.toShow.size()){t.toHide.animate({height:"hide",paddingTop:"hide",paddingBottom:"hide"},t);retu
rn}var r=t.toShow.css("overflow"),i=0,s={},o={},u=["height","paddingTop","paddingBottom"],f,l=t.toShow;f=l[0].style.wid
th,l.width(l.parent().width()-parseFloat(l.css("paddingLeft"))-parseFloat(l.css("paddingRight"))-(parseFloat(l.css("bor
derLeftWidth"))||0)-(parseFloat(l.css("borderRightWidth"))||0)),e.each(u,function(n,r){o[r]="hide";var i=(""+e.css(t.to
Show[0],r)).match(/^([\d+-.]+)(.*)$/);s[r]={value:i[1],unit:i[2]||"px"}}),t.toShow.css({height:0,overflow:"hidden"}).sh
ow(),t.toHide.filter(":hidden").each(t.complete).end().filter(":visible").animate(o,{step:function(e,n){n.prop=="height
"&&(i=n.end-n.start===0?0:(n.now-n.start)/(n.end-n.start)),t.toShow[0].style[n.prop]=i*s[n.prop].value+s[n.prop].unit},
duration:t.duration,easing:t.easing,complete:function(){t.autoHeight||t.toShow.css("height",""),t.toShow.css({width:f,o
verflow:r}),t.complete()}})}},bounceslide:function(e){this.slide(e,{easing:e.down?"easeOutBounce":"swing",duration:e.do
wn?1e3:200})}}})}(jQuery),function(e,t){var n=0;e.widget("ui.autocomplete",{options:{appendTo:"body",autoFocus:!1,delay
:300,minLength:1,position:{my:"left top",at:"left bottom",collision:"none"},source:null},pending:0,_create:function(){v
ar t=this,n=this.element[0].ownerDocument,r;this.element.addClass("ui-autocomplete-input").attr("autocomplete","off").a
ttr({role:"textbox","aria-autocomplete":"list","aria-haspopup":"true"}).bind("keydown.autocomplete",function(n){if(!t.o
ptions.disabled&&!t.element.propAttr("readOnly")){r=!1;var i=e.ui.keyCode;switch(n.keyCode){case i.PAGE_UP:t._move("pre
viousPage",n);break;case i.PAGE_DOWN:t._move("nextPage",n);break;case i.UP:t._move("previous",n),n.preventDefault();bre
ak;case i.DOWN:t._move("next",n),n.preventDefault();break;case i.ENTER:case i.NUMPAD_ENTER:t.menu.active&&(r=!0,n.preve
ntDefault());case i.TAB:if(!t.menu.active)return;t.menu.select(n);break;case i.ESCAPE:t.element.val(t.term),t.close(n);
break;default:clearTimeout(t.searching),t.searching=setTimeout(function(){t.term!=t.element.val()&&(t.selectedItem=null
,t.search(null,n))},t.options.delay)}}}).bind("keypress.autocomplete",function(e){r&&(r=!1,e.preventDefault())}).bind("
focus.autocomplete",function(){t.options.disabled||(t.selectedItem=null,t.previous=t.element.val())}).bind("blur.autoco
mplete",function(e){t.options.disabled||(clearTimeout(t.searching),t.closing=setTimeout(function(){t.close(e),t._change
(e)},150))}),this._initSource(),this.response=function(){return t._response.apply(t,arguments)},this.menu=e("<ul></ul>"
).addClass("ui-autocomplete").appendTo(e(this.options.appendTo||"body",n)[0]).mousedown(function(n){var r=t.menu.elemen
t[0];e(n.target).closest(".ui-menu-item").length||setTimeout(function(){e(document).one("mousedown",function(n){n.targe
t!==t.element[0]&&n.target!==r&&!e.ui.contains(r,n.target)&&t.close()})},1),setTimeout(function(){clearTimeout(t.closin
g)},13)}).menu({focus:function(e,n){var r=n.item.data("item.autocomplete");!1!==t._trigger("focus",e,{item:r})&&/^key/.
test(e.originalEvent.type)&&t.element.val(r.value)},selected:function(e,r){var i=r.item.data("item.autocomplete"),s=t.p
revious;t.element[0]!==n.activeElement&&(t.element.focus(),t.previous=s,setTimeout(function(){t.previous=s,t.selectedIt
em=i},1)),!1!==t._trigger("select",e,{item:i})&&t.element.val(i.value),t.term=t.element.val(),t.close(e),t.selectedItem
=i},blur:function(e,n){t.menu.element.is(":visible")&&t.element.val()!==t.term&&t.element.val(t.term)}}).zIndex(this.el
ement.zIndex()+1).css({top:0,left:0}).hide().data("menu"),e.fn.bgiframe&&this.menu.element.bgiframe(),t.beforeunloadHan
dler=function(){t.element.removeAttr("autocomplete")},e(window).bind("beforeunload",t.beforeunloadHandler)},destroy:fun
ction(){this.element.removeClass("ui-autocomplete-input").removeAttr("autocomplete").removeAttr("role").removeAttr("ari
a-autocomplete").removeAttr("aria-haspopup"),this.menu.element.remove(),e(window).unbind("beforeunload",this.beforeunlo
adHandler),e.Widget.prototype.destroy.call(this)},_setOption:function(t,n){e.Widget.prototype._setOption.apply(this,arg
uments),t==="source"&&this._initSource(),t==="appendTo"&&this.menu.element.appendTo(e(n||"body",this.element[0].ownerDo
cument)[0]),t==="disabled"&&n&&this.xhr&&this.xhr.abort()},_initSource:function(){var t=this,r,i;e.isArray(this.options
.source)?(r=this.options.source,this.source=function(t,n){n(e.ui.autocomplete.filter(r,t.term))}):typeof this.options.s
ource=="string"?(i=this.options.source,this.source=function(r,s){t.xhr&&t.xhr.abort(),t.xhr=e.ajax({url:i,data:r,dataTy
pe:"json",autocompleteRequest:++n,success:function(e,t){this.autocompleteRequest===n&&s(e)},error:function(){this.autoc
ompleteRequest===n&&s([])}})}):this.source=this.options.source},search:function(e,t){e=e!=null?e:this.element.val(),thi
s.term=this.element.val();if(e.length<this.options.minLength)return this.close(t);clearTimeout(this.closing);if(this._t
rigger("search",t)!==!1)return this._search(e)},_search:function(e){this.pending++,this.element.addClass("ui-autocomple
te-loading"),this.source({term:e},this.response)},_response:function(e){!this.options.disabled&&e&&e.length?(e=this._no
rmalize(e),this._suggest(e),this._trigger("open")):this.close(),this.pending--,this.pending||this.element.removeClass("
ui-autocomplete-loading")},close:function(e){clearTimeout(this.closing),this.menu.element.is(":visible")&&(this.menu.el
ement.hide(),this.menu.deactivate(),this._trigger("close",e))},_change:function(e){this.previous!==this.element.val()&&
this._trigger("change",e,{item:this.selectedItem})},_normalize:function(t){return t.length&&t[0].label&&t[0].value?t:e.
map(t,function(t){return typeof t=="string"?{label:t,value:t}:e.extend({label:t.label||t.value,value:t.value||t.label},
t)})},_suggest:function(t){var n=this.menu.element.empty().zIndex(this.element.zIndex()+1);this._renderMenu(n,t),this.m
enu.deactivate(),this.menu.refresh(),n.show(),this._resizeMenu(),n.position(e.extend({of:this.element},this.options.pos
ition)),this.options.autoFocus&&this.menu.next(new e.Event("mouseover"))},_resizeMenu:function(){var e=this.menu.elemen
t;e.outerWidth(Math.max(e.width("").outerWidth()+1,this.element.outerWidth()))},_renderMenu:function(t,n){var r=this;e.
each(n,function(e,n){r._renderItem(t,n)})},_renderItem:function(t,n){return e("<li></li>").data("item.autocomplete",n).
append(e("<a></a>").text(n.label)).appendTo(t)},_move:function(e,t){if(!this.menu.element.is(":visible"))this.search(nu
ll,t);else{if(this.menu.first()&&/^previous/.test(e)||this.menu.last()&&/^next/.test(e)){this.element.val(this.term),th
is.menu.deactivate();return}this.menu[e](t)}},widget:function(){return this.menu.element}}),e.extend(e.ui.autocomplete,
{escapeRegex:function(e){return e.replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&")},filter:function(t,n){var r=new RegExp(e.u
i.autocomplete.escapeRegex(n),"i");return e.grep(t,function(e){return r.test(e.label||e.value||e)})}})}(jQuery),functio
n(e){e.widget("ui.menu",{_create:function(){
var t=this;this.element.addClass("ui-menu ui-widget ui-widget-content ui-corner-all").attr({role:"listbox","aria-active
descendant":"ui-active-menuitem"}).click(function(n){!e(n.target).closest(".ui-menu-item a").length||(n.preventDefault(
),t.select(n))}),this.refresh()},refresh:function(){var t=this,n=this.element.children("li:not(.ui-menu-item):has(a)").
addClass("ui-menu-item").attr("role","menuitem");n.children("a").addClass("ui-corner-all").attr("tabindex",-1).mouseent
er(function(n){t.activate(n,e(this).parent())}).mouseleave(function(){t.deactivate()})},activate:function(e,t){this.dea
ctivate();if(this.hasScroll()){var n=t.offset().top-this.element.offset().top,r=this.element.scrollTop(),i=this.element
.height();n<0?this.element.scrollTop(r+n):n>=i&&this.element.scrollTop(r+n-i+t.height())}this.active=t.eq(0).children("
a").addClass("ui-state-hover").attr("id","ui-active-menuitem").end(),this._trigger("focus",e,{item:t})},deactivate:func
tion(){!this.active||(this.active.children("a").removeClass("ui-state-hover").removeAttr("id"),this._trigger("blur"),th
is.active=null)},next:function(e){this.move("next",".ui-menu-item:first",e)},previous:function(e){this.move("prev",".ui
-menu-item:last",e)},first:function(){return this.active&&!this.active.prevAll(".ui-menu-item").length},last:function()
{return this.active&&!this.active.nextAll(".ui-menu-item").length},move:function(e,t,n){if(!this.active)this.activate(n
,this.element.children(t));else{var r=this.active[e+"All"](".ui-menu-item").eq(0);r.length?this.activate(n,r):this.acti
vate(n,this.element.children(t))}},nextPage:function(t){if(this.hasScroll()){if(!this.active||this.last()){this.activat
e(t,this.element.children(".ui-menu-item:first"));return}var n=this.active.offset().top,r=this.element.height(),i=this.
element.children(".ui-menu-item").filter(function(){var t=e(this).offset().top-n-r+e(this).height();return t<10&&t>-10}
);i.length||(i=this.element.children(".ui-menu-item:last")),this.activate(t,i)}else this.activate(t,this.element.childr
en(".ui-menu-item").filter(!this.active||this.last()?":first":":last"))},previousPage:function(t){if(this.hasScroll()){
if(!this.active||this.first()){this.activate(t,this.element.children(".ui-menu-item:last"));return}var n=this.active.of
fset().top,r=this.element.height();result=this.element.children(".ui-menu-item").filter(function(){var t=e(this).offset
().top-n+r-e(this).height();return t<10&&t>-10}),result.length||(result=this.element.children(".ui-menu-item:first")),t
his.activate(t,result)}else this.activate(t,this.element.children(".ui-menu-item").filter(!this.active||this.first()?":
last":":first"))},hasScroll:function(){return this.element.height()<this.element[e.fn.prop?"prop":"attr"]("scrollHeight
")},select:function(e){this._trigger("selected",e,{item:this.active})}})}(jQuery),function(e,t){var n,r,i,s,o="ui-butto
n ui-widget ui-state-default ui-corner-all",u="ui-state-hover ui-state-active ",a="ui-button-icons-only ui-button-icon-
only ui-button-text-icons ui-button-text-icon-primary ui-button-text-icon-secondary ui-button-text-only",f=function(){v
ar t=e(this).find(":ui-button");setTimeout(function(){t.button("refresh")},1)},l=function(t){var n=t.name,r=t.form,i=e(
[]);return n&&(r?i=e(r).find("[name='"+n+"']"):i=e("[name='"+n+"']",t.ownerDocument).filter(function(){return!this.form
})),i};e.widget("ui.button",{options:{disabled:null,text:!0,label:null,icons:{primary:null,secondary:null}},_create:fun
ction(){this.element.closest("form").unbind("reset.button").bind("reset.button",f),typeof this.options.disabled!="boole
an"&&(this.options.disabled=this.element.propAttr("disabled")),this._determineButtonType(),this.hasTitle=!!this.buttonE
lement.attr("title");var t=this,u=this.options,a=this.type==="checkbox"||this.type==="radio",h="ui-state-hover"+(a?"":"
 ui-state-active"),p="ui-state-focus";u.label===null&&(u.label=this.buttonElement.html()),this.element.is(":disabled")&
&(u.disabled=!0),this.buttonElement.addClass(o).attr("role","button").bind("mouseenter.button",function(){u.disabled||(
e(this).addClass("ui-state-hover"),this===n&&e(this).addClass("ui-state-active"))}).bind("mouseleave.button",function()
{u.disabled||e(this).removeClass(h)}).bind("click.button",function(e){u.disabled&&(e.preventDefault(),e.stopImmediatePr
opagation())}),this.element.bind("focus.button",function(){t.buttonElement.addClass(p)}).bind("blur.button",function(){
t.buttonElement.removeClass(p)}),a&&(this.element.bind("change.button",function(){s||t.refresh()}),this.buttonElement.b
ind("mousedown.button",function(e){u.disabled||(s=!1,r=e.pageX,i=e.pageY)}).bind("mouseup.button",function(e){!u.disabl
ed&&(r!==e.pageX||i!==e.pageY)&&(s=!0)})),this.type==="checkbox"?this.buttonElement.bind("click.button",function(){if(u
.disabled||s)return!1;e(this).toggleClass("ui-state-active"),t.buttonElement.attr("aria-pressed",t.element[0].checked)}
):this.type==="radio"?this.buttonElement.bind("click.button",function(){if(u.disabled||s)return!1;e(this).addClass("ui-
state-active"),t.buttonElement.attr("aria-pressed","true");var n=t.element[0];l(n).not(n).map(function(){return e(this)
.button("widget")[0]}).removeClass("ui-state-active").attr("aria-pressed","false")}):(this.buttonElement.bind("mousedow
n.button",function(){if(u.disabled)return!1;e(this).addClass("ui-state-active"),n=this,e(document).one("mouseup",functi
on(){n=null})}).bind("mouseup.button",function(){if(u.disabled)return!1;e(this).removeClass("ui-state-active")}).bind("
keydown.button",function(t){if(u.disabled)return!1;(t.keyCode==e.ui.keyCode.SPACE||t.keyCode==e.ui.keyCode.ENTER)&&e(th
is).addClass("ui-state-active")}).bind("keyup.button",function(){e(this).removeClass("ui-state-active")}),this.buttonEl
ement.is("a")&&this.buttonElement.keyup(function(t){t.keyCode===e.ui.keyCode.SPACE&&e(this).click()})),this._setOption(
"disabled",u.disabled),this._resetButton()},_determineButtonType:function(){this.element.is(":checkbox")?this.type="che
ckbox":this.element.is(":radio")?this.type="radio":this.element.is("input")?this.type="input":this.type="button";if(thi
s.type==="checkbox"||this.type==="radio"){var e=this.element.parents().filter(":last"),t="label[for='"+this.element.att
r("id")+"']";this.buttonElement=e.find(t),this.buttonElement.length||(e=e.length?e.siblings():this.element.siblings(),t
his.buttonElement=e.filter(t),this.buttonElement.length||(this.buttonElement=e.find(t))),this.element.addClass("ui-help
er-hidden-accessible");var n=this.element.is(":checked");n&&this.buttonElement.addClass("ui-state-active"),this.buttonE
lement.attr("aria-pressed",n)}else this.buttonElement=this.element},widget:function(){return this.buttonElement},destro
y:function(){this.element.removeClass("ui-helper-hidden-accessible"),this.buttonElement.removeClass(o+" "+u+" "+a).remo
veAttr("role").removeAttr("aria-pressed").html(this.buttonElement.find(".ui-button-text").html()),this.hasTitle||this.b
uttonElement.removeAttr("title"),e.Widget.prototype.destroy.call(this)},_setOption:function(t,n){e.Widget.prototype._se
tOption.apply(this,arguments),t==="disabled"?n?this.element.propAttr("disabled",!0):this.element.propAttr("disabled",!1
):this._resetButton()},refresh:function(){var t=this.element.is(":disabled");t!==this.options.disabled&&this._setOption
("disabled",t),this.type==="radio"?l(this.element[0]).each(function(){e(this).is(":checked")?e(this).button("widget").a
ddClass("ui-state-active").attr("aria-pressed","true"):e(this).button("widget").removeClass("ui-state-active").attr("ar
ia-pressed","false")}):this.type==="checkbox"&&(this.element.is(":checked")?this.buttonElement.addClass("ui-state-activ
e").attr("aria-pressed","true"):this.buttonElement.removeClass("ui-state-active").attr("aria-pressed","false"))},_reset
Button:function(){if(this.type==="input")this.options.label&&this.element.val(this.options.label);else{var t=this.butto
nElement.removeClass(a),n=e("<span></span>",this.element[0].ownerDocument).addClass("ui-button-text").html(this.options
.label).appendTo(t.empty()).text(),r=this.options.icons,i=r.primary&&r.secondary,s=[];r.primary||r.secondary?(this.opti
ons.text&&s.push("ui-button-text-icon"+(i?"s":r.primary?"-primary":"-secondary")),r.primary&&t.prepend("<span class='ui
-button-icon-primary ui-icon "+r.primary+"'></span>"),r.secondary&&t.append("<span class='ui-button-icon-secondary ui-i
con "+r.secondary+"'></span>"),this.options.text||(s.push(i?"ui-button-icons-only":"ui-button-icon-only"),this.hasTitle
||t.attr("title",n))):s.push("ui-button-text-only"),t.addClass(s.join(" "))}}}),e.widget("ui.buttonset",{options:{items
:":button, :submit, :reset, :checkbox, :radio, a, :data(button)"},_create:function(){this.element.addClass("ui-buttonse
t")},_init:function(){this.refresh()},_setOption:function(t,n){t==="disabled"&&this.buttons.button("option",t,n),e.Widg
et.prototype._setOption.apply(this,arguments)},refresh:function(){var t=this.element.css("direction")==="rtl";this.butt
ons=this.element.find(this.options.items).filter(":ui-button").button("refresh").end().not(":ui-button").button().end()
.map(function(){return e(this).button("widget")[0]}).removeClass("ui-corner-all ui-corner-left ui-corner-right").filter
(":first").addClass(t?"ui-corner-right":"ui-corner-left").end().filter(":last").addClass(t?"ui-corner-left":"ui-corner-
right").end().end()},destroy:function(){this.element.removeClass("ui-buttonset"),this.buttons.map(function(){return e(t
his).button("widget")[0]}).removeClass("ui-corner-left ui-corner-right").end().button("destroy"),e.Widget.prototype.des
troy.call(this)}})}(jQuery),function(e,t){var n="ui-dialog ui-widget ui-widget-content ui-corner-all ",r={buttons:!0,he
ight:!0,maxHeight:!0,maxWidth:!0,minHeight:!0,minWidth:!0,width:!0},i={maxHeight:!0,maxWidth:!0,minHeight:!0,minWidth:!
0},s=e.attrFn||{val:!0,css:!0,html:!0,text:!0,data:!0,width:!0,height:!0,offset:!0,click:!0};e.widget("ui.dialog",{opti
ons:{autoOpen:!0,buttons:{},closeOnEscape:!0,closeText:"close",dialogClass:"",draggable:!0,hide:null,height:"auto",maxH
eight:!1,maxWidth:!1,minHeight:150,minWidth:150,modal:!1,position:{my:"center",at:"center",collision:"fit",using:functi
on(t){var n=e(this).css(t).offset().top;n<0&&e(this).css("top",t.top-n)}},resizable:!0,show:null,stack:!0,title:"",widt
h:300,zIndex:1e3},_create:function(){this.originalTitle=this.element.attr("title"),typeof this.originalTitle!="string"&
&(this.originalTitle=""),this.options.title=this.options.title||this.originalTitle;var t=this,r=t.options,i=r.title||"&
#160;",s=e.ui.dialog.getTitleId(t.element),o=(t.uiDialog=e("<div></div>")).appendTo(document.body).hide().addClass(n+r.
dialogClass).css({zIndex:r.zIndex}).attr("tabIndex",-1).css("outline",0).keydown(function(n){r.closeOnEscape&&!n.isDefa
ultPrevented()&&n.keyCode&&n.keyCode===e.ui.keyCode.ESCAPE&&(t.close(n),n.preventDefault())}).attr({role:"dialog","aria
-labelledby":s}).mousedown(function(e){t.moveToTop(!1,e)}),u=t.element.show().removeAttr("title").addClass("ui-dialog-c
ontent ui-widget-content").appendTo(o),f=(t.uiDialogTitlebar=e("<div></div>")).addClass("ui-dialog-titlebar ui-widget-h
eader ui-corner-all ui-helper-clearfix").prependTo(o),l=e('<a href="#"></a>').addClass("ui-dialog-titlebar-close ui-cor
ner-all").attr("role","button").hover(function(){l.addClass("ui-state-hover")},function(){l.removeClass("ui-state-hover
")}).focus(function(){l.addClass("ui-state-focus")}).blur(function(){l.removeClass("ui-state-focus")}).click(function(e
){return t.close(e),!1}).appendTo(f),h=(t.uiDialogTitlebarCloseText=e("<span></span>")).addClass("ui-icon ui-icon-close
thick").text(r.closeText).appendTo(l),p=e("<span></span>").addClass("ui-dialog-title").attr("id",s).html(i).prependTo(f
);e.isFunction(r.beforeclose)&&!e.isFunction(r.beforeClose)&&(r.beforeClose=r.beforeclose),f.find("*").add(f).disableSe
lection(),r.draggable&&e.fn.draggable&&t._makeDraggable(),r.resizable&&e.fn.resizable&&t._makeResizable(),t._createButt
ons(r.buttons),t._isOpen=!1,e.fn.bgiframe&&o.bgiframe()},_init:function(){this.options.autoOpen&&this.open()},destroy:f
unction(){var e=this;return e.overlay&&e.overlay.destroy(),e.uiDialog.hide(),e.element.unbind(".dialog").removeData("di
alog").removeClass("ui-dialog-content ui-widget-content").hide().appendTo("body"),e.uiDialog.remove(),e.originalTitle&&
e.element.attr("title",e.originalTitle),e},widget:function(){return this.uiDialog},close:function(t){var n=this,r,i;if(
!1!==n._trigger("beforeClose",t))return n.overlay&&n.overlay.destroy(),n.uiDialog.unbind("keypress.ui-dialog"),n._isOpe
n=!1,n.options.hide?n.uiDialog.hide(n.options.hide,function(){n._trigger("close",t)}):(n.uiDialog.hide(),n._trigger("cl
ose",t)),e.ui.dialog.overlay.resize(),n.options.modal&&(r=0,e(".ui-dialog").each(function(){this!==n.uiDialog[0]&&(i=e(
this).css("z-index"),isNaN(i)||(r=Math.max(r,i)))}),e.ui.dialog.maxZ=r),n},isOpen:function(){return this._isOpen},moveT
oTop:function(t,n){var r=this,i=r.options,s;return i.modal&&!t||!i.stack&&!i.modal?r._trigger("focus",n):(i.zIndex>e.ui
.dialog.maxZ&&(e.ui.dialog.maxZ=i.zIndex),r.overlay&&(e.ui.dialog.maxZ+=1,r.overlay.$el.css("z-index",e.ui.dialog.overl
ay.maxZ=e.ui.dialog.maxZ)),s={scrollTop:r.element.scrollTop(),scrollLeft:r.element.scrollLeft()},e.ui.dialog.maxZ+=1,r.
uiDialog.css("z-index",e.ui.dialog.maxZ),r.element.attr(s),r._trigger("focus",n),r)},open:function(){if(!this._isOpen){
var t=this,n=t.options,r=t.uiDialog;return t.overlay=n.modal?new e.ui.dialog.overlay(t):null,t._size(),t._position(n.po
sition),r.show(n.show),t.moveToTop(!0),n.modal&&r.bind("keydown.ui-dialog",function(t){if(t.keyCode===e.ui.keyCode.TAB)
{var n=e(":tabbable",this),r=n.filter(":first"),i=n.filter(":last");if(t.target===i[0]&&!t.shiftKey)return r.focus(1),!
1;if(t.target===r[0]&&t.shiftKey)return i.focus(1),!1}}),e(t.element.find(":tabbable").get().concat(r.find(".ui-dialog-
buttonpane :tabbable").get().concat(r.get()))).eq(0).focus(),t._isOpen=!0,t._trigger("open"),t}},_createButtons:functio
n(t){var n=this,r=!1,i=e("<div></div>").addClass("ui-dialog-buttonpane ui-widget-content ui-helper-clearfix"),o=e("<div
></div>").addClass("ui-dialog-buttonset").appendTo(i);n.uiDialog.find(".ui-dialog-buttonpane").remove(),typeof t=="obje
ct"&&t!==null&&e.each(t,function(){return!(r=!0)}),r&&(e.each(t,function(t,r){r=e.isFunction(r)?{click:r,text:t}:r;var 
i=e('<button type="button"></button>').click(function(){r.click.apply(n.element[0],arguments)}).appendTo(o);e.each(r,fu
nction(e,t){e!=="click"&&(e in s?i[e](t):i.attr(e,t))}),e.fn.button&&i.button()}),i.appendTo(n.uiDialog))},_makeDraggab
le:function(){function t(e){return{position:e.position,offset:e.offset}}var n=this,r=n.options,i=e(document),s;n.uiDial
og.draggable({cancel:".ui-dialog-content, .ui-dialog-titlebar-close",handle:".ui-dialog-titlebar",containment:"document
",start:function(i,o){s=r.height==="auto"?"auto":e(this).height(),e(this).height(e(this).height()).addClass("ui-dialog-
dragging"),n._trigger("dragStart",i,t(o))},drag:function(e,r){n._trigger("drag",e,t(r))},stop:function(o,u){r.position=
[u.position.left-i.scrollLeft(),u.position.top-i.scrollTop()],e(this).removeClass("ui-dialog-dragging").height(s),n._tr
igger("dragStop",o,t(u)),e.ui.dialog.overlay.resize()}})},_makeResizable:function(n){function r(e){return{originalPosit
ion:e.originalPosition,originalSize:e.originalSize,position:e.position,size:e.size}}n=n===t?this.options.resizable:n;va
r i=this,s=i.options,o=i.uiDialog.css("position"),u=typeof n=="string"?n:"n,e,s,w,se,sw,ne,nw";i.uiDialog.resizable({ca
ncel:".ui-dialog-content",containment:"document",alsoResize:i.element,maxWidth:s.maxWidth,maxHeight:s.maxHeight,minWidt
h:s.minWidth,minHeight:i._minHeight(),handles:u,start:function(t,n){e(this).addClass("ui-dialog-resizing"),i._trigger("
resizeStart",t,r(n))},resize:function(e,t){i._trigger("resize",e,r(t))},stop:function(t,n){e(this).removeClass("ui-dial
og-resizing"),s.height=e(this).height(),s.width=e(this).width(),i._trigger("resizeStop",t,r(n)),e.ui.dialog.overlay.res
ize()}}).css("position",o).find(".ui-resizable-se").addClass("ui-icon ui-icon-grip-diagonal-se")},_minHeight:function()
{var e=this.options;return e.height==="auto"?e.minHeight:Math.min(e.minHeight,e.height)},_position:function(t){var n=[]
,r=[0,0],i;if(t){if(typeof t=="string"||typeof t=="object"&&"0"in t)n=t.split?t.split(" "):[t[0],t[1]],n.length===1&&(n
[1]=n[0]),e.each(["left","top"],function(e,t){+n[e]===n[e]&&(r[e]=n[e],n[e]=t)}),t={my:n.join(" "),at:n.join(" "),offse
t:r.join(" ")};t=e.extend({},e.ui.dialog.prototype.options.position,t)}else t=e.ui.dialog.prototype.options.position;i=
this.uiDialog.is(":visible"),i||this.uiDialog.show(),this.uiDialog.css({top:0,left:0}).position(e.extend({of:window},t)
),i||this.uiDialog.hide()},_setOptions:function(t){var n=this,s={},o=!1;e.each(t,function(e,t){n._setOption(e,t),e in r
&&(o=!0),e in i&&(s[e]=t)}),o&&this._size(),this.uiDialog.is(":data(resizable)")&&this.uiDialog.resizable("option",s)},
_setOption:function(t,r){var i=this,s=i.uiDialog;switch(t){case"beforeclose":t="beforeClose";break;case"buttons":i._cre
ateButtons(r);break;case"closeText":i.uiDialogTitlebarCloseText.text(""+r);break;case"dialogClass":s.removeClass(i.opti
ons.dialogClass).addClass(n+r);break;case"disabled":r?s.addClass("ui-dialog-disabled"):s.removeClass("ui-dialog-disable
d");break;case"draggable":var o=s.is(":data(draggable)");o&&!r&&s.draggable("destroy"),!o&&r&&i._makeDraggable();break;
case"position":i._position(r);break;case"resizable":var u=s.is(":data(resizable)");u&&!r&&s.resizable("destroy"),u&&typ
eof r=="string"&&s.resizable("option","handles",r),!u&&r!==!1&&i._makeResizable(r);break;case"title":e(".ui-dialog-titl
e",i.uiDialogTitlebar).html(""+(r||"&#160;"))}e.Widget.prototype._setOption.apply(i,arguments)},_size:function(){var t=
this.options,n,r,i=this.uiDialog.is(":visible");this.element.show().css({width:"auto",minHeight:0,height:0}),t.minWidth
>t.width&&(t.width=t.minWidth),n=this.uiDialog.css({height:"auto",width:t.width}).height(),r=Math.max(0,t.minHeight-n);
if(t.height==="auto")if(e.support.minHeight)this.element.css({minHeight:r,height:"auto"});else{this.uiDialog.show();var
 s=this.element.css("height","auto").height();i||this.uiDialog.hide(),this.element.height(Math.max(s,r))}else this.elem
ent.height(Math.max(t.height-n,0));this.uiDialog.is(":data(resizable)")&&this.uiDialog.resizable("option","minHeight",t
his._minHeight())}}),e.extend(e.ui.dialog,{version:"1.8.17",uuid:0,maxZ:0,getTitleId:function(e){var t=e.attr("id");ret
urn t||(this.uuid+=1,t=this.uuid),"ui-dialog-title-"+t},overlay:function(t){this.$el=e.ui.dialog.overlay.create(t)}}),e
.extend(e.ui.dialog.overlay,{instances:[],oldInstances:[],maxZ:0,events:e.map("focus,mousedown,mouseup,keydown,keypress
,click".split(","),function(e){return e+".dialog-overlay"}).join(" "),create:function(t){this.instances.length===0&&(se
tTimeout(function(){e.ui.dialog.overlay.instances.length&&e(document).bind(e.ui.dialog.overlay.events,function(t){if(e(
t.target).zIndex()<e.ui.dialog.overlay.maxZ)return!1})},1),e(document).bind("keydown.dialog-overlay",function(n){t.opti
ons.closeOnEscape&&!n.isDefaultPrevented()&&n.keyCode&&n.keyCode===e.ui.keyCode.ESCAPE&&(t.close(n),n.preventDefault())
}),e(window).bind("resize.dialog-overlay",e.ui.dialog.overlay.resize));var n=(this.oldInstances.pop()||e("<div></div>")
.addClass("ui-widget-overlay")).appendTo(document.body).css({width:this.width(),height:this.height()});return e.fn.bgif
rame&&n.bgiframe(),this.instances.push(n),n},destroy:function(t){var n=e.inArray(t,this.instances);n!=-1&&this.oldInsta
nces.push(this.instances.splice(n,1)[0]),this.instances.length===0&&e([document,window]).unbind(".dialog-overlay"),t.re
move();var r=0;e.each(this.instances,function(){r=Math.max(r,this.css("z-index"))}),this.maxZ=r},height:function(){var 
t,n;return e.browser.msie&&e.browser.version<7?(t=Math.max(document.documentElement.scrollHeight,document.body.scrollHe
ight),n=Math.max(document.documentElement.offsetHeight,document.body.offsetHeight),t<n?e(window).height()+"px":t+"px"):
e(document).height()+"px"},width:function(){var t,n;return e.browser.msie?(t=Math.max(document.documentElement.scrollWi
dth,document.body.scrollWidth),n=Math.max(document.documentElement.offsetWidth,document.body.offsetWidth),t<n?e(window)
.width()+"px":t+"px"):e(document).width()+"px"},resize:function(){var t=e([]);e.each(e.ui.dialog.overlay.instances,func
tion(){t=t.add(this)}),t.css({width:0,height:0}).css({width:e.ui.dialog.overlay.width(),height:e.ui.dialog.overlay.heig
ht()})}}),e.extend(e.ui.dialog.overlay.prototype,{destroy:function(){e.ui.dialog.overlay.destroy(this.$el)}})}(jQuery),
function(e,t){var n=5;e.widget("ui.slider",e.ui.mouse,{widgetEventPrefix:"slide",options:{animate:!1,distance:0,max:100
,min:0,orientation:"horizontal",range:!1,step:1,value:0,values:null},_create:function(){var t=this,r=this.options,i=thi
s.element.find(".ui-slider-handle").addClass("ui-state-default ui-corner-all"),s="<a class='ui-slider-handle ui-state-d
efault ui-corner-all' href='#'></a>",o=r.values&&r.values.length||1,u=[];this._keySliding=!1,this._mouseSliding=!1,this
._animateOff=!0,this._handleIndex=null,this._detectOrientation(),this._mouseInit(),this.element.addClass("ui-slider ui-
slider-"+this.orientation+" ui-widget"+" ui-widget-content"+" ui-corner-all"+(r.disabled?" ui-slider-disabled ui-disabl
ed":"")),this.range=e([]),r.range&&(r.range===!0&&(r.values||(r.values=[this._valueMin(),this._valueMin()]),r.values.le
ngth&&r.values.length!==2&&(r.values=[r.values[0],r.values[0]])),this.range=e("<div></div>").appendTo(this.element).add
Class("ui-slider-range ui-widget-header"+(r.range==="min"||r.range==="max"?" ui-slider-range-"+r.range:"")));for(var f=
i.length;f<o;f+=1)u.push(s);this.handles=i.add(e(u.join("")).appendTo(t.element)),this.handle=this.handles.eq(0),this.h
andles.add(this.range).filter("a").click(function(e){e.preventDefault()}).hover(function(){r.disabled||e(this).addClass
("ui-state-hover")},function(){e(this).removeClass("ui-state-hover")}).focus(function(){r.disabled?e(this).blur():(e(".
ui-slider .ui-state-focus").removeClass("ui-state-focus"),e(this).addClass("ui-state-focus"))}).blur(function(){e(this)
.removeClass("ui-state-focus")}),this.handles.each(function(t){e(this).data("index.ui-slider-handle",t)}),this.handles.
keydown(function(r){var i=!0,s=e(this).data("index.ui-slider-handle"),o,u,f,l;if(!t.options.disabled){switch(r.keyCode)
{case e.ui.keyCode.HOME:case e.ui.keyCode.END:case e.ui.keyCode.PAGE_UP:case e.ui.keyCode.PAGE_DOWN:case e.ui.keyCode.U
P:case e.ui.keyCode.RIGHT:case e.ui.keyCode.DOWN:case e.ui.keyCode.LEFT:i=!1;if(!t._keySliding){t._keySliding=!0,e(this
).addClass("ui-state-active"),o=t._start(r,s);if(o===!1)return}}l=t.options.step,t.options.values&&t.options.values.len
gth?u=f=t.values(s):u=f=t.value();switch(r.keyCode){case e.ui.keyCode.HOME:f=t._valueMin();break;case e.ui.keyCode.END:
f=t._valueMax();break;case e.ui.keyCode.PAGE_UP:f=t._trimAlignValue(u+(t._valueMax()-t._valueMin())/n);break;case e.ui.
keyCode.PAGE_DOWN:f=t._trimAlignValue(u-(t._valueMax()-t._valueMin())/n);break;case e.ui.keyCode.UP:case e.ui.keyCode.R
IGHT:if(u===t._valueMax())return;f=t._trimAlignValue(u+l);break;case e.ui.keyCode.DOWN:case e.ui.keyCode.LEFT:if(u===t.
_valueMin())return;f=t._trimAlignValue(u-l)}return t._slide(r,s,f),i}}).keyup(function(n){var r=e(this).data("index.ui-
slider-handle");t._keySliding&&(t._keySliding=!1,t._stop(n,r),t._change(n,r),e(this).removeClass("ui-state-active"))}),
this._refreshValue(),this._animateOff=!1},destroy:function(){return this.handles.remove(),this.range.remove(),this.elem
ent.removeClass("ui-slider ui-slider-horizontal ui-slider-vertical ui-slider-disabled ui-widget ui-widget-content ui-co
rner-all").removeData("slider").unbind(".slider"),this._mouseDestroy(),this},_mouseCapture:function(t){var n=this.optio
ns,r,i,s,o,u,f,l,c,h;return n.disabled?!1:(this.elementSize={width:this.element.outerWidth(),height:this.element.outerH
eight()},this.elementOffset=this.element.offset(),r={x:t.pageX,y:t.pageY},i=this._normValueFromMouse(r),s=this._valueMa
x()-this._valueMin()+1,u=this,this.handles.each(function(t){var n=Math.abs(i-u.values(t));s>n&&(s=n,o=e(this),f=t)}),n.
range===!0&&this.values(1)===n.min&&(f+=1,o=e(this.handles[f])),l=this._start(t,f),l===!1?!1:(this._mouseSliding=!0,u._
handleIndex=f,o.addClass("ui-state-active").focus(),c=o.offset(),h=!e(t.target).parents().andSelf().is(".ui-slider-hand
le"),this._clickOffset=h?{left:0,top:0}:{left:t.pageX-c.left-o.width()/2,top:t.pageY-c.top-o.height()/2-(parseInt(o.css
("borderTopWidth"),10)||0)-(parseInt(o.css("borderBottomWidth"),10)||0)+(parseInt(o.css("marginTop"),10)||0)},this.hand
les.hasClass("ui-state-hover")||this._slide(t,f,i),this._animateOff=!0,!0))},_mouseStart:function(e){return!0},_mouseDr
ag:function(e){var t={x:e.pageX,y:e.pageY},n=this._normValueFromMouse(t);return this._slide(e,this._handleIndex,n),!1},
_mouseStop:function(e){return this.handles.removeClass("ui-state-active"),this._mouseSliding=!1,this._stop(e,this._hand
leIndex),this._change(e,this._handleIndex),this._handleIndex=null,this._clickOffset=null,this._animateOff=!1,!1},_detec
tOrientation:function(){this.orientation=this.options.orientation==="vertical"?"vertical":"horizontal"},_normValueFromM
ouse:function(e){var t,n,r,i,s;return this.orientation==="horizontal"?(t=this.elementSize.width,n=e.x-this.elementOffse
t.left-(this._clickOffset?this._clickOffset.left:0)):(t=this.elementSize.height,n=e.y-this.elementOffset.top-(this._cli
ckOffset?this._clickOffset.top:0)),r=n/t,r>1&&(r=1),r<0&&(r=0),this.orientation==="vertical"&&(r=1-r),i=this._valueMax(
)-this._valueMin(),s=this._valueMin()+r*i,this._trimAlignValue(s)},_start:function(e,t){var n={handle:this.handles[t],v
alue:this.value()};return this.options.values&&this.options.values.length&&(n.value=this.values(t),n.values=this.values
()),this._trigger("start",e,n)},_slide:function(e,t,n){var r,i,s;this.options.values&&this.options.values.length?(r=thi
s.values(t?0:1),this.options.values.length===2&&this.options.range===!0&&(t===0&&n>r||t===1&&n<r)&&(n=r),n!==this.value
s(t)&&(i=this.values(),i[t]=n,s=this._trigger("slide",e,{handle:this.handles[t],value:n,values:i}),r=this.values(t?0:1)
,s!==!1&&this.values(t,n,!0))):n!==this.value()&&(s=this._trigger("slide",e,{handle:this.handles[t],value:n}),s!==!1&&t
his.value(n))},_stop:function(e,t){var n={handle:this.handles[t],value:this.value()};this.options.values&&this.options.
values.length&&(n.value=this.values(t),n.values=this.values()),this._trigger("stop",e,n)},_change:function(e,t){if(!thi
s._keySliding&&!this._mouseSliding){var n={handle:this.handles[t],value:this.value()};this.options.values&&this.options
.values.length&&(n.value=this.values(t),n.values=this.values()),this._trigger("change",e,n)}},value:function(e){if(!arg
uments.length)return this._value();this.options.value=this._trimAlignValue(e),this._refreshValue(),this._change(null,0)
},values:function(t,n){var r,i,s;if(arguments.length>1)this.options.values[t]=this._trimAlignValue(n),this._refreshValu
e(),this._change(null,t);else{if(!arguments.length)return this._values();if(!e.isArray(arguments[0]))return this.option
s.values&&this.options.values.length?this._values(t):this.value();r=this.options.values,i=arguments[0];for(s=0;s<r.leng
th;s+=1)r[s]=this._trimAlignValue(i[s]),this._change(null,s);this._refreshValue()}},_setOption:function(t,n){var r,i=0;
e.isArray(this.options.values)&&(i=this.options.values.length),e.Widget.prototype._setOption.apply(this,arguments);swit
ch(t){case"disabled":n?(this.handles.filter(".ui-state-focus").blur(),this.handles.removeClass("ui-state-hover"),this.h
andles.propAttr("disabled",!0),this.element.addClass("ui-disabled")):(this.handles.propAttr("disabled",!1),this.element
.removeClass("ui-disabled"));break;case"orientation":this._detectOrientation(),this.element.removeClass("ui-slider-hori
zontal ui-slider-vertical").addClass("ui-slider-"+this.orientation),this._refreshValue();break;case"value":this._animat
eOff=!0,this._refreshValue(),this._change(null,0),this._animateOff=!1;break;case"values":this._animateOff=!0,this._refr
eshValue();for(r=0;r<i;r+=1)this._change(null,r);this._animateOff=!1}},_value:function(){var e=this.options.value;retur
n e=this._trimAlignValue(e),e},_values:function(e){var t,n,r;if(arguments.length)return t=this.options.values[e],t=this
._trimAlignValue(t),t;n=this.options.values.slice();for(r=0;r<n.length;r+=1)n[r]=this._trimAlignValue(n[r]);return n},_
trimAlignValue:function(e){if(e<=this._valueMin())return this._valueMin();if(e>=this._valueMax())return this._valueMax(
);var t=this.options.step>0?this.options.step:1,n=(e-this._valueMin())%t,r=e-n;return Math.abs(n)*2>=t&&(r+=n>0?t:-t),p
arseFloat(r.toFixed(5))},_valueMin:function(){return this.options.min},_valueMax:function(){return this.options.max},_r
efreshValue:function(){var t=this.options.range,n=this.options,r=this,i=this._animateOff?!1:n.animate,s,o={},u,f,l,c;th
is.options.values&&this.options.values.length?this.handles.each(function(t,f){s=(r.values(t)-r._valueMin())/(r._valueMa
x()-r._valueMin())*100,o[r.orientation==="horizontal"?"left":"bottom"]=s+"%",e(this).stop(1,1)[i?"animate":"css"](o,n.a
nimate),r.options.range===!0&&(r.orientation==="horizontal"?(t===0&&r.range.stop(1,1)[i?"animate":"css"]({left:s+"%"},n
.animate),t===1&&r.range[i?"animate":"css"]({width:s-u+"%"},{queue:!1,duration:n.animate})):(t===0&&r.range.stop(1,1)[i
?"animate":"css"]({bottom:s+"%"},n.animate),t===1&&r.range[i?"animate":"css"]({height:s-u+"%"},{queue:!1,duration:n.ani
mate}))),u=s}):(f=this.value(),l=this._valueMin(),c=this._valueMax(),s=c!==l?(f-l)/(c-l)*100:0,o[r.orientation==="horiz
ontal"?"left":"bottom"]=s+"%",this.handle.stop(1,1)[i?"animate":"css"](o,n.animate),t==="min"&&this.orientation==="hori
zontal"&&this.range.stop(1,1)[i?"animate":"css"]({width:s+"%"},n.animate),t==="max"&&this.orientation==="horizontal"&&t
his.range[i?"animate":"css"]({width:100-s+"%"},{queue:!1,duration:n.animate}),t==="min"&&this.orientation==="vertical"&
&this.range.stop(1,1)[i?"animate":"css"]({height:s+"%"},n.animate),t==="max"&&this.orientation==="vertical"&&this.range
[i?"animate":"css"]({height:100-s+"%"},{queue:!1,duration:n.animate}))}}),e.extend(e.ui.slider,{version:"1.8.17"})}(jQu
ery),function(e,n){function r(){return++o}function i(){return++s}var s=0,o=0;e.widget("ui.tabs",{options:{add:null,ajax
Options:null,cache:!1,cookie:null,collapsible:!1,disable:null,disabled:[],enable:null,event:"click",fx:null,idPrefix:"u
i-tabs-",load:null,panelTemplate:"<div></div>",remove:null,select:null,show:null,spinner:"<em>Loading&#8230;</em>",tabT
emplate:"<li><a href='#{href}'><span>#{label}</span></a></li>"},_create:function(){this._tabify(!0)},_setOption:functio
n(e,t){if(e=="selected"){if(this.options.collapsible&&t==this.options.selected)return;this.select(t)}else this.options[
e]=t,this._tabify()},_tabId:function(e){return e.title&&e.title.replace(/\s/g,"_").replace(/[^\w\u00c0-\uFFFF-]/g,"")||
this.options.idPrefix+i()},_sanitizeSelector:function(e){return e.replace(/:/g,"\\:")},_cookie:function(){var t=this.co
okie||(this.cookie=this.options.cookie.name||"ui-tabs-"+r());return e.cookie.apply(null,[t].concat(e.makeArray(argument
s)))},_ui:function(e,t){return{tab:e,panel:t,index:this.anchors.index(e)}},_cleanup:function(){this.lis.filter(".ui-sta
te-processing").removeClass("ui-state-processing").find("span:data(label.tabs)").each(function(){var t=e(this);t.html(t
.data("label.tabs")).removeData("label.tabs")})},_tabify:function(t){function r(t,n){t.css("display",""),!e.support.opa
city&&n.opacity&&t[0].style.removeAttribute("filter")}var i=this,s=this.options,o=/^#.+/;this.list=this.element.find("o
l,ul").eq(0),this.lis=e(" > li:has(a[href])",this.list),this.anchors=this.lis.map(function(){return e("a",this)[0]}),th
is.panels=e([]),this.anchors.each(function(t,n){var r=e(n).attr("href"),u=r.split("#")[0],f;u&&(u===location.toString()
.split("#")[0]||(f=e("base")[0])&&u===f.href)&&(r=n.hash,n.href=r);if(o.test(r))i.panels=i.panels.add(i.element.find(i.
_sanitizeSelector(r)));else if(r&&r!=="#"){e.data(n,"href.tabs",r),e.data(n,"load.tabs",r.replace(/#.*$/,""));var l=i._
tabId(n);n.href="#"+l;var c=i.element.find("#"+l);c.length||(c=e(s.panelTemplate).attr("id",l).addClass("ui-tabs-panel 
ui-widget-content ui-corner-bottom").insertAfter(i.panels[t-1]||i.list),c.data("destroy.tabs",!0)),i.panels=i.panels.ad
d(c)}else s.disabled.push(t)}),t?(this.element.addClass("ui-tabs ui-widget ui-widget-content ui-corner-all"),this.list.
addClass("ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all"),this.lis.addClass("ui-state-d
efault ui-corner-top"),this.panels.addClass("ui-tabs-panel ui-widget-content ui-corner-bottom"),s.selected===n?(locatio
n.hash&&this.anchors.each(function(e,t){if(t
.hash==location.hash)return s.selected=e,!1}),typeof s.selected!="number"&&s.cookie&&(s.selected=parseInt(i._cookie(),1
0)),typeof s.selected!="number"&&this.lis.filter(".ui-tabs-selected").length&&(s.selected=this.lis.index(this.lis.filte
r(".ui-tabs-selected"))),s.selected=s.selected||(this.lis.length?0:-1)):s.selected===null&&(s.selected=-1),s.selected=s
.selected>=0&&this.anchors[s.selected]||s.selected<0?s.selected:0,s.disabled=e.unique(s.disabled.concat(e.map(this.lis.
filter(".ui-state-disabled"),function(e,t){return i.lis.index(e)}))).sort(),e.inArray(s.selected,s.disabled)!=-1&&s.dis
abled.splice(e.inArray(s.selected,s.disabled),1),this.panels.addClass("ui-tabs-hide"),this.lis.removeClass("ui-tabs-sel
ected ui-state-active"),s.selected>=0&&this.anchors.length&&(i.element.find(i._sanitizeSelector(i.anchors[s.selected].h
ash)).removeClass("ui-tabs-hide"),this.lis.eq(s.selected).addClass("ui-tabs-selected ui-state-active"),i.element.queue(
"tabs",function(){i._trigger("show",null,i._ui(i.anchors[s.selected],i.element.find(i._sanitizeSelector(i.anchors[s.sel
ected].hash))[0]))}),this.load(s.selected)),e(window).bind("unload",function(){i.lis.add(i.anchors).unbind(".tabs"),i.l
is=i.anchors=i.panels=null})):s.selected=this.lis.index(this.lis.filter(".ui-tabs-selected")),this.element[s.collapsibl
e?"addClass":"removeClass"]("ui-tabs-collapsible"),s.cookie&&this._cookie(s.selected,s.cookie);for(var u=0,f;f=this.lis
[u];u++)e(f)[e.inArray(u,s.disabled)!=-1&&!e(f).hasClass("ui-tabs-selected")?"addClass":"removeClass"]("ui-state-disabl
ed");s.cache===!1&&this.anchors.removeData("cache.tabs"),this.lis.add(this.anchors).unbind(".tabs");if(s.event!=="mouse
over"){var l=function(e,t){t.is(":not(.ui-state-disabled)")&&t.addClass("ui-state-"+e)},c=function(e,t){t.removeClass("
ui-state-"+e)};this.lis.bind("mouseover.tabs",function(){l("hover",e(this))}),this.lis.bind("mouseout.tabs",function(){
c("hover",e(this))}),this.anchors.bind("focus.tabs",function(){l("focus",e(this).closest("li"))}),this.anchors.bind("bl
ur.tabs",function(){c("focus",e(this).closest("li"))})}var h,p;s.fx&&(e.isArray(s.fx)?(h=s.fx[0],p=s.fx[1]):h=p=s.fx);v
ar d=p?function(t,n){e(t).closest("li").addClass("ui-tabs-selected ui-state-active"),n.hide().removeClass("ui-tabs-hide
").animate(p,p.duration||"normal",function(){r(n,p),i._trigger("show",null,i._ui(t,n[0]))})}:function(t,n){e(t).closest
("li").addClass("ui-tabs-selected ui-state-active"),n.removeClass("ui-tabs-hide"),i._trigger("show",null,i._ui(t,n[0]))
},v=h?function(e,t){t.animate(h,h.duration||"normal",function(){i.lis.removeClass("ui-tabs-selected ui-state-active"),t
.addClass("ui-tabs-hide"),r(t,h),i.element.dequeue("tabs")})}:function(e,t,n){i.lis.removeClass("ui-tabs-selected ui-st
ate-active"),t.addClass("ui-tabs-hide"),i.element.dequeue("tabs")};this.anchors.bind(s.event+".tabs",function(){var t=t
his,n=e(t).closest("li"),r=i.panels.filter(":not(.ui-tabs-hide)"),o=i.element.find(i._sanitizeSelector(t.hash));if(n.ha
sClass("ui-tabs-selected")&&!s.collapsible||n.hasClass("ui-state-disabled")||n.hasClass("ui-state-processing")||i.panel
s.filter(":animated").length||i._trigger("select",null,i._ui(this,o[0]))===!1)return this.blur(),!1;s.selected=i.anchor
s.index(this),i.abort();if(s.collapsible){if(n.hasClass("ui-tabs-selected"))return s.selected=-1,s.cookie&&i._cookie(s.
selected,s.cookie),i.element.queue("tabs",function(){v(t,r)}).dequeue("tabs"),this.blur(),!1;if(!r.length)return s.cook
ie&&i._cookie(s.selected,s.cookie),i.element.queue("tabs",function(){d(t,o)}),i.load(i.anchors.index(this)),this.blur()
,!1}s.cookie&&i._cookie(s.selected,s.cookie);if(!o.length)throw"jQuery UI Tabs: Mismatching fragment identifier.";r.len
gth&&i.element.queue("tabs",function(){v(t,r)}),i.element.queue("tabs",function(){d(t,o)}),i.load(i.anchors.index(this)
),e.browser.msie&&this.blur()}),this.anchors.bind("click.tabs",function(){return!1})},_getIndex:function(e){return type
of e=="string"&&(e=this.anchors.index(this.anchors.filter("[href$="+e+"]"))),e},destroy:function(){var t=this.options;r
eturn this.abort(),this.element.unbind(".tabs").removeClass("ui-tabs ui-widget ui-widget-content ui-corner-all ui-tabs-
collapsible").removeData("tabs"),this.list.removeClass("ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header
 ui-corner-all"),this.anchors.each(function(){var t=e.data(this,"href.tabs");t&&(this.href=t);var n=e(this).unbind(".ta
bs");e.each(["href","load","cache"],function(e,t){n.removeData(t+".tabs")})}),this.lis.unbind(".tabs").add(this.panels)
.each(function(){e.data(this,"destroy.tabs")?e(this).remove():e(this).removeClass(["ui-state-default","ui-corner-top","
ui-tabs-selected","ui-state-active","ui-state-hover","ui-state-focus","ui-state-disabled","ui-tabs-panel","ui-widget-co
ntent","ui-corner-bottom","ui-tabs-hide"].join(" "))}),t.cookie&&this._cookie(null,t.cookie),this},add:function(t,r,i){
i===n&&(i=this.anchors.length);var s=this,o=this.options,u=e(o.tabTemplate.replace(/#\{href\}/g,t).replace(/#\{label\}/
g,r)),f=t.indexOf("#")?this._tabId(e("a",u)[0]):t.replace("#","");u.addClass("ui-state-default ui-corner-top").data("de
stroy.tabs",!0);var l=s.element.find("#"+f);return l.length||(l=e(o.panelTemplate).attr("id",f).data("destroy.tabs",!0)
),l.addClass("ui-tabs-panel ui-widget-content ui-corner-bottom ui-tabs-hide"),i>=this.lis.length?(u.appendTo(this.list)
,l.appendTo(this.list[0].parentNode)):(u.insertBefore(this.lis[i]),l.insertBefore(this.panels[i])),o.disabled=e.map(o.d
isabled,function(e,t){return e>=i?++e:e}),this._tabify(),this.anchors.length==1&&(o.selected=0,u.addClass("ui-tabs-sele
cted ui-state-active"),l.removeClass("ui-tabs-hide"),this.element.queue("tabs",function(){s._trigger("show",null,s._ui(
s.anchors[0],s.panels[0]))}),this.load(0)),this._trigger("add",null,this._ui(this.anchors[i],this.panels[i])),this},rem
ove:function(t){t=this._getIndex(t);var n=this.options,r=this.lis.eq(t).remove(),i=this.panels.eq(t).remove();return r.
hasClass("ui-tabs-selected")&&this.anchors.length>1&&this.select(t+(t+1<this.anchors.length?1:-1)),n.disabled=e.map(e.g
rep(n.disabled,function(e,n){return e!=t}),function(e,n){return e>=t?--e:e}),this._tabify(),this._trigger("remove",null
,this._ui(r.find("a")[0],i[0])),this},enable:function(t){t=this._getIndex(t);var n=this.options;if(e.inArray(t,n.disabl
ed)!=-1)return this.lis.eq(t).removeClass("ui-state-disabled"),n.disabled=e.grep(n.disabled,function(e,n){return e!=t})
,this._trigger("enable",null,this._ui(this.anchors[t],this.panels[t])),this},disable:function(e){e=this._getIndex(e);va
r t=this,n=this.options;return e!=n.selected&&(this.lis.eq(e).addClass("ui-state-disabled"),n.disabled.push(e),n.disabl
ed.sort(),this._trigger("disable",null,this._ui(this.anchors[e],this.panels[e]))),this},select:function(e){e=this._getI
ndex(e);if(e==-1){if(!this.options.collapsible||this.options.selected==-1)return this;e=this.options.selected}return th
is.anchors.eq(e).trigger(this.options.event+".tabs"),this},load:function(t){t=this._getIndex(t);var n=this,r=this.optio
ns,i=this.anchors.eq(t)[0],s=e.data(i,"load.tabs");this.abort();if(!(!s||this.element.queue("tabs").length!==0&&e.data(
i,"cache.tabs"))){this.lis.eq(t).addClass("ui-state-processing");if(r.spinner){var o=e("span",i);o.data("label.tabs",o.
html()).html(r.spinner)}return this.xhr=e.ajax(e.extend({},r.ajaxOptions,{url:s,success:function(s,o){n.element.find(n.
_sanitizeSelector(i.hash)).html(s),n._cleanup(),r.cache&&e.data(i,"cache.tabs",!0),n._trigger("load",null,n._ui(n.ancho
rs[t],n.panels[t]));try{r.ajaxOptions.success(s,o)}catch(u){}},error:function(e,s,o){n._cleanup(),n._trigger("load",nul
l,n._ui(n.anchors[t],n.panels[t]));try{r.ajaxOptions.error(e,s,t,i)}catch(o){}}})),n.element.dequeue("tabs"),this}this.
element.dequeue("tabs")},abort:function(){return this.element.queue([]),this.panels.stop(!1,!0),this.element.queue("tab
s",this.element.queue("tabs").splice(-2,2)),this.xhr&&(this.xhr.abort(),delete this.xhr),this._cleanup(),this},url:func
tion(e,t){return this.anchors.eq(e).removeData("cache.tabs").data("load.tabs",t),this},length:function(){return this.an
chors.length}}),e.extend(e.ui.tabs,{version:"1.8.17"}),e.extend(e.ui.tabs.prototype,{rotation:null,rotate:function(e,n)
{var r=this,i=this.options,s=r._rotate||(r._rotate=function(t){clearTimeout(r.rotation),r.rotation=setTimeout(function(
){var e=i.selected;r.select(++e<r.anchors.length?e:0)},e),t&&t.stopPropagation()}),o=r._unrotate||(r._unrotate=n?functi
on(e){t=i.selected,s()}:function(e){e.clientX&&r.rotate(null)});return e?(this.element.bind("tabsshow",s),this.anchors.
bind(i.event+".tabs",o),s()):(clearTimeout(r.rotation),this.element.unbind("tabsshow",s),this.anchors.unbind(i.event+".
tabs",o),delete this._rotate,delete this._unrotate),this}})}(jQuery),function($,undefined){function isArray(e){return e
&&($.browser.safari&&typeof e=="object"&&e.length||e.constructor&&e.constructor.toString().match(/\Array\(\)/))}functio
n extendRemove(e,t){$.extend(e,t);for(var n in t)if(t[n]==null||t[n]==undefined)e[n]=t[n];return e}function bindHover(e
){var t="button, .ui-datepicker-prev, .ui-datepicker-next, .ui-datepicker-calendar td a";return e.bind("mouseout",funct
ion(e){var n=$(e.target).closest(t);!n.length||n.removeClass("ui-state-hover ui-datepicker-prev-hover ui-datepicker-nex
t-hover")}).bind("mouseover",function(n){var r=$(n.target).closest(t);!$.datepicker._isDisabledDatepicker(instActive.in
line?e.parent()[0]:instActive.input[0])&&!!r.length&&(r.parents(".ui-datepicker-calendar").find("a").removeClass("ui-st
ate-hover"),r.addClass("ui-state-hover"),r.hasClass("ui-datepicker-prev")&&r.addClass("ui-datepicker-prev-hover"),r.has
Class("ui-datepicker-next")&&r.addClass("ui-datepicker-next-hover"))})}function Datepicker(){this.debug=!1,this._curIns
t=null,this._keyEvent=!1,this._disabledInputs=[],this._datepickerShowing=!1,this._inDialog=!1,this._mainDivId="ui-datep
icker-div",this._inlineClass="ui-datepicker-inline",this._appendClass="ui-datepicker-append",this._triggerClass="ui-dat
epicker-trigger",this._dialogClass="ui-datepicker-dialog",this._disableClass="ui-datepicker-disabled",this._unselectabl
eClass="ui-datepicker-unselectable",this._currentClass="ui-datepicker-current-day",this._dayOverClass="ui-datepicker-da
ys-cell-over",this.regional=[],this.regional[""]={closeText:"Done",prevText:"Prev",nextText:"Next",currentText:"Today",
monthNames:["January","February","March","April","May","June","July","August","September","October","November","Decembe
r"],monthNamesShort:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],dayNames:["Sunday","Monda
y","Tuesday","Wednesday","Thursday","Friday","Saturday"],dayNamesShort:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],dayN
amesMin:["Su","Mo","Tu","We","Th","Fr","Sa"],weekHeader:"Wk",dateFormat:"mm/dd/yy",firstDay:0,isRTL:!1,showMonthAfterYe
ar:!1,yearSuffix:""},this._defaults={showOn:"focus",showAnim:"fadeIn",showOptions:{},defaultDate:null,appendText:"",but
tonText:"...",buttonImage:"",buttonImageOnly:!1,hideIfNoPrevNext:!1,navigationAsDateFormat:!1,gotoCurrent:!1,changeMont
h:!1,changeYear:!1,yearRange:"c-10:c+10",showOtherMonths:!1,selectOtherMonths:!1,showWeek:!1,calculateWeek:this.iso8601
Week,shortYearCutoff:"+10",minDate:null,maxDate:null,duration:"fast",beforeShowDay:null,beforeShow:null,onSelect:null,o
nChangeMonthYear:null,onClose:null,numberOfMonths:1,showCurrentAtPos:0,stepMonths:1,stepBigMonths:12,altField:"",altFor
mat:"",constrainInput:!0,showButtonPanel:!1,autoSize:!1,disabled:!1},$.extend(this._defaults,this.regional[""]),this.dp
Div=bindHover($('<div id="'+this._mainDivId+'" class="ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-c
orner-all"></div>'))}$.extend($.ui,{datepicker:{version:"1.8.17"}});var PROP_NAME="datepicker",dpuuid=(new Date).getTim
e(),instActive;$.extend(Datepicker.prototype,{markerClassName:"hasDatepicker",maxRows:4,log:function(){this.debug&&cons
ole.log.apply("",arguments)},_widgetDatepicker:function(){return this.dpDiv},setDefaults:function(e){return extendRemov
e(this._defaults,e||{}),this},_attachDatepicker:function(target,settings){var inlineSettings=null;for(var attrName in t
his._defaults){var attrValue=target.getAttribute("date:"+attrName);if(attrValue){inlineSettings=inlineSettings||{};try{
inlineSettings[attrName]=eval(attrValue)}catch(err){inlineSettings[attrName]=attrValue}}}var nodeName=target.nodeName.t
oLowerCase(),inline=nodeName=="div"||nodeName=="span";target.id||(this.uuid+=1,target.id="dp"+this.uuid);var inst=this.
_newInst($(target),inline);inst.settings=$.extend({},settings||{},inlineSettings||{}),nodeName=="input"?this._connectDa
tepicker(target,inst):inline&&this._inlineDatepicker(target,inst)},_newInst:function(e,t){var n=e[0].id.replace(/([^A-Z
a-z0-9_-])/g,"\\\\$1");return{id:n,input:e,selectedDay:0,selectedMonth:0,selectedYear:0,drawMonth:0,drawYear:0,inline:t
,dpDiv:t?bindHover($('<div class="'+this._inlineClass+' ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui
-corner-all"></div>')):this.dpDiv}},_connectDatepicker:function(e,t){var n=$(e);t.append=$([]),t.trigger=$([]),n.hasCla
ss(this.markerClassName)||(this._attachments(n,t),n.addClass(this.markerClassName).keydown(this._doKeyDown).keypress(th
is._doKeyPress).keyup(this._doKeyUp).bind("setData.datepicker",function(e,n,r){t.settings[n]=r}).bind("getData.datepick
er",function(e,n){return this._get(t,n)}),this._autoSize(t),$.data(e,PROP_NAME,t),t.settings.disabled&&this._disableDat
epicker(e))},_attachments:function(e,t){var n=this._get(t,"appendText"),r=this._get(t,"isRTL");t.append&&t.append.remov
e(),n&&(t.append=$('<span class="'+this._appendClass+'">'+n+"</span>"),e[r?"before":"after"](t.append)),e.unbind("focus
",this._showDatepicker),t.trigger&&t.trigger.remove();var i=this._get(t,"showOn");(i=="focus"||i=="both")&&e.focus(this
._showDatepicker);if(i=="button"||i=="both"){var s=this._get(t,"buttonText"),o=this._get(t,"buttonImage");t.trigger=$(t
his._get(t,"buttonImageOnly")?$("<img/>").addClass(this._triggerClass).attr({src:o,alt:s,title:s}):$('<button type="but
ton"></button>').addClass(this._triggerClass).html(o==""?s:$("<img/>").attr({src:o,alt:s,title:s}))),e[r?"before":"afte
r"](t.trigger),t.trigger.click(function(){return $.datepicker._datepickerShowing&&$.datepicker._lastInput==e[0]?$.datep
icker._hideDatepicker():$.datepicker._showDatepicker(e[0]),!1})}},_autoSize:function(e){if(this._get(e,"autoSize")&&!e.
inline){var t=new Date(2009,11,20),n=this._get(e,"dateFormat");if(n.match(/[DM]/)){var r=function(e){var t=0,n=0;for(va
r r=0;r<e.length;r++)e[r].length>t&&(t=e[r].length,n=r);return n};t.setMonth(r(this._get(e,n.match(/MM/)?"monthNames":"
monthNamesShort"))),t.setDate(r(this._get(e,n.match(/DD/)?"dayNames":"dayNamesShort"))+20-t.getDay())}e.input.attr("siz
e",this._formatDate(e,t).length)}},_inlineDatepicker:function(e,t){var n=$(e);n.hasClass(this.markerClassName)||(n.addC
lass(this.markerClassName).append(t.dpDiv).bind("setData.datepicker",function(e,n,r){t.settings[n]=r}).bind("getData.da
tepicker",function(e,n){return this._get(t,n)}),$.data(e,PROP_NAME,t),this._setDate(t,this._getDefaultDate(t),!0),this.
_updateDatepicker(t),this._updateAlternate(t),t.settings.disabled&&this._disableDatepicker(e),t.dpDiv.css("display","bl
ock"))},_dialogDatepicker:function(e,t,n,r,i){var s=this._dialogInst;if(!s){this.uuid+=1;var o="dp"+this.uuid;this._dia
logInput=$('<input type="text" id="'+o+'" style="position: absolute; top: -100px; width: 0px; z-index: -10;"/>'),this._
dialogInput.keydown(this._doKeyDown),$("body").append(this._dialogInput),s=this._dialogInst=this._newInst(this._dialogI
nput,!1),s.settings={},$.data(this._dialogInput[0],PROP_NAME,s)}extendRemove(s.settings,r||{}),t=t&&t.constructor==Date
?this._formatDate(s,t):t,this._dialogInput.val(t),this._pos=i?i.length?i:[i.pageX,i.pageY]:null;if(!this._pos){var u=do
cument.documentElement.clientWidth,a=document.documentElement.clientHeight,f=document.documentElement.scrollLeft||docum
ent.body.scrollLeft,l=document.documentElement.scrollTop||document.body.scrollTop;this._pos=[u/2-100+f,a/2-150+l]}retur
n this._dialogInput.css("left",this._pos[0]+20+"px").css("top",this._pos[1]+"px"),s.settings.onSelect=n,this._inDialog=
!0,this.dpDiv.addClass(this._dialogClass),this._showDatepicker(this._dialogInput[0]),$.blockUI&&$.blockUI(this.dpDiv),$
.data(this._dialogInput[0],PROP_NAME,s),this},_destroyDatepicker:function(e){var t=$(e),n=$.data(e,PROP_NAME);if(!!t.ha
sClass(this.markerClassName)){var r=e.nodeName.toLowerCase();$.removeData(e,PROP_NAME),r=="input"?(n.append.remove(),n.
trigger.remove(),t.removeClass(this.markerClassName).unbind("focus",this._showDatepicker).unbind("keydown",this._doKeyD
own).unbind("keypress",this._doKeyPress).unbind("keyup",this._doKeyUp)):(r=="div"||r=="span")&&t.removeClass(this.marke
rClassName).empty()}},_enableDatepicker:function(e){var t=$(e),n=$.data(e,PROP_NAME);if(!!t.hasClass(this.markerClassNa
me)){var r=e.nodeName.toLowerCase();if(r=="input")e.disabled=!1,n.trigger.filter("button").each(function(){this.disable
d=!1}).end().filter("img").css({opacity:"1.0",cursor:""});else if(r=="div"||r=="span"){var i=t.children("."+this._inlin
eClass);i.children().removeClass("ui-state-disabled"),i.find("select.ui-datepicker-month, select.ui-datepicker-year").r
emoveAttr("disabled")}this._disabledInputs=$.map(this._disabledInputs,function(t){return t==e?null:t})}},_disableDatepi
cker:function(e){var t=$(e),n=$.data(e,PROP_NAME);if(!!t.hasClass(this.markerClassName)){var r=e.nodeName.toLowerCase()
;if(r=="input")e.disabled=!0,n.trigger.filter("button").each(function(){this.disabled=!0}).end().filter("img").css({opa
city:"0.5",cursor:"default"});else if(r=="div"||r=="span"){var i=t.children("."+this._inlineClass);i.children().addClas
s("ui-state-disabled"),i.find("select.ui-datepicker-month, select.ui-datepicker-year").attr("disabled","disabled")}this
._disabledInputs=$.map(this._disabledInputs,function(t){return t==e?null:t}),this._disabledInputs[this._disabledInputs.
length]=e}},_isDisabledDatepicker:function(e){if(!e)return!1;for(var t=0;t<this._disabledInputs.length;t++)if(this._dis
abledInputs[t]==e)return!0;return!1},_getInst:function(e){try{return $.data(e,PROP_NAME)}catch(t){throw"Missing instanc
e data for this datepicker"}},_optionDatepicker:function(e,t,n){var r=this._getInst(e);if(arguments.length==2&&typeof t
=="string")return t=="defaults"?$.extend({},$.datepicker._defaults):r?t=="all"?$.extend({},r.settings):this._get(r,t):n
ull;var i=t||{};typeof t=="string"&&(i={},i[t]=n);if(r){this._curInst==r&&this._hideDatepicker();var s=this._getDateDat
epicker(e,!0),o=this._getMinMaxDate(r,"min"),u=this._getMinMaxDate(r,"max");extendRemove(r.settings,i),o!==null&&i.date
Format!==undefined&&i.minDate===undefined&&(r.settings.minDate=this._formatDate(r,o)),u!==null&&i.dateFormat!==undefine
d&&i.maxDate===undefined&&(r.settings.maxDate=this._formatDate(r,u)),this._attachments($(e),r),this._autoSize(r),this._
setDate(r,s),this._updateAlternate(r),this._updateDatepicker(r)}},_changeDatepicker:function(e,t,n){this._optionDatepic
ker(e,t,n)},_refreshDatepicker:function(e){var t=this._getInst(e);t&&this._updateDatepicker(t)},_setDateDatepicker:func
tion(e,t){var n=this._getInst(e);n&&(this._setDate(n,t),this._updateDatepicker(n),this._updateAlternate(n))},_getDateDa
tepicker:function(e,t){var n=this._getInst(e);return n&&!n.inline&&this._setDateFromField(n,t),n?this._getDate(n):null}
,_doKeyDown:function(e){var t=$.datepicker._getInst(e.target),n=!0,r=t.dpDiv.is(".ui-datepicker-rtl");t._keyEvent=!0;if
($.datepicker._datepickerShowing)switch(e.keyCode){case 9:$.datepicker._hideDatepicker(),n=!1;break;case 13:var i=$("td
."+$.datepicker._dayOverClass+":not(."+$.datepicker._currentClass+")",t.dpDiv);i[0]&&$.datepicker._selectDay(e.target,t
.selectedMonth,t.selectedYear,i[0]);var s=$.datepicker._get(t,"onSelect");if(s){var o=$.datepicker._formatDate(t);s.app
ly(t.input?t.input[0]:null,[o,t])}else $.datepicker._hideDatepicker();return!1;case 27:$.datepicker._hideDatepicker();b
reak;case 33:$.datepicker._adjustDate(e.target,e.ctrlKey?-$.datepicker._get(t,"stepBigMonths"):-$.datepicker._get(t,"st
epMonths"),"M");break;case 34:$.datepicker._adjustDate(e.target,e.ctrlKey?+$.datepicker._get(t,"stepBigMonths"):+$.date
picker._get(t,"stepMonths"),"M");break;case 35:(e.ctrlKey||e.metaKey)&&$.datepicker._clearDate(e.target),n=e.ctrlKey||e
.metaKey;break;case 36:(e.ctrlKey||e.metaKey)&&$.datepicker._gotoToday(e.target),n=e.ctrlKey||e.metaKey;break;case 37:(
e.ctrlKey||e.metaKey)&&$.datepicker._adjustDate(e.target,r?1:-1,"D"),n=e.ctrlKey||e.metaKey,e.originalEvent.altKey&&$.d
atepicker._adjustDate(e.target,e.ctrlKey?-$.datepicker._get(t,"stepBigMonths"):-$.datepicker._get(t,"stepMonths"),"M");
break;case 38:(e.ctrlKey||e.metaKey)&&$.datepicker._adjustDate(e.target,-7,"D"),n=e.ctrlKey||e.metaKey;break;case 39:(e
.ctrlKey||e.metaKey)&&$.datepicker._adjustDate(e.target,r?-1:1,"D"),n=e.ctrlKey||e.metaKey,e.originalEvent.altKey&&$.da
tepicker._adjustDate(e.target,e.ctrlKey?+$.datepicker._get(t,"stepBigMonths"):+$.datepicker._get(t,"stepMonths"),"M");b
reak;case 40:(e.ctrlKey||e.metaKey)&&$.datepicker._adjustDate(e.target,7,"D"),n=e.ctrlKey||e.metaKey;break;default:n=!1
}else e.keyCode==36&&e.ctrlKey?$.datepicker._showDatepicker(this):n=!1;n&&(e.preventDefault(),e.stopPropagation())},_do
KeyPress:function(e){var t=$.datepicker._getInst(e.target);if($.datepicker._get(t,"constrainInput")){var n=$.datepicker
._possibleChars($.datepicker._get(t,"dateFormat")),r=String.fromCharCode(e.charCode==undefined?e.keyCode:e.charCode);re
turn e.ctrlKey||e.metaKey||r<" "||!n||n.indexOf(r)>-1}},_doKeyUp:function(e){var t=$.datepicker._getInst(e.target);if(t
.input.val()!=t.lastVal)try{var n=$.datepicker.parseDate($.datepicker._get(t,"dateFormat"),t.input?t.input.val():null,$
.datepicker._getFormatConfig(t));n&&($.datepicker._setDateFromField(t),$.datepicker._updateAlternate(t),$.datepicker._u
pdateDatepicker(t))}catch(e){$.datepicker.log(e)}return!0},_showDatepicker:function(e){e=e.target||e,e.nodeName.toLower
Case()!="input"&&(e=$("input",e.parentNode)[0]);if(!$.datepicker._isDisabledDatepicker(e)&&$.datepicker._lastInput!=e){
var t=$.datepicker._getInst(e);$.datepicker._curInst&&$.datepicker._curInst!=t&&($.datepicker._curInst.dpDiv.stop(!0,!0
),t&&$.datepicker._datepickerShowing&&$.datepicker._hideDatepicker($.datepicker._curInst.input[0]));var n=$.datepicker.
_get(t,"beforeShow"),r=n?n.apply(e,[e,t]):{};if(r===!1)return;extendRemove(t.settings,r),t.lastVal=null,$.datepicker._l
astInput=e,$.datepicker._setDateFromField(t),$.datepicker._inDialog&&(e.value=""),$.datepicker._pos||($.datepicker._pos
=$.datepicker._findPos(e),$.datepicker._pos[1]+=e.offsetHeight);var i=!1;$(e).parents().each(function(){return i|=$(thi
s).css("position")=="fixed",!i}),i&&$.browser.opera&&($.datepicker._pos[0]-=document.documentElement.scrollLeft,$.datep
icker._pos[1]-=document.documentElement.scrollTop);var s={left:$.datepicker._pos[0],top:$.datepicker._pos[1]};$.datepic
ker._pos=null,t.dpDiv.empty(),t.dpDiv.css({position:"absolute",display:"block",top:"-1000px"}),$.datepicker._updateDate
picker(t),s=$.datepicker._checkOffset(t,s,i),t.dpDiv.css({position:$.datepicker._inDialog&&$.blockUI?"static":i?"fixed"
:"absolute",display:"none",left:s.left+"px",top:s.top+"px"});if(!t.inline){var o=$.datepicker._get(t,"showAnim"),u=$.da
tepicker._get(t,"duration"),a=function(){var e=t.dpDiv.find("iframe.ui-datepicker-cover");if(!!e.length){var n=$.datepi
cker._getBorders(t.dpDiv);e.css({left:-n[0],top:-n[1],width:t.dpDiv.outerWidth(),height:t.dpDiv.outerHeight()})}};t.dpD
iv.zIndex($(e).zIndex()+1),$.datepicker._datepickerShowing=!0,$.effects&&$.effects[o]?t.dpDiv.show(o,$.datepicker._get(
t,"showOptions"),u,a):t.dpDiv[o||"show"](o?u:null,a),(!o||!u)&&a(),t.input.is(":visible")&&!t.input.is(":disabled")&&t.
input.focus(),$.datepicker._curInst=t}}},_updateDatepicker:function(e){var t=this;t.maxRows=4;var n=$.datepicker._getBo
rders(e.dpDiv);instActive=e,e.dpDiv.empty().append(this._generateHTML(e));var r=e.dpDiv.find("iframe.ui-datepicker-cove
r");!r.length||r.css({left:-n[0],top:-n[1],width:e.dpDiv.outerWidth(),height:e.dpDiv.outerHeight()}),e.dpDiv.find("."+t
his._dayOverClass+" a").mouseover();var i=this._getNumberOfMonths(e),s=i[1],o=17;e.dpDiv.removeClass("ui-datepicker-mul
ti-2 ui-datepicker-multi-3 ui-datepicker-multi-4").width(""),s>1&&e.dpDiv.addClass("ui-datepicker-multi-"+s).css("width
",o*s+"em"),e.dpDiv[(i[0]!=1||i[1]!=1?"add":"remove")+"Class"]("ui-datepicker-multi"),e.dpDiv[(this._get(e,"isRTL")?"ad
d":"remove")+"Class"]("ui-datepicker-rtl"),e==$.datepicker._curInst&&$.datepicker._datepickerShowing&&e.input&&e.input.
is(":visible")&&!e.input.is(":disabled")&&e.input[0]!=document.activeElement&&e.input.focus();if(e.yearshtml){var u=e.y
earshtml;setTimeout(function(){u===e.yearshtml&&e.yearshtml&&e.dpDiv.find("select.ui-datepicker-year:first").replaceWit
h(e.yearshtml),u=e.yearshtml=null},0)}},_getBorders:function(e){var t=function(e){return{thin:1,medium:2,thick:3}[e]||e
};return[parseFloat(t(e.css("border-left-width"))),parseFloat(t(e.css("border-top-width")))]},_checkOffset:function(e,t
,n){var r=e.dpDiv.outerWidth(),i=e.dpDiv.outerHeight(),s=e.input?e.input.outerWidth():0,o=e.input?e.input.outerHeight()
:0,u=document.documentElement.clientWidth+$(document).scrollLeft(),a=document.documentElement.clientHeight+$(document).
scrollTop();return t.left-=this._get(e,"isRTL")?r-s:0,t.left-=n&&t.left==e.input.offset().left?$(document).scrollLeft()
:0,t.top-=n&&t.top==e.input.offset().top+o?$(document).scrollTop():0,t.left-=Math.min(t.left,t.left+r>u&&u>r?Math.abs(t
.left+r-u):0),t.top-=Math.min(t.top,t.top+i>a&&a>i?Math.abs(i+o):0),t},_findPos:function(e){var t=this._getInst(e),n=th
is._get(t,"isRTL");while(e&&(e.type=="hidden"||e.nodeType!=1||$.expr.filters.hidden(e)))e=e[n?"previousSibling":"nextSi
bling"];var r=$(e).offset();return[r.left,r.top]},_hideDatepicker:function(e){var t=this._curInst;if(!(!t||e&&t!=$.data
(e,PROP_NAME))&&this._datepickerShowing){var n=this._get(t,"showAnim"),r=this._get(t,"duration"),i=this,s=function(){$.
datepicker._tidyDialog(t),i._curInst=null};$.effects&&$.effects[n]?t.dpDiv.hide(n,$.datepicker._get(t,"showOptions"),r,
s):t.dpDiv[n=="slideDown"?"slideUp":n=="fadeIn"?"fadeOut":"hide"](n?r:null,s),n||s(),this._datepickerShowing=!1;var o=t
his._get(t,"onClose");o&&o.apply(t.input?t.input[0]:null,[t.input?t.input.val():"",t]),this._lastInput=null,this._inDia
log&&(this._dialogInput.css({position:"absolute",left:"0",top:"-100px"}),$.blockUI&&($.unblockUI(),$("body").append(thi
s.dpDiv))),this._inDialog=!1}},_tidyDialog:function(e){e.dpDiv.removeClass(this._dialogClass).unbind(".ui-datepicker-ca
lendar")},_checkExternalClick:function(e){if(!!$.datepicker._curInst){var t=$(e.target),n=$.datepicker._getInst(t[0]);(
t[0].id!=$.datepicker._mainDivId&&t.parents("#"+$.datepicker._mainDivId).length==0&&!t.hasClass($.datepicker.markerClas
sName)&&!t.hasClass($.datepicker._triggerClass)&&$.datepicker._datepickerShowing&&(!$.datepicker._inDialog||!$.blockUI)
||t.hasClass($.datepicker.markerClassName)&&$.datepicker._curInst!=n)&&$.datepicker._hideDatepicker()}},_adjustDate:fun
ction(e,t,n){var r=$(e),i=this._getInst(r[0]);this._isDisabledDatepicker(r[0])||(this._adjustInstDate(i,t+(n=="M"?this.
_get(i,"showCurrentAtPos"):0),n),this._updateDatepicker(i))},_gotoToday:function(e){var t=$(e),n=this._getInst(t[0]);if
(this._get(n,"gotoCurrent")&&n.currentDay)n.selectedDay=n.currentDay,n.drawMonth=n.selectedMonth=n.currentMonth,n.drawY
ear=n.selectedYear=n.currentYear;else{var r=new Date;n.selectedDay=r.getDate(),n.drawMonth=n.selectedMonth=r.getMonth()
,n.drawYear=n.selectedYear=r.getFullYear()}this._notifyChange(n),this._adjustDate(t)},_selectMonthYear:function(e,t,n){
var r=$(e),i=this._getInst(r[0]);i["selected"+(n=="M"?"Month":"Year")]=i["draw"+(n=="M"?"Month":"Year")]=parseInt(t.opt
ions[t.selectedIndex].value,10),this._notifyChange(i),this._adjustDate(r)},_selectDay:function(e,t,n,r){var i=$(e);if(!
$(r).hasClass(this._unselectableClass)&&!this._isDisabledDatepicker(i[0])){var s=this._getInst(i[0]);s.selectedDay=s.cu
rrentDay=$("a",r).html(),s.selectedMonth=s.currentMonth=t,s.selectedYear=s.currentYear=n,this._selectDate(e,this._forma
tDate(s,s.currentDay,s.currentMonth,s.currentYear))}},_clearDate:function(e){var t=$(e),n=this._getInst(t[0]);this._sel
ectDate(t,"")},_selectDate:function(e,t){var n=$(e),r=this._getInst(n[0]);t=t!=null?t:this._formatDate(r),r.input&&r.in
put.val(t),this._updateAlternate(r);var i=this._get(r,"onSelect");i?i.apply(r.input?r.input[0]:null,[t,r]):r.input&&r.i
nput.trigger("change"),r.inline?this._updateDatepicker(r):(this._hideDatepicker(),this._lastInput=r.input[0],typeof r.i
nput[0]!="object"&&r.input.focus(),this._lastInput=null)},_updateAlternate:function(e){var t=this._get(e,"altField");if
(t){var n=this._get(e,"altFormat")||this._get(e,"dateFormat"),r=this._getDate(e),i=this.formatDate(n,r,this._getFormatC
onfig(e));$(t).each(function(){$(this).val(i)})}},noWeekends:function(e){var t=e.getDay();return[t>0&&t<6,""]},iso8601W
eek:function(e){var t=new Date(e.getTime());t.setDate(t.getDate()+4-(t.getDay()||7));var n=t.getTime();return t.setMont
h(0),t.setDate(1),Math.floor(Math.round((n-t)/864e5)/7)+1},parseDate:function(e,t,n){if(e==null||t==null)throw"Invalid 
arguments";t=typeof t=="object"?t.toString():t+"";if(t=="")return null;var r=(n?n.shortYearCutoff:null)||this._defaults
.shortYearCutoff;r=typeof r!="string"?r:(new Date).getFullYear()%100+parseInt(r,10);var i=(n?n.dayNamesShort:null)||thi
s._defaults.dayNamesShort,s=(n?n.dayNames:null)||this._defaults.dayNames,o=(n?n.monthNamesShort:null)||this._defaults.m
onthNamesShort,u=(n?n.monthNames:null)||this._defaults.monthNames,a=-1,f=-1,l=-1,c=-1,h=!1,p=function(t){var n=y+1<e.le
ngth&&e.charAt(y+1)==t;return n&&y++,n},d=function(e){var n=p(e),r=e=="@"?14:e=="!"?20:e=="y"&&n?4:e=="o"?3:2,i=new Reg
Exp("^\\d{1,"+r+"}"),s=t.substring(g).match(i);if(!s)throw"Missing number at position "+g;return g+=s[0].length,parseIn
t(s[0],10)},v=function(e,n,r){var i=$.map(p(e)?r:n,function(e,t){return[[t,e]]}).sort(function(e,t){return-(e[1].length
-t[1].length)}),s=-1;$.each(i,function(e,n){var r=n[1];if(t.substr(g,r.length).toLowerCase()==r.toLowerCase())return s=
n[0],g+=r.length,!1});if(s!=-1)return s+1;throw"Unknown name at position "+g},m=function(){if(t.charAt(g)!=e.charAt(y))
throw"Unexpected literal at position "+g;g++},g=0;for(var y=0;y<e.length;y++)if(h)e.charAt(y)=="'"&&!p("'")?h=!1:m();el
se switch(e.charAt(y)){case"d":l=d("d");break;case"D":v("D",i,s);break;case"o":c=d("o");break;case"m":f=d("m");break;ca
se"M":f=v("M",o,u);break;case"y":a=d("y");break;case"@":var b=new Date(d("@"));a=b.getFullYear(),f=b.getMonth()+1,l=b.g
etDate();break;case"!":var b=new Date((d("!")-this._ticksTo1970)/1e4);a=b.getFullYear(),f=b.getMonth()+1,l=b.getDate();
break;case"'":p("'")?m():h=!0;break;default:m()}if(g<t.length)throw"Extra/unparsed characters found in date: "+t.substr
ing(g);a==-1?a=(new Date).getFullYear():a<100&&(a+=(new Date).getFullYear()-(new Date).getFullYear()%100+(a<=r?0:-100))
;if(c>-1){f=1,l=c;for(;;){var w=this._getDaysInMonth(a,f-1);if(l<=w)break;f++,l-=w}}var b=this._daylightSavingAdjust(ne
w Date(a,f-1,l));if(b.getFullYear()!=a||b.getMonth()+1!=f||b.getDate()!=l)throw"Invalid date";return b},ATOM:"yy-mm-dd"
,COOKIE:"D, dd M yy",ISO_8601:"yy-mm-dd",RFC_822:"D, d M y",RFC_850:"DD, dd-M-y",RFC_1036:"D, d M y",RFC_1123:"D, d M y
y",RFC_2822:"D, d M yy",RSS:"D, d M y",TICKS:"!",TIMESTAMP:"@",W3C:"yy-mm-dd",_ticksTo1970:(718685+Math.floor(492.5)-Ma
th.floor(19.7)+Math.floor(4.925))*24*60*60*1e7,formatDate:function(e,t,n){if(!t)return"";var r=(n?n.dayNamesShort:null)
||this._defaults.dayNamesShort,i=(n?n.dayNames:null)||this._defaults.dayNames,s=(n?n.monthNamesShort:null)||this._defau
lts.monthNamesShort,o=(n?n.monthNames:null)||this._defaults.monthNames,u=function(t){var n=h+1<e.length&&e.charAt(h+1)=
=t;return n&&h++,n},a=function(e,t,n){var r=""+t;if(u(e))while(r.length<n)r="0"+r;return r},f=function(e,t,n,r){return 
u(e)?r[t]:n[t]},l="",c=!1;if(t)for(var h=0;h<e.length;h++)if(c)e.charAt(h)=="'"&&!u("'")?c=!1:l+=e.charAt(h);else switc
h(e.charAt(h)){case"d":l+=a("d",t.getDate(),2);break;case"D":l+=f("D",t.getDay(),r,i);break;case"o":l+=a("o",Math.round
(((new Date(t.getFullYear(),t.getMonth(),t.getDate())).getTime()-(new Date(t.getFullYear(),0,0)).getTime())/864e5),3);b
reak;case"m":l+=a("m",t.getMonth()+1,2);break;case"M":l+=f("M",t.getMonth(),s,o);break;case"y":l+=u("y")?t.getFullYear(
):(t.getYear()%100<10?"0":"")+t.getYear()%100;break;case"@":l+=t.getTime();break;case"!":l+=t.getTime()*1e4+this._ticks
To1970;break;case"'":u("'")?l+="'":c=!0;break;default:l+=e.charAt(h)}return l},_possibleChars:function(e){var t="",n=!1
,r=function(t){var n=i+1<e.length&&e.charAt(
i+1)==t;return n&&i++,n};for(var i=0;i<e.length;i++)if(n)e.charAt(i)=="'"&&!r("'")?n=!1:t+=e.charAt(i);else switch(e.ch
arAt(i)){case"d":case"m":case"y":case"@":t+="0123456789";break;case"D":case"M":return null;case"'":r("'")?t+="'":n=!0;b
reak;default:t+=e.charAt(i)}return t},_get:function(e,t){return e.settings[t]!==undefined?e.settings[t]:this._defaults[
t]},_setDateFromField:function(e,t){if(e.input.val()!=e.lastVal){var n=this._get(e,"dateFormat"),r=e.lastVal=e.input?e.
input.val():null,i,s;i=s=this._getDefaultDate(e);var o=this._getFormatConfig(e);try{i=this.parseDate(n,r,o)||s}catch(u)
{this.log(u),r=t?"":r}e.selectedDay=i.getDate(),e.drawMonth=e.selectedMonth=i.getMonth(),e.drawYear=e.selectedYear=i.ge
tFullYear(),e.currentDay=r?i.getDate():0,e.currentMonth=r?i.getMonth():0,e.currentYear=r?i.getFullYear():0,this._adjust
InstDate(e)}},_getDefaultDate:function(e){return this._restrictMinMax(e,this._determineDate(e,this._get(e,"defaultDate"
),new Date))},_determineDate:function(e,t,n){var r=function(e){var t=new Date;return t.setDate(t.getDate()+e),t},i=func
tion(t){try{return $.datepicker.parseDate($.datepicker._get(e,"dateFormat"),t,$.datepicker._getFormatConfig(e))}catch(n
){}var r=(t.toLowerCase().match(/^c/)?$.datepicker._getDate(e):null)||new Date,i=r.getFullYear(),s=r.getMonth(),o=r.get
Date(),u=/([+-]?[0-9]+)\s*(d|D|w|W|m|M|y|Y)?/g,f=u.exec(t);while(f){switch(f[2]||"d"){case"d":case"D":o+=parseInt(f[1],
10);break;case"w":case"W":o+=parseInt(f[1],10)*7;break;case"m":case"M":s+=parseInt(f[1],10),o=Math.min(o,$.datepicker._
getDaysInMonth(i,s));break;case"y":case"Y":i+=parseInt(f[1],10),o=Math.min(o,$.datepicker._getDaysInMonth(i,s))}f=u.exe
c(t)}return new Date(i,s,o)},s=t==null||t===""?n:typeof t=="string"?i(t):typeof t=="number"?isNaN(t)?n:r(t):new Date(t.
getTime());return s=s&&s.toString()=="Invalid Date"?n:s,s&&(s.setHours(0),s.setMinutes(0),s.setSeconds(0),s.setMillisec
onds(0)),this._daylightSavingAdjust(s)},_daylightSavingAdjust:function(e){return e?(e.setHours(e.getHours()>12?e.getHou
rs()+2:0),e):null},_setDate:function(e,t,n){var r=!t,i=e.selectedMonth,s=e.selectedYear,o=this._restrictMinMax(e,this._
determineDate(e,t,new Date));e.selectedDay=e.currentDay=o.getDate(),e.drawMonth=e.selectedMonth=e.currentMonth=o.getMon
th(),e.drawYear=e.selectedYear=e.currentYear=o.getFullYear(),(i!=e.selectedMonth||s!=e.selectedYear)&&!n&&this._notifyC
hange(e),this._adjustInstDate(e),e.input&&e.input.val(r?"":this._formatDate(e))},_getDate:function(e){var t=!e.currentY
ear||e.input&&e.input.val()==""?null:this._daylightSavingAdjust(new Date(e.currentYear,e.currentMonth,e.currentDay));re
turn t},_generateHTML:function(e){var t=new Date;t=this._daylightSavingAdjust(new Date(t.getFullYear(),t.getMonth(),t.g
etDate()));var n=this._get(e,"isRTL"),r=this._get(e,"showButtonPanel"),i=this._get(e,"hideIfNoPrevNext"),s=this._get(e,
"navigationAsDateFormat"),o=this._getNumberOfMonths(e),u=this._get(e,"showCurrentAtPos"),a=this._get(e,"stepMonths"),f=
o[0]!=1||o[1]!=1,l=this._daylightSavingAdjust(e.currentDay?new Date(e.currentYear,e.currentMonth,e.currentDay):new Date
(9999,9,9)),c=this._getMinMaxDate(e,"min"),h=this._getMinMaxDate(e,"max"),p=e.drawMonth-u,d=e.drawYear;p<0&&(p+=12,d--)
;if(h){var v=this._daylightSavingAdjust(new Date(h.getFullYear(),h.getMonth()-o[0]*o[1]+1,h.getDate()));v=c&&v<c?c:v;wh
ile(this._daylightSavingAdjust(new Date(d,p,1))>v)p--,p<0&&(p=11,d--)}e.drawMonth=p,e.drawYear=d;var m=this._get(e,"pre
vText");m=s?this.formatDate(m,this._daylightSavingAdjust(new Date(d,p-a,1)),this._getFormatConfig(e)):m;var g=this._can
AdjustMonth(e,-1,d,p)?'<a class="ui-datepicker-prev ui-corner-all" onclick="DP_jQuery_'+dpuuid+".datepicker._adjustDate
('#"+e.id+"', -"+a+", 'M');\""+' title="'+m+'"><span class="ui-icon ui-icon-circle-triangle-'+(n?"e":"w")+'">'+m+"</spa
n></a>":i?"":'<a class="ui-datepicker-prev ui-corner-all ui-state-disabled" title="'+m+'"><span class="ui-icon ui-icon-
circle-triangle-'+(n?"e":"w")+'">'+m+"</span></a>",y=this._get(e,"nextText");y=s?this.formatDate(y,this._daylightSaving
Adjust(new Date(d,p+a,1)),this._getFormatConfig(e)):y;var b=this._canAdjustMonth(e,1,d,p)?'<a class="ui-datepicker-next
 ui-corner-all" onclick="DP_jQuery_'+dpuuid+".datepicker._adjustDate('#"+e.id+"', +"+a+", 'M');\""+' title="'+y+'"><spa
n class="ui-icon ui-icon-circle-triangle-'+(n?"w":"e")+'">'+y+"</span></a>":i?"":'<a class="ui-datepicker-next ui-corne
r-all ui-state-disabled" title="'+y+'"><span class="ui-icon ui-icon-circle-triangle-'+(n?"w":"e")+'">'+y+"</span></a>",
w=this._get(e,"currentText"),E=this._get(e,"gotoCurrent")&&e.currentDay?l:t;w=s?this.formatDate(w,E,this._getFormatConf
ig(e)):w;var S=e.inline?"":'<button type="button" class="ui-datepicker-close ui-state-default ui-priority-primary ui-co
rner-all" onclick="DP_jQuery_'+dpuuid+'.datepicker._hideDatepicker();">'+this._get(e,"closeText")+"</button>",x=r?'<div
 class="ui-datepicker-buttonpane ui-widget-content">'+(n?S:"")+(this._isInRange(e,E)?'<button type="button" class="ui-d
atepicker-current ui-state-default ui-priority-secondary ui-corner-all" onclick="DP_jQuery_'+dpuuid+".datepicker._gotoT
oday('#"+e.id+"');\""+">"+w+"</button>":"")+(n?"":S)+"</div>":"",T=parseInt(this._get(e,"firstDay"),10);T=isNaN(T)?0:T;
var N=this._get(e,"showWeek"),C=this._get(e,"dayNames"),k=this._get(e,"dayNamesShort"),L=this._get(e,"dayNamesMin"),A=t
his._get(e,"monthNames"),O=this._get(e,"monthNamesShort"),M=this._get(e,"beforeShowDay"),_=this._get(e,"showOtherMonths
"),D=this._get(e,"selectOtherMonths"),P=this._get(e,"calculateWeek")||this.iso8601Week,H=this._getDefaultDate(e),B="";f
or(var j=0;j<o[0];j++){var F="";this.maxRows=4;for(var I=0;I<o[1];I++){var q=this._daylightSavingAdjust(new Date(d,p,e.
selectedDay)),R=" ui-corner-all",U="";if(f){U+='<div class="ui-datepicker-group';if(o[1]>1)switch(I){case 0:U+=" ui-dat
epicker-group-first",R=" ui-corner-"+(n?"right":"left");break;case o[1]-1:U+=" ui-datepicker-group-last",R=" ui-corner-
"+(n?"left":"right");break;default:U+=" ui-datepicker-group-middle",R=""}U+='">'}U+='<div class="ui-datepicker-header u
i-widget-header ui-helper-clearfix'+R+'">'+(/all|left/.test(R)&&j==0?n?b:g:"")+(/all|right/.test(R)&&j==0?n?g:b:"")+thi
s._generateMonthYearHeader(e,p,d,c,h,j>0||I>0,A,O)+'</div><table class="ui-datepicker-calendar"><thead>'+"<tr>";var z=N
?'<th class="ui-datepicker-week-col">'+this._get(e,"weekHeader")+"</th>":"";for(var W=0;W<7;W++){var X=(W+T)%7;z+="<th"
+((W+T+6)%7>=5?' class="ui-datepicker-week-end"':"")+">"+'<span title="'+C[X]+'">'+L[X]+"</span></th>"}U+=z+"</tr></the
ad><tbody>";var V=this._getDaysInMonth(d,p);d==e.selectedYear&&p==e.selectedMonth&&(e.selectedDay=Math.min(e.selectedDa
y,V));var J=(this._getFirstDayOfMonth(d,p)-T+7)%7,K=Math.ceil((J+V)/7),Q=f?this.maxRows>K?this.maxRows:K:K;this.maxRows
=Q;var G=this._daylightSavingAdjust(new Date(d,p,1-J));for(var Y=0;Y<Q;Y++){U+="<tr>";var Z=N?'<td class="ui-datepicker
-week-col">'+this._get(e,"calculateWeek")(G)+"</td>":"";for(var W=0;W<7;W++){var et=M?M.apply(e.input?e.input[0]:null,[
G]):[!0,""],tt=G.getMonth()!=p,nt=tt&&!D||!et[0]||c&&G<c||h&&G>h;Z+='<td class="'+((W+T+6)%7>=5?" ui-datepicker-week-en
d":"")+(tt?" ui-datepicker-other-month":"")+(G.getTime()==q.getTime()&&p==e.selectedMonth&&e._keyEvent||H.getTime()==G.
getTime()&&H.getTime()==q.getTime()?" "+this._dayOverClass:"")+(nt?" "+this._unselectableClass+" ui-state-disabled":"")
+(tt&&!_?"":" "+et[1]+(G.getTime()==l.getTime()?" "+this._currentClass:"")+(G.getTime()==t.getTime()?" ui-datepicker-to
day":""))+'"'+((!tt||_)&&et[2]?' title="'+et[2]+'"':"")+(nt?"":' onclick="DP_jQuery_'+dpuuid+".datepicker._selectDay('#
"+e.id+"',"+G.getMonth()+","+G.getFullYear()+', this);return false;"')+">"+(tt&&!_?"&#xa0;":nt?'<span class="ui-state-d
efault">'+G.getDate()+"</span>":'<a class="ui-state-default'+(G.getTime()==t.getTime()?" ui-state-highlight":"")+(G.get
Time()==l.getTime()?" ui-state-active":"")+(tt?" ui-priority-secondary":"")+'" href="#">'+G.getDate()+"</a>")+"</td>",G
.setDate(G.getDate()+1),G=this._daylightSavingAdjust(G)}U+=Z+"</tr>"}p++,p>11&&(p=0,d++),U+="</tbody></table>"+(f?"</di
v>"+(o[0]>0&&I==o[1]-1?'<div class="ui-datepicker-row-break"></div>':""):""),F+=U}B+=F}return B+=x+($.browser.msie&&par
seInt($.browser.version,10)<7&&!e.inline?'<iframe src="javascript:false;" class="ui-datepicker-cover" frameborder="0"><
/iframe>':""),e._keyEvent=!1,B},_generateMonthYearHeader:function(e,t,n,r,i,s,o,u){var a=this._get(e,"changeMonth"),f=t
his._get(e,"changeYear"),l=this._get(e,"showMonthAfterYear"),c='<div class="ui-datepicker-title">',h="";if(s||!a)h+='<s
pan class="ui-datepicker-month">'+o[t]+"</span>";else{var p=r&&r.getFullYear()==n,d=i&&i.getFullYear()==n;h+='<select c
lass="ui-datepicker-month" onchange="DP_jQuery_'+dpuuid+".datepicker._selectMonthYear('#"+e.id+"', this, 'M');\" "+">";
for(var v=0;v<12;v++)(!p||v>=r.getMonth())&&(!d||v<=i.getMonth())&&(h+='<option value="'+v+'"'+(v==t?' selected="select
ed"':"")+">"+u[v]+"</option>");h+="</select>"}l||(c+=h+(s||!a||!f?"&#xa0;":""));if(!e.yearshtml){e.yearshtml="";if(s||!
f)c+='<span class="ui-datepicker-year">'+n+"</span>";else{var m=this._get(e,"yearRange").split(":"),g=(new Date).getFul
lYear(),y=function(e){var t=e.match(/c[+-].*/)?n+parseInt(e.substring(1),10):e.match(/[+-].*/)?g+parseInt(e,10):parseIn
t(e,10);return isNaN(t)?g:t},b=y(m[0]),w=Math.max(b,y(m[1]||""));b=r?Math.max(b,r.getFullYear()):b,w=i?Math.min(w,i.get
FullYear()):w,e.yearshtml+='<select class="ui-datepicker-year" onchange="DP_jQuery_'+dpuuid+".datepicker._selectMonthYe
ar('#"+e.id+"', this, 'Y');\" "+">";for(;b<=w;b++)e.yearshtml+='<option value="'+b+'"'+(b==n?' selected="selected"':"")
+">"+b+"</option>";e.yearshtml+="</select>",c+=e.yearshtml,e.yearshtml=null}}return c+=this._get(e,"yearSuffix"),l&&(c+
=(s||!a||!f?"&#xa0;":"")+h),c+="</div>",c},_adjustInstDate:function(e,t,n){var r=e.drawYear+(n=="Y"?t:0),i=e.drawMonth+
(n=="M"?t:0),s=Math.min(e.selectedDay,this._getDaysInMonth(r,i))+(n=="D"?t:0),o=this._restrictMinMax(e,this._daylightSa
vingAdjust(new Date(r,i,s)));e.selectedDay=o.getDate(),e.drawMonth=e.selectedMonth=o.getMonth(),e.drawYear=e.selectedYe
ar=o.getFullYear(),(n=="M"||n=="Y")&&this._notifyChange(e)},_restrictMinMax:function(e,t){var n=this._getMinMaxDate(e,"
min"),r=this._getMinMaxDate(e,"max"),i=n&&t<n?n:t;return i=r&&i>r?r:i,i},_notifyChange:function(e){var t=this._get(e,"o
nChangeMonthYear");t&&t.apply(e.input?e.input[0]:null,[e.selectedYear,e.selectedMonth+1,e])},_getNumberOfMonths:functio
n(e){var t=this._get(e,"numberOfMonths");return t==null?[1,1]:typeof t=="number"?[1,t]:t},_getMinMaxDate:function(e,t){
return this._determineDate(e,this._get(e,t+"Date"),null)},_getDaysInMonth:function(e,t){return 32-this._daylightSavingA
djust(new Date(e,t,32)).getDate()},_getFirstDayOfMonth:function(e,t){return(new Date(e,t,1)).getDay()},_canAdjustMonth:
function(e,t,n,r){var i=this._getNumberOfMonths(e),s=this._daylightSavingAdjust(new Date(n,r+(t<0?t:i[0]*i[1]),1));retu
rn t<0&&s.setDate(this._getDaysInMonth(s.getFullYear(),s.getMonth())),this._isInRange(e,s)},_isInRange:function(e,t){va
r n=this._getMinMaxDate(e,"min"),r=this._getMinMaxDate(e,"max");return(!n||t.getTime()>=n.getTime())&&(!r||t.getTime()<
=r.getTime())},_getFormatConfig:function(e){var t=this._get(e,"shortYearCutoff");return t=typeof t!="string"?t:(new Dat
e).getFullYear()%100+parseInt(t,10),{shortYearCutoff:t,dayNamesShort:this._get(e,"dayNamesShort"),dayNames:this._get(e,
"dayNames"),monthNamesShort:this._get(e,"monthNamesShort"),monthNames:this._get(e,"monthNames")}},_formatDate:function(
e,t,n,r){t||(e.currentDay=e.selectedDay,e.currentMonth=e.selectedMonth,e.currentYear=e.selectedYear);var i=t?typeof t==
"object"?t:this._daylightSavingAdjust(new Date(r,n,t)):this._daylightSavingAdjust(new Date(e.currentYear,e.currentMonth
,e.currentDay));return this.formatDate(this._get(e,"dateFormat"),i,this._getFormatConfig(e))}}),$.fn.datepicker=functio
n(e){if(!this.length)return this;$.datepicker.initialized||($(document).mousedown($.datepicker._checkExternalClick).fin
d("body").append($.datepicker.dpDiv),$.datepicker.initialized=!0);var t=Array.prototype.slice.call(arguments,1);return 
typeof e!="string"||e!="isDisabled"&&e!="getDate"&&e!="widget"?e=="option"&&arguments.length==2&&typeof arguments[1]=="
string"?$.datepicker["_"+e+"Datepicker"].apply($.datepicker,[this[0]].concat(t)):this.each(function(){typeof e=="string
"?$.datepicker["_"+e+"Datepicker"].apply($.datepicker,[this].concat(t)):$.datepicker._attachDatepicker(this,e)}):$.date
picker["_"+e+"Datepicker"].apply($.datepicker,[this[0]].concat(t))},$.datepicker=new Datepicker,$.datepicker.initialize
d=!1,$.datepicker.uuid=(new Date).getTime(),$.datepicker.version="1.8.17",window["DP_jQuery_"+dpuuid]=$}(jQuery),functi
on(e,t){e.widget("ui.progressbar",{options:{value:0,max:100},min:0,_create:function(){this.element.addClass("ui-progres
sbar ui-widget ui-widget-content ui-corner-all").attr({role:"progressbar","aria-valuemin":this.min,"aria-valuemax":this
.options.max,"aria-valuenow":this._value()}),this.valueDiv=e("<div class='ui-progressbar-value ui-widget-header ui-corn
er-left'></div>").appendTo(this.element),this.oldValue=this._value(),this._refreshValue()},destroy:function(){this.elem
ent.removeClass("ui-progressbar ui-widget ui-widget-content ui-corner-all").removeAttr("role").removeAttr("aria-valuemi
n").removeAttr("aria-valuemax").removeAttr("aria-valuenow"),this.valueDiv.remove(),e.Widget.prototype.destroy.apply(thi
s,arguments)},value:function(e){return e===t?this._value():(this._setOption("value",e),this)},_setOption:function(t,n){
t==="value"&&(this.options.value=n,this._refreshValue(),this._value()===this.options.max&&this._trigger("complete")),e.
Widget.prototype._setOption.apply(this,arguments)},_value:function(){var e=this.options.value;return typeof e!="number"
&&(e=0),Math.min(this.options.max,Math.max(this.min,e))},_percentage:function(){return 100*this._value()/this.options.m
ax},_refreshValue:function(){var e=this.value(),t=this._percentage();this.oldValue!==e&&(this.oldValue=e,this._trigger(
"change")),this.valueDiv.toggle(e>this.min).toggleClass("ui-corner-right",e===this.options.max).width(t.toFixed(0)+"%")
,this.element.attr("aria-valuenow",e)}}),e.extend(e.ui.progressbar,{version:"1.8.17"})}(jQuery),jQuery.effects||functio
n(e,t){function n(t){return!t||typeof t=="number"||e.fx.speeds[t]?!0:typeof t=="string"&&!e.effects[t]?!0:!1}function r
(t,n,r,i){typeof t=="object"&&(i=n,r=null,n=t,t=n.effect),e.isFunction(n)&&(i=n,r=null,n={});if(typeof n=="number"||e.f
x.speeds[n])i=r,r=n,n={};return e.isFunction(r)&&(i=r,r=null),n=n||{},r=r||n.duration,r=e.fx.off?0:typeof r=="number"?r
:r in e.fx.speeds?e.fx.speeds[r]:e.fx.speeds._default,i=i||n.complete,[t,n,r,i]}function i(e,t){var n={_:0},r;for(r in 
t)e[r]!=t[r]&&(n[r]=t[r]);return n}function s(t){var n,r;for(n in t)r=t[n],(r==null||e.isFunction(r)||n in c||/scrollba
r/.test(n)||!/color/i.test(n)&&isNaN(parseFloat(r)))&&delete t[n];return t}function o(){var e=document.defaultView?docu
ment.defaultView.getComputedStyle(this,null):this.currentStyle,t={},n,r;if(e&&e.length&&e[0]&&e[e[0]]){var i=e.length;w
hile(i--)n=e[i],typeof e[n]=="string"&&(r=n.replace(/\-(\w)/g,function(e,t){return t.toUpperCase()}),t[r]=e[n])}else fo
r(n in e)typeof e[n]=="string"&&(t[n]=e[n]);return t}function u(t,n){var r;do{r=e.curCSS(t,n);if(r!=""&&r!="transparent
"||e.nodeName(t,"body"))break;n="backgroundColor"}while(t=t.parentNode);return a(r)}function a(t){var n;return t&&t.con
structor==Array&&t.length==3?t:(n=/rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(t))?[parseInt(
n[1],10),parseInt(n[2],10),parseInt(n[3],10)]:(n=/rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*(
[0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(t))?[parseFloat(n[1])*2.55,parseFloat(n[2])*2.55,parseFloat(n[3])*2.55]:(n=/#([a-fA-F
0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(t))?[parseInt(n[1],16),parseInt(n[2],16),parseInt(n[3],16)]:(n=/#([a-fA-
F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(t))?[parseInt(n[1]+n[1],16),parseInt(n[2]+n[2],16),parseInt(n[3]+n[3],16)]:(n=/r
gba\(0, 0, 0, 0\)/.exec(t))?f.transparent:f[e.trim(t).toLowerCase()]}e.effects={},e.each(["backgroundColor","borderBott
omColor","borderLeftColor","borderRightColor","borderTopColor","borderColor","color","outlineColor"],function(t,n){e.fx
.step[n]=function(e){e.colorInit||(e.start=u(e.elem,n),e.end=a(e.end),e.colorInit=!0),e.elem.style[n]="rgb("+Math.max(M
ath.min(parseInt(e.pos*(e.end[0]-e.start[0])+e.start[0],10),255),0)+","+Math.max(Math.min(parseInt(e.pos*(e.end[1]-e.st
art[1])+e.start[1],10),255),0)+","+Math.max(Math.min(parseInt(e.pos*(e.end[2]-e.start[2])+e.start[2],10),255),0)+")"}})
;var f={aqua:[0,255,255],azure:[240,255,255],beige:[245,245,220],black:[0,0,0],blue:[0,0,255],brown:[165,42,42],cyan:[0
,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgrey:[169,169,169],darkgreen:[0,100,0],darkkhaki:[189,183,107],da
rkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darks
almon:[233,150,122],darkviolet:[148,0,211],fuchsia:[255,0,255],gold:[255,215,0],green:[0,128,0],indigo:[75,0,130],khaki
:[240,230,140],lightblue:[173,216,230],lightcyan:[224,255,255],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpi
nk:[255,182,193],lightyellow:[255,255,224],lime:[0,255,0],magenta:[255,0,255],maroon:[128,0,0],navy:[0,0,128],olive:[12
8,128,0],orange:[255,165,0],pink:[255,192,203],purple:[128,0,128],violet:[128,0,128],red:[255,0,0],silver:[192,192,192]
,white:[255,255,255],yellow:[255,255,0],transparent:[255,255,255]},l=["add","remove","toggle"],c={border:1,borderBottom
:1,borderColor:1,borderLeft:1,borderRight:1,borderTop:1,borderWidth:1,margin:1,padding:1};e.effects.animateClass=functi
on(t,n,r,u){return e.isFunction(r)&&(u=r,r=null),this.queue(function(){var a=e(this),f=a.attr("style")||" ",c=s(o.call(
this)),p,v=a.attr("class");e.each(l,function(e,n){t[n]&&a[n+"Class"](t[n])}),p=s(o.call(this)),a.attr("class",v),a.anim
ate(i(c,p),{queue:!1,duration:n,easing:r,complete:function(){e.each(l,function(e,n){t[n]&&a[n+"Class"](t[n])}),typeof a
.attr("style")=="object"?(a.attr("style").cssText="",a.attr("style").cssText=f):a.attr("style",f),u&&u.apply(this,argum
ents),e.dequeue(this)}})})},e.fn.extend({_addClass:e.fn.addClass,addClass:function(t,n,r,i){return n?e.effects.animateC
lass.apply(this,[{add:t},n,r,i]):this._addClass(t)},_removeClass:e.fn.removeClass,removeClass:function(t,n,r,i){return 
n?e.effects.animateClass.apply(this,[{remove:t},n,r,i]):this._removeClass(t)},_toggleClass:e.fn.toggleClass,toggleClass
:function(n,r,i,s,o){return typeof r=="boolean"||r===t?i?e.effects.animateClass.apply(this,[r?{add:n}:{remove:n},i,s,o]
):this._toggleClass(n,r):e.effects.animateClass.apply(this,[{toggle:n},r,i,s])},switchClass:function(t,n,r,i,s){return 
e.effects.animateClass.apply(this,[{add:n,remove:t},r,i,s])}}),e.extend(e.effects,{version:"1.8.17",save:function(e,t){
for(var n=0;n<t.length;n++)t[n]!==null&&e.data("ec.storage."+t[n],e[0].style[t[n]])},restore:function(e,t){for(var n=0;
n<t.length;n++)t[n]!==null&&e.css(t[n],e.data("ec.storage."+t[n]))},setMode:function(e,t){return t=="toggle"&&(t=e.is("
:hidden")?"show":"hide"),t},getBaseline:function(e,t){var n,r;switch(e[0]){case"top":n=0;break;case"middle":n=.5;break;
case"bottom":n=1;break;default:n=e[0]/t.height}switch(e[1]){case"left":r=0;break;case"center":r=.5;break;case"right":r=
1;break;default:r=e[1]/t.width}return{x:r,y:n}},createWrapper:function(t){if(t.parent().is(".ui-effects-wrapper"))retur
n t.parent();var n={width:t.outerWidth(!0),height:t.outerHeight(!0),"float":t.css("float")},r=e("<div></div>").addClass
("ui-effects-wrapper").css({fontSize:"100%",background:"transparent",border:"none",margin:0,padding:0}),i=document.acti
veElement;return t.wrap(r),(t[0]===i||e.contains(t[0],i))&&e(i).focus(),r=t.parent(),t.css("position")=="static"?(r.css
({position:"relative"}),t.css({position:"relative"})):(e.extend(n,{position:t.css("position"),zIndex:t.css("z-index")})
,e.each(["top","left","bottom","right"],function(e,r){n[r]=t.css(r),isNaN(parseInt(n[r],10))&&(n[r]="auto")}),t.css({po
sition:"relative",top:0,left:0,right:"auto",bottom:"auto"})),r.css(n).show()},removeWrapper:function(t){var n,r=documen
t.activeElement;return t.parent().is(".ui-effects-wrapper")?(n=t.parent().replaceWith(t),(t[0]===r||e.contains(t[0],r))
&&e(r).focus(),n):t},setTransition:function(t,n,r,i){return i=i||{},e.each(n,function(e,n){unit=t.cssUnit(n),unit[0]>0&
&(i[n]=unit[0]*r+unit[1])}),i}}),e.fn.extend({effect:function(t,n,i,s){var o=r.apply(this,arguments),u={options:o[1],du
ration:o[2],callback:o[3]},a=u.options.mode,f=e.effects[t];return e.fx.off||!f?a?this[a](u.duration,u.callback):this.ea
ch(function(){u.callback&&u.callback.call(this)}):f.call(this,u)},_show:e.fn.show,show:function(e){if(n(e))return this.
_show.apply(this,arguments);var t=r.apply(this,arguments);return t[1].mode="show",this.effect.apply(this,t)},_hide:e.fn
.hide,hide:function(e){if(n(e))return this._hide.apply(this,arguments);var t=r.apply(this,arguments);return t[1].mode="
hide",this.effect.apply(this,t)},__toggle:e.fn.toggle,toggle:function(t){if(n(t)||typeof t=="boolean"||e.isFunction(t))
return this.__toggle.apply(this,arguments);var i=r.apply(this,arguments);return i[1].mode="toggle",this.effect.apply(th
is,i)},cssUnit:function(t){var n=this.css(t),r=[];return e.each(["em","px","%","pt"],function(e,t){n.indexOf(t)>0&&(r=[
parseFloat(n),t])}),r}}),e.easing.jswing=e.easing.swing,e.extend(e.easing,{def:"easeOutQuad",swing:function(t,n,r,i,s){
return e.easing[e.easing.def](t,n,r,i,s)},easeInQuad:function(e,t,n,r,i){return r*(t/=i)*t+n},easeOutQuad:function(e,t,
n,r,i){return-r*(t/=i)*(t-2)+n},easeInOutQuad:function(e,t,n,r,i){return(t/=i/2)<1?r/2*t*t+n:-r/2*(--t*(t-2)-1)+n},ease
InCubic:function(e,t,n,r,i){return r*(t/=i)*t*t+n},easeOutCubic:function(e,t,n,r,i){return r*((t=t/i-1)*t*t+1)+n},easeI
nOutCubic:function(e,t,n,r,i){return(t/=i/2)<1?r/2*t*t*t+n:r/2*((t-=2)*t*t+2)+n},easeInQuart:function(e,t,n,r,i){return
 r*(t/=i)*t*t*t+n},easeOutQuart:function(e,t,n,r,i){return-r*((t=t/i-1)*t*t*t-1)+n},easeInOutQuart:function(e,t,n,r,i){
return(t/=i/2)<1?r/2*t*t*t*t+n:-r/2*((t-=2)*t*t*t-2)+n},easeInQuint:function(e,t,n,r,i){return r*(t/=i)*t*t*t*t+n},ease
OutQuint:function(e,t,n,r,i){return r*((t=t/i-1)*t*t*t*t+1)+n},easeInOutQuint:function(e,t,n,r,i){return(t/=i/2)<1?r/2*
t*t*t*t*t+n:r/2*((t-=2)*t*t*t*t+2)+n},easeInSine:function(e,t,n,r,i){return-r*Math.cos(t/i*(Math.PI/2))+r+n},easeOutSin
e:function(e,t,n,r,i){return r*Math.sin(t/i*(Math.PI/2))+n},easeInOutSine:function(e,t,n,r,i){return-r/2*(Math.cos(Math
.PI*t/i)-1)+n},easeInExpo:function(e,t,n,r,i){return t==0?n:r*Math.pow(2,10*(t/i-1))+n},easeOutExpo:function(e,t,n,r,i)
{return t==i?n+r:r*(-Math.pow(2,-10*t/i)+1)+n},easeInOutExpo:function(e,t,n,r,i){return t==0?n:t==i?n+r:(t/=i/2)<1?r/2*
Math.pow(2,10*(t-1))+n:r/2*(-Math.pow(2,-10*--t)+2)+n},easeInCirc:function(e,t,n,r,i){return-r*(Math.sqrt(1-(t/=i)*t)-1
)+n},easeOutCirc:function(e,t,n,r,i){return r*Math.sqrt(1-(t=t/i-1)*t)+n},easeInOutCirc:function(e,t,n,r,i){return(t/=i
/2)<1?-r/2*(Math.sqrt(1-t*t)-1)+n:r/2*(Math.sqrt(1-(t-=2)*t)+1)+n},easeInElastic:function(e,t,n,r,i){var s=1.70158,o=0,
u=r;if(t==0)return n;if((t/=i)==1)return n+r;o||(o=i*.3);if(u<Math.abs(r)){u=r;var s=o/4}else var s=o/(2*Math.PI)*Math.
asin(r/u);return-(u*Math.pow(2,10*(t-=1))*Math.sin((t*i-s)*2*Math.PI/o))+n},easeOutElastic:function(e,t,n,r,i){var s=1.
70158,o=0,u=r;if(t==0)return n;if((t/=i)==1)return n+r;o||(o=i*.3);if(u<Math.abs(r)){u=r;var s=o/4}else var s=o/(2*Math
.PI)*Math.asin(r/u);return u*Math.pow(2,-10*t)*Math.sin((t*i-s)*2*Math.PI/o)+r+n},easeInOutElastic:function(e,t,n,r,i){
var s=1.70158,o=0,u=r;if(t==0)return n;if((t/=i/2)==2)return n+r;o||(o=i*.3*1.5);if(u<Math.abs(r)){u=r;var s=o/4}else v
ar s=o/(2*Math.PI)*Math.asin(r/u);return t<1?-0.5*u*Math.pow(2,10*(t-=1))*Math.sin((t*i-s)*2*Math.PI/o)+n:u*Math.pow(2,
-10*(t-=1))*Math.sin((t*i-s)*2*Math.PI/o)*.5+r+n},easeInBack:function(e,n,r,i,s,o){return o==t&&(o=1.70158),i*(n/=s)*n*
((o+1)*n-o)+r},easeOutBack:function(e,n,r,i,s,o){return o==t&&(o=1.70158),i*((n=n/s-1)*n*((o+1)*n+o)+1)+r},easeInOutBac
k:function(e,n,r,i,s,o){return o==t&&(o=1.70158),(n/=s/2)<1?i/2*n*n*(((o*=1.525)+1)*n-o)+r:i/2*((n-=2)*n*(((o*=1.525)+1
)*n+o)+2)+r},easeInBounce:function(t,n,r,i,s){return i-e.easing.easeOutBounce(t,s-n,0,i,s)+r},easeOutBounce:function(e,
t,n,r,i){return(t/=i)<1/2.75?r*7.5625*t*t+n:t<2/2.75?r*(7.5625*(t-=1.5/2.75)*t+.75)+n:t<2.5/2.75?r*(7.5625*(t-=2.25/2.7
5)*t+.9375)+n:r*(7.5625*(t-=2.625/2.75)*t+.984375)+n},easeInOutBounce:function(t,n,r,i,s){return n<s/2?e.easing.easeInB
ounce(t,n*2,0,i,s)*.5+r:e.easing.easeOutBounce(t,n*2-s,0,i,s)*.5+i*.5+r}})}(jQuery),function(e,t){e.effects.blind=funct
ion(t){return this.queue(function(){var n=e(this),r=["position","top","bottom","left","right"],i=e.effects.setMode(n,t.
options.mode||"hide"),s=t.options.direction||"vertical";e.effects.save(n,r),n.show();var o=e.effects.createWrapper(n).c
ss({overflow:"hidden"}),u=s=="vertical"?"height":"width",f=s=="vertical"?o.height():o.width();i=="show"&&o.css(u,0);var
 l={};l[u]=i=="show"?f:0,o.animate(l,t.duration,t.options.easing,function(){i=="hide"&&n.hide(),e.effects.restore(n,r),
e.effects.removeWrapper(n),t.callback&&t.callback.apply(n[0],arguments),n.dequeue()})})}}(jQuery),function(e,t){e.effec
ts.bounce=function(t){return this.queue(function(){var n=e(this),r=["position","top","bottom","left","right"],i=e.effec
ts.setMode(n,t.options.mode||"effect"),s=t.options.direction||"up",o=t.options.distance||20,u=t.options.times||5,f=t.du
ration||250;/show|hide/.test(i)&&r.push("opacity"),e.effects.save(n,r),n.show(),e.effects.createWrapper(n);var l=s=="up
"||s=="down"?"top":"left",c=s=="up"||s=="left"?"pos":"neg",o=t.options.distance||(l=="top"?n.outerHeight({margin:!0})/3
:n.outerWidth({margin:!0})/3);i=="show"&&n.css("opacity",0).css(l,c=="pos"?-o:o),i=="hide"&&(o/=u*2),i!="hide"&&u--;if(
i=="show"){var h={opacity:1};h[l]=(c=="pos"?"+=":"-=")+o,n.animate(h,f/2,t.options.easing),o/=2,u--}for(var p=0;p<u;p++
){var d={},v={};d[l]=(c=="pos"?"-=":"+=")+o,v[l]=(c=="pos"?"+=":"-=")+o,n.animate(d,f/2,t.options.easing).animate(v,f/2
,t.options.easing),o=i=="hide"?o*2:o/2}if(i=="hide"){var h={opacity:0};h[l]=(c=="pos"?"-=":"+=")+o,n.animate(h,f/2,t.op
tions.easing,function(){n.hide(),e.effects.restore(n,r),e.effects.removeWrapper(n),t.callback&&t.callback.apply(this,ar
guments)})}else{var d={},v={};d[l]=(c=="pos"?"-=":"+=")+o,v[l]=(c=="pos"?"+=":"-=")+o,n.animate(d,f/2,t.options.easing)
.animate(v,f/2,t.options.easing,function(){e.effects.restore(n,r),e.effects.removeWrapper(n),t.callback&&t.callback.app
ly(this,arguments)})}n.queue("fx",function(){n.dequeue()}),n.dequeue()})}}(jQuery),function(e,t){e.effects.clip=functio
n(t){return this.queue(function(){var n=e(this),r=["position","top","bottom","left","right","height","width"],i=e.effec
ts.setMode(n,t.options.mode||"hide"),s=t.options.direction||"vertical";e.effects.save(n,r),n.show();var o=e.effects.cre
ateWrapper(n).css({overflow:"hidden"}),u=n[0].tagName=="IMG"?o:n,f={size:s=="vertical"?"height":"width",position:s=="ve
rtical"?"top":"left"},l=s=="vertical"?u.height():u.width();i=="show"&&(u.css(f.size,0),u.css(f.position,l/2));var c={};
c[f.size]=i=="show"?l:0,c[f.position]=i=="show"?0:l/2,u.animate(c,{queue:!1,duration:t.duration,easing:t.options.easing
,complete:function(){i=="hide"&&n.hide(),e.effects.restore(n,r),e.effects.removeWrapper(n),t.callback&&t.callback.apply
(n[0],arguments),n.dequeue()}})})}}(jQuery),function(e,t){e.effects.drop=function(t){return this.queue(function(){var n
=e(this),r=["position","top","bottom","left","right","opacity"],i=e.effects.setMode(n,t.options.mode||"hide"),s=t.optio
ns.direction||"left";e.effects.save(n,r),n.show(),e.effects.createWrapper(n);var o=s=="up"||s=="down"?"top":"left",u=s=
="up"||s=="left"?"pos":"neg",f=t.options.distance||(o=="top"?n.outerHeight({margin:!0})/2:n.outerWidth({margin:!0})/2);
i=="show"&&n.css("opacity",0).css(o,u=="pos"?-f:f);var l={opacity:i=="show"?1:0};l[o]=(i=="show"?u=="pos"?"+=":"-=":u==
"pos"?"-=":"+=")+f,n.animate(l,{queue:!1,duration:t.duration,easing:t.options.easing,complete:function(){i=="hide"&&n.h
ide(),e.effects.restore(n,r),e.effects.removeWrapper(n),t.callback&&t.callback.apply(this,arguments),n.dequeue()}})})}}
(jQuery),function(e,t){e.effects.explode=function(t){return this.queue(function(){var n=t.options.pieces?Math.round(Mat
h.sqrt(t.options.pieces)):3,r=t.options.pieces?Math.round(Math.sqrt(t.options.pieces)):3;t.options.mode=t.options.mode=
="toggle"?e(this).is(":visible")?"hide":"show":t.options.mode;var i=e(this).show().css("visibility","hidden"),s=i.offse
t();s.top-=parseInt(i.css("marginTop"),10)||0,s.left-=parseInt(i.css("marginLeft"),10)||0;var o=i.outerWidth(!0),u=i.ou
terHeight(!0);for(var f=0;f<n;f++)for(var l=0;l<r;l++)i.clone().appendTo("body").wrap("<div></div>").css({position:"abs
olute",visibility:"visible",left:-l*(o/r),top:-f*(u/n)}).parent().addClass("ui-effects-explode").css({position:"absolut
e",overflow:"hidden",width:o/r,height:u/n,left:s.left+l*(o/r)+(t.options.mode=="show"?(l-Math.floor(r/2))*(o/r):0),top:
s.top+f*(u/n)+(t.options.mode=="show"?(f-Math.floor(n/2))*(u/n):0),opacity:t.options.mode=="show"?0:1}).animate({left:s
.left+l*(o/r)+(t.options.mode=="show"?0:(l-Math.floor(r/2))*(o/r)),top:s.top+f*(u/n)+(t.options.mode=="show"?0:(f-Math.
floor(n/2))*(u/n)),opacity:t.options.mode=="show"?1:0},t.duration||500);setTimeout(function(){t.options.mode=="show"?i.
css({visibility:"visible"}):i.css({visibility:"visible"}).hide(),t.callback&&t.callback.apply(i[0]),i.dequeue(),e("div.
ui-effects-explode").remove()},t.duration||500)})}}(jQuery),function(e,t){e.effects.fade=function(t){return this.queue(
function(){var n=e(this),r=e.effects.setMode(n,t.options.mode||"hide");n.animate({opacity:r},{queue:!1,duration:t.durat
ion,easing:t.options.easing,complete:function(){t.callback&&t.callback.apply(this,arguments),n.dequeue()}})})}}(jQuery)
,function(e,t){e.effects.fold=function(t){return this.queue(function(){var n=e(this),r=["position","top","bottom","left
","right"],i=e.effects.setMode(n,t.options.mode||"hide"),s=t.options.size||15,o=!!t.options.horizFirst,u=t.duration?t.d
uration/2:e.fx.speeds._default/2;e.effects.save(n,r),n.show();var f=e.effects.createWrapper(n).css({overflow:"hidden"})
,l=i=="show"!=o,c=l?["width","height"]:["height","width"],h=l?[f.width(),f.height()]:[f.height(),f.width()],p=/([0-9]+)
%/.exec(s);p&&(s=parseInt(p[1],10)/100*h[i=="hide"?0:1]),i=="show"&&f.css(o?{height:0,width:s}:{height:s,width:0});var 
d={},v={};d[c[0]]=i=="show"?h[0]:s,v[c[1]]=i=="show"?h[1]:0,f.animate(d,u,t.options.easing).animate(v,u,t.options.easin
g,function(){i=="hide"&&n.hide(),e.effects.restore(n,r),e.effects.removeWrapper(n),t.callback&&t.callback.apply(n[0],ar
guments),n.dequeue()})})}}(jQuery),function(e,t){e.effects.highlight=function(t){return this.queue(function(){var n=e(t
his),r=["backgroundImage","backgroundColor","opacity"],i=e.effects.setMode(n,t.options.mode||"show"),s={backgroundColor
:n.css("backgroundColor")};i=="hide"&&(s.opacity=0),e.effects.save(n,r),n.show().css({backgroundImage:"none",background
Color:t.options.color||"#ffff99"}).animate(s,{queue:!1,duration:t.duration,easing:t.options.easing,complete:function(){
i=="hide"&&n.hide(),e.effects.restore(n,r),i=="show"&&!e.support.opacity&&this.style.removeAttribute("filter"),t.callba
ck&&t.callback.apply(this,arguments),n.dequeue()}})})}}(jQuery),function(e,t){e.effects.pulsate=function(t){return this
.queue(function(){var n=e(this),r=e.effects.setMode(n,t.options.mode||"show");times=(t.options.times||5)*2-1,duration=t
.duration?t.duration/2:e.fx.speeds._default/2,isVisible=n.is(":visible"),animateTo=0,isVisible||(n.css("opacity",0).sho
w(),animateTo=1),(r=="hide"&&isVisible||r=="show"&&!isVisible)&&times--;for(var i=0;i<times;i++)n.animate({opacity:anim
ateTo},duration,t.options.easing),animateTo=(animateTo+1)%2;n.animate({opacity:animateTo},duration,t.options.easing,fun
ction(){animateTo==0&&n.hide(),t.callback&&t.callback.apply(this,arguments)}),n.queue("fx",function(){n.dequeue()}).deq
ueue()})}}(jQuery),function(e,t){e.effects.puff=function(t){return this.queue(function(){var n=e(this),r=e.effects.setM
ode(n,t.options.mode||"hide"),i=parseInt(t.options.percent,10)||150,s=i/100,o={height:n.height(),width:n.width()};e.ext
end(t.options,{fade:!0,mode:r,percent:r=="hide"?i:100,from:r=="hide"?o:{height:o.height*s,width:o.width*s}}),n.effect("
scale",t.options,t.duration,t.callback),n.dequeue()})},e.effects.scale=function(t){return this.queue(function(){var n=e
(this),r=e.extend(!0,{},t.options),i=e.effects.setMode(n,t.options.mode||"effect"),s=parseInt(t.options.percent,10)||(p
arseInt(t.options.percent,10)==0?0:i=="hide"?0
:100),o=t.options.direction||"both",u=t.options.origin;i!="effect"&&(r.origin=u||["middle","center"],r.restore=!0);var 
f={height:n.height(),width:n.width()};n.from=t.options.from||(i=="show"?{height:0,width:0}:f);var l={y:o!="horizontal"?
s/100:1,x:o!="vertical"?s/100:1};n.to={height:f.height*l.y,width:f.width*l.x},t.options.fade&&(i=="show"&&(n.from.opaci
ty=0,n.to.opacity=1),i=="hide"&&(n.from.opacity=1,n.to.opacity=0)),r.from=n.from,r.to=n.to,r.mode=i,n.effect("size",r,t
.duration,t.callback),n.dequeue()})},e.effects.size=function(t){return this.queue(function(){var n=e(this),r=["position
","top","bottom","left","right","width","height","overflow","opacity"],i=["position","top","bottom","left","right","ove
rflow","opacity"],s=["width","height","overflow"],o=["fontSize"],u=["borderTopWidth","borderBottomWidth","paddingTop","
paddingBottom"],f=["borderLeftWidth","borderRightWidth","paddingLeft","paddingRight"],l=e.effects.setMode(n,t.options.m
ode||"effect"),c=t.options.restore||!1,h=t.options.scale||"both",p=t.options.origin,d={height:n.height(),width:n.width(
)};n.from=t.options.from||d,n.to=t.options.to||d;if(p){var v=e.effects.getBaseline(p,d);n.from.top=(d.height-n.from.hei
ght)*v.y,n.from.left=(d.width-n.from.width)*v.x,n.to.top=(d.height-n.to.height)*v.y,n.to.left=(d.width-n.to.width)*v.x}
var m={from:{y:n.from.height/d.height,x:n.from.width/d.width},to:{y:n.to.height/d.height,x:n.to.width/d.width}};if(h=="
box"||h=="both")m.from.y!=m.to.y&&(r=r.concat(u),n.from=e.effects.setTransition(n,u,m.from.y,n.from),n.to=e.effects.set
Transition(n,u,m.to.y,n.to)),m.from.x!=m.to.x&&(r=r.concat(f),n.from=e.effects.setTransition(n,f,m.from.x,n.from),n.to=
e.effects.setTransition(n,f,m.to.x,n.to));(h=="content"||h=="both")&&m.from.y!=m.to.y&&(r=r.concat(o),n.from=e.effects.
setTransition(n,o,m.from.y,n.from),n.to=e.effects.setTransition(n,o,m.to.y,n.to)),e.effects.save(n,c?r:i),n.show(),e.ef
fects.createWrapper(n),n.css("overflow","hidden").css(n.from);if(h=="content"||h=="both")u=u.concat(["marginTop","margi
nBottom"]).concat(o),f=f.concat(["marginLeft","marginRight"]),s=r.concat(u).concat(f),n.find("*[width]").each(function(
){child=e(this),c&&e.effects.save(child,s);var n={height:child.height(),width:child.width()};child.from={height:n.heigh
t*m.from.y,width:n.width*m.from.x},child.to={height:n.height*m.to.y,width:n.width*m.to.x},m.from.y!=m.to.y&&(child.from
=e.effects.setTransition(child,u,m.from.y,child.from),child.to=e.effects.setTransition(child,u,m.to.y,child.to)),m.from
.x!=m.to.x&&(child.from=e.effects.setTransition(child,f,m.from.x,child.from),child.to=e.effects.setTransition(child,f,m
.to.x,child.to)),child.css(child.from),child.animate(child.to,t.duration,t.options.easing,function(){c&&e.effects.resto
re(child,s)})});n.animate(n.to,{queue:!1,duration:t.duration,easing:t.options.easing,complete:function(){n.to.opacity==
=0&&n.css("opacity",n.from.opacity),l=="hide"&&n.hide(),e.effects.restore(n,c?r:i),e.effects.removeWrapper(n),t.callbac
k&&t.callback.apply(this,arguments),n.dequeue()}})})}}(jQuery),function(e,t){e.effects.shake=function(t){return this.qu
eue(function(){var n=e(this),r=["position","top","bottom","left","right"],i=e.effects.setMode(n,t.options.mode||"effect
"),s=t.options.direction||"left",o=t.options.distance||20,u=t.options.times||3,f=t.duration||t.options.duration||140;e.
effects.save(n,r),n.show(),e.effects.createWrapper(n);var l=s=="up"||s=="down"?"top":"left",c=s=="up"||s=="left"?"pos":
"neg",h={},p={},d={};h[l]=(c=="pos"?"-=":"+=")+o,p[l]=(c=="pos"?"+=":"-=")+o*2,d[l]=(c=="pos"?"-=":"+=")+o*2,n.animate(
h,f,t.options.easing);for(var v=1;v<u;v++)n.animate(p,f,t.options.easing).animate(d,f,t.options.easing);n.animate(p,f,t
.options.easing).animate(h,f/2,t.options.easing,function(){e.effects.restore(n,r),e.effects.removeWrapper(n),t.callback
&&t.callback.apply(this,arguments)}),n.queue("fx",function(){n.dequeue()}),n.dequeue()})}}(jQuery),function(e,t){e.effe
cts.slide=function(t){return this.queue(function(){var n=e(this),r=["position","top","bottom","left","right"],i=e.effec
ts.setMode(n,t.options.mode||"show"),s=t.options.direction||"left";e.effects.save(n,r),n.show(),e.effects.createWrapper
(n).css({overflow:"hidden"});var o=s=="up"||s=="down"?"top":"left",u=s=="up"||s=="left"?"pos":"neg",f=t.options.distanc
e||(o=="top"?n.outerHeight({margin:!0}):n.outerWidth({margin:!0}));i=="show"&&n.css(o,u=="pos"?isNaN(f)?"-"+f:-f:f);var
 l={};l[o]=(i=="show"?u=="pos"?"+=":"-=":u=="pos"?"-=":"+=")+f,n.animate(l,{queue:!1,duration:t.duration,easing:t.optio
ns.easing,complete:function(){i=="hide"&&n.hide(),e.effects.restore(n,r),e.effects.removeWrapper(n),t.callback&&t.callb
ack.apply(this,arguments),n.dequeue()}})})}}(jQuery),function(e,t){e.effects.transfer=function(t){return this.queue(fun
ction(){var n=e(this),r=e(t.options.to),i=r.offset(),s={top:i.top,left:i.left,height:r.innerHeight(),width:r.innerWidth
()},o=n.offset(),u=e('<div class="ui-effects-transfer"></div>').appendTo(document.body).addClass(t.options.className).c
ss({top:o.top,left:o.left,height:n.innerHeight(),width:n.innerWidth(),position:"absolute"}).animate(s,t.duration,t.opti
ons.easing,function(){u.remove(),t.callback&&t.callback.apply(n[0],arguments),n.dequeue()})})}}(jQuery);
//     Underscore.js 1.3.1
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore
(function(){function C(e,t,n){if(e===t)return e!==0||1/e==1/t;if(e==null||t==null)return e===t;e._chain&&(e=e._wrapped)
,t._chain&&(t=t._wrapped);if(e.isEqual&&S.isFunction(e.isEqual))return e.isEqual(t);if(t.isEqual&&S.isFunction(t.isEqua
l))return t.isEqual(e);var r=a.call(e);if(r!=a.call(t))return!1;switch(r){case"[object String]":return e==String(t);cas
e"[object Number]":return e!=+e?t!=+t:e==0?1/e==1/t:e==+t;case"[object Date]":case"[object Boolean]":return+e==+t;case"
[object RegExp]":return e.source==t.source&&e.global==t.global&&e.multiline==t.multiline&&e.ignoreCase==t.ignoreCase}if
(typeof e!="object"||typeof t!="object")return!1;var i=n.length;while(i--)if(n[i]==e)return!0;n.push(e);var s=0,o=!0;if
(r=="[object Array]"){s=e.length,o=s==t.length;if(o)while(s--)if(!(o=s in e==s in t&&C(e[s],t[s],n)))break}else{if("con
structor"in e!="constructor"in t||e.constructor!=t.constructor)return!1;for(var u in e)if(S.has(e,u)){s++;if(!(o=S.has(
t,u)&&C(e[u],t[u],n)))break}if(o){for(u in t)if(S.has(t,u)&&!(s--))break;o=!s}}return n.pop(),o}var e=this,t=e._,n={},r
=Array.prototype,i=Object.prototype,s=Function.prototype,o=r.slice,u=r.unshift,a=i.toString,f=i.hasOwnProperty,l=r.forE
ach,c=r.map,h=r.reduce,p=r.reduceRight,d=r.filter,v=r.every,m=r.some,g=r.indexOf,y=r.lastIndexOf,b=Array.isArray,w=Obje
ct.keys,E=s.bind,S=function(e){return new O(e)};typeof exports!="undefined"?(typeof module!="undefined"&&module.exports
&&(exports=module.exports=S),exports._=S):e._=S,S.VERSION="1.3.1";var x=S.each=S.forEach=function(e,t,r){if(e==null)ret
urn;if(l&&e.forEach===l)e.forEach(t,r);else if(e.length===+e.length){for(var i=0,s=e.length;i<s;i++)if(i in e&&t.call(r
,e[i],i,e)===n)return}else for(var o in e)if(S.has(e,o)&&t.call(r,e[o],o,e)===n)return};S.map=S.collect=function(e,t,n)
{var r=[];return e==null?r:c&&e.map===c?e.map(t,n):(x(e,function(e,i,s){r[r.length]=t.call(n,e,i,s)}),e.length===+e.len
gth&&(r.length=e.length),r)},S.reduce=S.foldl=S.inject=function(e,t,n,r){var i=arguments.length>2;e==null&&(e=[]);if(h&
&e.reduce===h)return r&&(t=S.bind(t,r)),i?e.reduce(t,n):e.reduce(t);x(e,function(e,s,o){i?n=t.call(r,n,e,s,o):(n=e,i=!0
)});if(!i)throw new TypeError("Reduce of empty array with no initial value");return n},S.reduceRight=S.foldr=function(e
,t,n,r){var i=arguments.length>2;e==null&&(e=[]);if(p&&e.reduceRight===p)return r&&(t=S.bind(t,r)),i?e.reduceRight(t,n)
:e.reduceRight(t);var s=S.toArray(e).reverse();return r&&!i&&(t=S.bind(t,r)),i?S.reduce(s,t,n,r):S.reduce(s,t)},S.find=
S.detect=function(e,t,n){var r;return T(e,function(e,i,s){if(t.call(n,e,i,s))return r=e,!0}),r},S.filter=S.select=funct
ion(e,t,n){var r=[];return e==null?r:d&&e.filter===d?e.filter(t,n):(x(e,function(e,i,s){t.call(n,e,i,s)&&(r[r.length]=e
)}),r)},S.reject=function(e,t,n){var r=[];return e==null?r:(x(e,function(e,i,s){t.call(n,e,i,s)||(r[r.length]=e)}),r)},
S.every=S.all=function(e,t,r){var i=!0;return e==null?i:v&&e.every===v?e.every(t,r):(x(e,function(e,s,o){if(!(i=i&&t.ca
ll(r,e,s,o)))return n}),i)};var T=S.some=S.any=function(e,t,r){t||(t=S.identity);var i=!1;return e==null?i:m&&e.some===
m?e.some(t,r):(x(e,function(e,s,o){if(i||(i=t.call(r,e,s,o)))return n}),!!i)};S.include=S.contains=function(e,t){var n=
!1;return e==null?n:g&&e.indexOf===g?e.indexOf(t)!=-1:(n=T(e,function(e){return e===t}),n)},S.invoke=function(e,t){var 
n=o.call(arguments,2);return S.map(e,function(e){return(S.isFunction(t)?t||e:e[t]).apply(e,n)})},S.pluck=function(e,t){
return S.map(e,function(e){return e[t]})},S.max=function(e,t,n){if(!t&&S.isArray(e))return Math.max.apply(Math,e);if(!t
&&S.isEmpty(e))return-Infinity;var r={computed:-Infinity};return x(e,function(e,i,s){var o=t?t.call(n,e,i,s):e;o>=r.com
puted&&(r={value:e,computed:o})}),r.value},S.min=function(e,t,n){if(!t&&S.isArray(e))return Math.min.apply(Math,e);if(!
t&&S.isEmpty(e))return Infinity;var r={computed:Infinity};return x(e,function(e,i,s){var o=t?t.call(n,e,i,s):e;o<r.comp
uted&&(r={value:e,computed:o})}),r.value},S.shuffle=function(e){var t=[],n;return x(e,function(e,r,i){r==0?t[0]=e:(n=Ma
th.floor(Math.random()*(r+1)),t[r]=t[n],t[n]=e)}),t},S.sortBy=function(e,t,n){return S.pluck(S.map(e,function(e,r,i){re
turn{value:e,criteria:t.call(n,e,r,i)}}).sort(function(e,t){var n=e.criteria,r=t.criteria;return n<r?-1:n>r?1:0}),"valu
e")},S.groupBy=function(e,t){var n={},r=S.isFunction(t)?t:function(e){return e[t]};return x(e,function(e,t){var i=r(e,t
);(n[i]||(n[i]=[])).push(e)}),n},S.sortedIndex=function(e,t,n){n||(n=S.identity);var r=0,i=e.length;while(r<i){var s=r+
i>>1;n(e[s])<n(t)?r=s+1:i=s}return r},S.toArray=function(e){return e?e.toArray?e.toArray():S.isArray(e)?o.call(e):S.isA
rguments(e)?o.call(e):S.values(e):[]},S.size=function(e){return S.toArray(e).length},S.first=S.head=function(e,t,n){ret
urn t!=null&&!n?o.call(e,0,t):e[0]},S.initial=function(e,t,n){return o.call(e,0,e.length-(t==null||n?1:t))},S.last=func
tion(e,t,n){return t!=null&&!n?o.call(e,Math.max(e.length-t,0)):e[e.length-1]},S.rest=S.tail=function(e,t,n){return o.c
all(e,t==null||n?1:t)},S.compact=function(e){return S.filter(e,function(e){return!!e})},S.flatten=function(e,t){return 
S.reduce(e,function(e,n){return S.isArray(n)?e.concat(t?n:S.flatten(n)):(e[e.length]=n,e)},[])},S.without=function(e){r
eturn S.difference(e,o.call(arguments,1))},S.uniq=S.unique=function(e,t,n){var r=n?S.map(e,n):e,i=[];return S.reduce(r,
function(n,r,s){if(0==s||(t===!0?S.last(n)!=r:!S.include(n,r)))n[n.length]=r,i[i.length]=e[s];return n},[]),i},S.union=
function(){return S.uniq(S.flatten(arguments,!0))},S.intersection=S.intersect=function(e){var t=o.call(arguments,1);ret
urn S.filter(S.uniq(e),function(e){return S.every(t,function(t){return S.indexOf(t,e)>=0})})},S.difference=function(e){
var t=S.flatten(o.call(arguments,1));return S.filter(e,function(e){return!S.include(t,e)})},S.zip=function(){var e=o.ca
ll(arguments),t=S.max(S.pluck(e,"length")),n=new Array(t);for(var r=0;r<t;r++)n[r]=S.pluck(e,""+r);return n},S.indexOf=
function(e,t,n){if(e==null)return-1;var r,i;if(n)return r=S.sortedIndex(e,t),e[r]===t?r:-1;if(g&&e.indexOf===g)return e
.indexOf(t);for(r=0,i=e.length;r<i;r++)if(r in e&&e[r]===t)return r;return-1},S.lastIndexOf=function(e,t){if(e==null)re
turn-1;if(y&&e.lastIndexOf===y)return e.lastIndexOf(t);var n=e.length;while(n--)if(n in e&&e[n]===t)return n;return-1},
S.range=function(e,t,n){arguments.length<=1&&(t=e||0,e=0),n=arguments[2]||1;var r=Math.max(Math.ceil((t-e)/n),0),i=0,s=
new Array(r);while(i<r)s[i++]=e,e+=n;return s};var N=function(){};S.bind=function(t,n){var r,i;if(t.bind===E&&E)return 
E.apply(t,o.call(arguments,1));if(!S.isFunction(t))throw new TypeError;return i=o.call(arguments,2),r=function(){if(thi
s instanceof r){N.prototype=t.prototype;var e=new N,s=t.apply(e,i.concat(o.call(arguments)));return Object(s)===s?s:e}r
eturn t.apply(n,i.concat(o.call(arguments)))}},S.bindAll=function(e){var t=o.call(arguments,1);return t.length>0&&t[0].
length>0&&(t=t[0]),t.length==0&&(t=S.functions(e)),x(t,function(t){e[t]=S.bind(e[t],e)}),e},S.memoize=function(e,t){var
 n={};return t||(t=S.identity),function(){var r=t.apply(this,arguments);return S.has(n,r)?n[r]:n[r]=e.apply(this,argume
nts)}},S.delay=function(e,t){var n=o.call(arguments,2);return setTimeout(function(){return e.apply(e,n)},t)},S.defer=fu
nction(e){return S.delay.apply(S,[e,1].concat(o.call(arguments,1)))},S.throttle=function(e,t){var n,r,i,s,o,u=S.debounc
e(function(){o=s=!1},t);return function(){n=this,r=arguments;var a=function(){i=null,o&&e.apply(n,r),u()};i||(i=setTime
out(a,t)),s?o=!0:e.apply(n,r),u(),s=!0}},S.debounce=function(e,t){var n;return function(){var r=this,i=arguments,s=func
tion(){n=null,e.apply(r,i)};clearTimeout(n),n=setTimeout(s,t)}},S.once=function(e){var t=!1,n;return function(){return 
t?n:(t=!0,n=e.apply(this,arguments))}},S.wrap=function(e,t){return function(){var n=[e].concat(o.call(arguments,0));ret
urn t.apply(this,n)}},S.compose=function(){var e=arguments;return function(){var t=arguments;for(var n=e.length-1;n>=0;
n--)t=[e[n].apply(this,t)];return t[0]}},S.after=function(e,t){return e<=0?t():function(){if(--e<1)return t.apply(this,
arguments)}},S.keys=w||function(e){if(e!==Object(e))throw new TypeError("Invalid object");var t=[];for(var n in e)S.has
(e,n)&&(t[t.length]=n);return t},S.values=function(e){return S.map(e,S.identity)},S.functions=S.methods=function(e){var
 t=[];for(var n in e)S.isFunction(e[n])&&t.push(n);return t.sort()},S.extend=function(e){return x(o.call(arguments,1),f
unction(t){for(var n in t)e[n]=t[n]}),e},S.defaults=function(e){return x(o.call(arguments,1),function(t){for(var n in t
)e[n]==null&&(e[n]=t[n])}),e},S.clone=function(e){return S.isObject(e)?S.isArray(e)?e.slice():S.extend({},e):e},S.tap=f
unction(e,t){return t(e),e},S.isEqual=function(e,t){return C(e,t,[])},S.isEmpty=function(e){if(S.isArray(e)||S.isString
(e))return e.length===0;for(var t in e)if(S.has(e,t))return!1;return!0},S.isElement=function(e){return!!e&&e.nodeType==
1},S.isArray=b||function(e){return a.call(e)=="[object Array]"},S.isObject=function(e){return e===Object(e)},S.isArgume
nts=function(e){return a.call(e)=="[object Arguments]"},S.isArguments(arguments)||(S.isArguments=function(e){return!!e&
&!!S.has(e,"callee")}),S.isFunction=function(e){return a.call(e)=="[object Function]"},S.isString=function(e){return a.
call(e)=="[object String]"},S.isNumber=function(e){return a.call(e)=="[object Number]"},S.isNaN=function(e){return e!==
e},S.isBoolean=function(e){return e===!0||e===!1||a.call(e)=="[object Boolean]"},S.isDate=function(e){return a.call(e)=
="[object Date]"},S.isRegExp=function(e){return a.call(e)=="[object RegExp]"},S.isNull=function(e){return e===null},S.i
sUndefined=function(e){return e===void 0},S.has=function(e,t){return f.call(e,t)},S.noConflict=function(){return e._=t,
this},S.identity=function(e){return e},S.times=function(e,t,n){for(var r=0;r<e;r++)t.call(n,r)},S.escape=function(e){re
turn(""+e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;"
).replace(/\//g,"&#x2F;")},S.mixin=function(e){x(S.functions(e),function(t){_(t,S[t]=e[t])})};var k=0;S.uniqueId=functi
on(e){var t=k++;return e?e+t:t},S.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<
%-([\s\S]+?)%>/g};var L=/.^/,A=function(e){return e.replace(/\\\\/g,"\\").replace(/\\'/g,"'")};S.template=function(e,t)
{var n=S.templateSettings,r="var __p=[],print=function(){__p.push.apply(__p,arguments);};with(obj||{}){__p.push('"+e.re
place(/\\/g,"\\\\").replace(/'/g,"\\'").replace(n.escape||L,function(e,t){return"',_.escape("+A(t)+"),'"}).replace(n.in
terpolate||L,function(e,t){return"',"+A(t)+",'"}).replace(n.evaluate||L,function(e,t){return"');"+A(t).replace(/[\r\n\t
]/g," ")+";__p.push('"}).replace(/\r/g,"\\r").replace(/\n/g,"\\n").replace(/\t/g,"\\t")+"');}return __p.join('');",i=ne
w Function("obj","_",r);return t?i(t,S):function(e){return i.call(this,e,S)}},S.chain=function(e){return S(e).chain()};
var O=function(e){this._wrapped=e};S.prototype=O.prototype;var M=function(e,t){return t?S(e).chain():e},_=function(e,t)
{O.prototype[e]=function(){var e=o.call(arguments);return u.call(e,this._wrapped),M(t.apply(S,e),this._chain)}};S.mixin
(S),x(["pop","push","reverse","shift","sort","splice","unshift"],function(e){var t=r[e];O.prototype[e]=function(){var n
=this._wrapped;t.apply(n,arguments);var r=n.length;return(e=="shift"||e=="splice")&&r===0&&delete n[0],M(n,this._chain)
}}),x(["concat","join","slice"],function(e){var t=r[e];O.prototype[e]=function(){return M(t.apply(this._wrapped,argumen
ts),this._chain)}}),O.prototype.chain=function(){return this._chain=!0,this},O.prototype.value=function(){return this._
wrapped}}).call(this);
/* ===================================================
 * bootstrap-transition.js v2.0.2
 * http://twitter.github.com/bootstrap/javascript.html#transitions
 * ===================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */!function(e){e(function(){"use strict";e.support.transi
tion=function(){var t=document.body||document.documentElement,n=t.style,r=n.transition!==undefined||n.WebkitTransition!
==undefined||n.MozTransition!==undefined||n.MsTransition!==undefined||n.OTransition!==undefined;return r&&{end:function
(){var t="TransitionEnd";return e.browser.webkit?t="webkitTransitionEnd":e.browser.mozilla?t="transitionend":e.browser.
opera&&(t="oTransitionEnd"),t}()}}()})}(window.jQuery),!function(e){"use strict";var t='[data-dismiss="alert"]',n=funct
ion(n){e(n).on("click",t,this.close)};n.prototype={constructor:n,close:function(t){function s(){i.trigger("closed").rem
ove()}var n=e(this),r=n.attr("data-target"),i;r||(r=n.attr("href"),r=r&&r.replace(/.*(?=#[^\s]*$)/,"")),i=e(r),i.trigge
r("close"),t&&t.preventDefault(),i.length||(i=n.hasClass("alert")?n:n.parent()),i.trigger("close").removeClass("in"),e.
support.transition&&i.hasClass("fade")?i.on(e.support.transition.end,s):s()}},e.fn.alert=function(t){return this.each(f
unction(){var r=e(this),i=r.data("alert");i||r.data("alert",i=new n(this)),typeof t=="string"&&i[t].call(r)})},e.fn.ale
rt.Constructor=n,e(function(){e("body").on("click.alert.data-api",t,n.prototype.close)})}(window.jQuery),!function(e){"
use strict";var t=function(t,n){this.$element=e(t),this.options=e.extend({},e.fn.button.defaults,n)};t.prototype={const
ructor:t,setState:function(e){var t="disabled",n=this.$element,r=n.data(),i=n.is("input")?"val":"html";e+="Text",r.rese
tText||n.data("resetText",n[i]()),n[i](r[e]||this.options[e]),setTimeout(function(){e=="loadingText"?n.addClass(t).attr
(t,t):n.removeClass(t).removeAttr(t)},0)},toggle:function(){var e=this.$element.parent('[data-toggle="buttons-radio"]')
;e&&e.find(".active").removeClass("active"),this.$element.toggleClass("active")}},e.fn.button=function(n){return this.e
ach(function(){var r=e(this),i=r.data("button"),s=typeof n=="object"&&n;i||r.data("button",i=new t(this,s)),n=="toggle"
?i.toggle():n&&i.setState(n)})},e.fn.button.defaults={loadingText:"loading..."},e.fn.button.Constructor=t,e(function(){
e("body").on("click.button.data-api","[data-toggle^=button]",function(t){var n=e(t.target);n.hasClass("btn")||(n=n.clos
est(".btn")),n.button("toggle")})})}(window.jQuery),!function(e){"use strict";var t=function(t,n){this.$element=e(t),th
is.options=e.extend({},e.fn.carousel.defaults,n),this.options.slide&&this.slide(this.options.slide),this.options.pause=
="hover"&&this.$element.on("mouseenter",e.proxy(this.pause,this)).on("mouseleave",e.proxy(this.cycle,this))};t.prototyp
e={cycle:function(){return this.interval=setInterval(e.proxy(this.next,this),this.options.interval),this},to:function(t
){var n=this.$element.find(".active"),r=n.parent().children(),i=r.index(n),s=this;if(t>r.length-1||t<0)return;return th
is.sliding?this.$element.one("slid",function(){s.to(t)}):i==t?this.pause().cycle():this.slide(t>i?"next":"prev",e(r[t])
)},pause:function(){return clearInterval(this.interval),this.interval=null,this},next:function(){if(this.sliding)return
;return this.slide("next")},prev:function(){if(this.sliding)return;return this.slide("prev")},slide:function(t,n){var r
=this.$element.find(".active"),i=n||r[t](),s=this.interval,o=t=="next"?"left":"right",u=t=="next"?"first":"last",a=this
;this.sliding=!0,s&&this.pause(),i=i.length?i:this.$element.find(".item")[u]();if(i.hasClass("active"))return;return!e.
support.transition&&this.$element.hasClass("slide")?(this.$element.trigger("slide"),r.removeClass("active"),i.addClass(
"active"),this.sliding=!1,this.$element.trigger("slid")):(i.addClass(t),i[0].offsetWidth,r.addClass(o),i.addClass(o),th
is.$element.trigger("slide"),this.$element.one(e.support.transition.end,function(){i.removeClass([t,o].join(" ")).addCl
ass("active"),r.removeClass(["active",o].join(" ")),a.sliding=!1,setTimeout(function(){a.$element.trigger("slid")},0)})
),s&&this.cycle(),this}},e.fn.carousel=function(n){return this.each(function(){var r=e(this),i=r.data("carousel"),s=typ
eof n=="object"&&n;i||r.data("carousel",i=new t(this,s)),typeof n=="number"?i.to(n):typeof n=="string"||(n=s.slide)?i[n
]():i.cycle()})},e.fn.carousel.defaults={interval:5e3,pause:"hover"},e.fn.carousel.Constructor=t,e(function(){e("body")
.on("click.carousel.data-api","[data-slide]",function(t){var n=e(this),r,i=e(n.attr("data-target")||(r=n.attr("href"))&
&r.replace(/.*(?=#[^\s]+$)/,"")),s=!i.data("modal")&&e.extend({},i.data(),n.data());i.carousel(s),t.preventDefault()})}
)}(window.jQuery),!function(e){"use strict";var t=function(t,n){this.$element=e(t),this.options=e.extend({},e.fn.collap
se.defaults,n),this.options.parent&&(this.$parent=e(this.options.parent)),this.options.toggle&&this.toggle()};t.prototy
pe={constructor:t,dimension:function(){var e=this.$element.hasClass("width");return e?"width":"height"},show:function()
{var t=this.dimension(),n=e.camelCase(["scroll",t].join("-")),r=this.$parent&&this.$parent.find(".in"),i;r&&r.length&&(
i=r.data("collapse"),r.collapse("hide"),i||r.data("collapse",null)),this.$element[t](0),this.transition("addClass","sho
w","shown"),this.$element[t](this.$element[0][n])},hide:function(){var e=this.dimension();this.reset(this.$element[e]()
),this.transition("removeClass","hide","hidden"),this.$element[e](0)},reset:function(e){var t=this.dimension();return t
his.$element.removeClass("collapse")[t](e||"auto")[0].offsetWidth,this.$element[e?"addClass":"removeClass"]("collapse")
,this},transition:function(t,n,r){var i=this,s=function(){n=="show"&&i.reset(),i.$element.trigger(r)};this.$element.tri
gger(n)[t]("in"),e.support.transition&&this.$element.hasClass("collapse")?this.$element.one(e.support.transition.end,s)
:s()},toggle:function(){this[this.$element.hasClass("in")?"hide":"show"]()}},e.fn.collapse=function(n){return this.each
(function(){var r=e(this),i=r.data("collapse"),s=typeof n=="object"&&n;i||r.data("collapse",i=new t(this,s)),typeof n==
"string"&&i[n]()})},e.fn.collapse.defaults={toggle:!0},e.fn.collapse.Constructor=t,e(function(){e("body").on("click.col
lapse.data-api","[data-toggle=collapse]",function(t){var n=e(this),r,i=n.attr("data-target")||t.preventDefault()||(r=n.
attr("href"))&&r.replace(/.*(?=#[^\s]+$)/,""),s=e(i).data("collapse")?"toggle":n.data();e(i).collapse(s)})})}(window.jQ
uery),!function(e){"use strict";function r(){e(t).parent().removeClass("open")}var t='[data-toggle="dropdown"]',n=funct
ion(t){var n=e(t).on("click.dropdown.data-api",this.toggle);e("html").on("click.dropdown.data-api",function(){n.parent(
).removeClass("open")})};n.prototype={constructor:n,toggle:function(t){var n=e(this),i=n.attr("data-target"),s,o;return
 i||(i=n.attr("href"),i=i&&i.replace(/.*(?=#[^\s]*$)/,"")),s=e(i),s.length||(s=n.parent()),o=s.hasClass("open"),r(),!o&
&s.toggleClass("open"),!1}},e.fn.dropdown=function(t){return this.each(function(){var r=e(this),i=r.data("dropdown");i|
|r.data("dropdown",i=new n(this)),typeof t=="string"&&i[t].call(r)})},e.fn.dropdown.Constructor=n,e(function(){e("html"
).on("click.dropdown.data-api",r),e("body").on("click.dropdown.data-api",t,n.prototype.toggle)})}(window.jQuery),!funct
ion(e){"use strict";function n(){var t=this,n=setTimeout(function(){t.$element.off(e.support.transition.end),r.call(t)}
,500);this.$element.one(e.support.transition.end,function(){clearTimeout(n),r.call(t)})}function r(e){this.$element.hid
e().trigger("hidden"),i.call(this)}function i(t){var n=this,r=this.$element.hasClass("fade")?"fade":"";if(this.isShown&
&this.options.backdrop){var i=e.support.transition&&r;this.$backdrop=e('<div class="modal-backdrop '+r+'" />').appendTo
(document.body),this.options.backdrop!="static"&&this.$backdrop.click(e.proxy(this.hide,this)),i&&this.$backdrop[0].off
setWidth,this.$backdrop.addClass("in"),i?this.$backdrop.one(e.support.transition.end,t):t()}else!this.isShown&&this.$ba
ckdrop?(this.$backdrop.removeClass("in"),e.support.transition&&this.$element.hasClass("fade")?this.$backdrop.one(e.supp
ort.transition.end,e.proxy(s,this)):s.call(this)):t&&t()}function s(){this.$backdrop.remove(),this.$backdrop=null}funct
ion o(){var t=this;this.isShown&&this.options.keyboard?e(document).on("keyup.dismiss.modal",function(e){e.which==27&&t.
hide()}):this.isShown||e(document).off("keyup.dismiss.modal")}var t=function(t,n){this.options=n,this.$element=e(t).del
egate('[data-dismiss="modal"]',"click.dismiss.modal",e.proxy(this.hide,this))};t.prototype={constructor:t,toggle:functi
on(){return this[this.isShown?"hide":"show"]()},show:function(){var t=this;if(this.isShown)return;e("body").addClass("m
odal-open"),this.isShown=!0,this.$element.trigger("show"),o.call(this),i.call(this,function(){var n=e.support.transitio
n&&t.$element.hasClass("fade");!t.$element.parent().length&&t.$element.appendTo(document.body),t.$element.show(),n&&t.$
element[0].offsetWidth,t.$element.addClass("in"),n?t.$element.one(e.support.transition.end,function(){t.$element.trigge
r("shown")}):t.$element.trigger("shown")})},hide:function(t){t&&t.preventDefault();if(!this.isShown)return;var i=this;t
his.isShown=!1,e("body").removeClass("modal-open"),o.call(this),this.$element.trigger("hide").removeClass("in"),e.suppo
rt.transition&&this.$element.hasClass("fade")?n.call(this):r.call(this)}},e.fn.modal=function(n){return this.each(funct
ion(){var r=e(this),i=r.data("modal"),s=e.extend({},e.fn.modal.defaults,r.data(),typeof n=="object"&&n);i||r.data("moda
l",i=new t(this,s)),typeof n=="string"?i[n]():s.show&&i.show()})},e.fn.modal.defaults={backdrop:!0,keyboard:!0,show:!0}
,e.fn.modal.Constructor=t,e(function(){e("body").on("click.modal.data-api",'[data-toggle="modal"]',function(t){var n=e(
this),r,i=e(n.attr("data-target")||(r=n.attr("href"))&&r.replace(/.*(?=#[^\s]+$)/,"")),s=i.data("modal")?"toggle":e.ext
end({},i.data(),n.data());t.preventDefault(),i.modal(s)})})}(window.jQuery),!function(e){"use strict";var t=function(e,
t){this.init("tooltip",e,t)};t.prototype={constructor:t,init:function(t,n,r){var i,s;this.type=t,this.$element=e(n),thi
s.options=this.getOptions(r),this.enabled=!0,this.options.trigger!="manual"&&(i=this.options.trigger=="hover"?"mouseent
er":"focus",s=this.options.trigger=="hover"?"mouseleave":"blur",this.$element.on(i,this.options.selector,e.proxy(this.e
nter,this)),this.$element.on(s,this.options.selector,e.proxy(this.leave,this))),this.options.selector?this._options=e.e
xtend({},this.options,{trigger:"manual",selector:""}):this.fixTitle()},getOptions:function(t){return t=e.extend({},e.fn
[this.type].defaults,t,this.$element.data()),t.delay&&typeof t.delay=="number"&&(t.delay={show:t.delay,hide:t.delay}),t
},enter:function(t){var n=e(t.currentTarget)[this.type](this._options).data(this.type);!n.options.delay||!n.options.del
ay.show?n.show():(n.hoverState="in",setTimeout(function(){n.hoverState=="in"&&n.show()},n.options.delay.show))},leave:f
unction(t){var n=e(t.currentTarget)[this.type](this._options).data(this.type);!n.options.delay||!n.options.delay.hide?n
.hide():(n.hoverState="out",setTimeout(function(){n.hoverState=="out"&&n.hide()},n.options.delay.hide))},show:function(
){var e,t,n,r,i,s,o;if(this.hasContent()&&this.enabled){e=this.tip(),this.setContent(),this.options.animation&&e.addCla
ss("fade"),s=typeof this.options.placement=="function"?this.options.placement.call(this,e[0],this.$element[0]):this.opt
ions.placement,t=/in/.test(s),e.remove().css({top:0,left:0,display:"block"}).appendTo(t?this.$element:document.body),n=
this.getPosition(t),r=e[0].offsetWidth,i=e[0].offsetHeight;switch(t?s.split(" ")[1]:s){case"bottom":o={top:n.top+n.heig
ht,left:n.left+n.width/2-r/2};break;case"top":o={top:n.top-i,left:n.left+n.width/2-r/2};break;case"left":o={top:n.top+n
.height/2-i/2,left:n.left-r};break;case"right":o={top:n.top+n.height/2-i/2,left:n.left+n.width}}e.css(o).addClass(s).ad
dClass("in")}},setContent:function(){var e=this.tip();e.find(".tooltip-inner").html(this.getTitle()),e.removeClass("fad
e in top bottom left right")},hide:function(){function r(){var t=setTimeout(function(){n.off(e.support.transition.end).
remove()},500);n.one(e.support.transition.end,function(){clearTimeout(t),n.remove()})}var t=this,n=this.tip();n.removeC
lass("in"),e.support.transition&&this.$tip.hasClass("fade")?r():n.remove()},fixTitle:function(){var e=this.$element;(e.
attr("title")||typeof e.attr("data-original-title")!="string")&&e.attr("data-original-title",e.attr("title")||"").remov
eAttr("title")},hasContent:function(){return this.getTitle()},getPosition:function(t){return e.extend({},t?{top:0,left:
0}:this.$element.offset(),{width:this.$element[0].offsetWidth,height:this.$element[0].offsetHeight})},getTitle:function
(){var e,t=this.$element,n=this.options;return e=t.attr("data-original-title")||(typeof n.title=="function"?n.title.cal
l(t[0]):n.title),e=(e||"").toString().replace(/(^\s*|\s*$)/,""),e},tip:function(){return this.$tip=this.$tip||e(this.op
tions.template)},validate:function(){this.$element[0].parentNode||(this.hide(),this.$element=null,this.options=null)},e
nable:function(){this.enabled=!0},disable:function(){this.enabled=!1},toggleEnabled:function(){this.enabled=!this.enabl
ed},toggle:function(){this[this.tip().hasClass("in")?"hide":"show"]()}},e.fn.tooltip=function(n){return this.each(funct
ion(){var r=e(this),i=r.data("tooltip"),s=typeof n=="object"&&n;i||r.data("tooltip",i=new t(this,s)),typeof n=="string"
&&i[n]()})},e.fn.tooltip.Constructor=t,e.fn.tooltip.defaults={animation:!0,delay:0,selector:!1,placement:"top",trigger:
"hover",title:"",template:'<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div
>'}}(window.jQuery),!function(e){"use strict";var t=function(e,t){this.init("popover",e,t)};t.prototype=e.extend({},e.f
n.tooltip.Constructor.prototype,{constructor:t,setContent:function(){var t=this.tip(),n=this.getTitle(),r=this.getConte
nt();t.find(".popover-title")[e.type(n)=="object"?"append":"html"](n),t.find(".popover-content > *")[e.type(r)=="object
"?"append":"html"](r),t.removeClass("fade top bottom left right in")},hasContent:function(){return this.getTitle()||thi
s.getContent()},getContent:function(){var e,t=this.$element,n=this.options;return e=t.attr("data-content")||(typeof n.c
ontent=="function"?n.content.call(t[0]):n.content),e=e.toString().replace(/(^\s*|\s*$)/,""),e},tip:function(){return th
is.$tip||(this.$tip=e(this.options.template)),this.$tip}}),e.fn.popover=function(n){return this.each(function(){var r=e
(this),i=r.data("popover"),s=typeof n=="object"&&n;i||r.data("popover",i=new t(this,s)),typeof n=="string"&&i[n]()})},e
.fn.popover.Constructor=t,e.fn.popover.defaults=e.extend({},e.fn.tooltip.defaults,{placement:"right",content:"",templat
e:'<div class="popover"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="
popover-content"><p></p></div></div></div>'})}(window.jQuery),!function(e){"use strict";function t(t,n){var r=e.proxy(t
his.process,this),i=e(t).is("body")?e(window):e(t),s;this.options=e.extend({},e.fn.scrollspy.defaults,n),this.$scrollEl
ement=i.on("scroll.scroll.data-api",r),this.selector=(this.options.target||(s=e(t).attr("href"))&&s.replace(/.*(?=#[^\s
]+$)/,"")||"")+" .nav li > a",this.$body=e("body").on("click.scroll.data-api",this.selector,r),this.refresh(),this.proc
ess()}t.prototype={constructor:t,refresh:function(){this.targets=this.$body.find(this.selector).map(function(){var t=e(
this).attr("href");return/^#\w/.test(t)&&e(t).length?t:null}),this.offsets=e.map(this.targets,function(t){return e(t).p
osition().top})},process:function(){var e=this.$scrollElement.scrollTop()+this.options.offset,t=this.offsets,n=this.tar
gets,r=this.activeTarget,i;for(i=t.length;i--;)r!=n[i]&&e>=t[i]&&(!t[i+1]||e<=t[i+1])&&this.activate(n[i])},activate:fu
nction(e){var t;this.activeTarget=e,this.$body.find(this.selector).parent(".active").removeClass("active"),t=this.$body
.find(this.selector+'[href="'+e+'"]').parent("li").addClass("active"),t.parent(".dropdown-menu")&&t.closest("li.dropdow
n").addClass("active")}},e.fn.scrollspy=function(n){return this.each(function(){var r=e(this),i=r.data("scrollspy"),s=t
ypeof n=="object"&&n;i||r.data("scrollspy",i=new t(this,s)),typeof n=="string"&&i[n]()})},e.fn.scrollspy.Constructor=t,
e.fn.scrollspy.defaults={offset:10},e(function(){e('[data-spy="scroll"]').each(function(){var t=e(this);t.scrollspy(t.d
ata())})})}(window.jQuery),!function(e){"use strict";var t=function(t){this.element=e(t)};t.prototype={constructor:t,sh
ow:function(){var t=this.element,n=t.closest("ul:not(.dropdown-menu)"),r=t.attr("data-target"),i,s;r||(r=t.attr("href")
,r=r&&r.replace(/.*(?=#[^\s]*$)/,""));if(t.parent("li").hasClass("active"))return;i=n.find(".active a").last()[0],t.tri
gger({type:"show",relatedTarget:i}),s=e(r),this.activate(t.parent("li"),n),this.activate(s,s.parent(),function(){t.trig
ger({type:"shown",relatedTarget:i})})},activate:function(t,n,r){function o(){i.removeClass("active").find("> .dropdown-
menu > .active").removeClass("active"),t.addClass("active"),s?(t[0].offsetWidth,t.addClass("in")):t.removeClass("fade")
,t.parent(".dropdown-menu")&&t.closest("li.dropdown").addClass("active"),r&&r()}var i=n.find("> .active"),s=r&&e.suppor
t.transition&&i.hasClass("fade");s?i.one(e.support.transition.end,o):o(),i.removeClass("in")}},e.fn.tab=function(n){ret
urn this.each(function(){var r=e(this),i=r.data("tab");i||r.data("tab",i=new t(this)),typeof n=="string"&&i[n]()})},e.f
n.tab.Constructor=t,e(function(){e("body").on("click.tab.data-api",'[data-toggle="tab"], [data-toggle="pill"]',function
(t){t.preventDefault(),e(this).tab("show")})})}(window.jQuery),!function(e){"use strict";var t=function(t,n){this.$elem
ent=e(t),this.options=e.extend({},e.fn.typeahead.defaults,n),this.matcher=this.options.matcher||this.matcher,this.sorte
r=this.options.sorter||this.sorter,this.highlighter=this.options.highlighter||this.highlighter,this.$menu=e(this.option
s.menu).appendTo("body"),this.source=this.options.source,this.shown=!1,this.listen()};t.prototype={constructor:t,select
:function(){var e=this.$menu.find(".active").attr("data-value");return this.$element.val(e),this.$element.change(),this
.hide()},show:function(){var t=e.extend({},this.$element.offset(),{height:this.$element[0].offsetHeight});return this.$
menu.css({top:t.top+t.height,left:t.left}),this.$menu.show(),this.shown=!0,this},hide:function(){return this.$menu.hide
(),this.shown=!1,this},lookup:function(t){var n=this,r,i;return this.query=this.$element.val(),this.query?(r=e.grep(thi
s.source,function(e){if(n.matcher(e))return e}),r=this.sorter(r),r.length?this.render(r.slice(0,this.options.items)).sh
ow():this.shown?this.hide():this):this.shown?this.hide():this},matcher:function(e){return~e.toLowerCase().indexOf(this.
query.toLowerCase())},sorter:function(e){var t=[],n=[],r=[],i;while(i=e.shift())i.toLowerCase().indexOf(this.query.toLo
werCase())?~i.indexOf(this.query)?n.push(i):r.push(i):t.push(i);return t.concat(n,r)},highlighter:function(e){return e.
replace(new RegExp("("+this.query+")","ig"),function(e,t){return"<strong>"+t+"</strong>"})},render:function(t){var n=th
is;return t=e(t).map(function(t,r){return t=e(n.options.item).attr("data-value",r),t.find("a").html(n.highlighter(r)),t
[0]}),t.first().addClass("active"),this.$menu.html(t),this},next:function(t){var n=this.$menu.find(".active").removeCla
ss("active"),r=n.next();r.length||(r=e(this.$menu.find("li")[0])),r.addClass("active")},prev:function(e){var t=this.$me
nu.find(".active").removeClass("active"),n=t.prev();n.length||(n=this.$menu.find("li").last()),n.addClass("active")},li
sten:function(){this.$element.on("blur",e.proxy(this.blur,this)).on("keypress",e.proxy(this.keypress,this)).on("keyup",
e.proxy(this.keyup,this)),(e.browser.webkit||e.browser.msie)&&this.$element.on("keydown",e.proxy(this.keypress,this)),t
his.$menu.on("click",e.proxy(this.click,this)).on("mouseenter","li",e.proxy(this.mouseenter,this))},keyup:function(e){s
witch(e.keyCode){case 40:case 38:break;case 9:case 13:if(!this.shown)return;this.select();break;case 27:if(!this.shown)
return;this.hide();break;default:this.lookup()}e.stopPropagation(),e.preventDefault()},keypress:function(e){if(!this.sh
own)return;switch(e.keyCode){case 9:case 13:case 27:e.preventDefault();break;case 38:e.preventDefault(),this.prev();bre
ak;case 40:e.preventDefault(),this.next()}e.stopPropagation()},blur:function(e){var t=this;setTimeout(function(){t.hide
()},150)},click:function(e){e.stopPropagation(),e.preventDefault(),this.select()},mouseenter:function(t){this.$menu.fin
d(".active").removeClass("active"),e(t.currentTarget).addClass("active")}},e.fn.typeahead=function(n){return this.each(
function(){var r=e(this),i=r.data("typeahead"),s=typeof n=="object"&&n;i||r.data("typeahead",i=new t(this,s)),typeof n=
="string"&&i[n]()})},e.fn.typeahead.defaults={source:[],items:8,menu:'<ul class="typeahead dropdown-menu"></ul>',item:'
<li><a href="#"></a></li>'},e.fn.typeahead.Constructor=t,e(function(){e("body").on("focus.typeahead.data-api",'[data-pr
ovide="typeahead"]',function(t){var n=e(this);if(n.data("typeahead"))return;t.preventDefault(),n.typeahead(n.data())})}
)}(window.jQuery);
/* ============================================================
 * bootstrap-dropdown.js v2.0.3
 * http://twitter.github.com/bootstrap/javascript.html#dropdowns
 * ============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */!function(e){"use strict";function i(){e(n).parent().
removeClass("open"),t=!1}var t=!1,n='[data-toggle="dropdown"]',r=function(n){var r=this,i=e(n).on("click.dropdown.data-
api",function(e){r.clickToggle.call(r,e,this)}).on("mouseover.dropdown.data-api",function(e){r.hoverToggle.call(r,e,thi
s)});e("html").on("click.dropdown.data-api",function(){i.parent().removeClass("open")}),e("html").on("click",function()
{t=!1})};r.prototype={constructor:r,hoverToggle:function(e,n){t&&this.toggle.call(n,e)},clickToggle:function(e,t){this.
toggle.call(t,e,!0)},toggle:function(n,r){var s=e(this),o,u,a;if(s.is(".disabled, :disabled"))return;return u=s.attr("d
ata-target"),u||(u=s.attr("href"),u=u&&u.replace(/.*(?=#[^\s]*$)/,"")),o=e(u),o.length||(o=s.parent()),a=o.hasClass("op
en"),r?i():a||i(),a?r&&(t=!1):(o.toggleClass("open"),t=!0),!1}},e.fn.dropdown=function(t){return this.each(function(){v
ar n=e(this),i=n.data("dropdown");i||n.data("dropdown",i=new r(this)),typeof t=="string"&&i[t].call(n)})},e.fn.dropdown
.Constructor=r,e(function(){e("html").on("click.dropdown.data-api",i),e("body").on("click.dropdown",".dropdown form",fu
nction(e){e.stopPropagation()}).on("click.dropdown.data-api",n,function(e){r.prototype.toggle.call(this,e,!0)})})}(wind
ow.jQuery);
/*
 * Port of a script by Masanao Izumo.
 *
 * Only changes : wrap all the variables in a function and add the 
 * main function to JSZip (DEFLATE compression method).
 * Everything else was written by M. Izumo.
 *
 * Original code can be found here: http://www.onicos.com/staff/iz/amuse/javascript/expert/deflate.txt
 */if(!JSZip)throw"JSZip not defined";(function(){var e=32768,t=0,n=1,r=2,i=6,s=!0,o=32768,u=64,a=8192,f=2*e,l=3,c=258,
h=16,p=8192,d=13;p>o&&alert("error: zip_INBUFSIZ is too small"),e<<1>1<<h&&alert("error: zip_WSIZE is too large"),d>h-1
&&alert("error: zip_HASH_BITS is too large"),(d<8||c!=258)&&alert("error: Code too clever");var v=p,m=1<<d,g=m-1,y=e-1,
b=0,w=4096,E=c+l+1,S=e-E,x=1,T=15,N=7,C=29,k=256,L=256,A=k+1+C,O=30,M=19,_=16,D=17,P=18,H=2*A+1,B=parseInt((d+l-1)/l),j
,F,I,q,R=null,U,z,W,X,V,$,J,K,Q,G,Y,Z,et,tt,nt,rt,it,st,ot,ut,at,ft,lt,ct,ht,pt,dt,vt,mt,gt,yt,bt,wt,Et,St,xt,Tt,Nt,Ct,
kt,Lt,At,Ot,Mt,_t,Dt,Pt,Ht,Bt,jt,Ft,It,qt=function(){this.fc=0,this.dl=0},Rt=function(){this.dyn_tree=null,this.static_
tree=null,this.extra_bits=null,this.extra_base=0,this.elems=0,this.max_length=0,this.max_code=0},Ut=function(e,t,n,r){t
his.good_length=e,this.max_lazy=t,this.nice_length=n,this.max_chain=r},zt=function(){this.next=null,this.len=0,this.ptr
=new Array(a),this.off=0},Wt=new Array(0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0),Xt=new Array(0,0,0,0,
1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13),Vt=new Array(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7),$t=new
 Array(16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15),Jt=new Array(new Ut(0,0,0,0),new Ut(4,4,8,4),new Ut(4,5,16,8),ne
w Ut(4,6,32,32),new Ut(4,4,16,16),new Ut(8,16,32,32),new Ut(8,16,128,128),new Ut(8,32,128,256),new Ut(32,128,258,1024),
new Ut(32,258,258,4096)),Kt=function(e){var t;e?e<1?e=1:e>9&&(e=9):e=i,lt=e,q=!1,ot=!1;if(R!=null)return;j=F=I=null,R=n
ew Array(a),X=new Array(f),V=new Array(v),$=new Array(o+u),J=new Array(1<<h),pt=new Array(H);for(t=0;t<H;t++)pt[t]=new 
qt;dt=new Array(2*O+1);for(t=0;t<2*O+1;t++)dt[t]=new qt;vt=new Array(A+2);for(t=0;t<A+2;t++)vt[t]=new qt;mt=new Array(O
);for(t=0;t<O;t++)mt[t]=new qt;gt=new Array(2*M+1);for(t=0;t<2*M+1;t++)gt[t]=new qt;yt=new Rt,bt=new Rt,wt=new Rt,Et=ne
w Array(T+1),St=new Array(2*A+1),Nt=new Array(2*A+1),Ct=new Array(c-l+1),kt=new Array(512),Lt=new Array(C),At=new Array
(O),Ot=new Array(parseInt(p/8))},Qt=function(){j=F=I=null,R=null,X=null,V=null,$=null,J=null,pt=null,dt=null,vt=null,mt
=null,gt=null,yt=null,bt=null,wt=null,Et=null,St=null,Nt=null,Ct=null,kt=null,Lt=null,At=null,Ot=null},Gt=function(e){e
.next=j,j=e},Yt=function(){var e;return j!=null?(e=j,j=j.next):e=new zt,e.next=null,e.len=e.off=0,e},Zt=function(t){ret
urn J[e+t]},en=function(t,n){return J[e+t]=n},tn=function(e){R[z+U++]=e,z+U==a&&Pn()},nn=function(e){e&=65535,z+U<a-2?(
R[z+U++]=e&255,R[z+U++]=e>>>8):(tn(e&255),tn(e>>>8))},rn=function(){Y=(Y<<B^X[it+l-1]&255)&g,Z=Zt(Y),J[it&y]=Z,en(Y,it)
},sn=function(e,t){Mn(t[e].fc,t[e].dl)},on=function(e){return(e<256?kt[e]:kt[256+(e>>7)])&255},un=function(e,t,n){retur
n e[t].fc<e[n].fc||e[t].fc==e[n].fc&&Nt[t]<=Nt[n]},an=function(e,t,n){var r;for(r=0;r<n&&It<Ft.length;r++)e[t+r]=Ft.cha
rCodeAt(It++)&255;return r},fn=function(){var t;for(t=0;t<m;t++)J[e+t]=0;ft=Jt[lt].max_lazy,ct=Jt[lt].good_length,s||(h
t=Jt[lt].nice_length),at=Jt[lt].max_chain,it=0,G=0,ut=an(X,0,2*e);if(ut<=0){ot=!0,ut=0;return}ot=!1;while(ut<E&&!ot)cn(
);Y=0;for(t=0;t<l-1;t++)Y=(Y<<B^X[t]&255)&g},ln=function(e){var t=at,n=it,r,i,o=rt,u=it>S?it-S:b,a=it+c,f=X[n+o-1],l=X[
n+o];rt>=ct&&(t>>=2);do{r=e;if(X[r+o]!=l||X[r+o-1]!=f||X[r]!=X[n]||X[++r]!=X[n+1])continue;n+=2,r++;do;while(X[++n]==X[
++r]&&X[++n]==X[++r]&&X[++n]==X[++r]&&X[++n]==X[++r]&&X[++n]==X[++r]&&X[++n]==X[++r]&&X[++n]==X[++r]&&X[++n]==X[++r]&&n
<a);i=c-(a-n),n=a-c;if(i>o){st=e,o=i;if(s){if(i>=c)break}else if(i>=ht)break;f=X[n+o-1],l=X[n+o]}}while((e=J[e&y])>u&&-
-t!=0);return o},cn=function(){var t,n,r=f-ut-it;if(r==-1)r--;else if(it>=e+S){for(t=0;t<e;t++)X[t]=X[t+e];st-=e,it-=e,
G-=e;for(t=0;t<m;t++)n=Zt(t),en(t,n>=e?n-e:b);for(t=0;t<e;t++)n=J[t],J[t]=n>=e?n-e:b;r+=e}ot||(t=an(X,it+ut,r),t<=0?ot=
!0:ut+=t)},hn=function(){while(ut!=0&&F==null){var e;rn(),Z!=b&&it-Z<=S&&(nt=ln(Z),nt>ut&&(nt=ut));if(nt>=l){e=Ln(it-st
,nt-l),ut-=nt;if(nt<=ft){nt--;do it++,rn();while(--nt!=0);it++}else it+=nt,nt=0,Y=X[it]&255,Y=(Y<<B^X[it+1]&255)&g}else
 e=Ln(0,X[it]&255),ut--,it++;e&&(kn(0),G=it);while(ut<E&&!ot)cn()}},pn=function(){while(ut!=0&&F==null){rn(),rt=nt,et=s
t,nt=l-1,Z!=b&&rt<ft&&it-Z<=S&&(nt=ln(Z),nt>ut&&(nt=ut),nt==l&&it-st>w&&nt--);if(rt>=l&&nt<=rt){var e;e=Ln(it-1-et,rt-l
),ut-=rt-1,rt-=2;do it++,rn();while(--rt!=0);tt=0,nt=l-1,it++,e&&(kn(0),G=it)}else tt!=0?(Ln(0,X[it-1]&255)&&(kn(0),G=i
t),it++,ut--):(tt=1,it++,ut--);while(ut<E&&!ot)cn()}},dn=function(){if(ot)return;K=0,Q=0,gn(),fn(),F=null,U=0,z=0,lt<=3
?(rt=l-1,nt=0):(nt=l-1,tt=0),W=!1},vn=function(e,t,n){var r;if(!q){dn(),q=!0;if(ut==0)return W=!0,0}return(r=mn(e,t,n))
==n?n:W?r:(lt<=3?hn():pn(),ut==0&&(tt!=0&&Ln(0,X[it-1]&255),kn(1),W=!0),r+mn(e,r+t,n-r))},mn=function(e,t,n){var r,i,s;
r=0;while(F!=null&&r<n){i=n-r,i>F.len&&(i=F.len);for(s=0;s<i;s++)e[t+r+s]=F.ptr[F.off+s];F.off+=i,F.len-=i,r+=i;if(F.le
n==0){var o;o=F,F=F.next,Gt(o)}}if(r==n)return r;if(z<U){i=n-r,i>U-z&&(i=U-z);for(s=0;s<i;s++)e[t+r+s]=R[z+s];z+=i,r+=i
,U==z&&(U=z=0)}return r},gn=function(){var e,t,n,r,i;if(mt[0].dl!=0)return;yt.dyn_tree=pt,yt.static_tree=vt,yt.extra_bi
ts=Wt,yt.extra_base=k+1,yt.elems=A,yt.max_length=T,yt.max_code=0,bt.dyn_tree=dt,bt.static_tree=mt,bt.extra_bits=Xt,bt.e
xtra_base=0,bt.elems=O,bt.max_length=T,bt.max_code=0,wt.dyn_tree=gt,wt.static_tree=null,wt.extra_bits=Vt,wt.extra_base=
0,wt.elems=M,wt.max_length=N,wt.max_code=0,n=0;for(r=0;r<C-1;r++){Lt[r]=n;for(e=0;e<1<<Wt[r];e++)Ct[n++]=r}Ct[n-1]=r,i=
0;for(r=0;r<16;r++){At[r]=i;for(e=0;e<1<<Xt[r];e++)kt[i++]=r}i>>=7;for(;r<O;r++){At[r]=i<<7;for(e=0;e<1<<Xt[r]-7;e++)kt
[256+i++]=r}for(t=0;t<=T;t++)Et[t]=0;e=0;while(e<=143)vt[e++].dl=8,Et[8]++;while(e<=255)vt[e++].dl=9,Et[9]++;while(e<=2
79)vt[e++].dl=7,Et[7]++;while(e<=287)vt[e++].dl=8,Et[8]++;En(vt,A+1);for(e=0;e<O;e++)mt[e].dl=5,mt[e].fc=_n(e,5);yn()},
yn=function(){var e;for(e=0;e<A;e++)pt[e].fc=0;for(e=0;e<O;e++)dt[e].fc=0;for(e=0;e<M;e++)gt[e].fc=0;pt[L].fc=1,Bt=jt=0
,Mt=_t=Dt=0,Pt=0,Ht=1},bn=function(e,t){var n=St[t],r=t<<1;while(r<=xt){r<xt&&un(e,St[r+1],St[r])&&r++;if(un(e,n,St[r])
)break;St[t]=St[r],t=r,r<<=1}St[t]=n},wn=function(e){var t=e.dyn_tree,n=e.extra_bits,r=e.extra_base,i=e.max_code,s=e.ma
x_length,o=e.static_tree,u,a,f,l,c,h,p=0;for(l=0;l<=T;l++)Et[l]=0;t[St[Tt]].dl=0;for(u=Tt+1;u<H;u++){a=St[u],l=t[t[a].d
l].dl+1,l>s&&(l=s,p++),t[a].dl=l;if(a>i)continue;Et[l]++,c=0,a>=r&&(c=n[a-r]),h=t[a].fc,Bt+=h*(l+c),o!=null&&(jt+=h*(o[
a].dl+c))}if(p==0)return;do{l=s-1;while(Et[l]==0)l--;Et[l]--,Et[l+1]+=2,Et[s]--,p-=2}while(p>0);for(l=s;l!=0;l--){a=Et[
l];while(a!=0){f=St[--u];if(f>i)continue;t[f].dl!=l&&(Bt+=(l-t[f].dl)*t[f].fc,t[f].fc=l),a--}}},En=function(e,t){var n=
new Array(T+1),r=0,i,s;for(i=1;i<=T;i++)r=r+Et[i-1]<<1,n[i]=r;for(s=0;s<=t;s++){var o=e[s].dl;if(o==0)continue;e[s].fc=
_n(n[o]++,o)}},Sn=function(e){var t=e.dyn_tree,n=e.static_tree,r=e.elems,i,s,o=-1,u=r;xt=0,Tt=H;for(i=0;i<r;i++)t[i].fc
!=0?(St[++xt]=o=i,Nt[i]=0):t[i].dl=0;while(xt<2){var a=St[++xt]=o<2?++o:0;t[a].fc=1,Nt[a]=0,Bt--,n!=null&&(jt-=n[a].dl)
}e.max_code=o;for(i=xt>>1;i>=1;i--)bn(t,i);do i=St[x],St[x]=St[xt--],bn(t,x),s=St[x],St[--Tt]=i,St[--Tt]=s,t[u].fc=t[i]
.fc+t[s].fc,Nt[i]>Nt[s]+1?Nt[u]=Nt[i]:Nt[u]=Nt[s]+1,t[i].dl=t[s].dl=u,St[x]=u++,bn(t,x);while(xt>=2);St[--Tt]=St[x],wn(
e),En(t,o)},xn=function(e,t){var n,r=-1,i,s=e[0].dl,o=0,u=7,a=4;s==0&&(u=138,a=3),e[t+1].dl=65535;for(n=0;n<=t;n++){i=s
,s=e[n+1].dl;if(++o<u&&i==s)continue;o<a?gt[i].fc+=o:i!=0?(i!=r&&gt[i].fc++,gt[_].fc++):o<=10?gt[D].fc++:gt[P].fc++,o=0
,r=i,s==0?(u=138,a=3):i==s?(u=6,a=3):(u=7,a=4)}},Tn=function(e,t){var n,r=-1,i,s=e[0].dl,o=0,u=7,a=4;s==0&&(u=138,a=3);
for(n=0;n<=t;n++){i=s,s=e[n+1].dl;if(++o<u&&i==s)continue;if(o<a){do sn(i,gt);while(--o!=0)}else i!=0?(i!=r&&(sn(i,gt),
o--),sn(_,gt),Mn(o-3,2)):o<=10?(sn(D,gt),Mn(o-3,3)):(sn(P,gt),Mn(o-11,7));o=0,r=i,s==0?(u=138,a=3):i==s?(u=6,a=3):(u=7,
a=4)}},Nn=function(){var e;xn(pt,yt.max_code),xn(dt,bt.max_code),Sn(wt);for(e=M-1;e>=3;e--)if(gt[$t[e]].dl!=0)break;ret
urn Bt+=3*(e+1)+5+5+4,e},Cn=function(e,t,n){var r;Mn(e-257,5),Mn(t-1,5),Mn(n-4,4);for(r=0;r<n;r++)Mn(gt[$t[r]].dl,3);Tn
(pt,e-1),Tn(dt,t-1)},kn=function(e){var i,s,o,u;u=it-G,Ot[Dt]=Pt,Sn(yt),Sn(bt),o=Nn(),i=Bt+3+7>>3,s=jt+3+7>>3,s<=i&&(i=
s);if(u+4<=i&&G>=0){var a;Mn((t<<1)+e,3),Dn(),nn(u),nn(~u);for(a=0;a<u;a++)tn(X[G+a])}else s==i?(Mn((n<<1)+e,3),An(vt,m
t)):(Mn((r<<1)+e,3),Cn(yt.max_code+1,bt.max_code+1,o+1),An(pt,dt));yn(),e!=0&&Dn()},Ln=function(e,t){$[Mt++]=t,e==0?pt[
t].fc++:(e--,pt[Ct[t]+k+1].fc++,dt[on(e)].fc++,V[_t++]=e,Pt|=Ht),Ht<<=1,(Mt&7)==0&&(Ot[Dt++]=Pt,Pt=0,Ht=1);if(lt>2&&(Mt
&4095)==0){var n=Mt*8,r=it-G,i;for(i=0;i<O;i++)n+=dt[i].fc*(5+Xt[i]);n>>=3;if(_t<parseInt(Mt/2)&&n<parseInt(r/2))return
!0}return Mt==p-1||_t==v},An=function(e,t){var n,r,i=0,s=0,o=0,u=0,a,f;if(Mt!=0)do(i&7)==0&&(u=Ot[o++]),r=$[i++]&255,(u
&1)==0?sn(r,e):(a=Ct[r],sn(a+k+1,e),f=Wt[a],f!=0&&(r-=Lt[a],Mn(r,f)),n=V[s++],a=on(n),sn(a,t),f=Xt[a],f!=0&&(n-=At[a],M
n(n,f))),u>>=1;while(i<Mt);sn(L,e)},On=16,Mn=function(e,t){Q>On-t?(K|=e<<Q,nn(K),K=e>>On-Q,Q+=t-On):(K|=e<<Q,Q+=t)},_n=
function(e,t){var n=0;do n|=e&1,e>>=1,n<<=1;while(--t>0);return n>>1},Dn=function(){Q>8?nn(K):Q>0&&tn(K),K=0,Q=0},Pn=fu
nction(){if(U!=0){var e,t;e=Yt(),F==null?F=I=e:I=I.next=e,e.len=U-z;for(t=0;t<e.len;t++)e.ptr[t]=R[z+t];U=z=0}},Hn=func
tion(e,t){var n,r;Ft=e,It=0,typeof t=="undefined"&&(t=i),Kt(t);var s=new Array(1024),o=[];while((n=vn(s,0,s.length))>0)
{var u=new Array(n);for(r=0;r<n;r++)u[r]=String.fromCharCode(s[r]);o[o.length]=u.join("")}return Ft=null,o.join("")};JS
Zip.compressions.DEFLATE?JSZip.compressions.DEFLATE.compress=Hn:JSZip.compressions.DEFLATE={magic:"\b\0",compress:Hn}})
();
/**

JSZip - A Javascript class for generating Zip files
<http://stuartk.com/jszip>

(c) 2009 Stuart Knightley <stuart [at] stuartk.com>
Licenced under the GPLv3 and the MIT licences

Usage:
   zip = new JSZip();
   zip.file("hello.txt", "Hello, World!").add("tempfile", "nothing");
   zip.folder("images").file("smile.gif", base64Data, {base64: true});
   zip.file("Xmas.txt", "Ho ho ho !", {date : new Date("December 25, 2007 00:00:01")});
   zip.remove("tempfile");

   base64zip = zip.generate();

**//**
 * Representation a of zip file in js
 * @constructor
 * @param {String=} data the data to load, if any (optional).
 * @param {Object=} options the options for creating this objects (optional).
 */var JSZip=function(e,t){this.files={},this.root="",e&&this.load(e,t)};JSZip.signature={LOCAL_FILE_HEADER:"PK",CENT
RAL_FILE_HEADER:"PK",CENTRAL_DIRECTORY_END:"PK",ZIP64_CENTRAL_DIRECTORY_LOCATOR:"PK",ZIP64_CENTRAL_DIRECTORY_END:
"PK",DATA_DESCRIPTOR:"PK\b"},JSZip.defaults={base64:!1,binary:!1,dir:!1,date:null},JSZip.prototype=function(){var e=
function(e,t,n){this.name=e,this.data=t,this.options=n};e.prototype={asText:function(){return this.options.binary?JSZip
.prototype.utf8decode(this.data):this.data},asBinary:function(){return this.options.binary?this.data:JSZip.prototype.ut
f8encode(this.data)}};var t=function(e,t){var n="",r;for(r=0;r<t;r++)n+=String.fromCharCode(e&255),e>>>=8;return n},n=f
unction(){var e={},t,n;for(t=0;t<arguments.length;t++)for(n in arguments[t])typeof e[n]=="undefined"&&(e[n]=arguments[t
][n]);return e},r=function(e){return e=e||{},e.base64===!0&&e.binary==null&&(e.binary=!0),e=n(e,JSZip.defaults),e.date=
e.date||new Date,e},i=function(e,t,n){var i=s(e);return i&&o.call(this,i),n=r(n),this.files[e]={name:e,data:t,options:n
}},s=function(e){e.slice(-1)=="/"&&(e=e.substring(0,e.length-1));var t=e.lastIndexOf("/");return t>0?e.substring(0,t):"
"},o=function(e){e.slice(-1)!="/"&&(e+="/");if(!this.files[e]){var t=s(e);t&&o.call(this,t),i.call(this,e,"",{dir:!0})}
return this.files[e]},u=function(e,n,r){var i=n!==e.name,s=e.data,o=e.options,u,a;u=o.date.getHours(),u<<=6,u|=o.date.g
etMinutes(),u<<=5,u|=o.date.getSeconds()/2,a=o.date.getFullYear()-1980,a<<=4,a|=o.date.getMonth()+1,a<<=5,a|=o.date.get
Date(),o.base64===!0&&(s=JSZipBase64.decode(s)),o.binary===!1&&(s=this.utf8encode(s));var f=JSZip.compressions[r],l=f.c
ompress(s),c="";return c+="\n\0",c+=i?"\0\b":"\0\0",c+=f.magic,c+=t(u,2),c+=t(a,2),c+=t(this.crc32(s),4),c+=t(l.length,
4),c+=t(s.length,4),c+=t(n.length,2),c+="\0\0",{header:c,compressedData:l}};return{load:function(e,t){throw new Error("
Load method is not defined. Is the file jszip-load.js included ?")},filter:function(t){var r=[],i,s,o,u;for(i in this.f
iles)o=this.files[i],u=new e(o.name,o.data,n(o.options)),s=i.slice(this.root.length,i.length),i.slice(0,this.root.lengt
h)===this.root&&t(s,u)&&r.push(u);return r},file:function(e,t,n){if(arguments.length===1){if(e instanceof RegExp){var r
=e;return this.filter(function(e,t){return!t.options.dir&&r.test(e)})}return this.filter(function(t,n){return!n.options
.dir&&t===e})[0]||null}return e=this.root+e,i.call(this,e,t,n),this},folder:function(e){if(!e)throw new Error("folder :
 wrong argument");if(e instanceof RegExp)return this.filter(function(t,n){return n.options.dir&&e.test(t)});var t=this.
root+e,n=o.call(this,t),r=this.clone();return r.root=n.name,r},remove:function(e){e=this.root+e;var t=this.files[e];t||
(e.slice(-1)!="/"&&(e+="/"),t=this.files[e]);if(t)if(!t.options.dir)delete this.files[e];else{var n=this.filter(functio
n(t,n){return n.name.slice(0,e.length)===e});for(var r=0;r<n.length;r++)delete this.files[n[r].name]}return this},gener
ate:function(e){e=n(e||{},{base64:!0,compression:"STORE"});var r=e.compression.toUpperCase(),i=[],s=[],o=0;if(!JSZip.co
mpressions[r])throw r+" is not a valid compression method !";for(var a in this.files){if(!this.files.hasOwnProperty(a))
continue;var f=this.files[a],l=this.utf8encode(f.name),c="",h="",p=u.call(this,f,l,r);c=JSZip.signature.LOCAL_FILE_HEAD
ER+p.header+l+p.compressedData,h=JSZip.signature.CENTRAL_FILE_HEADER+"\0"+p.header+"\0\0"+"\0\0"+"\0\0"+(this.files[a]
.dir===!0?"\0\0\0":"\0\0\0\0")+t(o,4)+l,o+=c.length,s.push(c),i.push(h)}var d=s.join(""),v=i.join(""),m="";m=JSZip.sig
nature.CENTRAL_DIRECTORY_END+"\0\0"+"\0\0"+t(s.length,2)+t(s.length,2)+t(v.length,4)+t(d.length,4)+"\0\0";var g=d+v+m;r
eturn e.base64?JSZipBase64.encode(g):g},crc32:function(e,t){if(e===""||typeof e=="undefined")return 0;var n="00000000 7
7073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B
82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C
9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8F
A 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 
CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EF
D5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B
51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D
49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846
 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5
EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD
277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F
268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED
5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 
A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2B
B45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 0500
5713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16
CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE
 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 3
0B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40
BBE37 C30C8EA1 5A05DF1B 2D02EF8D";typeof t=="undefined"&&(t=0);var r=0,i=0;t^=-1;for(var s=0,o=e.length;s<o;s++)i=(t^e.
charCodeAt(s))&255,r="0x"+n.substr(i*9,8),t=t>>>8^r;return t^-1},clone:function(){var e=new JSZip;for(var t in this)typ
eof this[t]!="function"&&(e[t]=this[t]);return e},utf8encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0
;n<e.length;n++){var r=e.charCodeAt(n);r<128?t+=String.fromCharCode(r):r>127&&r<2048?(t+=String.fromCharCode(r>>6|192),
t+=String.fromCharCode(r&63|128)):(t+=String.fromCharCode(r>>12|224),t+=String.fromCharCode(r>>6&63|128),t+=String.from
CharCode(r&63|128))}return t},utf8decode:function(e){var t="",n=0,r=0,i=0,s=0,o=0;while(n<e.length)r=e.charCodeAt(n),r<
128?(t+=String.fromCharCode(r),n++):r>191&&r<224?(s=e.charCodeAt(n+1),t+=String.fromCharCode((r&31)<<6|s&63),n+=2):(s=e
.charCodeAt(n+1),o=e.charCodeAt(n+2),t+=String.fromCharCode((r&15)<<12|(s&63)<<6|o&63),n+=3);return t}}}(),JSZip.compre
ssions={STORE:{magic:"\0\0",compress:function(e){return e},uncompress:function(e){return e}}};var JSZipBase64=function(
){var e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";return{encode:function(t,n){var r="",i,s,o,
u,a,f,l,c=0;while(c<t.length)i=t.charCodeAt(c++),s=t.charCodeAt(c++),o=t.charCodeAt(c++),u=i>>2,a=(i&3)<<4|s>>4,f=(s&15
)<<2|o>>6,l=o&63,isNaN(s)?f=l=64:isNaN(o)&&(l=64),r=r+e.charAt(u)+e.charAt(a)+e.charAt(f)+e.charAt(l);return r},decode:
function(t,n){var r="",i,s,o,u,a,f,l,c=0;t=t.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(c<t.length)u=e.indexOf(t.charAt(c+
+)),a=e.indexOf(t.charAt(c++)),f=e.indexOf(t.charAt(c++)),l=e.indexOf(t.charAt(c++)),i=u<<2|a>>4,s=(a&15)<<4|f>>2,o=(f&
3)<<6|l,r+=String.fromCharCode(i),f!=64&&(r+=String.fromCharCode(s)),l!=64&&(r+=String.fromCharCode(o));return r}}}();
