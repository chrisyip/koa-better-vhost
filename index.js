'use strict'

const _ = require('lodash')
const compose = require('koa-compose')

/**
 * Create vhost instance
 * @param  {String|RegExp} host     The host to match, can be string and RegExp
 * @param  {Application}   app      Koa application instance
 * @param  {Boolean}       isolated If it's `true`, create a seprated context of vhost app
 *                                  Useful when you need to use different middlewares bwtween vhosts,
 *                                  otherwise, they're sharing same middlewares with main app
 * @return {Object}
 */
const vhost = (host, app, isolated) => {
  if (!(_.isString(host) && host.trim()) && !_.isRegExp(host)) {
    throw new TypeError(`Host requires a string or a regex, but saw ${host}`)
  }

  if (!app || app.constructor && app.constructor.name !== 'Application') {
    throw new TypeError(`App requires a Koa application, but saw ${app}`)
  }

  return {
    host, app,
    middleware: compose(app.middleware),
    isolated: !!isolated
  }
}

/**
 * Craete vhosts and return Koa middleware
 * @param  {Object|Array}       config Configurations, can be an object or an Array that contains config object:
 *                                     { host, app, isolated }
 * @return {Generator Function}
 */
module.exports = config => {
  let vhosts = []

  if (Array.isArray(config)) {
    vhosts = vhosts.concat(config.map(c => vhost(c.host, c.app, c.isolated)))
  } else if (_.isObject(config)) {
    vhosts.push(vhost(config.host, config.app, config.isolated))
  } else {
    throw new TypeError(`Config requires an object or an array, but saw ${config}`)
  }

  return function* (next) {
    let host = this.hostname

    let vhost = vhosts.find(item => item.host === host || _.isRegExp(item.host) && item.host.test(host))

    if (!vhost) {
      yield* next
      return
    }

    /**
     * If isolated is true, create a separated context of vhost app instead of using main app's context
     */
    let ctx = vhost.isolated ? vhost.app.createContext(this.req, this.res) : this

    yield* vhost.middleware.call(ctx, next)

    /**
     * Copy isolated context's response to main app
     */
    if (vhost.isolated) {
      _.forIn(ctx.response.header, (val, key) => {
        if (!_.isFunction(val)) {
          this.set(key, val)
        }
      }, this)
      this.status = ctx.status
      this.body = ctx.body
      this.type = ctx.type
    }
  }
}
