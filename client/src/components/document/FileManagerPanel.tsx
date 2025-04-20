import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { queryClient } from '@/lib/queryClient';

interface FileItem { name: string; key: string; }
interface FileManagerPanelProps { documentId: number; }

export default function FileManagerPanel({ documentId }: FileManagerPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    data: files = [],
    isLoading,
    error,
  } = useQuery<FileItem[], Error>({
    queryKey: [`/api/documents/${documentId}/files`],
    queryFn: async (): Promise<FileItem[]> => {
      const res = await fetch(`/api/documents/${documentId}/files`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch files');
      return res.json();
    },
  });

  const uploadMutation = useMutation<FileItem, Error, File>({
    mutationFn: async (file: File): Promise<FileItem> => {
      try {
        console.log(`Preparing to upload file: ${file.name} (${file.size} bytes) for document ${documentId}`);
        
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch(`/api/documents/${documentId}/files`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!res.ok) {
          const errorText = await res.text().catch(() => "Unknown error");
          console.error(`Upload failed for file ${file.name}:`, errorText);
          throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
        }
        
        const result = await res.json();
        console.log(`File ${file.name} uploaded successfully:`, result);
        return result;
      } catch (error) {
        console.error("Error in file upload process:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}/files`] });
      setSelectedFile(null);
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (fileName: string): Promise<void> => {
      const res = await fetch(
        `/api/documents/${documentId}/files/${fileName}`,
        { method: 'DELETE', credentials: 'include' }
      );
      if (!res.ok) throw new Error('Deletion failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}/files`] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <input
          type="file"
          onChange={e => e.target.files && setSelectedFile(e.target.files[0])}
          className="text-sm text-slate-600"
        />
        <Button
          onClick={() => selectedFile && uploadMutation.mutate(selectedFile)}
          disabled={!selectedFile || uploadMutation.status === 'pending'}
        >
          {uploadMutation.status === 'pending' ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
      {error && <p className="text-red-600">Error: {(error as Error).message}</p>}
      {isLoading ? (
        <p>Loading files...</p>
      ) : files.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map(file => (
              <TableRow key={file.key}>
                <TableCell>{file.name}</TableCell>
                <TableCell className="flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`/api/documents/${documentId}/files/${file.name}`}
                      download
                    >
                      Download
                    </a>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(file.name)}
                    disabled={deleteMutation.status === 'pending'}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-slate-500">No files uploaded.</p>
      )}
    </div>
  );
} 