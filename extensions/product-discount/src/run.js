// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

// Use JSDoc annotations for type safety
/**
* @typedef {import("../generated/api").RunInput} RunInput
* @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
* @typedef {import("../generated/api").Target} Target
* @typedef {import("../generated/api").ProductVariant} ProductVariant
*/

/**
* @type {FunctionRunResult}
*/
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

// The configured entrypoint for the 'purchase.product-discount.run' extension target
/**
* @param {RunInput} input
* @returns {FunctionRunResult}
*/
export function run(input) {
  const discounts = {
    "tier": {
      "message": "Free Product Discount",
      "percentage": 100
      },
    "BuymoreSaveMore": {
      "message": "Buy More Save More Discount",
      "percentage": {
        "first":5,
        "second": 10 
      }
    },
    "frequentlyBoughtTogether": {
     "message": "Frequently Bought Together Discount", 
     "percentage": 5
   }
  }

  const globalMessage = "Discount Applied!!";

  const targets = input.cart.lines
  // Only include cart lines with a quantity of two or more
  // and a targetable product variant
  .filter(line => 
   line.source && line.source.value == "Rebuy" &&
    line.merchandise.__typename == "ProductVariant")
  .map(line => {
    const variant = /** @type {ProductVariant} */ (line.merchandise);
    const attribution =  (line.attribution && line.attribution.value) || '';
    return { 
      attribution,
      productVariant: {
        id: variant.id
      }
    }
  });

  const discountProductHasMap = {
    tier: {
      targets: [],
      message: globalMessage, 
      value: {
        percentage: {
          value: discounts.tier.percentage
        }
      }
    },
    BuymoreSaveMore: {
      targets: [],
      message: globalMessage, 
      value: {
        percentage: {
          value: discounts.BuymoreSaveMore.percentage.first
        }
      }
    },
    frequentlyBoughtTogether: {
      targets: [],
      message: globalMessage, 
      value: {
        percentage: {
          value: discounts.frequentlyBoughtTogether.percentage
        }
      }
    }
  }

  for(let index = 0 ; index<targets.length; index++) {
    const {attribution = '', productVariant} = targets[index];
    if(attribution && attribution == "Rebuy Tiered Progress Bar") {
      // @ts-ignore
      discountProductHasMap.tier.targets.push({
        productVariant: {...productVariant}
      })
    }
    if(attribution && attribution == "Rebuy Dynamic Product Bundle") {
      // @ts-ignore
      discountProductHasMap.frequentlyBoughtTogether.targets.push({
        productVariant: {...productVariant, quantity:1}
      })
    }
    if(attribution && attribution == "Rebuy Buy More Save More") {
      // @ts-ignore
      discountProductHasMap.frequentlyBoughtTogether.targets.push({
        productVariant
      })
    }
  }

  let {BuymoreSaveMore:{targets:BuymoreSaveMoreItems,value: {percentage:{value:percentageValue}}}} = discountProductHasMap || {}; 
  const {BuymoreSaveMore:{percentage:BuymoreSaveMorePercentage}} = discounts;

  if(BuymoreSaveMoreItems && BuymoreSaveMoreItems.length >= 2) {
    percentageValue = BuymoreSaveMorePercentage["first"];
  }
  else if(BuymoreSaveMoreItems && BuymoreSaveMoreItems.length >= 5) {
    percentageValue = BuymoreSaveMorePercentage["second"];
  }
  else {
    BuymoreSaveMoreItems = [];
  }

  const getDiscountedProductsWithTypes = Object.values(discountProductHasMap).filter((discountType)=>{
   if(discountType.targets.length) {
    return discountType;
   }
  })

  if (!targets.length) {
    // You can use STDERR for debug logs in your function
    console.error("No cart lines qualify for volume discount.");
    return EMPTY_DISCOUNT;
  }

  // The @shopify/shopify_function package applies JSON.stringify() to your function result
  // and writes it to STDOUT
  return {
    discounts: getDiscountedProductsWithTypes,
    discountApplicationStrategy: DiscountApplicationStrategy.All
  };
};
