const fs = require('fs');
const path = require('path');

// Read dotenv manually to avoid dependencies
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const apiKey = env.SARVAM_API_KEY;

async function testTts() {
  try {
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey,
      },
      body: JSON.stringify({
        text: 'Hello, this is a test of the text to speech service.',
        target_language_code: 'en-IN',
        speaker: 'rohan',
        model: 'bulbul:v3',
      }),
    });

    console.log('Status:', response.status);
    const json = await response.json();
    console.log('JSON Keys:', Object.keys(json));
    if (response.ok) {
      console.log('Sample of keys or first few chars of data:');
      if (json.audio_content) {
        console.log('audio_content starts with:', json.audio_content.substring(0, 100));
      } else {
        console.log(json);
      }
    } else {
      console.log('Error:', json);
    }
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}

testTts();
