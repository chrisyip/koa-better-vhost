# koa-better-vhost

[![Node version][node-image]][npm-url] [![NPM version][npm-image]][npm-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Travis CI][travis-image]][travis-url] [![Codecov][codecov-image]][codecov-url]

vhost for koajs.

Forked from [koa-vhost](https://github.com/Treri/koa-vhost).

# Install

```js
npm i koa-better-vhost
```

# Example

```js
const koa = require('koa')
const Router = require('koa-router')
const vhost = require('koa-better-vhost')

const main = koa()
main.use(require('koa-compress')())
main.use(function* (next) {
  this.today = new Date
  yield next
})

let vhosts = []

let homepage = koa()
let homepageRouter = new Router()
homepageRouter.get('/', function* (next) {
  // `this` is shared between main and homepage applications
  this.body = `Hello ${this.today.toUTCString()}`
  yield next
})

homepage.use(homepageRouter.routes())

vhosts.push({
  host: 'example.com',
  app: homepage
})

let api = koa()
api.use(function* auth (next) {
  // Do some auth job
  yield next
})

let apiRouter = new Router()
apiRouter.get('/', function* (next) {
  /**
   * Because we set this vhost is isolated, `this` is NOT shared between main and api applications
   * But `koa-compress` is still working
   */
  console.info(typeof this.today) // undefined
  this.body = `Hello from API`
  yield next
})
api.use(apiRouter.routes())

vhosts.push({
  host: /^api\.example\.com$/i,
  app: api,
  isolated: true
})

main.use(vhost(vhosts))
```

[node-image]: http://img.shields.io/node/v/koa-better-vhost.svg?style=flat-square
[npm-url]: https://npmjs.org/package/koa-better-vhost
[npm-image]: http://img.shields.io/npm/v/koa-better-vhost.svg?style=flat-square
[daviddm-url]: https://david-dm.org/chrisyip/koa-better-vhost
[daviddm-image]: http://img.shields.io/david/chrisyip/koa-better-vhost.svg?style=flat-square
[travis-url]: https://travis-ci.org/chrisyip/koa-better-vhost
[travis-image]: http://img.shields.io/travis/chrisyip/koa-better-vhost.svg?style=flat-square
[codecov-url]: https://codecov.io/github/chrisyip/koa-better-vhost
[codecov-image]: https://img.shields.io/codecov/c/github/chrisyip/koa-better-vhost.svg?style=flat-square
