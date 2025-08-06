# File Move Persistence Testing Guide

## **Testing the Enhanced Fix**

### **What Was Fixed:**
1. **Query Invalidation Strategy**: Changed from `refetchType: 'active'` to `refetchType: 'all'`
2. **Race Condition Prevention**: Removed optimistic updates that were interfering with server responses
3. **Improved Error Handling**: Better error handling and rollback mechanisms
4. **Enhanced Logging**: Comprehensive logging throughout the move process

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
🔄 Starting document move operation: { documentId: 123, currentCategory: "General", targetFolderName: "Test Folder" }
📡 Making API call to update document category...
✅ API response received: { id: 123, category: "Test Folder", ... }
🔄 Cache updated with server response: { documentId: 123, newCategory: "Test Folder", totalDocuments: 5 }
🔄 Invalidating related queries...
✅ Document move operation completed successfully
```

**Backend logs:**
```
📝 Updating user document 123: { userId: 1, updateData: { category: "Test Folder" } }
🔄 Storage: Updating document 123 with data: { category: "Test Folder" }
✅ Storage: Document 123 updated successfully: { newCategory: "Test Folder" }
✅ Document 123 updated successfully: { wasActuallyUpdated: true }
```

#### **5. Advanced Testing Scenarios**

**Test 1: Multiple Documents**
- Move multiple documents to different folders
- Verify all moves persist after refresh

**Test 2: Error Handling**
- Try to move a document to a non-existent folder
- Verify error handling and rollback

**Test 3: Concurrent Operations**
- Move documents rapidly in succession
- Verify no race conditions occur

**Test 4: Network Issues**
- Simulate network failure during move
- Verify proper error handling and recovery

### **6. Verification Checklist**

- [ ] Document appears in new folder immediately
- [ ] Document disappears from old folder immediately
- [ ] Document stays in new folder after page refresh
- [ ] Console shows successful API response
- [ ] Console shows cache update confirmation
- [ ] Console shows query invalidation completion
- [ ] Server logs show database update success
- [ ] No errors in browser console
- [ ] No errors in server logs

### **7. Troubleshooting**

**If moves still don't persist:**
1. Check browser console for errors
2. Check server logs for database errors
3. Verify QueryClient configuration
4. Check network tab for failed API calls
5. Clear browser cache and try again

**If UI doesn't update immediately:**
1. Check if query invalidation is working
2. Verify cache update logic
3. Check for JavaScript errors

### **8. Performance Considerations**

- Document moves should complete within 1-2 seconds
- UI should remain responsive during moves
- No memory leaks from cache operations
- Server should handle concurrent moves efficiently 