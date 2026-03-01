---
title: SMTP Mail Adapter
description: SMTP adapter for ZinTrust's mail system
---

# SMTP Mail Adapter

The `@zintrust/mail-smtp` package provides a direct SMTP driver for ZinTrust's mail system, enabling email delivery through any SMTP-compliant server.

## Installation

```bash
zin add  @zintrust/mail-smtp
```

## Configuration

Add the SMTP mail configuration to your environment:

```typescript
// config/mail.ts
import { MailConfig } from '@zintrust/core';

export const mail: MailConfig = {
  driver: 'smtp',
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    tls: {
      rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
    },
  },
};
```

## Environment Variables

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_REJECT_UNAUTHORIZED=true
```

## Usage

```typescript
import { Mail } from '@zintrust/core';

// Basic email sending
await Mail.send({
  to: 'recipient@example.com',
  from: 'sender@yourdomain.com',
  subject: 'Hello World',
  text: 'This is a plain text email.',
  html: '<p>This is an <strong>HTML</strong> email.</p>',
});

// Send with template
await Mail.send({
  to: 'recipient@example.com',
  from: 'sender@yourdomain.com',
  subject: 'Welcome',
  template: 'welcome',
  data: {
    name: 'John Doe',
    verificationUrl: 'https://example.com/verify/123',
  },
});

