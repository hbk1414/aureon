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
- June 25, 2025. Implemented comprehensive onboarding flow for new users
  - Created 7-step onboarding process capturing personal info, financial goals, budgeting setup, debt information, living situation, spending categories, and future planning
  - Added route protection to ensure users complete onboarding before accessing dashboard
  - Integrated onboarding data with Firestore user document creation for personalized experience
  - Added professional bank logos with brand-accurate colors for connected accounts visual identification
  - Fixed account connection speed with optimistic updates and automatic data refresh without page reloads
  - Implemented local storage backup for onboarding completion to handle Firestore connection issues
  - Fixed onboarding navigation flow to properly redirect to dashboard after completion
  - Enhanced onboarding completion with loading spinner, full-screen overlay, and progress messages for better user feedback during profile creation
- June 25, 2025. Implemented comprehensive micro investing feature with round-up calculations
  - Built spare change analysis calculating round-ups from actual spending transactions to nearest pound
  - Created realistic transaction generator with authentic UK merchants (Tesco, Costa, TfL, Sainsbury's, etc.)
  - Added investment options tailored for UK market: FTSE 100 Index Fund, Global Diversified ETF, Technology Growth Fund
  - Implemented annual potential calculation showing projected investing amount if spending trends continue
  - Enhanced dashboard to display real-time round-up amounts available for investment with detailed breakdown
  - Added risk categorization (Low/Medium/High) with expected returns and professional investment recommendations
- June 26, 2025. Completed round-up toggle functionality with Firestore integration
  - Implemented working round-up toggle that saves state to Firestore with proper persistence
  - Added Firestore subcollection storage for round-up transactions with merchant, amount, and date tracking
  - Created invest button logic that transfers spare change amounts to investment bucket
  - Built recent round-ups display showing transactions like "Costa Coffee - £0.77"
  - Fixed toggle disabled state issues and proper conditional visibility for invest button
  - Enhanced user experience with proper state management and real-time updates
- June 26, 2025. Enhanced Firestore roundUps subcollection with authentic UK transaction data
  - Implemented comprehensive roundUps subcollection with fields: merchant, amountSpent, roundUp, date, category, invested, createdAt
  - Enhanced invest button to generate realistic UK merchant transactions (Costa Coffee, Tesco, Sainsbury's, TfL, etc.)
  - Added intelligent transaction generation that creates accurate round-up amounts summing to exact total
  - Improved recent round-ups display showing merchant name, transaction flow (£4.23 → £5.00), and round-up amount
  - Implemented proper investment tracking with batch writes to mark transactions as invested
  - All sections now properly respect toggle state with conditional visibility
- June 26, 2025. Added monthly breakdown chart with enhanced user experience
  - Created bar chart showing 6 months of round-up savings and investment history
  - Implemented distinct color scheme: blue for available round-ups, green for invested amounts
  - Added proper tooltip functionality displaying correct labels for each bar type
  - Positioned invest button above chart for improved user flow and visual hierarchy
  - Chart updates in real-time showing investment progress over time with historical sample data
  - Complete reset functionality removes all references to past transactions after investment
- June 27, 2025. Integrated authentic merchant branding with Brandfetch API
  - Implemented secure server-side proxy for Brandfetch API to protect API keys
  - Added comprehensive domain mapping for major UK brands (TfL, Marks & Spencer, Tesco, Costa Coffee, etc.)
  - Enhanced transaction display with authentic merchant logos and colorful gradient fallbacks
  - Implemented intelligent logo selection prioritizing icon format for optimal display
  - Added proper caching and error handling for logo fetching requests
  - Transaction history now displays professional merchant branding improving visual engagement
- June 27, 2025. Enhanced investment experience with fund selection modal and portfolio tracking
  - Added investment fund selection modal when clicking "Invest" button
  - Implemented individual fund tracking across FTSE 100, Global Diversified ETF, and Technology Growth Fund
  - Created progress bars showing investment amounts in each fund with visual indicators
  - Added portfolio overview displaying total investment value and fund distribution
  - Integrated persistent storage for fund investments using localStorage with user-specific keys
  - Enhanced investment flow with detailed fund information and current holdings display
- June 29, 2025. Migrated micro-investing from localStorage to Firestore database
  - Replaced all localStorage-based data persistence with Firestore collections and subcollections
  - Created Firestore functions for round-up transactions, fund investments, and user settings
  - Implemented proper data validation and error handling for Firestore operations
  - Added user-specific document structure with roundUps subcollection and settings document
  - Enhanced data integrity with real-time synchronization across user sessions
  - Fixed modal layout issues and improved investment fund selection user experience
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```