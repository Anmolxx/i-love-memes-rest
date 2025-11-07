# ILoveMemes — NestJS REST API Backend

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

A comprehensive REST API backend for ILoveMemes — a meme generation and e-commerce platform that enables users to create, customize, share, and purchase custom meme products.

---

## Table of Contents

### Getting Started

- [Introduction](docs/introduction.md)
- [Installing and Running](docs/installing-and-running.md)
- [Architecture Overview](docs/architecture.md)
- [System Design](docs/system-design.md)

### Development

- [Command Line Interface](docs/cli.md)
- [Database Schema & Migrations](docs/database.md)
- [Authentication & Authorization](docs/auth.md)
- [Serialization](docs/serialization.md)
- [File Uploading & Management](docs/file-uploading.md)
- [Testing Strategy](docs/tests.md)
- [Benchmarking](docs/benchmarking.md)
- [Translations & i18n](docs/translations.md)
- [Automatic Dependency Updates](docs/automatic-update-dependencies.md)

### Modules & Features

- [Module Overview](docs/modules/README.md)
- [Authentication Module](docs/modules/auth/module-overview.md)
- [Memes Module](docs/modules/memes/module-overview.md)
- [Templates Module](docs/modules/templates/module-overview.md)
- [Users Module](docs/modules/users/module-overview.md)
- [Files Module](docs/modules/files/module-overview.md)
- [Tags Module](docs/modules/tags/module-overview.md)

### Features

- [Meme Generation](docs/features/meme-generation/feature-specification.md)
- [Template Management](docs/features/template-management/feature-specification.md)
- [Community Gallery](docs/features/community-gallery/feature-specification.md)
- [E-commerce Integration](docs/features/ecommerce-integration/feature-specification.md)

### API Documentation

- [API Reference](docs/api-reference.md)
- [Endpoints Overview](docs/api-endpoints.md)

---

## Project Overview

### What is ILoveMemes?

ILoveMemes is a comprehensive meme generation and e-commerce platform that combines creative tools with print-on-demand capabilities. The platform enables users to:

- **Create**: Use a Fabric.js-based canvas editor to create custom memes from templates
- **Customize**: Add text, stickers, images with full control over styling and positioning
- **Share**: Publish creations to a community gallery with social interactions
- **Commerce**: Transform memes into physical products (candy tubes, candles, greeting cards, etc.)
- **Purchase**: Complete checkout flow with Shopify and Stripe integration

### Backend Architecture

This repository contains the NestJS-based REST API backend that powers the platform. The backend follows clean architecture principles with:

- **Domain-Driven Design**: Core business logic isolated in domain models
- **Repository Pattern**: Abstract data persistence layer for flexibility
- **Modular Structure**: Feature-based modules with clear boundaries
- **Type Safety**: Full TypeScript implementation with strict typing
- **API Versioning**: Support for multiple API versions

### Technology Stack

| Layer              | Technology      | Purpose                              |
| ------------------ | --------------- | ------------------------------------ |
| **Framework**      | NestJS          | Enterprise-grade Node.js framework   |
| **Language**       | TypeScript      | Type-safe application development    |
| **Database**       | PostgreSQL      | Relational data persistence          |
| **ORM**            | TypeORM         | Database abstraction and migrations  |
| **Authentication** | JWT + Passport  | Secure user authentication           |
| **File Storage**   | S3 / Local      | Asset management (images, templates) |
| **Email**          | Nodemailer      | Transactional email service          |
| **API Docs**       | Swagger/OpenAPI | Interactive API documentation        |
| **Testing**        | Jest            | Unit and E2E testing                 |
| **Validation**     | class-validator | DTO validation                       |

---

## Core Concepts

### User Roles & Permissions

#### Admin Users

- Create and manage meme templates
- Manage products and product categories
- View analytics and metrics
- Moderate community content
- Access admin dashboard

#### Regular Users

