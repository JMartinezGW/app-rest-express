const request = require('request-promise')

exports.checkAllProducts = async function (order, shop, myAccessToken) {
    try {
        const bundles = []
        const items = order.line_items
        items.forEach(item => {
            if (item.properties[0]) bundles.push(item.properties[0].value)
        });
        
        const bundlesIntoProducts = checkBundlesInProducts(bundles, items)
        updateInventory(bundlesIntoProducts, shop, myAccessToken)
    } catch (error) {
        console.log(error)
    }
}

const checkBundlesInProducts = (bundles, items) => {
    const bundlesIntoProducts = []
    bundles.forEach(bundle => {
        for (let i = 0; i < items.length; i++) {
            if (parseInt(bundle) === items[i].product_id) {
                bundlesIntoProducts.push(items[i])
            }
        }
    });

    return bundlesIntoProducts
}


const getVariantInformation = async (bundle, shop, accessToken) => {
    try{
        const urlProducts = 'https://' + shop + '/admin/api/2021-07/products/' + bundle.product_id + '.json'

        const paramsProducts = {
            method: 'GET',
            url: urlProducts,
            json: true,
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'content-type': 'application/json'
            }
        }

        const requestProduct = await request(paramsProducts)
        const product = requestProduct.product
        const variant = product.variants.filter((variant) => {
            return variant.id === bundle.variant_id
        })

        return variant[0]
    } catch (error) {
        console.log(error)
    }
}

const updateInventory = (bundles, shop, accessToken) => {
    try {
        bundles.forEach(async bundle => {

            const variant = getVariantInformation(bundle, shop, accessToken)
    
            const shopRequestURL = 'https://' + shop + '/admin/api/2021-07/inventory_levels/set.json';
    
            const form = {
                location_id: 65419149489,
                inventory_item_id: variant.inventory_item_id,
                available: variant.inventory_quantity - 1
            }
    
            const paramsOrders = {
                method: 'POST',
                url: shopRequestURL,
                json: true,
                headers: {
                    'X-Shopify-Access-Token': accessToken
                },
                body: form
            }
    
            const req = await request(paramsOrders)
    
        });
    } catch (error) {
        console.log(error)
    }

}