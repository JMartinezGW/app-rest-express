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
let myAccessToken = ''
const shop = process.env.SHOP
const scopes = process.env.SCOPES
const forwardingAddress = process.env.HOST

app.get('/orders', (req, res) => {
    const url = 'https://' + shop + '/admin/api/2021-07/orders.json?status=any'

    const params = {
      method: 'GET',
      url: url,
      json: true,
      headers: {
        'X-Shopify-Access-Token': myAccessToken,
        'content-type': 'application/json'
      }
    }

    request(params)
      .then((parsedBody) => {
        console.log('parsedBody')
        console.log(parsedBody)
        res.status(200).send('good')
      })
      .catch((err) => {
        console.log('err')
        console.log(err)
        res.status(500).send('good')
      })   
})

app.listen(3000, () => {
    console.log('Example app listening on port 3000!')
})