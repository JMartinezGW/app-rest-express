const dotenv = require('dotenv').config()
const express = require('express')
const app = express()
const crypto = require('crypto')
const cookie = require('cookie')
const nonce = require('nonce')()
const querystring = require('querystring')
const request = require('request-promise')

const apiKey = process.env.SHOPIFY_API_KEY
const apiSecret = process.env.SHOPIFY_API_SECRET
const shop = process.env.SHOP
const scopes = process.env.SCOPES
const forwardingAddress = process.env.HOST
let myAccessToken = ''

app.get('/shopify', (req, res) => {
  // Shop Name
  const shopName = req.query.shop;
  if (shopName) {

      const shopState = nonce();
      // shopify callback redirect
      const redirectURL = forwardingAddress + '/shopify/callback';

      // Install URL for app install
      const shopifyURL = 'https://' + shopName +
          '/admin/oauth/authorize?client_id=' + apiKey +
          '&scope=' + scopes +
          '&state=' + shopState +
          '&redirect_uri=' + redirectURL;

      res.cookie('state', shopState);
      res.redirect(shopifyURL);
  } else {
      return res.status(400).send('Missing "Shop Name" parameter!!');
  }
});

app.get('/shopify/callback', (req, res) => {
  const {shop, hmac, code, state} = req.query;
  const stateCookie = cookie.parse(req.headers.cookie).state;

  if (state !== stateCookie) {
      return res.status(403).send('Request origin cannot be verified');
  }

  if (shop && hmac && code) {
      const queryMap = Object.assign({}, req.query);
      delete queryMap['signature'];
      delete queryMap['hmac'];

      const message = querystring.stringify(queryMap);
      const providedHmac = Buffer.from(hmac, 'utf-8');
      const generatedHash = Buffer.from(crypto.createHmac('sha256', apiSecret).update(message).digest('hex'), 'utf-8');

      let hashEquals = false;

      try {
          hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac);
      } catch (e) {
          hashEquals = false;
      }

      if (!hashEquals) {
          return res.status(400).send('HMAC validation failed');
      }
      const accessTokenRequestUrl = 'https://' + shop + '/admin/oauth/access_token';
      const accessTokenPayload = {
          client_id: apiKey,
          client_secret: apiSecret,
          code,
      };

      request.post(accessTokenRequestUrl, {json: accessTokenPayload})
          .then((accessTokenResponse) => {
              myAccessToken = accessTokenResponse.access_token;
              const shopRequestURL = 'https://' + shop + '/admin/api/2020-04/shop.json';
              const shopRequestHeaders = {'X-Shopify-Access-Token': myAccessToken};

              request.get(shopRequestURL, {headers: shopRequestHeaders})
                  .then((shopResponse) => {
                      res.redirect('https://' + shop + '/admin/apps');
                  })
                  .catch((error) => {
                      res.status(error.statusCode).send(error.error.error_description);
                  });
          })
          .catch((error) => {
              res.status(error.statusCode).send(error.error.error_description);
          });

  } else {
      res.status(400).send('Required parameters missing');
  }
});

app.get('/orders', async (req, res) => {
  try {

    const urlOrders = 'https://' + shop + '/admin/api/2021-07/orders.json?fulfillment_status=shipped'
    const urlCustomers = 'https://' + shop + '/admin/api/2021-07/customers.json?tag=vip'

    const paramsOrders = {
      method: 'GET',
      url: urlOrders,
      json: true,
      headers: {
        'X-Shopify-Access-Token': myAccessToken,
        'content-type': 'application/json'
      }
    }

    const paramsCustomers = {
      method: 'GET',
      url: urlCustomers,
      json: true,
      headers: {
        'X-Shopify-Access-Token': myAccessToken,
        'content-type': 'application/json'
      }
    }

    const requestOrders = await request(paramsOrders)
    const requestCustomers = await request(paramsCustomers)
    const obj = {
      orders: requestOrders.orders,
      customers: requestCustomers.customers
    }
    res.send(obj)
  } catch (error) {
    console.log(error)
  }
})

const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log('Example app listening on port 3000!')
})