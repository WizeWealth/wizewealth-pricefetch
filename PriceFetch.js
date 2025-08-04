import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import cron from 'node-cron';
import simpleGit from 'simple-git';

const STOCK_SYMBOLS = {
  "JWL.NS": "Jupiter Wagons",
  "OLECTRA.NS": "Olectra Greentech"
};

const OUTPUT_PATH = path.join("public", "stockprices.json");
const git = simpleGit();

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

    // Commit and push to GitHub
    await git.add(OUTPUT_PATH);
    await git.addConfig('user.name', 'WizeBot Auto Commit');
await git.addConfig('user.email', 'wizewealth.ai@gmail.com');

    await git.commit(`🔄 Update stock prices @ ${new Date().toLocaleString("en-IN")}`);
    await git.push();

    console.log("✅ Stock prices pushed to GitHub.");

  } catch (error) {
    console.error("❌ Failed to fetch or push stock prices:", error.message);
  }
}

// 🔁 Schedule: 10AM, 12PM, 2PM, 4PM IST (Mon–Fri)
cron.schedule('0 10,12,14,16 * * 1-5', fetchPrices, {
  timezone: 'Asia/Kolkata'
});

// 🧪 Optional: Run once immediately for testing
fetchPrices();

console.log("🕒 Cron job scheduled (Mon–Fri @ 10AM, 12PM, 2PM, 4PM IST)");
