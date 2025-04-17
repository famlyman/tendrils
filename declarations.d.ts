// declarations.d.ts
declare module "*.svg" {
  import * as React from "react";
  import { SvgProps } from "react-native-svg";
  const content: React.FC<SvgProps>;
  export default content;
}

// Allow importing common image file types
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.png";