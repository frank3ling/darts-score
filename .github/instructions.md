# Darts Score Tracker - Agent Instructions

## Project Overview

We are building a simple, static web application for tracking dart throw results. The app should be hosted via GitHub Pages and work completely client-side without any backend dependencies.

## Core Requirements

### Technology Stack

- **Frontend**: Pure HTML, CSS, JavaScript (no frameworks required for simplicity)
- **Hosting**: GitHub Pages (static hosting)
- **Storage**: Browser IndexedDB for local data persistence
- **Styling**: Responsive design, mobile-friendly

### Data Model

Each throw record contains:

- `timestamp` (Date/Time when the throw was recorded)
- `pfeil1` (Arrow 1 result)
- `pfeil2` (Arrow 2 result)
- `pfeil3` (Arrow 3 result)

**Value Format Examples:**

- Single hits: `12`, `20`, `1`
- Double hits: `D12`, `D20`
- Triple hits: `T12`, `T20`
- Miss: `0` or `MISS`

### User Interface Requirements

#### Main Input Interface

- **4 Equal-sized Action Buttons:**
  - `SINGLE` - Records single hit
  - `DOUBLE` - Records double hit
  - `TRIPLE` - Records triple hit
  - `MISS` - Records miss (0 points)

#### Target Selection

- **Dropdown Menu**: Numbers 1-20 for selecting target number
- Selected number applies to SINGLE/DOUBLE/TRIPLE buttons
- Label: "Target" (short and clean)

#### Top Control Bar

- **Target Dropdown**: Left side with "Target" label
- **Statistics Button**: 📊 icon (prepared for future implementation)
- **Undo Button**: ⟲ icon to remove last entered arrow
- **Visual Separation**: Separate background sections for clean layout

#### Current Throw Display

- **Live Feedback**: Show current throw in progress as single line
  - Format: `- / - / -` becomes `20 / D12 / T5`
- **Reset After 3 Arrows**: Automatically clear for next throw

#### Additional Features Needed

- **Throw History**: List of recent throws with timestamp
- **Session Statistics**: Basic stats for current session (future implementation)

#### Implemented Additional Features

- **Badge System**: Automatic scoring badges for special throws
  - `100` (exact 100 points) - Blue badge
  - `100+` (over 100 points) - Green badge
  - `140` (exact 140 points) - Orange badge
  - `140+` (over 140 points) - Red badge
  - `180` (perfect throw) - Gold badge
  - `0` (no score) - Gray badge
- **Smart Timestamps**: Shows time only for today, date + time for older throws
- **Undo Functionality**: Remove last entered arrow with ⟲ button
- **Auto-Save**: Automatically saves after 3rd arrow (no manual save needed)
- **Recent History**: Shows last 3 throws with badges and timestamps

## Technical Implementation Guidelines

### File Structure

```
/
├── index.html          # Main application file
├── css/
│   └── style.css      # Styling
├── js/
│   ├── app.js         # Main application logic
│   └── storage.js     # IndexedDB operations
└── README.md          # Documentation
```

### IndexedDB Schema

```javascript
// Database: "dartscore"
// Store: "throws"
// Key: auto-increment
// Structure:
{
  id: 1,
  timestamp: "2025-11-18T14:30:00.000Z",
  pfeil1: "20",
  pfeil2: "D20",
  pfeil3: "T20"
}
```

### Key Functionalities

#### Input Handling

1. User selects target number (1-20) from dropdown
2. User clicks SINGLE/DOUBLE/TRIPLE/MISS button
3. App records: `[number]`, `D[number]`, `T[number]`, or `0`
4. Display updates showing current arrow (1, 2, or 3)
5. After 3 arrows, save to IndexedDB and reset

#### Data Storage

- Use IndexedDB for persistent local storage
- Implement proper error handling
- Support offline usage
- Data should survive browser restarts

#### UI/UX Considerations

- **Mobile-first design**: Touch-friendly buttons
- **Clear visual feedback**: Highlight current arrow
- **Responsive layout**: Works on phone, tablet, desktop
- **Accessibility**: Proper contrast, screen reader support

## Styling Guidelines

- **Color Scheme**: Neutral grays with subtle accents
- **Typography**: Clear, readable fonts
- **Button Design**: Large, square, touch-friendly buttons
- **Spacing**: Adequate spacing for mobile use
- **Feedback**: Visual feedback for button presses
- **MISS Button**: Subtle red background to indicate miss
- **Badges**: Uniform gray color with white text for consistency
- **Feedback**: Visual feedback for button presses
- **MISS Button**: Subtle red background to indicate miss
- **Badges**: Uniform gray color with white text for consistency

## GitHub Pages Setup

- Enable GitHub Pages in repository settings
- Use main branch for deployment
- Ensure all paths are relative
- Test locally before deployment

## Browser Compatibility

- Modern browsers with IndexedDB support
- Mobile Safari, Chrome, Firefox
- Progressive enhancement approach

## Future Enhancements (Ideas)

- PWA capabilities (offline usage, install prompt)
- Statistics dashboard
- Data synchronization options

---

## Development Notes for Agent

When implementing this project:

1. Start with a minimal viable product (MVP)
2. Focus on core functionality first
3. Ensure proper error handling
4. Test IndexedDB operations thoroughly
5. Make the UI intuitive and responsive
6. Follow web accessibility guidelines
7. Keep the code simple and maintainable
8. Use semantic HTML elements
9. Implement proper data validation
10. Test on multiple devices/browsers

The goal is to create a simple, reliable, and user-friendly dart scoring application that works entirely in the browser without requiring any server-side components.
