/// <reference types="next" />
/// <reference types="next/image-types/global" />

declare module "*.png" {
  const content: import("next/dist/client/image").StaticImageData;
  export default content;
}

declare module "*.jpg" {
  const content: import("next/dist/client/image").StaticImageData;
  export default content;
}

declare module "*.jpeg" {
  const content: import("next/dist/client/image").StaticImageData;
  export default content;
}

declare module "*.svg" {
  const content: import("next/dist/client/image").StaticImageData;
  export default content;
}
