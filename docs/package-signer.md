---
title: Signer
description: Digital signature and verification adapter for ZinTrust
---

# Signer

The `@zintrust/signer` package provides digital signature and verification capabilities for ZinTrust applications, enabling secure data integrity and authentication.

## Installation

```bash
npm install @zintrust/signer
```

## Configuration

Add the signer configuration to your environment:

```typescript
// config/signer.ts
import { SignerConfig } from '@zintrust/core';

export const signer: SignerConfig = {
  default: 'rsa',
  algorithms: {
    rsa: {
      keySize: 2048,
      hashAlgorithm: 'sha256',
      padding: 'pkcs1',
    },
    ecdsa: {
      curve: 'p256',
      hashAlgorithm: 'sha256',
    },
    ed25519: {
      context: 'ZinTrust',
    },
  },
  keyManagement: {
    storage: 'file', // or 'vault', 'cloud'
    path: './keys',
    encryption: {
      enabled: true,
      algorithm: 'aes-256-gcm',
    },
  },
  verification: {
    cache: {
      enabled: true,
      ttl: 300000, // 5 minutes
      maxSize: 1000,
    },
    strictMode: false,
  },
};
```

## Environment Variables

```bash
SIGNER_DEFAULT_ALGORITHM=rsa
SIGNER_KEY_STORAGE=file
SIGNER_KEY_PATH=./keys
SIGNER_KEY_ENCRYPTION=true
SIGNER_VERIFICATION_CACHE_TTL=300000
```

## Usage

```typescript
import { Signer } from '@zintrust/core';

// Generate key pair
const keyPair = await Signer.generateKeyPair('rsa', {
  keySize: 2048,
  passphrase: 'secure-password',
});

// Sign data
const signature = await Signer.sign('rsa', keyPair.privateKey, 'Hello, World!');

// Verify signature
const isValid = await Signer.verify('rsa', keyPair.publicKey, 'Hello, World!', signature);

// Sign JSON data
const jsonData = { user: 'john', action: 'login' };
const jsonSignature = await Signer.signJSON('rsa', keyPair.privateKey, jsonData);

// Verify JSON signature
const isJsonValid = await Signer.verifyJSON('rsa', keyPair.publicKey, jsonData, jsonSignature);
```

## Features

- **Multiple Algorithms**: RSA, ECDSA, Ed25519 support
- **Key Management**: Secure key storage and management
- **Data Signing**: Sign strings, JSON, and binary data
- **Signature Verification**: Verify signatures with strict validation
- **JSON Web Tokens**: JWT creation and verification
- **Timestamped Signatures**: RFC 3161 timestamp support
- **Batch Operations**: Efficient batch signing and verification
- **Security**: Secure key generation and storage

## Supported Algorithms

### RSA (Rivest-Shamir-Adleman)

```typescript
import { RSASigner } from '@zintrust/signer';

const rsaSigner = new RSASigner({
  keySize: 2048, // 1024, 2048, 3072, 4096
  hashAlgorithm: 'sha256', // sha1, sha256, sha384, sha512
  padding: 'pkcs1', // pkcs1, pss
});

// Generate RSA key pair
const rsaKeyPair = await rsaSigner.generateKeyPair({
  passphrase: 'secure-password',
  format: 'pem', // pem, der, jwk
});

// Sign data
const signature = await rsaSigner.sign(rsaKeyPair.privateKey, 'Hello, World!');

// Verify signature
const isValid = await rsaSigner.verify(rsaKeyPair.publicKey, 'Hello, World!', signature);
```

### ECDSA (Elliptic Curve Digital Signature Algorithm)

```typescript
import { ECDSASigner } from '@zintrust/signer';

const ecdsaSigner = new ECDSASigner({
  curve: 'p256', // p256, p384, p521, secp256k1
  hashAlgorithm: 'sha256', // sha1, sha256, sha384, sha512
});

// Generate ECDSA key pair
const ecdsaKeyPair = await ecdsaSigner.generateKeyPair({
  format: 'pem',
});

// Sign data
const signature = await ecdsaSigner.sign(ecdsaKeyPair.privateKey, 'Hello, World!');

// Verify signature
const isValid = await ecdsaSigner.verify(ecdsaKeyPair.publicKey, 'Hello, World!', signature);
```

