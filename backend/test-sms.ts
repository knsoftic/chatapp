import dotenv from 'dotenv';
import path from 'path';
import twilio from 'twilio';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER || '+13867498045';

// Get target phone number from command line argument (e.g. npx ts-node test-sms.ts +923001234567)
const targetNumber = process.argv[2];

console.log('\n======================================================');
console.log('       📱 CHATAPP TWILIO REAL SMS TESTER 📱');
console.log('======================================================\n');

if (!accountSid || !authToken || accountSid.includes('your-twilio')) {
  console.error('❌ ERROR: Twilio Account SID or Auth Token is missing in .env!');
  process.exit(1);
}

if (!targetNumber) {
  console.log('⚠️  USAGE INSTRUCTIONS:');
  console.log('   Pass your mobile number as argument with country code (e.g. +923001234567)\n');
  console.log('   Example Command:');
  console.log('   npm run test-sms +923001234567\n');
  console.log('   or:');
  console.log('   npx ts-node test-sms.ts +923001234567\n');
  console.log('======================================================\n');
  process.exit(0);
}

// Generate random test 6-digit OTP
const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
const smsBody = `ChatApp code: ${testOtp}`;

console.log('⚙️  Twilio Configuration Loaded:');
console.log(`   - Account SID:    ${accountSid.substring(0, 8)}...${accountSid.substring(accountSid.length - 4)}`);
console.log(`   - Sender Number:  ${fromNumber}`);
console.log(`   - Target Number:  ${targetNumber}`);
console.log(`   - Test OTP Code:  ${testOtp}\n`);
console.log('🚀 Sending real SMS via Twilio API...');

const client = twilio(accountSid, authToken);

client.messages
  .create({
    body: smsBody,
    from: fromNumber,
    to: targetNumber,
  })
  .then((message) => {
    console.log('\n======================================================');
    console.log('  ✅ SMS SENT SUCCESSFULLY TO YOUR PHONE!');
    console.log('======================================================');
    console.log(`   - Message SID:   ${message.sid}`);
    console.log(`   - Status:        ${message.status}`);
    console.log(`   - Date Created:  ${message.dateCreated}`);
    console.log(`   - To Number:     ${message.to}`);
    console.log(`   - From Number:   ${message.from}`);
    console.log('======================================================');
    console.log('📲 Check your mobile phone now for the SMS containing code: ' + testOtp);
    console.log('======================================================\n');
  })
  .catch((err) => {
    console.log('\n======================================================');
    console.log('  ❌ SMS SENDING FAILED!');
    console.log('======================================================');
    console.log(`   - Error Message: ${err.message}`);
    console.log(`   - Error Code:    ${err.code || 'N/A'}`);
    console.log(`   - More Info:     ${err.moreInfo || 'N/A'}`);
    console.log('======================================================\n');
  });
