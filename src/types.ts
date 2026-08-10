// Shared domain types mirroring architecture.md §4 (API contract) and §8 (schema).
// The client only ever displays values the server returns — no independent
// total/stock derivation logic lives here (architecture.md §0).

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface ProductImage {
  id: number;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  sku: string;
  category_id: number;
  tags: string[];
  is_featured: boolean;
  is_bestseller: boolean;
  is_clearance: boolean;
  stock_quantity?: number; // admin-only; omitted for customer-facing responses
  low_stock_threshold?: number | null;
  is_active?: boolean; // admin-only; true unless the admin has taken the product down
  stockStatus?: StockStatus; // present on customer-facing product detail responses
  images?: ProductImage[];
  groupIds?: number[];
  deleted_at?: string | null;
  // Configurable-product pricing (server/src/services/pricingFormulas). Null
  // for plain flat-price products — presence of this field is how the client
  // decides whether to render the size/options configurator.
  pricing_config?: PricingConfig | null;
}

// 'linear_per_unit' and 'flat' are fixed shapes implemented server-side
// (anthony_b/src/services/pricingFormulas/); 'custom' carries admin-authored
// expressions in `formula`. Either way the client never evaluates a formula to
// produce a price — it sends {sizeInches, selectedOptions} and displays
// whatever the server computes (mirrors the order-total rule: price is only
// ever derived server-side, architecture.md §0). src/lib/formulaExpression.ts
// parses expressions for the admin editor's chips and syntax errors only.
export interface PricingConfig {
  formulaType: 'linear_per_unit' | 'flat' | 'custom';
  params: {
    basePrice?: number;
    unitSizeInches?: number;
    pricePerExtraUnit?: number;
    wattsPerUnit?: number;
    // custom only
    constants?: Record<string, number>;
    minSizeInches?: number;
    // Phase 2: expression per option-group key deciding how many of that
    // component the configured size requires.
    autoQuantity?: Record<string, string>;
  };
  // Required when formulaType is 'custom'. `watts` is optional; omitted means
  // a load of 0, which disables power-supply capacity gating.
  formula?: {
    price: string;
    watts?: string;
  };
}

export interface ProductOptionChoice {
  id: number;
  key: string;
  label: string;
  priceDelta: number;
  // wattageCapacity and isFlatFee are read directly by the pricing service;
  // any other numeric attribute is exposed to custom formulas as
  // `<groupKey>_<attr>`.
  extra: ({ wattageCapacity?: number; isFlatFee?: boolean } & Record<string, number | boolean | undefined>) | null;
  sortOrder: number;
}

export interface ProductOptionGroup {
  id: number;
  key: string;
  label: string;
  type: 'single_select' | 'multi_select';
  sortOrder: number;
  choices: ProductOptionChoice[];
}

export interface SelectedOptionChoice {
  groupKey: string;
  groupLabel: string;
  choiceKey: string;
  choiceLabel: string;
  priceDelta: number;
  isFlatFee: boolean;
}

export interface SelectedOptionsSnapshot {
  sizeInches: number | null;
  totalWatts: number;
  choices: SelectedOptionChoice[];
  flatFeeDelta: number;
}

export type ProductSeoStatus = 'pending' | 'processing' | 'ready' | 'needs_review' | 'failed';