### Ed25519 (Edwards-curve Digital Signature Algorithm)

```typescript
import { Ed25519Signer } from '@zintrust/signer';

const ed25519Signer = new Ed25519Signer({
  context: 'ZinTrust', // Optional context string
});

// Generate Ed25519 key pair
const ed25519KeyPair = await ed25519Signer.generateKeyPair({
  format: 'hex', // hex, base64, pem
});

// Sign data
const signature = await ed25519Signer.sign(ed25519KeyPair.privateKey, 'Hello, World!');

// Verify signature
const isValid = await ed25519Signer.verify(ed25519KeyPair.publicKey, 'Hello, World!', signature);
```

## Key Management

### Key Storage

```typescript
import { KeyManager } from '@zintrust/signer';

const keyManager = new KeyManager({
  storage: 'file',
  path: './keys',
  encryption: {
    enabled: true,
    algorithm: 'aes-256-gcm',
    key: 'encryption-key-32-bytes-long',
  },
});

// Store key pair
await keyManager.storeKeyPair('user-signing-key', keyPair, {
  passphrase: 'secure-password',
  metadata: {
    algorithm: 'rsa',
    keySize: 2048,
    created: new Date(),
    purpose: 'user-signing',
  },
});

// Retrieve key pair
const storedKeyPair = await keyManager.getKeyPair('user-signing-key', {
  passphrase: 'secure-password',
});

// List keys
const keys = await keyManager.listKeys();
// Returns: Array<{ id: string, algorithm: string, created: Date, metadata: object }>

// Delete key
await keyManager.deleteKey('user-signing-key');
```

### Key Rotation

```typescript
import { KeyRotation } from '@zintrust/signer';

const keyRotation = new KeyRotation(keyManager);

// Rotate key
const rotationResult = await keyRotation.rotate('user-signing-key', {
  newAlgorithm: 'rsa',
  newKeySize: 3072,
  keepOldKey: true, // Keep old key for verification
  transitionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
});

// Get active key
const activeKey = await keyRotation.getActiveKey('user-signing-key');

// Verify with any key in rotation chain
const isValid = await keyRotation.verifyWithChain('user-signing-key', data, signature);
```

## Data Signing

### String Data

```typescript
// Sign simple string
const signature = await Signer.sign('rsa', privateKey, 'Hello, World!');

// Sign with options
const signatureWithOptions = await Signer.sign('rsa', privateKey, 'Hello, World!', {
  encoding: 'utf8',
  format: 'base64',
  includeTimestamp: true,
});

// Sign with custom headers
const signatureWithHeaders = await Signer.sign('rsa', privateKey, 'Hello, World!', {
  headers: {
    'X-Algorithm': 'RSA-SHA256',
    'X-Key-ID': 'user-signing-key',
    'X-Timestamp': Date.now().toString(),
  },
});
```

### JSON Data

```typescript
// Sign JSON object
const jsonData = {
  user: 'john@example.com',
  action: 'login',
  timestamp: new Date().toISOString(),
  sessionId: 'abc123',
};

const jsonSignature = await Signer.signJSON('rsa', privateKey, jsonData, {
  normalize: true, // Normalize JSON for consistent signing
  includeHash: true, // Include data hash in signature
});

// Verify JSON signature
const isValid = await Signer.verifyJSON('rsa', publicKey, jsonData, jsonSignature, {
  strictMode: true, // Strict field validation
  allowExtraFields: false,
});
```

### Binary Data

```typescript
import { BinarySigner } from '@zintrust/signer';

const binarySigner = new BinarySigner();

// Sign binary data
const fileBuffer = fs.readFileSync('document.pdf');
const signature = await binarySigner.sign('rsa', privateKey, fileBuffer, {
  format: 'base64',
  includeChecksum: true,
});

// Verify binary signature
const isValid = await binarySigner.verify('rsa', publicKey, fileBuffer, signature);
```

## JSON Web Tokens (JWT)

### JWT Creation

