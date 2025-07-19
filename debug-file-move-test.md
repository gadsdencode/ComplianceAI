# Debug File Move Test - Step by Step

## 🔍 **DEBUGGING STRATEGY**

This test will help us identify exactly where the file move persistence issue occurs by tracking every step of the process.

### **Phase 1: Initial Setup**

1. **Open Browser Dev Tools** → Console tab
2. **Navigate to** `/document-repository`
3. **Clear console** to start fresh
4. **Look for initial data logs:**
   ```
   🔄 USER DOCUMENTS UPDATED: { count: X, documents: [...] }
   🔄 FOLDERS UPDATED: { count: X, folders: [...] }
   🔄 Transforming documents to file nodes: { userDocuments: X, folders: X }
   ```

### **Phase 2: Pre-Move State**

1. **Note current document locations** in the UI
2. **Check console for:**
   ```
   📋 USER DOCUMENTS DEBUG: [{ id: X, title: "...", category: "..." }]
   📁 FOLDERS DEBUG: [{ id: "...", name: "..." }]
   📋 FINAL FOLDER STRUCTURE: [{ name: "...", documents: [...] }]
   ```
3. **Record which folder each document is currently in**

### **Phase 3: Execute Move**

1. **Drag a document** from one folder to another
2. **Watch console for move operation logs:**
   ```
   🔄 Move operation details: { itemId: "...", targetFolderName: "..." }
   🔍 PRE-MOVE DEBUG STATE: { userDocumentsBefore: [...] }
   📝 Making API call to update document category: { documentId: X, newCategory: "..." }
   ✅ Document move API response: Response
   📊 PARSED API RESPONSE: { wasSuccessful: true/false, newCategory: "..." }
   🔄 Invalidating queries for UI refresh...
   ✅ Query invalidation completed
   ```

### **Phase 4: Post-Move Verification**

1. **Immediately after move - check if:**
   - Document appears in new folder ✅/❌
   - Document disappears from old folder ✅/❌
   
2. **Wait for delayed debug log (1 second):**
   ```
   🔍 POST-MOVE DEBUG STATE (delayed): { userDocumentsAfter: [...] }
   ```

3. **Check for query updates:**
   ```
   🔄 USER DOCUMENTS UPDATED: { documents: [...] }
   🔄 FOLDERS UPDATED: { folders: [...] }
   🔄 Transforming documents to file nodes: ...
   ```

### **Phase 5: Persistence Test**

1. **Refresh the page** (F5 or Ctrl+R)
2. **Wait for page to load completely**
3. **Check document location:**
   - Still in new folder? ✅ PERSISTENCE WORKING
   - Back in old folder? ❌ PERSISTENCE BROKEN

4. **Check fresh data logs:**
   ```
   🔄 USER DOCUMENTS UPDATED: { documents: [...] }
   📋 USER DOCUMENTS DEBUG: [{ category: "..." }]
   ```

## 🔍 **CRITICAL CHECKPOINTS**

### **Checkpoint 1: API Response**
```
📊 PARSED API RESPONSE: { 
  wasSuccessful: true,  // ← Must be true
  newCategory: "Target Folder Name"  // ← Must match target
}
```
**If FALSE:** API update failed - backend issue

### **Checkpoint 2: Query Refetch**
```
🔄 USER DOCUMENTS UPDATED: { 
  documents: [{ 
    id: X, 
    category: "Target Folder Name"  // ← Must show new category
  }]
}
```
**If OLD CATEGORY:** Query not refetching - frontend cache issue

### **Checkpoint 3: Folder Assignment**
```
🔍 FOLDER MATCHING DEBUG: {
  documentCategory: "Target Folder Name",
  matchingFolder: "Target Folder Name"  // ← Must match
}
```
**If NO MATCH:** transformToFileNodes logic issue

### **Checkpoint 4: After Page Refresh**
```
📋 USER DOCUMENTS DEBUG: [{ 
  id: X, 
  category: "Target Folder Name"  // ← Must persist after refresh
}]
```
**If OLD CATEGORY:** Database not actually updated

## 🚨 **FAILURE SCENARIOS**

### **Scenario A: API Call Fails**
- `wasSuccessful: false` in parsed response
- **Cause:** Backend PATCH endpoint issue
- **Solution:** Check server logs, database connection

### **Scenario B: Database Not Updated**
- API succeeds but refresh shows old category
- **Cause:** Database transaction not committing
- **Solution:** Check storage.updateUserDocument function

### **Scenario C: Query Not Refetching**
- API succeeds, database updated, but UI cache stale
- **Cause:** Query invalidation not working
- **Solution:** Check invalidateQueries implementation

### **Scenario D: Folder Assignment Wrong**
- Query refetches correct data but document in wrong folder
- **Cause:** transformToFileNodes matching logic
- **Solution:** Check folder name matching logic

## 📋 **TEST CHECKLIST**

- [ ] Initial data loads correctly
- [ ] Pre-move state logged
- [ ] Move operation triggers correctly
- [ ] API call made with correct parameters
- [ ] API response shows success
- [ ] Response category matches target
- [ ] Query invalidation triggered
- [ ] Queries refetch with new data
- [ ] New data has updated category
- [ ] Document appears in correct folder immediately
- [ ] Page refresh preserves location
- [ ] Fresh data load shows correct category

## 🔧 **Next Steps Based on Results**

1. **If API fails:** Debug backend PATCH endpoint
2. **If DB not updated:** Debug storage.updateUserDocument
3. **If cache not refreshing:** Debug query invalidation
4. **If folder assignment wrong:** Debug transformToFileNodes
5. **If all above pass but still broken:** Look for race conditions

---

**Run this test and report back exactly which checkpoint fails!** 