// Send with attachments
await Mail.send({
  to: 'recipient@example.com',
  from: 'sender@yourdomain.com',
  subject: 'Document',
  attachments: [
    {
      filename: 'document.pdf',
      path: '/path/to/document.pdf',
      contentType: 'application/pdf',
    },
  ],
});
```

## Features

- **Direct SMTP**: Direct SMTP protocol implementation
- **Connection Pooling**: Efficient connection management
- **TLS/SSL Support**: Secure email transmission
- **Authentication**: Multiple authentication methods
- **Template Support**: Built-in template rendering
- **Attachments**: File attachment support
- **Error Handling**: Comprehensive error handling
- **Debug Mode**: Detailed logging for troubleshooting

## SMTP Server Configurations

### Gmail/Google Workspace

```typescript
export const mail: MailConfig = {
  driver: 'smtp',
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'your@gmail.com',
      pass: 'your-app-password', // Use app password, not regular password
    },
  },
};
```

### Outlook/Microsoft 365

```typescript
export const mail: MailConfig = {
  driver: 'smtp',
  smtp: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: 'your@outlook.com',
      pass: 'your-password',
    },
  },
};
```

### Amazon SES

```typescript
export const mail: MailConfig = {
  driver: 'smtp',
  smtp: {
    host: process.env.AWS_SES_HOST || 'email-smtp.us-east-1.amazonaws.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.AWS_SES_SMTP_USER,
      pass: process.env.AWS_SES_SMTP_PASSWORD,
    },
  },
};
```

### Postfix/Exim

```typescript
export const mail: MailConfig = {
  driver: 'smtp',
  smtp: {
    host: 'mail.yourdomain.com',
    port: 25,
    secure: false,
    auth: {
      user: 'postmaster@yourdomain.com',
      pass: 'your-password',
    },
    tls: {
      rejectUnauthorized: false, // For self-signed certificates
    },
  },
};
```

## Advanced Configuration

### Connection Pooling

```typescript
export const mail: MailConfig = {
  driver: 'smtp',
  smtp: {
    host: 'smtp.example.com',
    port: 587,
    auth: {
      user: 'user@example.com',
      pass: 'password',
    },
    pool: true, // Enable connection pooling
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
  },
};
```

### Custom TLS Options

```typescript
export const mail: MailConfig = {
  driver: 'smtp',
  smtp: {
    host: 'smtp.example.com',
    port: 465,
    secure: true,
    auth: {
      user: 'user@example.com',
      pass: 'password',
    },
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
      ciphers: 'ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256',
    },
  },
};
```

### SOCKS Proxy Support

```typescript
export const mail: MailConfig = {
  driver: 'smtp',
  smtp: {
    host: 'smtp.example.com',
    port: 587,
    auth: {
      user: 'user@example.com',
      pass: 'password',
    },
    socks: {
      host: 'socks-proxy.example.com',
      port: 1080,
      userId: 'proxy-user',
      password: 'proxy-pass',
    },
  },
};
```

## Authentication Methods

### Plain Authentication

```typescript
export const mail: MailConfig = {
  driver: 'smtp',
  smtp: {
    host: 'smtp.example.com',
    port: 587,
    auth: {
      type: 'plain',
      user: 'user@example.com',
      pass: 'password',
    },
  },
};
```

### CRAM-MD5 Authentication

```typescript
export const mail: MailConfig = {
  driver: 'smtp',
  smtp: {
    host: 'smtp.example.com',
    port: 587,
    auth: {
      type: 'cram-md5',
      user: 'user@example.com',
      pass: 'password',
    },
  },
};
```

### OAuth2 Authentication

```typescript
export const mail: MailConfig = {
  driver: 'smtp',
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      type: 'OAuth2',
      user: 'your@gmail.com',
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      refreshToken: process.env.OAUTH_REFRESH_TOKEN,
      accessToken: process.env.OAUTH_ACCESS_TOKEN,
    },
  },
};
```

## Email Options

### Rich HTML Email

```typescript
await Mail.send({
  to: 'recipient@example.com',
  from: 'sender@yourdomain.com',
  subject: 'Rich HTML Email',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome Email</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to Our Service</h1>
      </div>
      <div class="content">
        <p>Hello {{name}},</p>
        <p>Thank you for joining our platform! Click the button below to get started:</p>
        <a href="{{verificationUrl}}" class="button">Get Started</a>
      </div>
    </body>
    </html>
  `,
  data: {
    name: 'John Doe',
    verificationUrl: 'https://example.com/verify/123',
  },
});
```

### Multiple Recipients

```typescript
await Mail.send({
  to: ['user1@example.com', 'user2@example.com'],
  cc: 'manager@example.com',
  bcc: 'admin@example.com',
  from: 'sender@yourdomain.com',
  subject: 'Team Announcement',
  text: 'This is an important announcement for the team.',
  html: '<p>This is an <strong>important announcement</strong> for the team.</p>',
});
```

## Attachments

### File Attachments

```typescript
await Mail.send({
  to: 'recipient@example.com',
  from: 'sender@yourdomain.com',
  subject: 'Documents Attached',
  attachments: [
    {
      filename: 'report.pdf',
      path: '/path/to/report.pdf',
      contentType: 'application/pdf',
    },
    {
      filename: 'image.png',
      path: '/path/to/image.png',
      cid: 'unique-image-id', // Content ID for inline images
    },
    {
      filename: 'data.csv',
      content: 'Name,Email,Phone\nJohn,john@example.com,555-0123',
      contentType: 'text/csv',
    },
  ],
  html: `
    <p>Please find the attached documents.</p>
    <img src="cid:unique-image-id" alt="Attached Image">
  `,
});
```

## Error Handling

The SMTP adapter handles:

- Connection errors
- Authentication failures
- TLS/SSL errors
- SMTP protocol errors
- Network timeouts
- Attachment errors

```typescript
try {
  await Mail.send({
    to: 'recipient@example.com',
    from: 'sender@yourdomain.com',
    subject: 'Test Email',
    text: 'This is a test email.',
  });
} catch (error) {
  if (error.code === 'EAUTH') {
    console.log('Authentication failed - check credentials');
  } else if (error.code === 'ECONNECTION') {
    console.log('Connection failed - check host and port');
  } else if (error.code === 'ETLS') {
    console.log('TLS error - check certificate settings');
  } else {
    console.log('SMTP error:', error.message);
  }
}
```

## Debug Mode

### Enable Debug Logging

```typescript
export const mail: MailConfig = {
  driver: 'smtp',
  smtp: {
    host: 'smtp.example.com',
    port: 587,
    auth: {
      user: 'user@example.com',
      pass: 'password',
    },
    debug: process.env.NODE_ENV === 'development', // Enable debug logging
    logger: true, // Enable built-in logger
  },
};
```

### Custom Logger

```typescript
export const mail: MailConfig = {
  driver: 'smtp',
  smtp: {
    // ... other config
    logger: {
      debug: (msg) => console.debug('SMTP Debug:', msg),
      info: (msg) => console.info('SMTP Info:', msg),
      warn: (msg) => console.warn('SMTP Warning:', msg),
      error: (msg) => console.error('SMTP Error:', msg),
    },
  },
};
```

## Performance Optimization

1. **Connection Pooling**: Enable pooling for high-volume sending
2. **Batch Sending**: Send multiple emails in parallel
3. **Template Caching**: Cache compiled templates
4. **Async Processing**: Process emails asynchronously
5. **Queue Management**: Use job queues for bulk sending

## Security Considerations

- **TLS/SSL**: Always use secure connections when possible
- **Authentication**: Use strong passwords and app-specific passwords
- **Certificate Validation**: Validate server certificates
- **Input Validation**: Validate email addresses and content
- **Rate Limiting**: Respect server rate limits

## Troubleshooting

### Common Issues

1. **Gmail Authentication**: Use app passwords, not regular passwords
2. **Port Issues**: Use correct ports (587 for TLS, 465 for SSL, 25 for unencrypted)
3. **Firewall**: Ensure SMTP ports are open
4. **DNS**: Check MX and A records
5. **Certificates**: Handle self-signed certificates properly

### Test SMTP Connection

```typescript
import { SMTP } from '@zintrust/mail-smtp';

// Test connection
try {
  await SMTP.verifyConnection();
  console.log('SMTP connection successful');
} catch (error) {
  console.log('SMTP connection failed:', error.message);
}
```

## Limitations

- **Provider Limits**: SMTP provider rate limits apply
- **Attachment Size**: Provider-specific size limits
- **Concurrent Connections**: Limited by SMTP server
- **HTML Rendering**: Email client compatibility varies
- **Authentication**: Some servers have limited auth method support
