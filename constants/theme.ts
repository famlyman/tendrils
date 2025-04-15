// constants/theme.ts
import { MaterialIcons } from "@expo/vector-icons";

// Define the type for MaterialIcons names
type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

// Define the interface for icon entries
interface IconEntry {
  name: MaterialIconName; // Explicitly use the type
  type: 'MaterialIcons';
}

export const COLORS = {
  primaryGradient: ['#A8E6CF', '#6BAF92'] as const,

  secondary: '#FFD54F',
  secondaryLight: '#FFECB3',

  text: {
    primary: '#FFFFFF',
    secondary: '#FFD54F',
    dark: '#1A3C34',
    attribution: '#E0E0E0',
  },

  buttonGradient: ['#FFD54F', '#FFC107'] as const,

  overlay: 'rgba(0, 0, 0, 0.3)',
};

export const TYPOGRAPHY = {
  fonts: {
    heading: 'AmaticSC-Bold',
    body: 'Roboto-Regular',
    bold: 'Roboto-Bold',
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

export const STYLES = {
  featureIcon: {},
};

// Explicitly type ICONS
export const ICONS: {
  vine: IconEntry;
  trophy: IconEntry;
  ladder: IconEntry;
} = {
  vine: { name: 'nature', type: 'MaterialIcons' },
  trophy: { name: 'emoji-events', type: 'MaterialIcons' },
  ladder: { name: 'stairs', type: 'MaterialIcons' },
};