- Browse and search meme templates
- Create memes using templates
- Upload custom images and stickers
- Share memes to community gallery
- Interact with community (upvote, comment, share)
- Purchase custom products
- Manage personal profile and creations

### Meme Template System

#### Meme Template

- Canvas-based layout created by admins
- Defines dimensions, background, and layer structure
- Contains metadata (title, description, tags, category)
- Versioned for template evolution
- Supports preview thumbnails

#### Layer Types

1. **Text Layer**
   - Editable text content
   - Customizable properties:
     - Font family, size, weight
     - Color, stroke, shadow
     - Background color/opacity
     - Text alignment (left, center, right)
     - Line height and letter spacing
   - Transform controls (position, rotation, scale)
   - Z-index for layering

2. **Image Layer**
   - Placeholder for user images
   - Sticker library support
   - Transform controls (position, rotation, scale)
   - Opacity control
   - Crop and fit options
   - Z-index for layering

#### Layer Transforms

- Position: X/Y coordinates on canvas
- Rotation: Degrees (-180° to 180°)
- Scale: Width/Height percentage
- Lock aspect ratio option
- Snap-to-grid functionality

### Meme Instance Lifecycle

1. **Creation**: User selects template and fills layers
2. **Editing**: Real-time manipulation on canvas (frontend)
3. **Export**: Backend renders final image (PNG/JPEG)
4. **Storage**: Image saved to file storage (S3/Local)
5. **Publishing**: Optional publication to community gallery
6. **Product Mapping**: Optional product association for e-commerce

### Product System

#### Product Types

- Candy Tubes
- Candles
- Greeting Cards
- Stickers
- Posters
- Custom printables

#### Product Workflow

1. Admin creates product with mockup template
2. User applies meme to product preview
3. Backend generates product visualization
4. User adds to cart and proceeds to checkout
5. Order sent to fulfillment
6. Label generator creates print-ready files (300 DPI)

### Content Moderation

#### Automated Filters

- Text profanity detection
- Image content analysis (NSFW detection)
- Spam prevention
- Rate limiting

#### Manual Moderation

- User reporting system
- Admin review queue
- Content flagging
- User warnings/bans

### Analytics & Metrics

#### Template Metrics

- Usage count per template
- Popular templates trending
- Time-windowed analysis (7/30/90 days)

#### Meme Metrics

- Views, upvotes, downvotes
- Comments and shares
- Trending score calculation
- Engagement rate

#### User Metrics

- Memes created per user
- Popular creators
- Engagement statistics

---

## Features & Capabilities

This backend provides comprehensive REST APIs for:

- Product and order management with integrations to Shopify and Stripe
- Print-ready label generation for in-house production
- Basic moderation (text/image filters) and analytics per template/meme

The backend follows a modular NestJS structure (controllers, services, modules, repositories) and exposes REST endpoints consumed by:

- Meme editor frontend (Fabric.js-based canvas)
- Admin dashboard (template/product/order management)
- Community frontend (feed, search, product preview)

## Core concepts

- Admin: can create/manage meme templates, products, and view metrics.
- Meme template: canvas layout created via the dedicated meme frontend; defines a set of Layers.
- Layer: building block of a template; two types:
  - Text Layer: editable text with font, color, stroke, shadow, background, alignment
  - Image Layer: placeholder or sticker image
- Layer transforms: move, rotate, scale. Frontend uses Fabric.js to manage canvas/layers.
- Meme instance: a user-generated image produced by filling Text/Image layers and exporting.
- Product: mapping of a meme to a printable product (mockups such as candy tubes, candles, greeting cards).
- Moderation: basic profanity/text and image filters applied at creation/upload time.
- Analytics: counts and time-windowed metrics (e.g., memes created per-template in a given period).

## Features (backend responsibilities)

