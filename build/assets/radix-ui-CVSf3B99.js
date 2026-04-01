import{r as v}from"./sonner-CZ3C-vWh.js";var a={exports:{}},s={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var x;function O(){if(x)return s;x=1;var e=v(),u=Symbol.for("react.element"),i=Symbol.for("react.fragment"),f=Object.prototype.hasOwnProperty,n=e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,o={key:!0,ref:!0,__self:!0,__source:!0};function _(p,r,m){var t,c={},l=null,R=null;m!==void 0&&(l=""+m),r.key!==void 0&&(l=""+r.key),r.ref!==void 0&&(R=r.ref);for(t in r)f.call(r,t)&&!o.hasOwnProperty(t)&&(c[t]=r[t]);if(p&&p.defaultProps)for(t in r=p.defaultProps,r)c[t]===void 0&&(c[t]=r[t]);return{$$typeof:u,type:p,key:l,ref:R,props:c,_owner:n.current}}return s.Fragment=i,s.jsx=_,s.jsxs=_,s}var y;function h(){return y||(y=1,a.exports=O()),a.exports}var j=h();function d(e,u){if(typeof e=="function")return e(u);e!=null&&(e.current=u)}function q(...e){return u=>{let i=!1;const f=e.map(n=>{const o=d(n,u);return!i&&typeof o=="function"&&(i=!0),o});if(i)return()=>{for(let n=0;n<f.length;n++){const o=f[n];typeof o=="function"?o():d(e[n],null)}}}}export{q as c,j};
