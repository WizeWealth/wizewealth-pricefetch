import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';

const STOCK_SYMBOLS = ["JWL.NS", "OLECTRA.NS"];
const OUTPUT_PATH = path.join("public", "stockprices.json");

async function fetchPrices() {
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${STOCK_SYMBOLS.join(',')}`;
    const response = await axios.get(url);
    const results = response.data.quoteResponse.result;

    const dataToSave = {
      timestamp: new Date().toISOString(),
      prices: {}
    };

    for (const stock of results) {
      dataToSave.prices[stock.symbol] = stock.regularMarketPrice;
    }

    await fs.ensureDir('public');
    await fs.writeJson(OUTPUT_PATH, dataToSave, { spaces: 2 });

    console.log("✅ Stock prices saved at", dataToSave.timestamp);
  } catch (error) {
    console.error("❌ Failed to fetch stock prices:", error.message);
  }
}

fetchPrices();
