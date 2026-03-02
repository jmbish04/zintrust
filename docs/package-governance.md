---
title: Governance
description: Governance and compliance adapter for ZinTrust
---

# Governance

The `@zintrust/governance` package provides governance and compliance capabilities for ZinTrust applications, enabling policy enforcement, audit logging, and regulatory compliance.

## Installation

```bash
npm install @zintrust/governance
```

## Configuration

Add the governance configuration to your environment:

```typescript
// config/governance.ts
import { GovernanceConfig } from '@zintrust/core';

export const governance: GovernanceConfig = {
  enabled: true,
  policies: {
    dataRetention: {
      enabled: true,
      defaultTTL: 365 * 24 * 60 * 60 * 1000, // 1 year
      policies: {
        userLogs: { ttl: 90 * 24 * 60 * 60 * 1000 }, // 90 days
        auditLogs: { ttl: 7 * 365 * 24 * 60 * 60 * 1000 }, // 7 years
        sessionData: { ttl: 24 * 60 * 60 * 1000 }, // 24 hours
      },
    },
    accessControl: {
      enabled: true,
      rbac: {
        enabled: true,
        roles: ['admin', 'user', 'readonly'],
        permissions: ['read', 'write', 'delete', 'admin'],
      },
    },
    compliance: {
      enabled: true,
      frameworks: ['GDPR', 'SOC2', 'HIPAA'],
      dataClassification: {
        public: { retention: 365 * 24 * 60 * 60 * 1000 },
        internal: { retention: 3 * 365 * 24 * 60 * 60 * 1000 },
        confidential: { retention: 7 * 365 * 24 * 60 * 60 * 1000 },
        restricted: { retention: 10 * 365 * 24 * 60 * 60 * 1000 },
      },
    },
  },
  audit: {
    enabled: true,
    storage: 'database', // or 'file', 'cloud'
    level: 'detailed', // or 'basic', 'minimal'
    events: [
      'user.login',
      'user.logout',
      'data.access',
      'data.modify',
      'admin.action',
      'security.breach',
    ],
  },
};
```

## Usage

```typescript
import { Governance } from '@zintrust/core';

// Check user permissions
const canAccess = await Governance.can('user:123', 'read', 'resource:456');

// Log audit event
await Governance.audit({
  event: 'user.login',
  userId: 'user:123',
  resource: 'system',
  action: 'login',
  outcome: 'success',
  metadata: {
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
  },
});

// Apply data retention policy
await Governance.applyRetentionPolicy('userLogs', 'user:123');

// Check compliance
const complianceCheck = await Governance.checkCompliance('GDPR', 'user:123');
```

## Features

- **Policy Engine**: Flexible policy definition and enforcement
- **Access Control**: Role-based access control (RBAC)
- **Audit Logging**: Comprehensive audit trail
- **Data Retention**: Automated data lifecycle management
- **Compliance**: Multi-framework compliance support
- **Risk Management**: Risk assessment and mitigation
- **Reporting**: Compliance and governance reports
- **Security**: Security policy enforcement

## Policy Engine

### Policy Definition

```typescript
import { PolicyEngine } from '@zintrust/governance';

const policyEngine = new PolicyEngine();

// Define access policy
policyEngine.define('data.access', {
  conditions: [
    { field: 'user.role', operator: 'in', value: ['admin', 'manager'] },
    { field: 'data.classification', operator: '<=', value: 'confidential' },
    { field: 'data.owner', operator: 'equals', value: 'user.id' },
  ],
  effect: 'allow',
  priority: 1,
});

// Define data retention policy
policyEngine.define('data.retention', {
  conditions: [
    { field: 'data.type', operator: 'equals', value: 'userLogs' },
    { field: 'data.age', operator: '>', value: 90 * 24 * 60 * 60 * 1000 },
  ],
  actions: ['delete'],
  effect: 'require',
  priority: 2,
});
```

### Policy Evaluation

```typescript
// Evaluate access policy
const accessResult = await policyEngine.evaluate('data.access', {
  user: { id: 'user:123', role: 'admin' },
  data: { classification: 'internal', owner: 'user:123' },
});

// Evaluate retention policy
const retentionResult = await policyEngine.evaluate('data.retention', {
  data: { type: 'userLogs', age: 100 * 24 * 60 * 60 * 1000 },
});
```

## Access Control

### Role-Based Access Control (RBAC)

```typescript
import { RBAC } from '@zintrust/governance';

const rbac = new RBAC();

// Define roles
rbac.defineRole('admin', {
  permissions: ['*'], // All permissions
  description: 'System administrator',
});

rbac.defineRole('manager', {
  permissions: ['read', 'write', 'delete'],
  description: 'Department manager',
});

rbac.defineRole('user', {
  permissions: ['read', 'write'],
  description: 'Regular user',
});

// Assign roles to users
await rbac.assignRole('user:123', 'admin');
await rbac.assignRole('user:456', 'user');

// Check permissions
const canDelete = await rbac.hasPermission('user:123', 'delete', 'resource:789');
const canRead = await rbac.hasPermission('user:456', 'read', 'resource:789');
```