- Template CRUD and versioning
- Uploading and serving assets (templates, images, stickers)
- Meme creation endpoint (accepts layer content and exports image)
- Community endpoints: list, search, filter, tags, trending algorithms
- Interaction endpoints: upvote, downvote, report, flag, comment (auth required)
- Product preview endpoints: render meme onto product mockups or return mockup URLs
- Checkout integrations: create cart/order, Shopify/Stripe webhooks, order status
- Label generation: export print-ready (300 DPI) label files
- Basic moderation pipelines for text/image content
- Metrics APIs for admins (per-template and per-meme stats)

## Example API routes (browse-focused)

- GET /meme-templates
  - List available meme templates (pagination, search, filters)

- GET /memes
  - Browse user-generated memes (default: latest first, pagination)
- GET /memes?sort=oldest
  - Browse oldest-first
- GET /memes/{template-slug}
  - List memes created from a specific template
- GET /memes/trending
  - Memes considered "trending" by backend scoring logic (time-window + popularity)
- GET /memes/most-upvoted
  - Memes sorted desc by upvotes
- GET /memes/least-downvoted
  - Memes sorted asc by downvotes
- GET /memes/tag/{tag}
  - Memes filtered by tag (e.g., /memes/tag/happy, /memes/tag/nsfw)

Interaction and content routes:

- POST /memes/{id}/interactions
  - Body: { type: "upvote"|"downvote"|"report"|"flag", note?: string }
  - Some interaction types require a note (e.g., report), others do not.
  - Authenticated users only.
- POST /memes/{id}/comments
  - Add a comment (auth required)
- POST /meme-templates (admin)
  - Create a template (metadata + asset references)
- POST /memes
  - Create a meme instance (payload: filled layers). Backend returns exported image URL and variant for product preview.

Product and checkout:

- POST /products (admin)
- GET /products/{id}/preview?memeId={m}
  - Returns product mockup with meme applied
- POST /checkout (Shopify/Stripe integration)

## Authentication & interactions

- All mutation endpoints (create, interact, comment, order) require authentication.
- Interactions (upvote/downvote/comment/report/flag) are recorded per-user to prevent abuse.
- Admin endpoints are role-protected.
- Moderation hooks run on meme creation/upload to detect profanity and nudity where applicable.

## Data & Metrics

- Key metrics: memes created per-template, upvotes/downvotes per meme, trending score.
- Admin endpoints allow time-windowed queries (e.g., number of memes created in last 7/30 days).
- Usage of background workers (or queue) is recommended for expensive tasks: image rendering, label generation, Shopify webhooks.

## Quick Start (local development)

Prerequisites:

- Node.js (>=16)
- npm or yarn
- PostgreSQL (or configured DB per .env)

Steps:

1. Clone the repo and install dependencies:
    - npm install
2. Copy .env.example to .env and configure DB/keys:
    - cp .env.example .env
3. Run database migrations/seeding if applicable.
4. Start in development:
    - npm run start:dev
5. API will be available at <http://localhost:3000> by default.

## Milestones & Deliverables

- Milestone 1: Meme Editor
  Deliverable: Meme generator (like imgflip) — upload/choose template, add text/stickers, export/share.

- Milestone 2: Admin Dashboard
  Deliverable: Admin panel to manage templates, products, and orders.

- Milestone 3: Community Gallery
  Deliverable: Community feed where users can share, browse, and buy memes made by others.

- Milestone 4: Product Preview
  Deliverable: Memes placed onto product mockups (candy tubes, candles, greeting cards).

- Milestone 5: Checkout + Order Flow
  Deliverable: Integrated checkout (Shopify/Stripe) to purchase customized products.

- Milestone 6: Label Generator
  Deliverable: Print-ready label files (300 DPI) for in-house production.

- Milestone 7: Basic Moderation
  Deliverable: Simple text/image filters (profanity/nudity).

## Where to look next

- docs/introduction.md — high-level project notes
- docs/installing-and-running.md — detailed install/run instructions
- docs/architecture.md — architecture overview
- src/ — NestJS application code (controllers, modules, services)
