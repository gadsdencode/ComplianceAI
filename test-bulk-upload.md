# Bulk Upload Test Plan

## Testing Steps

1. **Start the development server**: `npm run dev`

2. **Navigate to Document Repository**: Go to the ComplianceWorkspace component

3. **Enable Upload Mode**: Click the "Upload Document" button

4. **Switch to Bulk Mode**: Click the "Bulk Upload" button 

5. **Select Multiple Files**: 
   - Use the "Browse files" button to select 2-3 test files
   - OR drag and drop multiple files

6. **Fill Metadata**: 
   - Add description (optional)
   - Add tags (optional) 
   - Select folder (optional)

7. **Submit Upload**: Click "Upload X Documents"

8. **Verify Results**:
   - Check the upload results summary
   - Verify files appear in document list
   - Try downloading each uploaded file

## Expected Behavior

### During Upload:
- Files should be validated (size, type)
- Progress indicators should show
- Each file should upload to Replit Object Storage
- Database records should be created
- Success/failure status per file

### After Upload:
- Files should appear in document list
- Downloads should work correctly
- File metadata should be accurate

## Debug Logs to Check

### Server Logs (Console):
```
✅ File uploaded to object storage: {userId}/{timestamp}-{index}-{filename}
✅ File existence verified in object storage: {path}
✅ Database record created for file X: {filename}
```

### Download Logs:
```
📥 Download request for document: {documentId, fileName, fileUrl}
🔍 Checking if file exists in object storage: {fileUrl}
✅ File found in object storage: {fileUrl}
```

## Common Issues to Check

1. **File Upload Validation**: Ensure files meet size/type requirements
2. **Object Storage Path**: Verify `fileUrl` contains correct object storage path
3. **Database Records**: Check that `fileUrl` field is populated correctly
4. **Download Access**: Verify object storage client can access uploaded files

## Testing Files

Create test files of different types:
- `test-document.pdf` (small PDF)
- `test-spreadsheet.xlsx` (Excel file)
- `test-presentation.pptx` (PowerPoint file)

Each should be under 20MB and valid file types. 