// Mock data for the tool management system

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Observer';
  createdAt: string;
  updatedAt: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  owner: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
  requestCount: number;
}

export interface ToolOverview {
  toolId: string;
  content: string;
}

export interface ToolArchitecture {
  toolId: string;
  markdownContent: string;
}

export interface ToolLanguageTech {
  toolId: string;
  language: string;
  framework: string;
  version: string;
}

export interface ToolHosting {
  toolId: string;
  provider: string;
  region: string;
  deploymentUrl: string;
}

export interface ToolEnvVariable {
  id: string;
  toolId: string;
  key: string;
  encryptedValue: string;
}

export interface ToolDemoLogin {
  toolId: string;
  username: string;
  encryptedPassword: string;
  notes?: string;
}

export interface Request {
  id: string;
  toolId: string;
  toolName: string;
  title: string;
  description: string;
  status: 'Requested' | 'In Progress' | 'Completed' | 'Rejected';
  createdBy: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: string;
  before: Record<string, any> | null;
  after: Record<string, any> | null;
  timestamp: string;
}

// Current user (simulating logged in Admin)
export const currentUser: User = {
  id: 'user-1',
  name: 'John Admin',
  email: 'john@applywizz.com',
  role: 'Admin',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

// Mock users
export const mockUsers: User[] = [
  currentUser,
  {
    id: 'user-2',
    name: 'Sarah Designer',
    email: 'sarah@applywizz.com',
    role: 'Observer',
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-01T09:00:00Z',
  },
  {
    id: 'user-3',
    name: 'Mike Developer',
    email: 'mike@applywizz.com',
    role: 'Admin',
    createdAt: '2024-02-10T14:30:00Z',
    updatedAt: '2024-02-10T14:30:00Z',
  },
  {
    id: 'user-4',
    name: 'Emily Marketing',
    email: 'emily@applywizz.com',
    role: 'Observer',
    createdAt: '2024-03-05T11:15:00Z',
    updatedAt: '2024-03-05T11:15:00Z',
  },
];

// Mock tools
export const mockTools: Tool[] = [
  {
    id: 'tool-1',
    name: 'Content Hub',
    description: 'Centralized content management system for marketing assets, blog posts, and social media content.',
    owner: 'Marketing Team',
    url: 'https://content.applywizz.com',
    createdAt: '2024-01-20T08:00:00Z',
    updatedAt: '2024-12-10T15:30:00Z',
    requestCount: 5,
  },
  {
    id: 'tool-2',
    name: 'Analytics Dashboard',
    description: 'Real-time analytics and reporting platform for tracking KPIs across all marketing channels.',
    owner: 'Data Team',
    url: 'https://analytics.applywizz.com',
    createdAt: '2024-02-15T10:00:00Z',
    updatedAt: '2024-12-08T09:45:00Z',
    requestCount: 3,
  },
  {
    id: 'tool-3',
    name: 'Email Automation',
    description: 'Automated email campaign management with segmentation, A/B testing, and performance tracking.',
    owner: 'Growth Team',
    url: 'https://email.applywizz.com',
    createdAt: '2024-03-01T14:00:00Z',
    updatedAt: '2024-12-05T16:20:00Z',
    requestCount: 7,
  },
  {
    id: 'tool-4',
    name: 'Design System',
    description: 'Component library and design tokens for consistent UI across all ApplyWizz products.',
    owner: 'Design Team',
    url: 'https://design.applywizz.com',
    createdAt: '2024-04-10T09:30:00Z',
    updatedAt: '2024-12-12T11:00:00Z',
    requestCount: 2,
  },
  {
    id: 'tool-5',
    name: 'CRM Integration',
    description: 'Customer relationship management integration hub connecting Salesforce, HubSpot, and internal systems.',
    owner: 'Sales Ops',
    url: 'https://crm.applywizz.com',
    createdAt: '2024-05-20T13:00:00Z',
    updatedAt: '2024-12-01T10:15:00Z',
    requestCount: 4,
  },
];

// Mock tool details
export const mockToolOverviews: Record<string, ToolOverview> = {
  'tool-1': {
    toolId: 'tool-1',
    content: `# Content Hub Overview

The Content Hub is our centralized platform for managing all marketing content across multiple channels.

## Key Features
- **Asset Library**: Store and organize images, videos, and documents
- **Content Calendar**: Plan and schedule content releases
- **Collaboration**: Real-time editing and approval workflows
- **Integration**: Connect with social media platforms and CMS

## Usage Guidelines
1. All content must be approved before publishing
2. Use appropriate tags for easy discovery
3. Follow brand guidelines for all assets`,
  },
  'tool-2': {
    toolId: 'tool-2',
    content: `# Analytics Dashboard Overview

Real-time insights into our marketing performance.

## Key Metrics
- Website traffic and conversions
- Campaign performance
- User engagement scores
- Revenue attribution`,
  },
};

export const mockToolArchitectures: Record<string, ToolArchitecture> = {
  'tool-1': {
    toolId: 'tool-1',
    markdownContent: `# Architecture

## System Components
- **Frontend**: React 18 with TypeScript
- **Backend**: Node.js API Gateway
- **Storage**: AWS S3 for assets
- **Database**: PostgreSQL
- **Cache**: Redis for session management

## Data Flow
1. User uploads content via web interface
2. Assets processed and stored in S3
3. Metadata indexed in PostgreSQL
4. CDN serves optimized assets`,
  },
};

export const mockToolLanguageTech: Record<string, ToolLanguageTech> = {
  'tool-1': {
    toolId: 'tool-1',
    language: 'TypeScript',
    framework: 'Next.js 14',
    version: '14.2.0',
  },
  'tool-2': {
    toolId: 'tool-2',
    language: 'Python',
    framework: 'FastAPI',
    version: '0.109.0',
  },
  'tool-3': {
    toolId: 'tool-3',
    language: 'TypeScript',
    framework: 'Express.js',
    version: '4.18.2',
  },
};

export const mockToolHosting: Record<string, ToolHosting> = {
  'tool-1': {
    toolId: 'tool-1',
    provider: 'Vercel',
    region: 'us-east-1',
    deploymentUrl: 'https://content.applywizz.com',
  },
  'tool-2': {
    toolId: 'tool-2',
    provider: 'AWS ECS',
    region: 'us-west-2',
    deploymentUrl: 'https://analytics.applywizz.com',
  },
};

export const mockToolEnvVariables: Record<string, ToolEnvVariable[]> = {
  'tool-1': [
    { id: 'env-1', toolId: 'tool-1', key: 'DATABASE_URL', encryptedValue: '***encrypted***' },
    { id: 'env-2', toolId: 'tool-1', key: 'AWS_ACCESS_KEY', encryptedValue: '***encrypted***' },
    { id: 'env-3', toolId: 'tool-1', key: 'REDIS_URL', encryptedValue: '***encrypted***' },
  ],
  'tool-2': [
    { id: 'env-4', toolId: 'tool-2', key: 'API_SECRET', encryptedValue: '***encrypted***' },
    { id: 'env-5', toolId: 'tool-2', key: 'ANALYTICS_KEY', encryptedValue: '***encrypted***' },
  ],
};

export const mockToolDemoLogins: Record<string, ToolDemoLogin> = {
  'tool-1': {
    toolId: 'tool-1',
    username: 'demo@applywizz.com',
    encryptedPassword: '***encrypted***',
    notes: 'Read-only access. Can view content but cannot publish.',
  },
  'tool-2': {
    toolId: 'tool-2',
    username: 'analyst@demo.com',
    encryptedPassword: '***encrypted***',
    notes: 'Access to sample data only.',
  },
};

// Mock requests
export const mockRequests: Request[] = [
  {
    id: 'req-1',
    toolId: 'tool-1',
    toolName: 'Content Hub',
    title: 'Add bulk upload feature',
    description: 'Allow users to upload multiple files at once with drag-and-drop support.',
    status: 'Requested',
    createdBy: 'user-2',
    creatorName: 'Sarah Designer',
    createdAt: '2024-12-10T14:00:00Z',
    updatedAt: '2024-12-10T14:00:00Z',
  },
  {
    id: 'req-2',
    toolId: 'tool-2',
    toolName: 'Analytics Dashboard',
    title: 'Export to PDF',
    description: 'Add ability to export dashboard reports as PDF documents.',
    status: 'In Progress',
    createdBy: 'user-4',
    creatorName: 'Emily Marketing',
    createdAt: '2024-12-08T09:30:00Z',
    updatedAt: '2024-12-12T11:00:00Z',
  },
  {
    id: 'req-3',
    toolId: 'tool-3',
    toolName: 'Email Automation',
    title: 'Template library expansion',
    description: 'Need more email templates for different campaign types.',
    status: 'Completed',
    createdBy: 'user-4',
    creatorName: 'Emily Marketing',
    createdAt: '2024-11-20T16:45:00Z',
    updatedAt: '2024-12-05T10:30:00Z',
  },
  {
    id: 'req-4',
    toolId: 'tool-1',
    toolName: 'Content Hub',
    title: 'Version history for assets',
    description: 'Track changes and allow reverting to previous versions of uploaded content.',
    status: 'In Progress',
    createdBy: 'user-3',
    creatorName: 'Mike Developer',
    createdAt: '2024-12-05T11:15:00Z',
    updatedAt: '2024-12-11T09:00:00Z',
  },
  {
    id: 'req-5',
    toolId: 'tool-4',
    toolName: 'Design System',
    title: 'Dark mode support',
    description: 'Add dark mode variants for all components in the design system.',
    status: 'Requested',
    createdBy: 'user-2',
    creatorName: 'Sarah Designer',
    createdAt: '2024-12-12T08:00:00Z',
    updatedAt: '2024-12-12T08:00:00Z',
  },
  {
    id: 'req-6',
    toolId: 'tool-5',
    toolName: 'CRM Integration',
    title: 'HubSpot sync improvements',
    description: 'Fix data sync delays between HubSpot and internal systems.',
    status: 'Rejected',
    createdBy: 'user-4',
    creatorName: 'Emily Marketing',
    createdAt: '2024-11-15T13:00:00Z',
    updatedAt: '2024-11-20T16:00:00Z',
  },
  {
    id: 'req-7',
    toolId: 'tool-3',
    toolName: 'Email Automation',
    title: 'SMS integration',
    description: 'Add SMS messaging capability alongside email campaigns.',
    status: 'Requested',
    createdBy: 'user-3',
    creatorName: 'Mike Developer',
    createdAt: '2024-12-11T15:30:00Z',
    updatedAt: '2024-12-11T15:30:00Z',
  },
  {
    id: 'req-8',
    toolId: 'tool-2',
    toolName: 'Analytics Dashboard',
    title: 'Custom date ranges',
    description: 'Allow selecting custom date ranges for all reports and charts.',
    status: 'Completed',
    createdBy: 'user-1',
    creatorName: 'John Admin',
    createdAt: '2024-10-30T10:00:00Z',
    updatedAt: '2024-11-25T14:00:00Z',
  },
];

// Mock audit logs
export const mockAuditLogs: AuditLog[] = [
  {
    id: 'audit-1',
    userId: 'user-1',
    userName: 'John Admin',
    userEmail: 'john@applywizz.com',
    action: 'UPDATE',
    entityType: 'request',
    entityId: 'req-2',
    before: { status: 'Requested' },
    after: { status: 'In Progress' },
    timestamp: '2024-12-12T11:00:00Z',
  },
  {
    id: 'audit-2',
    userId: 'user-2',
    userName: 'Sarah Designer',
    userEmail: 'sarah@applywizz.com',
    action: 'CREATE',
    entityType: 'request',
    entityId: 'req-5',
    before: null,
    after: { title: 'Dark mode support', status: 'Requested' },
    timestamp: '2024-12-12T08:00:00Z',
  },
  {
    id: 'audit-3',
    userId: 'user-3',
    userName: 'Mike Developer',
    userEmail: 'mike@applywizz.com',
    action: 'UPDATE',
    entityType: 'tool',
    entityId: 'tool-4',
    before: { description: 'Component library' },
    after: { description: 'Component library and design tokens for consistent UI across all ApplyWizz products.' },
    timestamp: '2024-12-12T11:00:00Z',
  },
  {
    id: 'audit-4',
    userId: 'user-1',
    userName: 'John Admin',
    userEmail: 'john@applywizz.com',
    action: 'CREATE',
    entityType: 'user',
    entityId: 'user-4',
    before: null,
    after: { name: 'Emily Marketing', role: 'Observer' },
    timestamp: '2024-03-05T11:15:00Z',
  },
  {
    id: 'audit-5',
    userId: 'user-1',
    userName: 'John Admin',
    userEmail: 'john@applywizz.com',
    action: 'UPDATE',
    entityType: 'tool_env_variable',
    entityId: 'env-1',
    before: { key: 'DATABASE_URL', value: '***ENCRYPTED***' },
    after: { key: 'DATABASE_URL', value: '***ENCRYPTED***' },
    timestamp: '2024-12-10T09:30:00Z',
  },
  {
    id: 'audit-6',
    userId: 'user-1',
    userName: 'John Admin',
    userEmail: 'john@applywizz.com',
    action: 'UPDATE',
    entityType: 'request',
    entityId: 'req-3',
    before: { status: 'In Progress' },
    after: { status: 'Completed' },
    timestamp: '2024-12-05T10:30:00Z',
  },
];

// Helper functions
export function getRequestsByStatus(status: Request['status']): Request[] {
  return mockRequests.filter((r) => r.status === status);
}

export function getRequestsByTool(toolId: string): Request[] {
  return mockRequests.filter((r) => r.toolId === toolId);
}

export function getToolById(toolId: string): Tool | undefined {
  return mockTools.find((t) => t.id === toolId);
}

export function getUserById(userId: string): User | undefined {
  return mockUsers.find((u) => u.id === userId);
}

// Dashboard stats
export function getDashboardStats() {
  return {
    totalTools: mockTools.length,
    totalRequests: mockRequests.length,
    pendingRequests: mockRequests.filter((r) => r.status === 'Requested').length,
    inProgressRequests: mockRequests.filter((r) => r.status === 'In Progress').length,
    completedRequests: mockRequests.filter((r) => r.status === 'Completed').length,
  };
}
