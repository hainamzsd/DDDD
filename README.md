# LocationID Tracker (C06) - Mobile Application

> **Status:** ✅ **PRODUCTION-READY** | **Last Updated:** 2025-11-21

A React Native mobile application for Vietnamese commune police officers to conduct offline-first field surveys of physical locations as part of the National Location Identification System.

## 🎯 Quick Start

```bash
# Install dependencies
npm install

# Verify setup
npm run verify

# Start development server
npm start

# Run tests
npm test

# Check TypeScript
npm run type-check

# Pre-deployment verification
npm run pre-deploy
```

## 📊 Project Status

| Metric | Status |
|--------|--------|
| **Development** | ✅ Complete |
| **Tests** | ✅ 236/236 passing (100%) |
| **TypeScript** | ✅ Zero errors |
| **Documentation** | ✅ 15+ comprehensive docs |
| **Regulatory Compliance** | ✅ Verified |
| **Deployment** | ⏳ Awaiting infrastructure |

## 📖 Key Documentation

### Getting Started
- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Executive summary and current status
- **[DEPLOYMENT_READINESS.md](DEPLOYMENT_READINESS.md)** - Deployment readiness report
- **[CLAUDE.md](CLAUDE.md)** - Instructions for AI assistants working on this codebase
- **[REQUIREMENTS.md](REQUIREMENTS.md)** - Detailed functional requirements