export interface ProductSeo {
  productId: number;
  status: ProductSeoStatus;
  attempts: number;
  seo: {
    meta_title: string;
    meta_description: string;
    og_title: string;
    og_description: string;
    image_alt_text: string;
    url_slug: string;
    primary_keyword: string;
    secondary_keywords: string[];
  } | null;
  geo: {
    definition_statement: string;
    key_facts: string[];
    faq: { q: string; a: string }[];
    comparison_points: string[];
  } | null;
  schemaMarkup: Record<string, unknown> | null;
  audit: { scores?: Record<string, number>; issues?: string[] } | null;
  flags: string[];
  lastError: string | null;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface ProductGroup {
  id: number;
  name: string;
  description: string | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface CartItem {
  cartId: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  // Configurable-product fields — null/undefined for plain products.
  selectedOptions?: SelectedOptionsSnapshot | null;
  sizeInches?: number | null;
  flatFeeTotal?: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'customer' | 'admin';
}

export type OrderStatus =
  | 'pending_payment'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface ShippingAddress {
  recipient_name: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
}

export interface OrderLineItem {
  id: number;
  item_type: 'line' | 'adjustment';
  product_id: number | null;
  label: string;
  unit_price: number | null;
  quantity: number | null;
  amount: number | null;
}

export interface OrderSummary {
  id: number;
  status: OrderStatus;
  total: number;
  created_at: string;
}

export interface Order extends OrderSummary {
  user_id: number;
  shipping_address: ShippingAddress;
  subtotal: number;
  adjustment_total: number;
  tax_rate_percent: number;
  tax_amount: number;
  stripe_payment_intent_id: string | null;
  items: OrderLineItem[];
  adjustedTotal?: number;
}

export interface OrderAuditLogEntry {
  id: number;
  order_id: number;
  actor_user_id: number;
  field_changed: string;
  old_value: string | null;
  new_value: string;
  reason: string | null;
  created_at: string;
}

export interface AdminOrder extends Order {
  auditLog: OrderAuditLogEntry[];
}

export type SectionKey = 'hero' | 'featured' | 'groupBanner' | 'footer';
export type SectionStyle = 'gradient' | 'flat';

export interface SocialLinks {
  instagram: string | null;
  pinterest: string | null;
  behance: string | null;
}

export interface ThemeResponse {
  brand_name: string;
  tagline: string | null;
  logo_url: string | null;
  resolvedColors: { primary: string; secondary: string };
  palette_id: string;
  custom_colors: { primary: string; secondary: string } | null;
  section_styles: Record<SectionKey, SectionStyle>;
  social_links: SocialLinks | null;
  default_mode: 'light' | 'dark' | 'auto';
  tax_rate_percent: number;
}

export interface SiteTheme extends ThemeResponse {
  id: number;
}

export interface Notification {
  id: number;
  type: 'low_stock' | 'custom_design_ordered';
  product_id: number | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ---- Custom Neon Designer ----

export type DesignType = 'upload' | 'draw' | 'text';
export type CustomNeonDesignStatus = 'pending' | 'processing' | 'ready' | 'needs_review' | 'failed';
export type NeonSize = 'small' | 'medium' | 'large';
export type NeonColor = 'amber' | 'pink' | 'blue' | 'white';

export interface CustomNeonDesignInputPayload {
  sourceImageUrl?: string;
  strokes?: unknown;
  renderedImageUrl?: string;
  text?: string;
  fontFamily?: string | null;
}

export interface CustomNeonDesign {
  id: number;
  designType: DesignType;
  inputPayload: CustomNeonDesignInputPayload;
  size: NeonSize | null;
  neonColor: NeonColor | null;
  price: number | null;
  status: CustomNeonDesignStatus;
  attempts: number;
  lastError: string | null;
  generatedImageUrl: string | null;
  imagesPurgedAt: string | null;
  productId: number | null;
  // Admin curation flag — a design only appears in the public galleries once
  // an admin promotes it. Defaults false for every new generation.
  isShowcased: boolean;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomNeonUsageRow {
  // null is the aggregate row for anonymous (signed-out) generations.
  userId: number | null;
  userEmail: string | null;
  userName: string | null;
  designCount: number;
  confirmedCount: number;
  lastGeneratedAt: string;
}

export interface RevenuePoint {
  period: string;
  revenue: number;
  orderCount: number;
}

export interface DocumentResource {
  id: number;
  title: string;
  category: string | null;
  url: string;
  sort_order: number;
}

export interface AssistantMessage {
  id: string; // client-generated (crypto.randomUUID()) for React keys — backend has no per-message IDs
  role: 'user' | 'assistant';
  content: string;
  products?: Product[];
  documents?: DocumentResource[];
}

// ---- Admin AI Insights ----

export type AdminAnalyticsIntent = 'revenue_trend' | 'top_products' | 'sales_projection' | 'out_of_scope';

/** A single prior turn sent as conversational context — the server is stateless. */
export interface AdminChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface TopProductRow {
  productId: number | null;
  name: string;
  unitsSold: number;
  revenue: number;
}

export interface ProjectionPoint {
  period: string;
  projectedRevenue: number;
}

export interface AdminAnalyticsData {
  // revenue_trend
  granularity?: 'daily' | 'monthly';
  from?: string;
  to?: string;
  series?: RevenuePoint[];
  // top_products
  metric?: 'units' | 'revenue';
  limit?: number;
  items?: TopProductRow[];
  // sales_projection
  history?: RevenuePoint[];
  projection?: ProjectionPoint[];
  model?: { slope: number; intercept: number; r2: number };
  insufficientData?: boolean;
}

export interface AdminAnalyticsResult {
  intent: AdminAnalyticsIntent;
  reply: string;
  data: AdminAnalyticsData | null;
}

export interface AdminChatMessage {
  id: string; // client-generated (crypto.randomUUID()) for React keys — backend has no per-message IDs
  role: 'user' | 'assistant';
  content: string;
  result?: AdminAnalyticsResult;
}
