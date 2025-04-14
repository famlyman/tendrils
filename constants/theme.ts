// constants/theme.ts

// Colors for the app, reflecting the nature theme (greens) and competition (gold)
export const COLORS = {
    // Primary gradient for backgrounds (used on landing page, can be used elsewhere)
    primaryGradient: ['#8ED1B5', '#4A704A'], // Adjusted green gradient for better contrast
  
    // Secondary color for competition and achievement accents
    secondary: '#FFD700', // Gold for taglines, buttons, icons
    secondaryLight: '#FFECB3', // Lighter gold for larger text if needed
  
    // Text colors
    text: {
      primary: '#FFFFFF', // White for most text on gradient backgrounds
      secondary: '#FFD700', // Gold for accents (e.g., tagline, community text)
      dark: '#1A3C34', // Dark green for title on landing page
      attribution: '#E0E0E0', // Brighter light gray for attribution text
    },
  
    // Button gradient (used on landing page, can be reused for key actions)
    buttonGradient: ['#FFD700', '#FFC107'], // Gold to amber gradient
  
    // Overlay for improving text contrast on gradient backgrounds
    overlay: 'rgba(0, 0, 0, 0.3)', // Semi-transparent black overlay
  };
  
  // Typography settings, including font families and a scalable size system
  export const TYPOGRAPHY = {
    // Font families used throughout the app
    fonts: {
      heading: 'AmaticSC-Bold', // For titles and headings (e.g., "TENDRILS")
      body: 'Roboto-Regular', // For body text and descriptions
      bold: 'Roboto-Bold', // For emphasized text (e.g., call to action, community text)
    },
  
    // Font sizes for consistent hierarchy across the app
    sizes: {
      heading: 32, // For screen titles (e.g., "My Vines" on home screen)
      subheading: 24, // For subtitles (e.g., "Top Players" on leaderboard)
      body: 16, // For primary content (e.g., user stats, descriptions)
      small: 14, // For secondary info (e.g., timestamps, footer description)
      // Landing page-specific sizes (can be used as reference for other screens)
      landing: {
        title: 60, // "TENDRILS" on landing page
        tagline: 28, // "The Ultimate Pickleball Ladder Experience"
        callToAction: 24, // "CLIMB THE VINE. CLAIM YOUR GLORY."
        communityText: 18, // "JOIN THE FASTEST-GROWING PICKLEBALL COMMUNITY"
      },
    },
  
    // Letter spacing for readability (optional, can be applied where needed)
    letterSpacing: {
      default: 0,
      heading: 0.5, // Slight spacing for larger text like tagline
    },
  };
  
  // Reusable styles for common elements
  export const STYLES = {
    // Overlay style to improve text contrast on gradient backgrounds
    textOverlay: {
      backgroundColor: COLORS.overlay,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 5,
    },
  
    // Style for feature icons (vine, trophy, ladder)
    featureIcon: {
      width: 20,
      height: 20,
      tintColor: COLORS.secondary, // Gold color for icons
    },
  };
  
  // References to shared icon assets (vine, trophy, ladder)
  // Note: You'll need to place the actual icon files in assets/icons/ and import them here
  // For now, these are placeholders; replace with actual imports once icons are sourced
  export const ICONS = {
    vine: require('../assets/icons/vine.png'), // Placeholder for community icon
    trophy: require('../assets/icons/trophy.png'), // Placeholder for competition icon
    ladder: require('../assets/icons/ladder.png'), // Placeholder for rankings icon
  };