```typescript
import { JWTSigner } from '@zintrust/signer';

const jwtSigner = new JWTSigner({
  algorithm: 'RS256',
  keyPair: rsaKeyPair,
});

// Create JWT
const token = await jwtSigner.create({
  payload: {
    sub: 'user:123',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
  },
  options: {
    expiresIn: '1h',
    issuer: 'ZinTrust',
    audience: 'zintrust-app',
    subject: 'user:123',
  },
});

// Returns: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### JWT Verification

```typescript
// Verify JWT
const payload = await jwtSigner.verify(token, {
  algorithms: ['RS256'],
  issuer: 'ZinTrust',
  audience: 'zintrust-app',
  clockTolerance: 30, // 30 seconds clock skew tolerance
});

// Returns: { sub: 'user:123', name: 'John Doe', email: 'john@example.com', role: 'user', iat: 1640995200, exp: 1640998800 }
```

### JWT Refresh

```typescript
// Refresh token
const refreshedToken = await jwtSigner.refresh(token, {
  expiresIn: '1h',
  // Update payload if needed
  payload: {
    lastLogin: new Date().toISOString(),
  },
});
```

## Timestamped Signatures

### RFC 3161 Timestamps

```typescript
import { TimestampedSigner } from '@zintrust/signer';

const timestampedSigner = new TimestampedSigner({
  tsaUrl: 'http://timestamp.digicert.com',
  hashAlgorithm: 'sha256',
});

// Create timestamped signature
const timestampedSignature = await timestampedSigner.sign(
  'rsa', 
  privateKey, 
  'Important document content',
  {
    includeTimestamp: true,
    tsaCredentials: {
      username: 'tsa-user',
      password: 'tsa-password',
    },
  }
);

// Verify timestamped signature
const verificationResult = await timestampedSigner.verify(
  'rsa',
  publicKey,
  'Important document content',
  timestampedSignature,
  {
    verifyTimestamp: true,
    checkRevocation: true,
  }
);

// Returns: { valid: boolean, timestamp: Date, verifiedAt: Date, revoked: boolean }
```

## Batch Operations

### Batch Signing

```typescript
import { BatchSigner } from '@zintrust/signer';

const batchSigner = new BatchSigner({
  algorithm: 'rsa',
  concurrency: 10,
});

// Prepare batch data
const batchData = [
  { id: 'doc1', content: 'Document 1 content' },
  { id: 'doc2', content: 'Document 2 content' },
  { id: 'doc3', content: 'Document 3 content' },
];

// Sign batch
const batchSignatures = await batchSigner.signBatch(privateKey, batchData, {
  includeTimestamp: true,
  format: 'base64',
});

// Returns: Array<{ id: string, signature: string, timestamp: Date }>
```

### Batch Verification

```typescript
// Verify batch
const verificationResults = await batchSigner.verifyBatch(publicKey, batchData, batchSignatures, {
  strictMode: true,
  parallel: true,
});

// Returns: Array<{ id: string, valid: boolean, error?: string }>
```

## Security Features

### Key Encryption

```typescript
import { KeyEncryption } from '@zintrust/signer';

const keyEncryption = new KeyEncryption({
  algorithm: 'aes-256-gcm',
  key: 'encryption-key-32-bytes-long',
});

// Encrypt private key
const encryptedKey = await keyEncryption.encrypt(privateKey, {
  passphrase: 'secure-password',
  metadata: {
    algorithm: 'rsa',
    keySize: 2048,
  },
});

// Decrypt private key
const decryptedKey = await keyEncryption.decrypt(encryptedKey, {
  passphrase: 'secure-password',
});
```

### Secure Random

```typescript
import { SecureRandom } from '@zintrust/signer';

// Generate secure random bytes
const randomBytes = await SecureRandom.bytes(32);

// Generate secure random string
const randomString = await SecureRandom.string(16, {
  charset: 'alphanumeric', // hex, base64, alphanumeric
});

// Generate secure random integer
const randomInt = await SecureRandom.integer(1, 1000000);
```

## Performance Optimization

### Signature Caching

```typescript
import { SignatureCache } from '@zintrust/signer';

