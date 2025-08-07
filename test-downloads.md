# Download Functionality Test Plan

## Summary of Changes Made

✅ **Fixed fileUrl inconsistency** - Removed API endpoint override in user documents list
✅ **Created data migration** - Script to clean up existing records with API endpoints  
✅ **Updated object storage paths** - Now uses proper folder structure: `user-documents/{userId}/{category}/{filename}`
✅ **Added validation** - Database constraint prevents API URLs in fileUrl field

## Object Storage Path Structure

**New Format**: `user-documents/{userId}/{category}/{timestamp}-{filename}`

**Examples**:
- `user-documents/1/anti-money-laundering/1703123456789-compliance-report.pdf`
- `user-documents/1/audit-report/1703123456790-financial-audit.xlsx`
- `user-documents/1/general/1703123456791-memo.docx`

## Testing Steps

### 1. Run Migration
```bash
cd server
npm run migrate
# Or run the specific migration:
npx tsx run-fileurl-migration.ts
```

### 2. Test Existing Downloads
1. Navigate to the documents page in your application
2. Try downloading documents from different folders (AML, Audit Report, etc.)
3. Verify downloads work properly from the object storage paths

### 3. Test New Uploads
1. Upload a new document to "Anti-Money Laundering (AML)" folder
2. Check that the fileUrl in database follows new pattern:
   `user-documents/{userId}/anti-money-laundering/{timestamp}-{filename}`
3. Try downloading the newly uploaded file

### 4. Verify Folder Structure
1. Documents should now be organized in object storage by category
2. Downloads should work seamlessly from the file browser interface
3. File paths should reflect the folder organization shown in the UI

### 5. Test Bulk Upload
1. Use bulk upload feature with multiple files
2. Verify all files get proper object storage paths with category folders
3. Test downloads for bulk uploaded files

## Troubleshooting

If downloads still fail:
1. Check browser network tab for 404 or 500 errors
2. Verify `fileUrl` field in database contains object storage paths (not API endpoints)
3. Check server logs for object storage access errors
4. Ensure object storage client is properly initialized

## Expected Results

- ✅ All downloads use object storage with proper folder structure
- ✅ New uploads organize files by category in object storage  
- ✅ Existing files with incorrect fileUrl values are fixed
- ✅ File browser interface shows proper folder organization
- ✅ Downloads work consistently across all categories
