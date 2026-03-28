// Test script to validate organization data
// Run locally from project root: node .github/scripts/test.js

const fs = require('fs');
const orgsData = JSON.parse(fs.readFileSync('orgs/altinn-orgs.json', 'utf8'));

// Basic payload structure validation
console.log('Validating payload structure...');
if (!orgsData || typeof orgsData !== 'object') {
    console.error('❌ Root data is not an object');
    process.exit(1);
}

if (!orgsData.orgs || typeof orgsData.orgs !== 'object') {
    console.error('❌ Missing or invalid "orgs" property');
    process.exit(1);
}

const orgCount = Object.keys(orgsData.orgs).length;
console.log(`✅ Found ${orgCount} organizations`);

// Norwegian organization numbers are 9-digit strings
const isValidOrgNr = (orgnr) => /^[0-9]{9}$/.test(orgnr);
const isValidHomePage = (homePage) => /^https:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/.test(homePage);

const invalidOrgs = [];
const invalidHomePages = [];

for (const [orgKey, orgData] of Object.entries(orgsData.orgs)) {
    if (!isValidOrgNr(orgData.orgnr)) {
        invalidOrgs.push({ org: orgKey, value: orgData.orgnr });
    }
    if (!isValidHomePage(orgData.homepage)) {
        invalidHomePages.push({ org: orgKey, value: orgData.homepage });
    }
}

const allowedInvalidOrgs = new Set(['ttd']);
let hasErrors = false;

// Check organization numbers
console.log('Organizations with invalid organization numbers:');
for (const { org, value } of invalidOrgs) {
    console.log(`  ${org}: "${value}"`);
    if (!allowedInvalidOrgs.has(org)) {
        console.error(`❌ ${org} has invalid organization number value: "${value}"`);
        hasErrors = true;
    }
}

// Check home pages
console.log('Organizations with invalid home pages:');
for (const { org, value } of invalidHomePages) {
    console.log(`  ${org}: "${value}"`);
    if (!allowedInvalidOrgs.has(org)) {
        console.error(`❌ ${org} has invalid home page value: "${value}"`);
        hasErrors = true;
    }
}

if (hasErrors) {
    console.error('Validation failed: Some organizations other than ttd have invalid values');
    process.exit(1);
} else {
    console.log('✅ Validation passed: Only ttd has invalid values');
}