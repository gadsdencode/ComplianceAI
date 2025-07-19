# File Move Persistence Test Guide

## **Testing the Fix**

### **What Was Fixed:**
1. **Enhanced Error Handling**: Better logging and error reporting in frontend and backend
2. **Improved Query Invalidation**: More aggressive cache invalidation and refetching
3. **Database Verification**: Added verification that database updates actually occurred
4. **Comprehensive Logging**: Detailed logging throughout the entire move process

### **How to Test:**

#### **1. Setup**
```bash
# Start the development server
npm run dev
```

#### **2. Test File Move Operations**
1. **Navigate to Document Repository** (`/document-repository`)
2. **Upload a test document** to the "General" folder
3. **Create a new folder** (e.g., "Test Folder")
4. **Drag the document** from "General" to "Test Folder"

#### **3. Verify Persistence**
1. **Check immediate UI response** - Document should disappear from General and appear in Test Folder
2. **Refresh the page** - Document should still be in Test Folder (not revert to General)
3. **Check browser console** for detailed logs showing the update process
4. **Check server logs** for database update confirmations

#### **4. Expected Console Logs**

**Frontend logs:**
```
🔄 Move operation details: { itemId: "...", targetFolderName: "Test Folder", ... }
📝 Making API call to update document category: { documentId: 123, newCategory: "Test Folder", ... }
✅ Document move API response: { id: 123, category: "Test Folder", ... }
🔄 Invalidating queries for UI refresh...
✅ Query invalidation completed
✅ Document move completed successfully
```

**Backend logs:**
```
📝 Updating user document 123: { userId: 1, updateData: { category: "Test Folder" }, ... }
🔄 Storage: Updating document 123 with data: { documentId: 123, updateData: { category: "Test Folder" }, ... }
✅ Storage: Document 123 updated successfully: { documentId: 123, newCategory: "Test Folder", ... }
✅ Document 123 updated successfully: { previousCategory: "General", newCategory: "Test Folder", wasActuallyUpdated: true }
```

### **5. What to Look For**

#### **✅ Success Indicators:**
- Document moves immediately in UI
- Document stays in new location after page refresh
- Console shows successful API calls and database updates
- No error messages in console or server logs
- `wasActuallyUpdated: true` in server logs

#### **❌ Failure Indicators:**
- Document reverts to original location after refresh
- Error messages in console or server logs
- `wasActuallyUpdated: false` in server logs
- API call failures or timeout errors

### **6. Advanced Testing**

#### **Test Edge Cases:**
1. **Multiple rapid moves** - Move same document quickly between folders
2. **Large documents** - Test with larger file uploads
3. **Network simulation** - Test with slow network conditions
4. **Browser refresh during move** - Refresh page while move is in progress

#### **Test Different Browsers:**
- Chrome (primary)
- Firefox
- Safari (if on Mac)
- Edge

### **7. Troubleshooting**

If issues persist, check:

1. **Database Connection**: Ensure database is accessible
2. **Object Storage**: Verify Replit Object Storage is working
3. **Network Issues**: Check for connectivity problems
4. **Cache Issues**: Clear browser cache and try again
5. **Server Logs**: Look for detailed error messages in server console

### **8. Rollback Plan**

If this fix causes issues, you can revert by:
1. Removing the enhanced logging (for performance)
2. Simplifying the query invalidation back to basic approach
3. Removing database verification step if it causes delays

---

## **Technical Summary**

The fix addresses file move persistence by:

1. **Frontend**: More robust query invalidation with both `invalidateQueries()` and `refetchQueries()`
2. **Backend**: Enhanced verification that database updates actually occurred
3. **Storage**: Comprehensive logging to track update success/failure
4. **Error Handling**: Better error reporting to identify specific failure points

This should resolve the "file's new location is not persisting" issue by ensuring both the database is updated AND the UI cache is properly refreshed. 