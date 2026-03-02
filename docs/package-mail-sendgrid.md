---
title: SendGrid Mail Adapter
description: SendGrid adapter for ZinTrust's mail system
---

# SendGrid Mail Adapter

The `@zintrust/mail-sendgrid` package provides a SendGrid driver for ZinTrust's mail system, enabling reliable email delivery through SendGrid's API.

## Installation

```bash
zin add  @zintrust/mail-sendgrid
```

## Configuration

Add the SendGrid mail configuration to your environment:

```typescript
// config/mail.ts
import { MailConfig } from '@zintrust/core';

export const mail: MailConfig = {
  driver: 'sendgrid',
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com',
      name: process.env.SENDGRID_FROM_NAME || 'Your App',
    },
    timeout: 30000,
  },
};
```

## Environment Variables

```bash
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Your App
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
  template: 'd-1234567890abcdef1234567890abcdef', // SendGrid template ID
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

- **API Integration**: Direct SendGrid API integration
- **Template Engine**: SendGrid dynamic template support
- **Attachments**: File attachment support
- **Personalization**: Advanced personalization features
- **Tracking**: Email tracking and analytics
- **Webhooks**: Webhook event handling
- **Validation**: Email validation before sending
- **Batch Sending**: Bulk email sending capabilities

## Options

| Option       | Type   | Default                    | Description           |
| ------------ | ------ | -------------------------- | --------------------- |
| `apiKey`     | string | required                   | SendGrid API key      |
| `from.email` | string | required                   | Default from email    |
| `from.name`  | string | undefined                  | Default from name     |
| `timeout`    | number | 30000                      | Request timeout in ms |
| `endpoint`   | string | 'https://api.sendgrid.com' | API endpoint          |
| `version`    | string | 'v3'                       | API version           |

## Advanced Configuration

### Multiple From Addresses

```typescript
export const mail: MailConfig = {
  driver: 'sendgrid',
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    from: {
      email: 'noreply@yourdomain.com',
      name: 'Your App',
    },
    defaults: {
      replyTo: 'support@yourdomain.com',
      categories: ['transactional'],
    },
  },
};
```

### Custom API Endpoint

```typescript
export const mail: MailConfig = {
  driver: 'sendgrid',
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    endpoint: 'https://api.eu.sendgrid.com', // EU endpoint
    from: {
      email: 'noreply@yourdomain.com',
    },
  },
};
```

## Template Integration

### Using SendGrid Dynamic Templates

```typescript
// Send with dynamic template
await Mail.send({
  to: 'recipient@example.com',
  from: 'sender@yourdomain.com',
  template: 'd-1234567890abcdef1234567890abcdef', // Template ID
  data: {
    name: 'John Doe',
    company: 'Acme Corp',
    verificationUrl: 'https://example.com/verify/123',
    products: [
      { name: 'Product A', price: '$29.99' },
      { name: 'Product B', price: '$49.99' },
    ],
  },
});
```

### Template Personalization

```typescript
// Send to multiple recipients with personalization
await Mail.send({
  to: [
    { email: 'user1@example.com', name: 'User One' },
    { email: 'user2@example.com', name: 'User Two' },
  ],
  from: 'sender@yourdomain.com',
  template: 'd-1234567890abcdef1234567890abcdef',
  personalizations: [
    {
      to: [{ email: 'user1@example.com', name: 'User One' }],
      data: { name: 'User One', discount: '10%' },
    },
    {
      to: [{ email: 'user2@example.com', name: 'User Two' }],
      data: { name: 'User Two', discount: '15%' },
    },
  ],
});
```

## Advanced Features

### Categories and Custom Headers

```typescript
await Mail.send({
  to: 'recipient@example.com',
  from: 'sender@yourdomain.com',
  subject: 'Welcome Email',
  categories: ['welcome', 'transactional'],
  customArgs: {
    campaign_id: 'welcome_campaign_2024',
    user_segment: 'premium',
  },
  headers: {
    'X-Priority': '1',
    'X-Mailer': 'ZinTrust',
  },
  html: '<p>Welcome to our service!</p>',
});
```

### Send Time Optimization

```typescript
await Mail.send({
  to: 'recipient@example.com',
  from: 'sender@yourdomain.com',
  subject: 'Scheduled Email',
  sendAt: Math.floor(Date.now() / 1000) + 3600, // Send in 1 hour
  html: '<p>This email will be sent in 1 hour.</p>',
});
```

### IP Pool Management

```typescript
await Mail.send({
  to: 'recipient@example.com',
  from: 'sender@yourdomain.com',
  subject: 'Marketing Email',
  ipPool: 'marketing_ips', // Use specific IP pool
  html: '<p>Marketing content here.</p>',
});
```

## Tracking and Analytics

### Enable Tracking

```typescript
await Mail.send({
  to: 'recipient@example.com',
  from: 'sender@yourdomain.com',
  subject: 'Trackable Email',
  trackingSettings: {
    clickTracking: { enable: true },
    openTracking: { enable: true },
    subscriptionTracking: { enable: true },
    ganalytics: {
      enable: true,
      utmSource: 'newsletter',
      utmMedium: 'email',
      utmCampaign: 'spring_sale',
    },
  },
  html: '<p>Click <a href="https://example.com">here</a> to visit our site.</p>',
});
```

### Custom Tracking Domains

```typescript
export const mail: MailConfig = {
  driver: 'sendgrid',
  sendgrid: {
    // ... other config
    trackingSettings: {
      clickTracking: {
        enable: true,
        text: 'If you cannot click, please copy and paste this link: %link%',
      },
      openTracking: {
        enable: true,
        substitutionTag: '%opentrack%',
      },
    },
  },
};
```

## Webhook Handling

```typescript
// Handle SendGrid webhooks
app.post('/webhooks/sendgrid', async (req, res) => {
  const events = req.body;

  // Verify webhook signature (recommended)
  const signature = req.headers['x-twilio-email-event- webhook-signature'];
  const timestamp = req.headers['x-twilio-email-event- webhook-timestamp'];

  for (const event of events) {
    switch (event.event) {
      case 'delivered':
        console.log('Email delivered:', event.email);
        break;
      case 'open':
        console.log('Email opened:', event.email, event.ip);
        break;
      case 'click':
        console.log('Email clicked:', event.email, event.url);
        break;
      case 'bounce':
        console.log('Email bounced:', event.email, event.reason);
        break;
      case 'spamreport':
        console.log('Email marked as spam:', event.email);
        break;
      case 'unsubscribe':
        console.log('User unsubscribed:', event.email);
        break;
    }
  }

  res.status(200).send('OK');
});
```

## Batch Sending

### Multiple Recipients

```typescript
// Send to multiple recipients efficiently
const recipients = [
  { email: 'user1@example.com', name: 'User One' },
  { email: 'user2@example.com', name: 'User Two' },
  { email: 'user3@example.com', name: 'User Three' },
];