### Implementation
- **[loop/tasks.md](loop/tasks.md)** - Complete task tracking (100% mobile app development complete)
- **[docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** - Step-by-step deployment instructions
- **[docs/DATA_MODEL.md](docs/DATA_MODEL.md)** - Database schema and relationships
- **[docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** - Service layer API contracts
- **[docs/SURVEY_WORKFLOW.md](docs/SURVEY_WORKFLOW.md)** - Complete workflow documentation

### Compliance & Regulations
- **[docs/COMPLIANCE_REQUIREMENTS.md](docs/COMPLIANCE_REQUIREMENTS.md)** - Vietnamese regulatory compliance
- **[docs/DATA_PRIVACY_POLICY.md](docs/DATA_PRIVACY_POLICY.md)** - Privacy and retention policies
- **[docs/CADASTRAL_REGULATIONS.md](docs/CADASTRAL_REGULATIONS.md)** - Cadastral data requirements

### Technical Deep Dives
- **[docs/OFFLINE_SYNC.md](docs/OFFLINE_SYNC.md)** - Offline-first architecture details
- **[docs/CODE_REVIEW.md](docs/CODE_REVIEW.md)** - Code quality assessment (87/100)
- **[docs/EDGE_CASE_TESTING.md](docs/EDGE_CASE_TESTING.md)** - Edge case testing scenarios
- **[docs/VALIDATION_GUIDE.md](docs/VALIDATION_GUIDE.md)** - Field validation rules

## 🏗️ Technology Stack

- **Framework:** Expo SDK 52 (React Native)
- **Language:** TypeScript (strict mode)
- **Backend:** Supabase (PostgreSQL 15 + PostGIS + Storage + Auth)
- **State Management:** Zustand
- **Maps:** react-native-maps
- **Storage:** AsyncStorage (offline-first)
- **Testing:** Jest + ts-jest (236 tests, 100% passing)
- **Build:** Expo Application Services (EAS)

## 🎨 Features

### Complete Survey Workflow
- ✅ **Authentication** - 12-digit police ID login system
- ✅ **Dashboard** - Overview of surveys and sync status
- ✅ **GPS Capture** - High-accuracy location capture
- ✅ **Photo Capture** - Multiple photos with compression
- ✅ **Owner Information** - Comprehensive property/owner data
- ✅ **Land Use Classification** - Vietnamese cadastral categories
- ✅ **Polygon Drawing** - Optional boundary mapping
- ✅ **Review & Submit** - Validation and submission
- ✅ **History** - Past surveys with sync status
- ✅ **Settings** - Manual sync, data export, logout

### Offline-First Architecture
- ✅ All data saved locally first (AsyncStorage)
- ✅ Automatic background sync when online
- ✅ Retry logic with exponential backoff
- ✅ Conflict resolution
- ✅ Offline banner indicator
- ✅ Draft auto-save and resume

### Performance & Security
- ✅ Photo compression (reduces bandwidth by ~80%)
- ✅ Login rate limiting (5 attempts per 5 minutes)
- ✅ Reference data caching
- ✅ Row Level Security (RLS) policies
- ✅ Session persistence
- ✅ Secure credential management

## 📁 Project Structure

```
App/
├── screens/           # 13 React Native screens
├── components/        # Reusable UI components
├── services/          # API layer (auth, survey, reference data)
├── store/             # Zustand state management (auth, survey, sync)
├── utils/             # Validation utilities
├── types/             # TypeScript type definitions
├── theme/             # Design system (colors, spacing)
├── navigation/        # React Navigation setup
├── supabase/          # Database schema, migrations, seeds
├── scripts/           # Admin unit data fetching scripts
├── __tests__/         # Comprehensive test suites (236 tests)
└── docs/              # Technical documentation (15+ files)
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

**Test Coverage:**
- 62 validation tests ✅
- 39 service integration tests ✅
- 19 E2E workflow tests ✅
- 49 edge case tests ✅
- 48 regulatory compliance tests ✅
- 14 authentication rate limiting tests ✅
- 5 photo compression tests ✅

## 🚀 Next Steps (Infrastructure Team)

The mobile app development is **100% complete**. Remaining tasks require external infrastructure:

1. **Set up Supabase production project** (task 12.4)
   - Create project at supabase.com
   - Enable PostGIS extension
   - Run migrations from `supabase/` directory

2. **Seed reference data** (task 12.5)
   - Load land use types: `supabase/seed-land-use-types-official.sql`
   - Load admin units: `supabase/seed-admin-units.sql`

3. **Configure Storage** (task 12.6)
   - Create `survey-photos` bucket
   - Set up RLS policies

4. **Build with EAS** (task 12.8)
   - Configure EAS project
   - Build Android APK/AAB
   - Build iOS IPA (TestFlight/App Store)

5. **Conduct UAT** (task 12.9)
   - Deploy to test devices
   - Test with real commune police officers
   - Collect feedback

See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🌐 Related Projects

### Web Platform (Separate Project - Not Started)

A multi-role web application for managing surveys submitted by the mobile app:

- **Location:** Described in [INSTRUCTION_WEB.md](INSTRUCTION_WEB.md)
- **Tech Stack:** Next.js, TypeScript, Supabase, Leaflet.js, TailwindCSS
- **Status:** ⏳ Specification complete, no code written yet
- **Roles:** Commune officers, supervisors, central administrators

**Note:** The web platform should be created in a separate repository (e.g., `c06-web-platform/`) and shares the same Supabase backend.

## 🔒 Environment Configuration

```bash
# Copy example file
cp .env.example .env

# Add your Supabase credentials
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**⚠️ Security:** Never commit `.env` to git. It's in `.gitignore`.

## 📋 Regulatory Compliance

The app complies with Vietnamese regulations:

- ✅ **Land Law 2013** - Land use classification (NNG/PNN/CSD categories)
- ✅ **Decree 43/2014/NĐ-CP** - Administrative unit coding (PP-DD-CC format)
- ✅ **Circular 02/2015/TT-BTNMT** - Cadastral data requirements
- ✅ **Circular 01/2022/TT-BCA** - Citizen identification (CMND/CCCD)
- ✅ **Cybersecurity Law 2018** - Data protection and privacy
- ✅ **Decree 13/2023/NĐ-CP** - Personal data protection

All 48 regulatory compliance tests passing ✅

## 🤝 Contributing

For developers continuing this project:

1. Read [CLAUDE.md](CLAUDE.md) for project conventions
2. Review [PROJECT_STATUS.md](PROJECT_STATUS.md) for current status
3. Check [loop/tasks.md](loop/tasks.md) for task tracking
4. Run `npm run pre-deploy` to verify codebase health
5. Follow existing code patterns (see [docs/CODE_REVIEW.md](docs/CODE_REVIEW.md))

## 📞 Support

- **Issues:** Create an issue in this repository
- **Documentation:** See [docs/](docs/) directory
- **Deployment Help:** See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
- **Historical Docs:** See [docs/archive/](docs/archive/) for development history

## 📄 License

[Specify license here - typically proprietary for government projects]

---

**🎉 The mobile app is production-ready and awaiting infrastructure deployment.**

For deployment teams: Start with [DEPLOYMENT_READINESS.md](DEPLOYMENT_READINESS.md)
