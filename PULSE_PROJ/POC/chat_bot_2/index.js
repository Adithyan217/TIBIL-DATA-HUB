const express = require('express');
const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
const path = require('path');

// Path to your Google service account key
const SERVICE_ACCOUNT_KEY_FILE = '/home/adithyan/Downloads/pulse-dev-477810-29914c7e36e1.json';

// Google Chat API scope
const SCOPES = ['https://www.googleapis.com/auth/chat.bot'];

const app = express();
app.use(express.json());

// Function to authenticate with Google API using service account JWT
async function authorize() {
  const auth = new JWT({
    keyFile: SERVICE_ACCOUNT_KEY_FILE,
    scopes: SCOPES,
  });
  await auth.authorize();
  return auth;
}

// Function to send async message to Google Chat space
async function sendGoogleChatMessage(spaceName, message) {
  if (!spaceName) {
    throw new Error('spaceName is required to send message');
  }
  const auth = await authorize();
  const chat = google.chat({ version: 'v1', auth });

  await chat.spaces.messages.create({
    parent: spaceName,
    requestBody: message,
  });
}

// Webhook endpoint for Google Chat events
app.post('/chatbot/webhook', async (req, res) => {
  try {
    const event = req.body;

    // Correct space name extraction as per your event payload
    const spaceName = event.chat?.messagePayload?.space?.name || '';

    if (!spaceName) {
      console.error('Missing space name in request body:', JSON.stringify(event, null, 2));
      return res.status(400).send('Missing space name in request body');
    }

    const userMessage = event.chat?.messagePayload?.message?.text || 'Hello from bot!';

    const message = {
      text: `You said: ${userMessage}`,
    };

    await sendGoogleChatMessage(spaceName, message);

    // Respond immediately to webhook event with HTTP 200 to avoid timeout/not responding
    res.status(200).json({
      renderActions: {
        action: {
          navigations: [
            {
              pushCard: {
                header: { title: 'Bot Response', subtitle: 'Echo' },
                sections: [
                  {
                    widgets: [
                      { textParagraph: { text: 'You said something!' } }
                    ]
                  }
                ]
              }
            }
          ]
        }
      }
    });
      } catch (error) {
    console.error('Error in webhook handler:', error);
    // Always respond 200 to avoid Chat showing "not responding" error
    res.status(200).end();
  }
});

// Start the server
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`Google Chat bot listening on port ${PORT}`);
});
