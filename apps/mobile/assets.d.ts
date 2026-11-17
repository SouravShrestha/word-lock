// Metro resolves an imported image to an asset id that <Image source> accepts.
declare module "*.png" {
  const asset: number;
  export default asset;
}

declare module "*.webp" {
  const asset: number;
  export default asset;
}
