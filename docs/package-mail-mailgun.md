---
title: Mailgun Mail Adapter
description: Mailgun adapter for ZinTrust's mail system
---

# Mailgun Mail Adapter

The `@zintrust/mail-mailgun` package provides a Mailgun driver for ZinTrust's mail system, enabling email delivery through Mailgun's API.

## Installation

```bash
zin add  @zintrust/mail-mailgun
```

## Configuration

Add the Mailgun mail configuration to your environment:

```typescript
// config/mail.ts
import { MailConfig } from '@zintrust/core';

export const mail: MailConfig = {
  driver: 'mailgun',
  mailgun: {
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
    region: process.env.MAILGUN_REGION || 'us',
    timeout: 30000,
  },
};
```

## Environment Variables

```bash
MAILGUN_API_KEY=your_api_key
MAILGUN_DOMAIN=your_domain.com
MAILGUN_REGION=us
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

- **API Integration**: Direct Mailgun API integration
- **Template Support**: Mailgun template engine support
- **Attachments**: File attachment support
- **Tracking**: Email tracking and analytics
- **Webhooks**: Webhook event handling
- **Validation**: Email validation before sending
- **Batch Sending**: Bulk email sending capabilities

## Options

| Option     | Type   | Default           | Description            |
| ---------- | ------ | ----------------- | ---------------------- |
| `apiKey`   | string | required          | Mailgun API key        |
| `domain`   | string | required          | Mailgun domain         |
| `region`   | string | 'us'              | Mailgun region (us/eu) |
| `timeout`  | number | 30000             | Request timeout in ms  |
| `host`     | string | 'api.mailgun.net' | Custom API host        |
| `protocol` | string | 'https'           | API protocol           |

## Advanced Configuration

### EU Region

```typescript
export const mail: MailConfig = {
  driver: 'mailgun',
  mailgun: {
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
    region: 'eu', // European region
  },
};
```

### Custom Domain Configuration

```typescript
export const mail: MailConfig = {
  driver: 'mailgun',
  mailgun: {
    apiKey: process.env.MAILGUN_API_KEY,
    domain: 'mg.yourdomain.com',
    host: 'api.eu.mailgun.net',
    protocol: 'https',
  },
};
```

## Template Integration

### Using Mailgun Templates

```typescript
// Send with stored template
await Mail.send({
  to: 'recipient@example.com',
  from: 'sender@yourdomain.com',
  subject: 'Welcome Email',
  template: 'welcome_template', // Mailgun stored template
  data: {
    name: 'John Doe',
    company: 'Acme Corp',
    loginUrl: 'https://app.example.com/login',
  },
});
```

### Template Variables

```typescript
// Complex template data
await Mail.send({
  to: 'recipient@example.com',
  from: 'sender@yourdomain.com',
  template: 'order_confirmation',
  data: {
    customer: {
      name: 'John Doe',
      email: 'john@example.com',
    },
    order: {
      id: 'ORD-12345',
      items: [
        { name: 'Product A', price: 29.99, quantity: 2 },
        { name: 'Product B', price: 49.99, quantity: 1 },
      ],
      total: 109.97,
      shippingAddress: {
        street: '123 Main St',
        city: 'New York',
        country: 'USA',
      },
    },
  },
});
```

## Tracking and Analytics

### Enable Tracking

```typescript
await Mail.send({
  to: 'recipient@example.com',
  from: 'sender@yourdomain.com',
  subject: 'Trackable Email',
  tracking: {
    opens: true,
    clicks: true,
    unsubscribes: true,
  },
  html: '<p>Click <a href="https://example.com">here</a> to visit our site.</p>',
});
```

### Custom Tracking Domains

```typescript
export const mail: MailConfig = {
  driver: 'mailgun',
  mailgun: {
    // ... other config
    tracking: {
      opens: true,
      clicks: true,
      domain: 'track.yourdomain.com',
    },
  },
};
```

## Webhook Handling

```typescript
// Handle Mailgun webhooks
app.post('/webhooks/mailgun', async (req, res) => {
  const signature = req.headers.signature;
  const timestamp = req.headers.timestamp;
  const token = req.body.signature?.token;

  // Verify webhook signature
  const isValid = await Mailgun.verifyWebhook(signature, timestamp, token);

  if (!isValid) {
    return res.status(401).send('Invalid webhook');
  }

  // Process webhook events
  switch (req.body.event) {
    case 'delivered':
      console.log('Email delivered:', req.body.id);
      break;
    case 'opened':
      console.log('Email opened:', req.body.id);
      break;
    case 'clicked':
      console.log('Email clicked:', req.body.id, req.body.url);
      break;
    case 'bounced':
      console.log('Email bounced:', req.body.id, req.body.reason);
      break;
  }

  res.status(200).send('OK');
});
```

## Batch Sending

```typescript
// Send to multiple recipients
const recipients = [
  { email: 'user1@example.com', name: 'User One' },
  { email: 'user2@example.com', name: 'User Two' },
  { email: 'user3@example.com', name: 'User Three' },
];

await Mail.batchSend({
  from: 'sender@yourdomain.com',
  subject: 'Newsletter',
  template: 'newsletter_template',
  recipients: recipients.map((r) => ({
    to: r.email,
    data: { name: r.name },
  })),
});
```

## Error Handling

The Mailgun adapter handles:

- API authentication errors
- Rate limiting errors
- Invalid recipient errors
- Attachment size limits
- Network timeouts
- Template validation errors

```typescript
try {
  await Mail.send({
    to: 'recipient@example.com',
    from: 'sender@yourdomain.com',
    subject: 'Test Email',
    text: 'This is a test email.',
  });
} catch (error) {
  if (error.code === 'RATE_LIMITED') {
    console.log('Rate limited, retry later');
  } else if (error.code === 'INVALID_RECIPIENT') {
    console.log('Invalid email address');
  } else {
    console.log('Mailgun error:', error.message);
  }
}
```

## Performance Tips

1. **Batch Operations**: Use batch sending for bulk emails
2. **Template Caching**: Cache template responses
3. **Connection Reuse**: Reuse HTTP connections
4. **Async Processing**: Process emails asynchronously
5. **Retry Logic**: Implement exponential backoff for failures

## Testing

### Test Mode

```typescript
export const mail: MailConfig = {
  driver: 'mailgun',
  mailgun: {
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
    testMode: process.env.NODE_ENV === 'test', // Enable test mode
  },
};
```

### Mock Mailgun for Testing

```typescript
// In your test setup
jest.mock('@zintrust/mail-mailgun', () => ({
  Mailgun: {
    send: jest.fn().mockResolvedValue({ id: 'test-id' }),
  },
}));
```

## Limitations

- **API Limits**: Mailgun API rate limits apply
- **Attachment Size**: 25MB attachment limit
- **Template Limits**: Template size restrictions
- **Sending Limits**: Account-level sending limits
