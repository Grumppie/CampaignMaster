# 🧪 Achievement System Test Documentation

## Overview

This document outlines the comprehensive test suite for the DnD Campaign Tracker Achievement System. The tests ensure that all functionality works correctly from player creation to achievement upgrades.

## Test Structure

### 1. Integration Tests (`achievement-system.test.tsx`)

Tests the complete achievement system workflow:

#### 1.1 Player Creation and Campaign Joining
- ✅ **User joins campaign with character name**
- ✅ **Character name validation**
- ✅ **Campaign membership verification**

#### 1.2 Achievement Creation
- ✅ **DM creates global achievements**
- ✅ **Achievement data validation**
- ✅ **Upgrade levels configuration**

#### 1.3 Achievement Assignment to Campaign
- ✅ **DM assigns achievements to campaign**
- ✅ **Permission validation (DM only)**
- ✅ **Campaign achievement tracking**

#### 1.4 Achievement Assignment to Player
- ✅ **DM assigns achievements to specific players**
- ✅ **Player achievement initialization**
- ✅ **Individual player tracking**

#### 1.5 Achievement Progress Tracking
- ✅ **Increment achievement count**
- ✅ **Decrement achievement count**
- ✅ **Prevent negative counts**
- ✅ **Real-time progress updates**

#### 1.6 Achievement Level Upgrades
- ✅ **Automatic level upgrades at thresholds**
- ✅ **Current level calculation**
- ✅ **Next level requirements display**
- ✅ **Max level handling**

#### 1.7 Error Handling
- ✅ **Network error handling**
- ✅ **Invalid data validation**
- ✅ **Permission error handling**

#### 1.8 Data Persistence
- ✅ **Data persistence across sessions**
- ✅ **Achievement history maintenance**
- ✅ **Multiple achievement tracking**

### 2. Component Tests (`components.test.tsx`)

Tests the UI components and user interactions:

#### 2.1 AchievementManager Component
- ✅ **Renders correctly for DM users**
- ✅ **Hides controls for non-DM users**
- ✅ **Shows empty state when no achievements**

#### 2.2 CreateAchievementModal Component
- ✅ **Renders achievement creation form**
- ✅ **Allows adding upgrade levels**
- ✅ **Validates form before submission**

#### 2.3 AssignAchievementModal Component
- ✅ **Renders achievement selection dropdown**
- ✅ **Handles achievement assignment**
- ✅ **Calls correct callbacks**

#### 2.4 PlayerAchievementModal Component
- ✅ **Renders player achievement modal**
- ✅ **Shows current achievement progress**
- ✅ **Allows incrementing/decrementing counts**
- ✅ **Displays level upgrades correctly**

## Running Tests

### Prerequisites
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Achievement System Tests Only
```bash
npm run test:achievements
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

## Test Data

### Mock Campaign
```typescript
const mockCampaign = {
  id: 'campaign-1',
  name: 'Test Campaign',
  description: 'A test campaign',
  dmId: 'test-user-id',
  dmName: 'Test User',
  players: [
    { userId: 'player-1', characterName: 'Gandalf', joinedAt: new Date() }
  ],
  assignedAchievements: [],
  createdAt: new Date(),
};
```

### Mock Global Achievement
```typescript
const mockGlobalAchievement = {
  id: 'achievement-1',
  name: 'Fireball Master',
  description: 'Cast fireball spells',
  basePoints: 10,
  upgrades: [
    { name: 'Fireball Novice', description: 'Cast 5 fireballs', requiredCount: 5, points: 25 },
    { name: 'Fireball Expert', description: 'Cast 20 fireballs', requiredCount: 20, points: 100 }
  ],
  createdBy: 'test-user-id',
  isPublic: true,
  createdAt: new Date(),
};
```

### Mock Player Achievement
```typescript
const mockPlayerAchievement = {
  id: 'player-achievement-1',
  playerId: 'player-1',
  globalAchievementId: 'achievement-1',
  campaignId: 'campaign-1',
  count: 3,
  currentLevel: 0,
  lastUpdated: new Date(),
  globalAchievement: mockGlobalAchievement,
};
```

## Test Coverage

### Service Layer Coverage
- ✅ `createGlobalAchievement` - Achievement creation
- ✅ `assignAchievementToCampaign` - Campaign assignment
- ✅ `getPlayerAchievements` - Player achievement retrieval
- ✅ `incrementPlayerAchievement` - Progress increment
- ✅ `decrementPlayerAchievement` - Progress decrement

### Component Layer Coverage
- ✅ AchievementManager - Main achievement management
- ✅ CreateAchievementModal - Achievement creation UI
- ✅ AssignAchievementModal - Achievement assignment UI
- ✅ PlayerAchievementModal - Player progress management

### Business Logic Coverage
- ✅ Level calculation algorithms
- ✅ Upgrade threshold checking
- ✅ Permission validation
- ✅ Data validation
- ✅ Error handling

## Expected Test Results

When all tests pass, you should see:

```
✅ All tests passed! Achievement system is working correctly.

📋 Test Summary:
   ✓ Player Creation and Campaign Joining
   ✓ Achievement Creation
   ✓ Achievement Assignment to Campaign
   ✓ Achievement Assignment to Player
   ✓ Achievement Progress Tracking
   ✓ Achievement Level Upgrades
   ✓ Error Handling
   ✓ Data Persistence
   ✓ Component UI Tests
```

## Troubleshooting

### Common Issues

1. **Firebase Mock Issues**
   - Ensure Firebase is properly mocked in tests
   - Check that auth and db objects are mocked correctly

2. **Async Test Failures**
   - Use `waitFor` for async operations
   - Ensure proper error handling in async functions

3. **Component Rendering Issues**
   - Wrap components in TestWrapper for router context
   - Mock all required dependencies

4. **TypeScript Errors**
   - Ensure all mock data matches TypeScript interfaces
   - Check for proper type assertions

### Debugging Tests

```bash
# Run tests with verbose output
npm run test:achievements -- --verbose

# Run specific test file
npm test -- --testPathPattern="achievement-system"

# Run tests in debug mode
npm test -- --detectOpenHandles --forceExit
```

## Continuous Integration

These tests should be run:
- ✅ Before each commit
- ✅ In CI/CD pipeline
- ✅ Before deployment
- ✅ After dependency updates

## Performance Considerations

- Tests use mocked Firebase to avoid network calls
- Component tests focus on UI interactions
- Integration tests verify business logic
- All tests should complete within 30 seconds

## Future Test Enhancements

- [ ] End-to-end tests with real Firebase
- [ ] Performance tests for large datasets
- [ ] Accessibility tests
- [ ] Mobile responsiveness tests
- [ ] Cross-browser compatibility tests 