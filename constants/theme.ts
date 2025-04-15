// constants/theme.ts

// Colors for the app, reflecting the nature theme (greens) and competition (gold)
export const COLORS = {
  primaryGradient: ['#8ED1B5', '#4A704A'] as const, // Adjusted green gradient for better contrast

  secondary: '#FFD700', // Gold for taglines, buttons, icons
  secondaryLight: '#FFECB3', // Lighter gold for larger text if needed

  text: {
    primary: '#FFFFFF', // White for most text on gradient backgrounds
    secondary: '#FFD700', // Gold for accents (e.g., tagline, community text)
    dark: '#1A3C34', // Dark green for title on landing page
    attribution: '#E0E0E0', // Brighter light gray for attribution text
  },

  buttonGradient: ['#FFD700', '#FFC107'] as const, // Gold to amber gradient

  overlay: 'rgba(0, 0, 0, 0.3)', // Semi-transparent black overlay
};

// Typography settings, including font families and a scalable size system
export const TYPOGRAPHY = {
  fonts: {
    heading: 'AmaticSC-Bold', // For titles and headings (e.g., "TENDRILS")
    body: 'Roboto-Regular', // For body text and descriptions
    bold: 'Roboto-Bold', // For emphasized text (e.g., call to action, community text)
  },

  sizes: {
    heading: 32,
    subheading: 24,
    body: 16,
    small: 14,
    landing: {
      title: 60,
      tagline: 28,
      callToAction: 24,
      communityText: 18,
    },
  },

  letterSpacing: {
    default: 0,
    heading: 0.5,
  },
};

// Reusable styles for common elements
export const STYLES = {
  textOverlay: {
    backgroundColor: COLORS.overlay,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },

  // Style for feature icons (vine, trophy, ladder)
  featureIcon: {
    // Removed width and height since vector icons use 'size' prop
    // Removed tintColor since we'll set color directly in the icon component
  },
};

// References to shared icon assets (now using vector icons)
export const ICONS = {
  vine: { name: 'nature', type: 'MaterialIcons' }, // Represents community (vine)
  trophy: { name: 'emoji-events', type: 'MaterialIcons' }, // Represents competition (trophy)
  ladder: { name: 'stairs', type: 'MaterialIcons' }, // Represents rankings (ladder; 'stairs' is a close match)
};