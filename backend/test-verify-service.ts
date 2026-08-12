import dotenv from 'dotenv';
import path from 'path';
import twilio from 'twilio';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID || 'VAb07656ac8a44538f04fff57cd526ec9f';
const targetNumber = process.argv[2];

console.log('\n======================================================');
console.log('    🛡️  TWILIO VERIFY API (ENGAGEMENT SUITE) TESTER 🛡️');
console.log('======================================================\n');

if (!targetNumber) {
  console.log('⚠️  USAGE INSTRUCTIONS:');
  console.log('   Pass mobile number as argument:');
  console.log('   npx ts-node test-verify-service.ts +923001234567\n');
  console.log('======================================================\n');
  process.exit(0);
}

console.log(`⚙️  Verify Service SID: ${verifySid}`);
console.log(`📲 Sending OTP via Twilio Verify API to: ${targetNumber}...\n`);

const client = twilio(accountSid, authToken);

client.verify.v2
  .services(verifySid)
  .verifications.create({ to: targetNumber, channel: 'sms' })
  .then((verification) => {
    console.log('======================================================');
    console.log('  ✅ TWILIO VERIFY SMS SENT SUCCESSFULLY!');
    console.log('======================================================');
    console.log(`   - Verification SID: ${verification.sid}`);
    console.log(`   - Service SID:      ${verification.serviceSid}`);
    console.log(`   - Status:           ${verification.status}`);
    console.log(`   - Channel:          ${verification.channel}`);
    console.log('======================================================\n');
  })
  .catch((err) => {
    console.log('======================================================');
    console.log('  ❌ TWILIO VERIFY FAILED!');
    console.log('======================================================');
    console.log(`   - Error: ${err.message}`);
    console.log('======================================================\n');
  });
