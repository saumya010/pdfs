import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";

import pdfTemplate from "./documents/index.js";

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let browserPromise;
const getBrowser = () => {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({ headless: true });
  }
  return browserPromise;
};

app.post("/create-pdf", async (req, res) => {
  const { name, receiptId, items, taxRate, currency } = req.body;

  if (!name || !receiptId) {
    return res.status(400).json({ error: "name and receiptId are required" });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "at least one item is required" });
  }

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(pdfTemplate({ name, receiptId, items, taxRate, currency }), {
      waitUntil: "networkidle0",
    });
    const pdfBytes = await page.pdf({ format: "A4" });
    await page.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=receipt.pdf",
    });
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("Failed to generate PDF:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

app.listen(port, () => console.log(`Listening on port ${port}`));

process.on("SIGINT", async () => {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
  }
  process.exit(0);
});
