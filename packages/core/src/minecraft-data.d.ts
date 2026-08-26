declare module "minecraft-data" {
  type MCData = {
    blocksByName: Record<string, { name: string; id: number; [k: string]: unknown }>;
    blocks: Record<number, { name: string; id: number; [k: string]: unknown }>;
  };
  const load: (version: string, edition?: string) => MCData;
  export default load;
}
