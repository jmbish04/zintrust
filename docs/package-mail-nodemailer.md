---
title: Nodemailer Mail Adapter
description: Nodemailer adapter for ZinTrust's mail system
---

# Nodemailer Mail Adapter

The `@zintrust/mail-nodemailer` package provides a Nodemailer driver for ZinTrust's mail system, enabling flexible email delivery through various transport methods.

## Installation

```bash
zin add  @zintrust/mail-nodemailer
```

## Configuration

Add the Nodemailer mail configuration to your environment:

```typescript
// config/mail.ts
import { MailConfig } from '@zintrust/core';

export const mail: MailConfig = {
  driver: 'nodemailer',
  nodemailer: {
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

- **Multiple Transports**: SMTP, Sendmail, SES, and more
- **Connection Pooling**: Efficient connection management
- **Template Support**: Built-in template rendering
- **Attachments**: File and buffer attachment support
- **HTML Support**: Rich HTML email support
- **Error Handling**: Comprehensive error handling
- **Testing**: Ethereal email testing support

## Transport Options

### SMTP Transport

```typescript
export const mail: MailConfig = {
  driver: 'nodemailer',
  nodemailer: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'your@gmail.com',
      pass: 'your-app-password',
    },
  },
};
```

### Gmail OAuth2

```typescript
export const mail: MailConfig = {
  driver: 'nodemailer',
  nodemailer: {
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: 'your@gmail.com',
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: process.env.GMAIL_ACCESS_TOKEN,
    },
  },
};
```

### Amazon SES

```typescript
export const mail: MailConfig = {
  driver: 'nodemailer',
  nodemailer: {
    service: 'SES',
    region: process.env.AWS_REGION || 'us-east-1',
    auth: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  },
};
```

### Sendmail Transport

```typescript
export const mail: MailConfig = {
  driver: 'nodemailer',
  nodemailer: {
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail',
  },
};
```

## Advanced Configuration

### Connection Pooling

```typescript
export const mail: MailConfig = {
  driver: 'nodemailer',
  nodemailer: {
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

### DKIM Signing

```typescript
export const mail: MailConfig = {
  driver: 'nodemailer',
  nodemailer: {
    // ... other config
    dkim: {
      domainName: 'example.com',
      keySelector: 'default',
      privateKey: process.env.DKIM_PRIVATE_KEY,
    },
  },
};
```

## Template Integration

### Using Templates

```typescript
// Send with template
await Mail.send({
  to: 'recipient@example.com',
  from: 'sender@yourdomain.com',
  subject: 'Welcome Email',
  template: 'welcome',
  data: {
    name: 'John Doe',
    company: 'Acme Corp',
    verificationUrl: 'https://example.com/verify/123',
  },
});
```

### Custom Template Engine

```typescript
// Configure custom template engine
export const mail: MailConfig = {
  driver: 'nodemailer',
  nodemailer: {
    // ... transport config
    templates: {
      engine: 'handlebars', // or 'ejs', 'pug'
      path: './templates',
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
      <style>
        body { font-family: Arial, sans-serif; }
        .header { background: #007bff; color: white; padding: 20px; }
        .content { padding: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to Our Service</h1>
      </div>
      <div class="content">
        <p>Hello {{name}},</p>
        <p>Thank you for joining us!</p>
      </div>
    </body>
    </html>
  `,
  data: { name: 'John Doe' },
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
  text: 'This is an announcement for the team.',
});
```

## Attachments

### File Attachments

```typescript
await Mail.send({
  to: 'recipient@example.com',
  from: 'sender@yourdomain.com',
  subject: 'Documents',
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
  ],
  html: `
    <p>Please find the attached report.</p>
    <img src="cid:unique-image-id" alt="Attached Image">
  `,
});
```

### Buffer Attachments

```typescript
import fs from 'fs';

const pdfBuffer = fs.readFileSync('/path/to/document.pdf');

await Mail.send({
  to: 'recipient@example.com',
  from: 'sender@yourdomain.com',
  subject: 'Document',
  attachments: [
    {
      filename: 'document.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf',
    },
  ],
});
```

## Error Handling

The Nodemailer adapter handles:

- Connection errors
- Authentication failures
- SMTP errors
- Attachment errors
- Template rendering errors

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
    console.log('Authentication failed');
  } else if (error.code === 'ECONNECTION') {
    console.log('Connection failed');
  } else {
    console.log('Email error:', error.message);
  }
}
```

## Testing

### Ethereal Testing

```typescript
// Test configuration
export const mail: MailConfig = {
  driver: 'nodemailer',
  nodemailer: {
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'ethereal_user',
      pass: 'ethereal_pass',
    },
  },
};

// Generate test account
import nodemailer from 'nodemailer';

const testAccount = await nodemailer.createTestAccount();
console.log('Test email URL:', nodemailer.getTestMessageUrl(info));
```

### Mock Transport for Testing

```typescript
// Mock transport for unit tests
export const mail: MailConfig = {
  driver: 'nodemailer',
  nodemailer: {
    jsonTransport: true, // Output emails as JSON
  },
};
```

## Performance Optimization

1. **Connection Pooling**: Enable connection pooling for high volume
2. **Batch Sending**: Send multiple emails in parallel
3. **Template Caching**: Cache compiled templates
4. **Async Processing**: Process emails asynchronously
5. **Queue Management**: Use job queues for bulk sending

## Security Considerations

- **TLS/SSL**: Always use secure connections
- **Authentication**: Use app-specific passwords
- **Rate Limiting**: Respect provider rate limits
- **Input Validation**: Validate email addresses and content
- **SPF/DKIM**: Configure email authentication

## Troubleshooting

### Common Issues

1. **Gmail Authentication**: Use app passwords, not regular passwords
2. **Port Issues**: Use correct ports (587 for TLS, 465 for SSL)
3. **Firewall**: Ensure SMTP ports are open
4. **DNS**: Check MX and SPF records

### Debug Mode

```typescript
export const mail: MailConfig = {
  driver: 'nodemailer',
  nodemailer: {
    // ... other config
    debug: process.env.NODE_ENV === 'development',
    logger: true,
  },
};
```

## Limitations

- **Provider Limits**: SMTP provider rate limits
- **Attachment Size**: Provider-specific size limits
- **HTML Rendering**: Email client compatibility varies
- **Concurrent Connections**: Limited by SMTP server
