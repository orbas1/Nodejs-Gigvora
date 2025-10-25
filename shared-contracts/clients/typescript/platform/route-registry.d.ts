export interface RouteRegistryRouteDefinition {
  readonly path: string;
  readonly module?: string;
  readonly title?: string;
  readonly icon?: string;
  readonly featureFlag?: string;
  readonly shellTheme?: string;
  readonly index?: boolean;
  readonly relativePath?: string | null;
  readonly allowedRoles?: readonly string[];
  readonly allowedMemberships?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface RouteRegistryCollectionDefinition {
  readonly persona?: string | null;
  readonly icon?: string | null;
  readonly defaultRoles?: readonly string[];
  readonly defaultMemberships?: readonly string[];
  readonly defaultShellTheme?: string | null;
  readonly routes: readonly RouteRegistryRouteDefinition[];
}

export interface RouteRegistryEntryMetadata {
  readonly id: string;
  readonly path: string;
  readonly absolutePath: string;
  readonly collection: string;
  readonly modulePath?: string | null;
  readonly title: string;
  readonly icon?: string | null;
  readonly persona?: string | null;
  readonly featureFlag?: string | null;
  readonly shellTheme?: string | null;
  readonly allowedRoles: readonly string[];
  readonly allowedMemberships: readonly string[];
  readonly metadata: Record<string, unknown>;
}

export interface RouteRegistrySyncSummary {
  readonly total: number;
  readonly created: number;
  readonly updated: number;
  readonly deactivated: number;
  readonly actor?: unknown;
}

export type RouteRegistryCollections = Readonly<
  Record<string, RouteRegistryCollectionDefinition>
>;

export declare const ROUTE_COLLECTIONS: RouteRegistryCollections;
export declare const COMMUNITY_ACCESS_MEMBERSHIPS: readonly string[];
export declare const VOLUNTEER_ACCESS_MEMBERSHIPS: readonly string[];
export declare const USER_DASHBOARD_ROLES: readonly string[];
export declare const LAUNCHPAD_ACCESS_MEMBERSHIPS: readonly string[];
export declare const SECURITY_ACCESS_MEMBERSHIPS: readonly string[];

export declare function toAbsolutePath(path?: string): string;
export declare function createRouteId(
  collectionKey: string,
  absolutePath: string,
): string;
export declare function flattenRouteRegistry(
  registry?: RouteRegistryCollections,
): RouteRegistryEntryMetadata[];

declare const defaultExport: RouteRegistryCollections;
export default defaultExport;
