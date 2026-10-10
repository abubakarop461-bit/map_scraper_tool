import { google } from 'googleapis';
import fs from 'fs';
import { CompanyLead } from '../types.js';
import { extractNormalizedDomain, normalizeCompanyName, extractLinkedInSlug, buildSalesNavigatorCompanyUrl } from '../engine/leads-normalizer.js';

export interface GoogleSheetsSyncResult {
  addedCount: number;
  skippedCount: number;
  totalExisting: number;
  sheetUrl: string;
}

/**
 * Extracts spreadsheet ID from either a raw ID or full Google Sheets URL
 * e.g., "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0"
 * -> "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
 */
export function extractSpreadsheetId(sheetInput: string): string {
  const trimmed = sheetInput.trim();
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  return trimmed;
}

/**
 * Creates authenticated Google Sheets API client using Service Account credentials
 */
export function getGoogleSheetsClient() {
  let credentialsJson: any = null;

  // 1. Check raw JSON or Base64 in GOOGLE_SERVICE_ACCOUNT_KEY
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY.trim();
    try {
      if (raw.startsWith('{')) {
        credentialsJson = JSON.parse(raw);
      } else {
        // Try base64
        const decoded = Buffer.from(raw, 'base64').toString('utf8');
        credentialsJson = JSON.parse(decoded);
      }
    } catch (err: any) {
      throw new Error(`[Google Sheets Error] Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY: ${err.message}`);
    }
  }

  // 2. Check file path in GOOGLE_APPLICATION_CREDENTIALS
  if (!credentialsJson && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS.trim();
    if (fs.existsSync(credPath)) {
      try {
        const fileContent = fs.readFileSync(credPath, 'utf8');
        credentialsJson = JSON.parse(fileContent);
      } catch (err: any) {
        throw new Error(`[Google Sheets Error] Failed to read GOOGLE_APPLICATION_CREDENTIALS file: ${err.message}`);
      }
    } else {
      throw new Error(`[Google Sheets Error] GOOGLE_APPLICATION_CREDENTIALS file not found at: ${credPath}`);
    }
  }

  if (!credentialsJson) {
    throw new Error(
      '[Google Sheets Error] Missing credentials. Please configure GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON) or GOOGLE_SERVICE_ACCOUNT_KEY (JSON string) in your .env file, and share your Google Sheet with the Service Account email.'
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials: credentialsJson,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Appends new company leads to the specified Google Sheet with deduplication.
 * Target Columns strictly: Company Name | LinkedIn | Website
 */
export async function appendLeadsToGoogleSheet(params: {
  spreadsheetInput: string;
  sheetName?: string;
  leads: CompanyLead[];
}): Promise<GoogleSheetsSyncResult> {
  const { spreadsheetInput, sheetName = 'Sheet1', leads } = params;
  const spreadsheetId = extractSpreadsheetId(spreadsheetInput);
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  const sheets = getGoogleSheetsClient();

  // 1. Fetch spreadsheet metadata to check/resolve existing tabs
  let targetSheetName = sheetName;
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const existingTabs = meta.data.sheets?.map((s) => s.properties?.title || '') || [];

    if (!existingTabs.includes(targetSheetName)) {
      if (existingTabs.includes('Company Leads')) {
        targetSheetName = 'Company Leads';
      } else if (targetSheetName === 'Sheet1' && existingTabs.length > 0) {
        // Create 'Company Leads' tab automatically
        try {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
              requests: [{ addSheet: { properties: { title: 'Company Leads' } } }],
            },
          });
          targetSheetName = 'Company Leads';
        } catch {
          targetSheetName = existingTabs[0];
        }
      } else {
        // Attempt to create requested tab
        try {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
              requests: [{ addSheet: { properties: { title: targetSheetName } } }],
            },
          });
        } catch {
          if (existingTabs.length > 0) {
            targetSheetName = existingTabs[0];
          }
        }
      }
    }
  } catch (err: any) {
    throw new Error(
      `[Google Sheets Error] Could not access spreadsheet (${spreadsheetId}). Make sure the Sheet is shared with your Service Account client_email as 'Editor'. Details: ${err.message}`
    );
  }

  const range = `'${targetSheetName}'!A:C`;
  let existingRows: string[][] = [];

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    existingRows = (response.data.values as string[][]) || [];
  } catch (err: any) {
    throw new Error(
      `[Google Sheets Error] Could not read range ${range}: ${err.message}`
    );
  }

  // 2. Initialize header if sheet is completely empty
  const TARGET_HEADERS = ['Company Name', 'LinkedIn', 'Website'];
  let hasHeaders = false;

  if (existingRows.length === 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${targetSheetName}'!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [TARGET_HEADERS],
      },
    });
    hasHeaders = true;
    existingRows = [TARGET_HEADERS];
  } else {
    // Check if row 0 looks like headers
    const row0 = existingRows[0].map((c) => c.toLowerCase().trim());
    if (row0.some((c) => c.includes('company') || c.includes('name') || c.includes('website') || c.includes('linkedin'))) {
      hasHeaders = true;
    }
  }

  // 3. Build deduplication index from existing rows
  const existingDomains = new Set<string>();
  const existingNames = new Set<string>();
  const existingLinkedInSlugs = new Set<string>();

  const dataRows = hasHeaders ? existingRows.slice(1) : existingRows;
  for (const row of dataRows) {
    const nameVal = row[0] || '';
    const linkedinVal = row[1] || '';
    const websiteVal = row[2] || '';

    const normName = normalizeCompanyName(nameVal);
    if (normName) existingNames.add(normName);

    const normDomain = extractNormalizedDomain(websiteVal);
    if (normDomain) existingDomains.add(normDomain);

    const lSlug = extractLinkedInSlug(linkedinVal);
    if (lSlug) existingLinkedInSlugs.add(lSlug);
  }

  // 4. Filter candidate leads against existing sheet records
  const newRowsToAppend: string[][] = [];
  let skippedCount = 0;

  for (const lead of leads) {
    const leadName = normalizeCompanyName(lead.company_name);
    const leadDomain = extractNormalizedDomain(lead.website);
    const leadLinkedInSlug = extractLinkedInSlug(lead.linkedin);

    let isDuplicate = false;

    // Check domain match
    if (leadDomain && existingDomains.has(leadDomain)) {
      isDuplicate = true;
    }

    // Check name match
    if (!isDuplicate && leadName && existingNames.has(leadName)) {
      isDuplicate = true;
    }

    // Check LinkedIn slug match
    if (!isDuplicate && leadLinkedInSlug && existingLinkedInSlugs.has(leadLinkedInSlug)) {
      isDuplicate = true;
    }

    if (isDuplicate) {
      skippedCount++;
      continue;
    }

    // Add to existing index so subsequent leads in this batch don't duplicate
    if (leadDomain) existingDomains.add(leadDomain);
    if (leadName) existingNames.add(leadName);
    if (leadLinkedInSlug) existingLinkedInSlugs.add(leadLinkedInSlug);

    // Format strictly: [Company Name, LinkedIn, Website]
    // Uses direct LinkedIn Sales Navigator URL so clicking in Google Sheet opens Sales Navigator
    const sheetLinkedIn = lead.sales_navigator_url || buildSalesNavigatorCompanyUrl(lead.company_name, lead.linkedin);

    newRowsToAppend.push([
      lead.company_name,
      sheetLinkedIn,
      lead.website || '',
    ]);
  }

  // 5. Append new unique rows
  if (newRowsToAppend.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${targetSheetName}'!A:C`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: newRowsToAppend,
      },
    });
  }

  return {
    addedCount: newRowsToAppend.length,
    skippedCount,
    totalExisting: dataRows.length,
    sheetUrl,
  };
}
