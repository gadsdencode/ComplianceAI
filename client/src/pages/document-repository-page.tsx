import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import ComplianceWorkspace from '@/components/documents/ComplianceWorkspace';

export default function DocumentRepositoryPage() {
  return (
    <DashboardLayout pageTitle="Document Workspace">
      <ComplianceWorkspace />
    </DashboardLayout>
  );
} 