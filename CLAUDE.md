# iPEC Coach Connect - Project Configuration

## Project Overview
iPEC Coach Connect is a comprehensive coaching platform that connects clients with certified iPEC coaches. The platform includes coach discovery, booking/scheduling, community features, learning resources, and dashboards.

## Technology Stack
- **Frontend:** React with Vite, TypeScript, Tailwind CSS, Zustand, React Router, Framer Motion
- **Backend:** Supabase (PostgreSQL), Authentication, API
- **Payments:** Stripe integration

## MCP Server Access
This project leverages the global MCP servers configured in `/Users/echalupa/.claude/mcp.json`:
- **supabase** - Database operations for user data, sessions, community content
- **filesystem** - File system access to project files
- **ide** - Diagnostics and code execution
- **web-search** - Research and documentation lookup
- **github** - Version control integration
- **task-master-ai** - Advanced task management and AI assistance
- **sequential-thinking** - Complex problem solving workflows
- **puppeteer** - Testing and automation capabilities

## Development Commands
Run tests with: `npm test`
Build project: `npm run build`
Development server: `npm run dev`
Lint code: `npm run lint`
Type check: `npm run typecheck`

## Key Features to Implement
1. **Onboarding & Authentication** - Email/password + Google Sign-In
2. **Coach Discovery** - Search, filtering, profiles with iPEC verification
3. **Booking & Scheduling** - Multi-step booking with calendar integration
4. **Community & Engagement** - Forums, groups, events, member profiles
5. **Dashboards** - Client and coach analytics and management
6. **Learning & Resources** - Courses, resource library, learning paths
7. **Settings & Profile Management** - Account, payment, subscription settings

## Security Requirements
- Secure user data handling with encryption
- Robust authentication/authorization
- PCI-compliant payment processing
- OWASP security best practices

## Performance Goals
- Fast load times and smooth navigation
- Fully responsive design (desktop, tablet, mobile)
- Scalable architecture for growing user base

## Project Structure
Follow React/TypeScript best practices with:
- Component-based architecture
- Type-safe implementations
- Clean separation of concerns
- Modular design patterns