const signatureCache = new SignatureCache({
  maxSize: 1000,
  ttl: 300000, // 5 minutes
  strategy: 'lru',
});

// Cache signature verification
const cacheKey = `${algorithm}:${hash(data)}`;
let isValid = await signatureCache.get(cacheKey);

if (isValid === undefined) {
  isValid = await Signer.verify(algorithm, publicKey, data, signature);
  await signatureCache.set(cacheKey, isValid);
}
```

### Parallel Processing

```typescript
import { ParallelSigner } from '@zintrust/signer';

const parallelSigner = new ParallelSigner({
  concurrency: 4,
  chunkSize: 100,
});

// Sign large dataset in parallel
const largeDataset = Array.from({ length: 10000 }, (_, i) => `Data item ${i}`);
const signatures = await parallelSigner.signBatch(privateKey, largeDataset);
```

## Error Handling

### Custom Error Handler

```typescript
const signer = new Signer({
  errorHandler: (error, operation, data) => {
    console.log(`Signing error in ${operation}:`, error.message);
    
    // Log to monitoring system
    logError(error, { operation, dataSize: data?.length });
    
    // Send alert for critical errors
    if (error.severity === 'critical') {
      sendAlert('Signing operation failed', error);
    }
  },
});
```

### Error Types

```typescript
try {
  await Signer.sign('rsa', privateKey, 'Hello, World!');
} catch (error) {
  if (error.code === 'INVALID_KEY') {
    console.log('Invalid private key format');
  } else if (error.code === 'WEAK_KEY') {
    console.log('Key size too small');
  } else if (error.code === 'SIGNING_FAILED') {
    console.log('Signing operation failed');
  } else {
    console.log('Signer error:', error.message);
  }
}
```

## Testing

### Mock Signer

```typescript
import { SignerMock } from '@zintrust/signer';

// Use mock for testing
const mockSigner = new SignerMock({
  algorithm: 'rsa',
  signature: 'mock-signature',
  verification: true,
});

// Test signing
const signature = await mockSigner.sign('rsa', privateKey, 'test-data');
expect(signature).toBe('mock-signature');

// Test verification
const isValid = await mockSigner.verify('rsa', publicKey, 'test-data', signature);
expect(isValid).toBe(true);
```

### Integration Testing

```typescript
import { TestSigner } from '@zintrust/signer';

// Use test signer with known keys
const testSigner = new TestSigner({
  algorithm: 'rsa',
  keySize: 2048,
  knownKeys: {
    privateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
    publicKey: '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----',
  },
});

// Test with deterministic results
const signature = await testSigner.sign('rsa', testSigner.privateKey, 'test-data');
const isValid = await testSigner.verify('rsa', testSigner.publicKey, 'test-data', signature);
expect(isValid).toBe(true);
```

## Best Practices

1. **Key Security**: Use strong key sizes and secure storage
2. **Algorithm Selection**: Choose appropriate algorithms for your use case
3. **Key Rotation**: Regularly rotate signing keys
4. **Timestamp Validation**: Always validate timestamps when applicable
5. **Input Validation**: Validate all inputs before signing
6. **Error Handling**: Implement comprehensive error handling
7. **Performance**: Use caching and batch operations for better performance
8. **Audit Trail**: Maintain audit trail of all signing operations

## Limitations

- **Key Size**: Maximum key size limitations
- **Algorithm Support**: Limited to supported algorithms
- **Performance**: Signing operations can be computationally expensive
- **Storage**: Encrypted keys require additional storage
- **Network**: Network-based verification may have latency

## Troubleshooting

### Common Issues

1. **Key Format Errors**: Ensure keys are in correct format
2. **Algorithm Mismatch**: Use same algorithm for signing and verification
3. **Encoding Issues**: Ensure consistent encoding
4. **Memory Usage**: Large data may cause memory issues
5. **Performance**: Optimize for your specific use case

### Debug Mode

```typescript
export const signer: SignerConfig = {
  default: 'rsa',
  debug: process.env.NODE_ENV === 'development',
  logging: {
    level: 'debug',
    logOperations: true,
    logKeys: false, // Don't log actual keys
    logPerformance: true,
  },
};
```
