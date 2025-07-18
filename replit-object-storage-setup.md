# Replit Object Storage Setup Instructions

## Problem Identified

The bulk upload is currently using **mock storage** (development mode) instead of real Replit Object Storage. This means files are stored in memory and won't persist or be accessible for download.

## Root Cause

The environment detection logic wasn't correctly identifying the Replit environment, causing the system to use mock storage instead of real Object Storage.

## Solution Implemented

### 1. Enhanced Environment Detection
Updated the detection logic to check multiple Replit environment variables:
- `REPL_ID`
- `REPLIT_DB_URL` 
- `REPLIT_DEPLOYMENT`
- `REPLIT_DOMAINS`
- `FORCE_REPLIT_STORAGE` (for testing)

### 2. Debug Endpoints Added
- `/api/environment` - Shows current environment detection status
- `/api/user-documents/:id/storage-status` - Shows file storage status for specific documents

## Required Setup in Replit

### Step 1: Create Object Storage Bucket
1. Open your Replit workspace
2. In the left sidebar, find **"Object Storage"** tool
3. Click **"Create new bucket"**
4. Name your bucket (e.g., "compliance-documents")
5. Note the **Bucket ID** from the Settings tab

### Step 2: Update Bucket ID in Code
The hardcoded bucket ID in the code needs to match your actual bucket:

```typescript
// In server/routes.ts, find this line:
bucketId: 'replit-objstore-98b6b970-0937-4dd6-9dc9-d33d8ec62826'

// Replace with your actual bucket ID from Step 1
```

### Step 3: Verify Environment Variables
In your Replit environment, check that these variables exist:
```bash
printenv | grep REPL
```

You should see variables like:
- `REPLIT_DOMAINS`
- `REPLIT_USER`
- `REPLIT_DEV_DOMAIN`

### Step 4: Test Environment Detection
Visit: `/api/environment` to verify the system detects Replit environment correctly.

Expected response:
```json
{
  "isReplitEnvironment": true,
  "storageMode": "real-object-storage",
  "detectedVariables": {
    "REPLIT_DOMAINS": true,
    // ... other variables
  }
}
```

## Testing the Fix

### 1. Upload Test Files
- Use the bulk upload feature
- Upload 2-3 small test files
- Check the console logs for:
  ```
  ✅ File uploaded to object storage: {path}
  ✅ File existence verified in object storage: {path}
  ```

### 2. Verify in Object Storage
- Go to Object Storage tool in Replit
- You should see the uploaded files in your bucket
- Files should be organized by user ID: `{userId}/{timestamp}-{index}-{filename}`

### 3. Test Downloads
- Try downloading the uploaded files
- Check storage status: `/api/user-documents/{id}/storage-status`

## Force Testing in Development

To test Object Storage locally (for development only):
```bash
export FORCE_REPLIT_STORAGE=true
npm run dev
```

This forces the system to use real Object Storage even in development.

## Bucket ID Configuration

**IMPORTANT**: Update the bucket ID in the following locations:

```typescript
// server/routes.ts - Multiple locations
objectStorage = new ObjectStorageClient({
  bucketId: 'YOUR-ACTUAL-BUCKET-ID-HERE'
});
```

Replace `'replit-objstore-98b6b970-0937-4dd6-9dc9-d33d8ec62826'` with your actual bucket ID.

## Verification Checklist

- [ ] Object Storage bucket created in Replit
- [ ] Bucket ID updated in code  
- [ ] Environment detection working (`/api/environment` shows `isReplitEnvironment: true`)
- [ ] Files appear in Object Storage bucket after upload
- [ ] Downloads work correctly
- [ ] Console logs show real storage operations (not mock)

## Next Steps

1. **Update bucket ID** in the code with your actual bucket ID
2. **Deploy to Replit** (not just development mode)
3. **Test bulk upload** in the deployed environment
4. **Verify files appear** in Object Storage tool
5. **Test downloads** to ensure complete functionality 