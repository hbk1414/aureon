# AUREON - AI-Powered Finance Management Platform

## Overview

AUREON is a comprehensive financial management platform that combines AI-driven insights with practical financial tools. The application helps users manage their finances through automated task generation, debt optimization, micro-investing, emergency fund tracking, and couples financial planning.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with JSON responses
- **Development**: tsx for TypeScript execution in development

### Data Storage Solutions
- **Authentication**: Firebase Authentication with Google and email/password sign-in
- **Database**: Firestore NoSQL database for real-time data storage
- **User Management**: Firebase Auth for user sessions and authentication state
- **Data Structure**: Firestore collections for users, accounts, transactions, goals, AI tasks

## Key Components

### Database Schema
The application uses a comprehensive schema with the following main entities:
- **Users**: User profiles and authentication data
- **Connected Accounts**: Bank account integrations (checking, savings, credit)
- **Transactions**: Financial transaction records with categorization
- **Financial Goals**: User-defined financial objectives with progress tracking
- **AI Tasks**: Generated recommendations and action items
- **Debt Accounts**: Debt tracking with payoff strategies
- **Investing Accounts**: Investment portfolio management
- **Couples Features**: Shared goals and partner linking
- **User Preferences**: Personalized settings and configurations

### AI Integration
- **OpenAI API**: GPT-4o model for financial analysis and task generation
- **Task Generation**: Daily, weekly, and monthly financial recommendations
- **Debt Optimization**: Avalanche, snowball, and hybrid payoff strategies
- **Savings Recommendations**: Personalized advice based on spending patterns

### Financial Features
- **Account Aggregation**: Multi-bank account connectivity
- **Transaction Categorization**: Automated expense categorization
- **Round-up Investing**: Micro-investing from transaction round-ups
- **Emergency Fund Tracking**: Goal-based emergency savings
- **Debt Management**: Strategic debt payoff planning
- **Couples Finance**: Shared goals and joint financial planning

## Data Flow

1. **User Authentication**: Users authenticate and access their dashboard
2. **Account Synchronization**: Connected bank accounts sync transaction data
3. **AI Analysis**: Financial data is analyzed to generate personalized tasks
4. **Dashboard Display**: Aggregated financial insights are presented
5. **User Interactions**: Users can complete tasks, update goals, and modify settings
6. **Real-time Updates**: TanStack Query manages cache invalidation and updates

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React, TanStack Query, React Hook Form with Zod validation
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Database**: Drizzle ORM with Neon PostgreSQL driver
- **AI Services**: OpenAI API for financial intelligence
- **Development**: Vite, TypeScript, ESBuild for development and production builds

### Styling and Icons
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **Custom Design System**: CSS variables for theming and brand consistency

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with Replit hosting
- **Database**: PostgreSQL 16 with automatic provisioning
- **Port Configuration**: Local port 5000 mapped to external port 80
- **Hot Reload**: Vite HMR for rapid development

### Production Build
- **Frontend**: Vite optimized build with code splitting
- **Backend**: ESBuild bundling for Node.js deployment
- **Static Assets**: Served from dist/public directory
- **Environment**: Production mode with optimized configurations

### Replit Configuration
- **Modules**: nodejs-20, web, postgresql-16
- **Autoscale Deployment**: Configured for automatic scaling
- **Development Workflow**: Integrated development and deployment pipeline

## Changelog

```
Changelog:
- June 23, 2025. Initial setup
- June 23, 2025. Implemented Firebase Authentication and Firestore database integration
  - Added Google and email/password authentication
  - Created Firestore collections for user data, accounts, transactions, goals, AI tasks
  - Implemented protected routes and authentication state management
  - Updated dashboard to use Firebase Auth user context
- June 24, 2025. Fixed dashboard component crashes with proper null checking
  - Added safe navigation operators and default values for emergency fund component
  - Resolved undefined property errors that prevented dashboard from loading
  - Improved error handling for Firestore connection issues
  - Application now loads successfully after authentication
- June 24, 2025. Implemented Firestore user document creation and data persistence
  - User documents created automatically on signup with default financial data
  - Dashboard now loads real user data from Firestore instead of mock data
  - Added user document structure: creditScore, savingsRate, monthlyBudget, totalSpent, emergencyFund, accounts, aiTasks
  - Implemented proper error handling for missing user documents with fallback to defaults
- June 24, 2025. Enhanced dashboard loading performance and user experience
  - Added comprehensive skeleton loading states for all dashboard components
  - Implemented query caching with 5-minute stale time and 10-minute cache time
  - Optimized data fetching by reducing initial transaction load and prioritizing essential data
  - Created reusable skeleton and loading spinner components for consistent UX
  - Implemented 3-second timeout protection and immediate fallback data for 2-3 second load times
  - Dashboard now displays meaningful default data instantly while Firestore loads in background
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```