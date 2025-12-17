// utils/splunk.js
const https = require('https');
const fetch = require('node-fetch'); // if not already installed: npm install node-fetch

// Create HTTPS agent (ignore self-signed certs on localhost)
const agent = new https.Agent({ rejectUnauthorized: false });

// Function to send logs to Splunk HEC
async function logEvent(event, data = {}) {
  try {
    const url = `${process.env.SPLUNK_URL}/services/collector/event`;
    const token = process.env.SPLUNK_TOKEN;

    const payload = {
      event: { event, ...data },
      sourcetype: '_json',
      index: process.env.SPLUNK_INDEX || 'main',
      source: process.env.SPLUNK_SOURCE || 'finai_backend',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Splunk ${token}` },
      body: JSON.stringify(payload),
      agent: url.startsWith('https') ? agent : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Splunk log failed:', response.status, text);
    } else {
      console.log('✅ Splunk log sent successfully');
    }
  } catch (error) {
    console.error('❌ Splunk log error:', error.message);
  }
}

module.exports = { logEvent };