### Attribute-Based Access Control (ABAC)

```typescript
import { ABAC } from '@zintrust/governance';

const abac = new ABAC();

// Define attributes
abac.defineAttribute('user.department', 'string');
abac.defineAttribute('user.clearance', 'number');
abac.defineAttribute('data.sensitivity', 'string');

// Define policies
abac.addPolicy({
  name: 'department-access',
  target: {
    resource: 'document.*',
    action: 'read',
  },
  condition: {
    'user.department': 'equals(data.owner.department)',
    'user.clearance': '>= data.sensitivity',
  },
  effect: 'allow',
});

// Evaluate access
const accessResult = await abac.evaluate('user:123', 'read', 'document:456', {
  user: { department: 'finance', clearance: 5 },
  document: { owner: { department: 'finance' }, sensitivity: 3 },
});
```

## Audit Logging

### Audit Events

```typescript
import { AuditLogger } from '@zintrust/governance';

const auditLogger = new AuditLogger({
  storage: 'database',
  level: 'detailed',
});

// Log user actions
await auditLogger.log({
  event: 'user.login',
  userId: 'user:123',
  resource: 'system',
  action: 'login',
  outcome: 'success',
  timestamp: new Date(),
  metadata: {
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    sessionId: 'session:abc123',
  },
});

// Log data access
await auditLogger.log({
  event: 'data.access',
  userId: 'user:123',
  resource: 'document:456',
  action: 'read',
  outcome: 'success',
  metadata: {
    documentTitle: 'Financial Report Q4',
    accessReason: 'business-need',
  },
});

// Log security events
await auditLogger.log({
  event: 'security.breach',
  userId: 'system',
  resource: 'system',
  action: 'intrusion-detected',
  outcome: 'failure',
  severity: 'high',
  metadata: {
    sourceIp: '10.0.0.1',
    attackType: 'sql-injection',
    blocked: true,
  },
});
```

### Audit Queries

```typescript
// Query audit logs
const userActions = await auditLogger.query({
  userId: 'user:123',
  event: 'user.login',
  timeRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31'),
  },
});

// Get security events
const securityEvents = await auditLogger.query({
  event: 'security.breach',
  severity: 'high',
  timeRange: {
    start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
  },
});

// Generate audit report
const auditReport = await auditLogger.generateReport({
  type: 'compliance',
  framework: 'GDPR',
  timeRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-03-31'),
  },
});
```

## Data Retention

### Retention Policies

```typescript
import { DataRetention } from '@zintrust/governance';

const retention = new DataRetention();

// Define retention policies
retention.definePolicy('userLogs', {
  ttl: 90 * 24 * 60 * 60 * 1000, // 90 days
  classification: 'internal',
  action: 'delete',
});

retention.definePolicy('auditLogs', {
  ttl: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
  classification: 'confidential',
  action: 'archive',
});

retention.definePolicy('personalData', {
  ttl: 365 * 24 * 60 * 60 * 1000, // 1 year
  classification: 'restricted',
  action: 'anonymize',
});

// Apply retention policy
await retention.apply('userLogs', 'user:123');
await retention.apply('auditLogs', 'system');

// Schedule retention tasks
retention.schedule({
  policy: 'userLogs',
  schedule: '0 2 * * *', // Daily at 2 AM
  dryRun: false,
});
```

### Data Lifecycle Management

```typescript
// Archive old data
await retention.archive('auditLogs', {
  olderThan: 6 * 365 * 24 * 60 * 60 * 1000, // 6 years
  destination: 'cold-storage',
});

// Anonymize personal data
await retention.anonymize('personalData', 'user:123', {
  fields: ['name', 'email', 'phone'],
  method: 'hash',
});

// Delete expired data
await retention.cleanup({
  dryRun: false,
  batchSize: 1000,
  progressCallback: (progress) => {
    console.log(`Cleanup progress: ${progress.percentage}%`);
  },
});
```

## Compliance

### Compliance Frameworks

```typescript
import { Compliance } from '@zintrust/governance';

const compliance = new Compliance();

// GDPR compliance
compliance.defineFramework('GDPR', {
  requirements: [
    'data.minimization',
    'purpose.limitation',
    'storage.limitation',
    'accuracy',
    'security',
    'accountability',
  ],
  controls: {
    'data.minimization': {
      enabled: true,
      policy: 'collect-only-necessary',
    },
    'storage.limitation': {
      enabled: true,
      policy: 'data-retention',
    },
    'security': {
      enabled: true,
      policy: 'encryption-at-rest',
    },
  },
});

// Check compliance
const gdprCompliance = await compliance.check('GDPR', {
  scope: 'user-data',
  timeRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-03-31'),
  },
});

// Generate compliance report
const complianceReport = await compliance.generateReport('GDPR', {
  format: 'pdf',
  includeEvidence: true,
  timeRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-03-31'),
  },
});
```

### Data Classification

