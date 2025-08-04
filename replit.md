# AUREON - AI-Powered Finance Management Platform

## Overview
AUREON is a comprehensive AI-powered financial management platform designed to help users manage their finances through automated task generation, debt optimization, micro-investing, emergency fund tracking, and couples financial planning. The platform aims to provide insightful financial guidance and practical tools to improve financial well-being.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Frontend
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful JSON API

### Data Storage
- **Authentication**: Firebase Authentication (Google, email/password)
- **Database**: Firestore NoSQL database
- **User Management**: Firebase Auth for sessions
- **Core Data Structures**: Users, Connected Accounts, Transactions, Financial Goals, AI Tasks, Debt Accounts, Investing Accounts, Couples Features, User Preferences.

### Core Features & AI Integration
- **AI**: OpenAI API (GPT-4o) for financial analysis, task generation (daily/weekly/monthly), debt optimization (avalanche, snowball, hybrid), and savings recommendations.
- **Financial Features**: Multi-bank account aggregation, automated transaction categorization, round-up micro-investing, emergency fund tracking, debt management, and shared financial planning for couples.
- **Real-Time Data Integration**: Dashboard displays authentic TrueLayer banking data including portfolio totals (£8,020.75), spending categories, and income summaries calculated from actual bank transactions.
- **UI/UX**: Focus on intuitive design with integrated skeleton loading, query caching, and professional branding (e.g., Brandfetch API for merchant logos).
- **Data Flow**: Authentication -> Account Sync -> AI Analysis -> Dashboard Display -> User Interaction -> Real-time Updates.

## Recent Changes (August 2025)
- **Enhanced TrueLayer Integration**: Created comprehensive dashboard integration displaying real banking data instead of placeholder content
- **Financial Overview Card**: New component showing actual portfolio totals, income/spending summaries, and spending breakdown by category from connected bank accounts
- **Custom Data Hook**: Implemented useTrueLayerData hook for centralized bank data management across dashboard components
- **Demo Account Enhancement**: Configured fallback system with 2 bank accounts (Transaction: £2,340.50, Savings: £5,680.25) and extensive realistic transaction history

## External Dependencies
- **Authentication/Database**: Firebase (Auth, Firestore)
- **AI Services**: OpenAI API
- **Banking Integration**: TrueLayer (for account aggregation and transaction data)
- **UI Libraries**: Radix UI, shadcn/ui, Lucide React
- **Styling**: Tailwind CSS
- **Data Validation**: Zod
- **Payment Integration**: GoCardless (access token support)
- **Branding**: Brandfetch API