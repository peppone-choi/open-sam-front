import type { Preview } from "@storybook/react";
import React from 'react';
import '../src/app/globals.css'; // Assuming global css is here, otherwise adjust

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Chromatic configuration for visual regression testing
    chromatic: {
      delay: 300,
      pauseAnimationAtEnd: true,
      viewports: [375, 768, 1280, 1920],
    },
  },
  // Global decorators
  decorators: [
    (Story) => (
      <div style={{ padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