```typescript
import { DataClassification } from '@zintrust/governance';

const classifier = new DataClassification();

// Classify data
const classification = await classifier.classify({
  type: 'user-profile',
  content: 'User personal information including email and phone',
  context: {
    department: 'hr',
    purpose: 'employee-management',
  },
});

// Apply classification
await classifier.apply('document:456', 'confidential', {
  reason: 'Contains sensitive employee information',
  approvedBy: 'hr-manager',
});

// Enforce classification policies
await classifier.enforce('document:456', {
  encryption: true,
  accessControl: true,
  retention: '3-years',
});
```

## Risk Management

### Risk Assessment

```typescript
import { RiskManager } from '@zintrust/governance';

const riskManager = new RiskManager();

// Define risks
riskManager.defineRisk('data.breach', {
  category: 'security',
  impact: 'high',
  probability: 'medium',
  description: 'Unauthorized access to sensitive data',
  mitigations: [
    'encryption-at-rest',
    'access-control',
    'audit-logging',
    'security-monitoring',
  ],
});

// Assess risk
const riskAssessment = await riskManager.assess('data.breach', {
  context: {
    dataVolume: 'large',
    sensitivity: 'high',
    existingControls: ['encryption', 'access-control'],
  },
});

// Get risk score
const riskScore = await riskManager.calculateRisk('data.breach');
// Returns: { score: 7.5, level: 'high', factors: [...] }
```

### Risk Mitigation

```typescript
// Implement mitigations
await riskManager.mitigate('data.breach', {
  controls: [
    {
      name: 'encryption-at-rest',
      status: 'implemented',
      effectiveness: 'high',
    },
    {
      name: 'access-control',
      status: 'implemented',
      effectiveness: 'medium',
    },
  ],
});

// Monitor risk levels
riskManager.on('risk.level.change', (risk, oldLevel, newLevel) => {
  console.log(`Risk ${risk.name} changed from ${oldLevel} to ${newLevel}`);
  
  if (newLevel === 'critical') {
    sendAlert(`Critical risk: ${risk.name}`);
  }
});
```

## Reporting

### Governance Reports

```typescript
import { GovernanceReporter } from '@zintrust/governance';

const reporter = new GovernanceReporter();

// Generate access report
const accessReport = await reporter.generateAccessReport({
  timeRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-03-31'),
  },
  users: ['user:123', 'user:456'],
  resources: ['document.*'],
});

// Generate compliance report
const complianceReport = await reporter.generateComplianceReport({
  frameworks: ['GDPR', 'SOC2'],
  timeRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-03-31'),
  },
  format: 'pdf',
});

// Generate audit report
const auditReport = await reporter.generateAuditReport({
  events: ['user.login', 'data.access', 'admin.action'],
  timeRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-03-31'),
  },
  includeDetails: true,
});
```

### Dashboard Integration

```typescript
import { GovernanceDashboard } from '@zintrust/governance';

const dashboard = new GovernanceDashboard();

// Get dashboard data
const dashboardData = await dashboard.getData({
  metrics: [
    'compliance.score',
    'risk.level',
    'audit.events',
    'access.requests',
  ],
  timeRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
  },
});

// Get alerts
const alerts = await dashboard.getAlerts({
  severity: ['high', 'critical'],
  status: 'active',
});
```

## Testing

### Mock Governance

```typescript
import { GovernanceMock } from '@zintrust/governance';

// Use mock for testing
const mockGovernance = new GovernanceMock({
  policies: {
    'data.access': { result: true },
    'user.login': { result: true },
  },
  auditLogs: [],
});

// Test policy evaluation
const result = await mockGovernance.can('user:123', 'read', 'resource:456');
expect(result).toBe(true);

// Test audit logging
await mockGovernance.audit({
  event: 'user.login',
  userId: 'user:123',
  action: 'login',
  outcome: 'success',
});

const logs = await mockGovernance.getAuditLogs();
expect(logs).toHaveLength(1);
```

## Best Practices

1. **Policy Definition**: Define clear, specific policies
2. **Access Control**: Implement principle of least privilege
3. **Audit Logging**: Log all relevant events
4. **Data Classification**: Classify data appropriately
5. **Compliance**: Regular compliance checks and reporting
6. **Risk Management**: Proactive risk assessment and mitigation
7. **Monitoring**: Continuous monitoring and alerting
8. **Documentation**: Maintain comprehensive documentation

## Limitations

- **Policy Complexity**: Complex policies may impact performance
- **Storage Requirements**: Audit logs require significant storage
- **Compliance Overhead**: Compliance checks add overhead
- **Integration**: Integration with existing systems may be complex
- **Maintenance**: Ongoing maintenance required

## Troubleshooting

### Common Issues

1. **Policy Conflicts**: Resolve conflicting policies
2. **Performance Issues**: Optimize policy evaluation
3. **Audit Log Size**: Implement log rotation
4. **Compliance Failures**: Address compliance gaps
5. **Access Issues**: Review access control policies

### Debug Mode

```typescript
export const governance: GovernanceConfig = {
  enabled: true,
  debug: process.env.NODE_ENV === 'development',
  logging: {
    level: 'debug',
    logPolicyEvaluation: true,
    logAccessChecks: true,
    logComplianceChecks: true,
  },
};
```
