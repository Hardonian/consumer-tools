import fs from 'fs';
import path from 'path';
import { IntelligenceEngine } from './engine';
import { EmailMetadata } from './types';

// Helper to load JSON
function loadJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const v1Path = path.join(process.cwd(), 'intelligence', 'v1');

const config = loadJson(path.join(v1Path, 'config.json'));
const senderPatterns = loadJson(path.join(v1Path, 'sender_patterns.json')).patterns;
const safetyRules = loadJson(path.join(v1Path, 'safety_rules.json')).rules;
const edgeCases = loadJson(path.join(v1Path, 'edge_cases.json')).cases;

const engine = new IntelligenceEngine(config, senderPatterns, safetyRules, edgeCases);

const testEmails: EmailMetadata[] = [
  {
    sender: 'security@chase.com',
    subject: 'Urgent: Suspicious activity on your account',
    body: 'We detected a login from a new device. Please verify your identity.',
    headers: {},
    has_attachments: false
  },
  {
    sender: 'deals@groupon.com',
    subject: '50% off your next massage!',
    body: 'Click here to claim your discount now!',
    headers: { 'List-Unsubscribe': '<mailto:unsubscribe@groupon.com>' },
    has_attachments: false
  },
  {
    sender: 'no-reply@github.com',
    subject: '[GitHub] Your verification code is 123456',
    body: 'Enter this code to authorize your login: 123456',
    headers: {},
    has_attachments: false
  },
  {
    sender: 'personal.friend@gmail.com',
    subject: 'Re: Weekend plans',
    body: 'Hey, are we still meeting up on Saturday?',
    headers: {},
    has_attachments: false
  }
];

console.log('--- InboxExorcist Intelligence Engine Test ---\n');

testEmails.forEach((email, i) => {
  const report = engine.analyze(email);
  console.log(`Test Email #${i + 1}: ${email.subject}`);
  console.log(`Sender: ${email.sender}`);
  console.log(`Decision: ${report.decision.toUpperCase()}`);
  console.log(`Score: ${report.final_score}`);
  console.log(`Category: ${report.category}`);
  console.log(`Explanation: ${report.explanation}`);
  console.log(`Matched Rules: ${report.matching_rules.join(', ') || 'None'}`);
  console.log(`Matched Patterns: ${report.matching_patterns.join(', ') || 'None'}`);
  console.log('--------------------------------------------\n');
});
