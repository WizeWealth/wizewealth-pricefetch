import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import cron from 'node-cron';

const STOCK_SYMBOLS = {
  "JWL.NS": "Jupiter Wagons",
  "OLECTRA.NS": "Olectra Greentech"
};

const OUTPUT_PATH = path.join("public", "stockprices.json");

async function fetchPrices() {
  try {
    const dataToSave = {
      timestamp: new Date().toISOString(),
      prices: {}
    };

    for (const symbol in STOCK_SYMBOLS) {
      const name = STOCK_SYMBOLS[symbol];
      const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      
      const quoteResponse = await axios.get(chartUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const price = quoteResponse.data.chart.result[0].meta.regularMarketPrice;

      if (price && !isNaN(price)) {
        dataToSave.prices[symbol] = {
          name,
          price
        };
        console.log(`✅ ${name} (${symbol}): ₹${price}`);
      } else {
        console.warn(`❌ No price found for ${name} (${symbol})`);
      }
    }

    await fs.ensureDir('public');
    await fs.writeJson(OUTPUT_PATH, dataToSave, { spaces: 2 });

    console.log("✅ Stock prices saved at", dataToSave.timestamp);

  } catch (error) {
    console.error("❌ Failed to fetch stock prices:", error.message);
  }
}

// 🔁 Schedule the job at 10 AM, 12 PM, 2 PM, 4 PM (Mon–Fri)
cron.schedule('0 10,12,14,16 * * 1-5', fetchPrices, {
  timezone: 'Asia/Kolkata'
});

// TEST RUN at 7:20 PM IST
cron.schedule('10 20 * * *', fetchPrices, {
  timezone: 'Asia/Kolkata'
});

console.log("🕒 Stock price cron job scheduled (Mon–Fri, 10AM–4PM IST)");