await Mail.send({
  from: 'sender@yourdomain.com',
  subject: 'Newsletter',
  personalizations: recipients.map((recipient) => ({
    to: [{ email: recipient.email, name: recipient.name }],
    data: { name: recipient.name },
  })),
  content: [
    {
      type: 'text/plain',
      value: 'Hello {{name}}, here is our newsletter!',
    },
    {
      type: 'text/html',
      value: '<p>Hello {{name}}, here is our newsletter!</p>',
    },
  ],
});
```

## Error Handling

The SendGrid adapter handles:

- API authentication errors
- Rate limiting errors
- Invalid recipient errors
- Template validation errors
- Attachment size limits
- Network timeouts

```typescript
try {
  await Mail.send({
    to: 'recipient@example.com',
    from: 'sender@yourdomain.com',
    subject: 'Test Email',
    text: 'This is a test email.',
  });
} catch (error) {
  if (error.response) {
    console.log('SendGrid API error:', error.response.body);
  } else if (error.code === 'ENOTFOUND') {
    console.log('Network error');
  } else {
    console.log('SendGrid error:', error.message);
  }
}
```

## Performance Tips

1. **Batch Operations**: Use personalization for bulk sending
2. **Template Caching**: Cache template responses
3. **Connection Reuse**: Reuse HTTP connections
4. **Async Processing**: Process emails asynchronously
5. **Rate Limiting**: Respect SendGrid rate limits

## Testing

### Test Mode

```typescript
export const mail: MailConfig = {
  driver: 'sendgrid',
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    sandboxMode: process.env.NODE_ENV === 'test', // Enable sandbox mode
    from: {
      email: 'test@yourdomain.com',
    },
  },
};
```

### Mock SendGrid for Testing

```typescript
// In your test setup
jest.mock('@zintrust/mail-sendgrid', () => ({
  SendGrid: {
    send: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  },
}));
```

## Security Considerations

- **API Key Security**: Store API keys securely
- **Domain Authentication**: Set up SPF/DKIM/DMARC
- **Link Tracking**: Be aware of link tracking security
- **Content Security**: Validate email content
- **Rate Limiting**: Implement rate limiting

## Limitations

- **API Limits**: SendGrid API rate limits apply
- **Attachment Size**: 40MB total attachment limit
- **Template Limits**: Template size restrictions
- **Sending Limits**: Account-level sending limits
- **Geographic Restrictions**: Some regions have restrictions
