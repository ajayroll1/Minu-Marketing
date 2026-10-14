/**
 * Centralized Product Tour Configuration for Minu Marketing IMS
 * Features 5 distinct chapters mapped across routes, actual UI workflows, and RBAC permissions.
 */

export const TOUR_CHAPTERS = [
  {
    id: 'overview',
    title: 'Orientation & Executive Dashboard',
    description: 'Explore live inventory valuation, KPI health metrics, and quick stock transactions.',
    tab: 'dashboard',
    estimatedTime: '2 min',
  },
  {
    id: 'catalog',
    title: 'Catalog & Stock Management',
    description: 'Learn SKU lifecycle, stock mutations (Stock In / Dispatch), and audit history.',
    tab: 'products',
    estimatedTime: '3 min',
  },
  {
    id: 'ledger',
    title: 'Stock Ledger & Concurrency Audit',
    description: 'Review append-only immutable stock shifts with before & after audit tracking.',
    tab: 'transactions',
    estimatedTime: '2 min',
  },
  {
    id: 'alerts',
    title: 'Automated Thresholds & Reports',
    description: 'Configure automated low-stock trigger levels and generate requisition PDFs.',
    tab: 'alerts',
    estimatedTime: '2 min',
  },
  {
    id: 'team',
    title: 'Team Directory & Security Audit',
    description: 'Manage staff access privileges, role assignments, and security audit logs.',
    tab: 'employees',
    adminOnly: true,
    estimatedTime: '2 min',
  },
];

export const TOUR_STEPS = [
  // CHAPTER 1: Executive Dashboard (tab: 'dashboard')
  {
    id: 'dash-valuation',
    chapter: 'overview',
    tab: 'dashboard',
    target: '[data-tour="dash-valuation"]',
    title: 'Live Inventory Valuation',
    content: 'View real-time cost-basis aggregated inventory value across all active warehouse SKUs, synchronized atomically with every transaction.',
    placement: 'bottom',
    roleRequirement: 'ALL',
  },
  {
    id: 'dash-quick-actions',
    chapter: 'overview',
    tab: 'dashboard',
    target: '[data-tour="dash-quick-actions"]',
    title: 'Rapid Intake & Dispatch',
    content: 'Execute instantaneous "Stock In" or "Dispatch Out" transactions with concurrency-safe database row locks and negative-stock prevention.',
    placement: 'left',
    roleRequirement: 'OPERATOR',
  },
  {
    id: 'dash-kpis',
    chapter: 'overview',
    tab: 'dashboard',
    target: '[data-tour="dash-kpis"]',
    title: 'Inventory Health Snapshot',
    content: 'Monitor total active catalog SKUs, minimum threshold breaches, and completely depleted out-of-stock items at a glance.',
    placement: 'bottom',
    roleRequirement: 'ALL',
  },
  {
    id: 'dash-charts',
    chapter: 'overview',
    tab: 'dashboard',
    target: '[data-tour="dash-charts"]',
    title: 'Visual Telemetry & Movements',
    content: 'Interactive Recharts graphs showing 7-day intake vs outflow trends alongside real-time physical category stock allocations.',
    placement: 'top',
    roleRequirement: 'ALL',
  },
  {
    id: 'topbar-search',
    chapter: 'overview',
    tab: 'dashboard',
    target: '[data-tour="topbar-search"]',
    title: 'Global Search Engine',
    content: 'Click the search icon to expand our smooth right-to-left instant search bar to find products, SKUs, and stock levels from any screen.',
    placement: 'bottom',
    roleRequirement: 'ALL',
  },

  // CHAPTER 2: Products Catalog (tab: 'products')
  {
    id: 'products-header-actions',
    chapter: 'catalog',
    tab: 'products',
    target: '[data-tour="products-header-actions"]',
    title: 'Catalog Actions & Export',
    content: 'Create new catalog products with enforced SKU uniqueness, export sanitized CSV reports, or view live active inventory items.',
    placement: 'bottom',
    roleRequirement: 'MANAGER',
  },
  {
    id: 'products-filters',
    chapter: 'catalog',
    tab: 'products',
    target: '[data-tour="products-filters"]',
    title: 'Catalog Filters & Search',
    content: 'Filter catalog SKUs by category, search by product name or SKU code, and view live stock counts with zero page reloads.',
    placement: 'bottom',
    roleRequirement: 'ALL',
  },
  {
    id: 'products-table-actions',
    chapter: 'catalog',
    tab: 'products',
    target: '[data-tour="products-table-actions"]',
    title: 'Per-Item Operations',
    content: 'Perform quick stock intake, dispatch goods, edit product specifications, or safely archive obsolete items without corrupting ledger history.',
    placement: 'left',
    roleRequirement: 'OPERATOR',
  },

  // CHAPTER 3: Stock Transactions Ledger (tab: 'transactions')
  {
    id: 'ledger-header',
    chapter: 'ledger',
    tab: 'transactions',
    target: '[data-tour="ledger-header"]',
    title: 'Append-Only Ledger',
    content: 'Every inventory shift is recorded into this immutable, append-only ledger with user attribution, transaction reason, and reference codes.',
    placement: 'bottom',
    roleRequirement: 'ALL',
  },
  {
    id: 'ledger-filters',
    chapter: 'ledger',
    tab: 'transactions',
    target: '[data-tour="ledger-filters"]',
    title: 'Audit Search & Filtration',
    content: 'Search ledger movements by reference number or product name, and filter by transaction type (Intake, Dispatch, Adjustment).',
    placement: 'bottom',
    roleRequirement: 'ALL',
  },

  // CHAPTER 4: Alerts & Automated Thresholds (tab: 'alerts')
  {
    id: 'alerts-live-table',
    chapter: 'alerts',
    tab: 'alerts',
    target: '[data-tour="alerts-live-table"]',
    title: 'Live Threshold Breaches',
    content: 'Automated event triggers watch stock levels in real time. When stock hits or drops below limits, alerts are generated instantly with severity indicators.',
    placement: 'bottom',
    roleRequirement: 'ALL',
  },
  {
    id: 'alerts-threshold-settings',
    chapter: 'alerts',
    tab: 'alerts',
    target: '[data-tour="alerts-threshold-settings"]',
    title: 'Custom Per-Product Thresholds',
    content: 'Configure customized trigger limits for individual products so the warehouse team is notified well before critical stock depletion.',
    placement: 'top',
    roleRequirement: 'MANAGER',
  },

  // CHAPTER 5: Team Management & Audit Logs (Admin only)
  {
    id: 'team-directory',
    chapter: 'team',
    tab: 'employees',
    target: '[data-tour="team-directory"]',
    title: 'Organization Team Directory',
    content: 'Manage employees, assign role-based access privileges (Admin, Manager, Operator, Viewer), and toggle account activation status.',
    placement: 'bottom',
    roleRequirement: 'ADMIN',
  },
  {
    id: 'nav-audit-logs',
    chapter: 'team',
    tab: 'audit',
    target: '[data-tour="nav-audit-logs"]',
    title: 'Security & Mutation Audit Trail',
    content: 'Track every security intervention, threshold alteration, user signup, and administrative action with full payload details.',
    placement: 'right',
    roleRequirement: 'ADMIN',
  },
];

export const ONBOARDING_CHECKLIST_ITEMS = [
  {
    id: 'explore_dashboard',
    title: 'Explore Executive Dashboard',
    description: 'Review total inventory valuation and active stock health KPIs.',
    targetTab: 'dashboard',
    chapterId: 'overview',
  },
  {
    id: 'view_catalog',
    title: 'Review Warehouse Catalog',
    description: 'Browse active SKUs and check current available stock levels.',
    targetTab: 'products',
    chapterId: 'catalog',
  },
  {
    id: 'check_stock_ledger',
    title: 'Inspect Stock Movement Ledger',
    description: 'Verify append-only transaction history and operational reasons.',
    targetTab: 'transactions',
    chapterId: 'ledger',
  },
  {
    id: 'review_alert_thresholds',
    title: 'Configure Low-Stock Thresholds',
    description: 'Set custom warning trigger levels for critical inventory items.',
    targetTab: 'alerts',
    chapterId: 'alerts',
  },
  {
    id: 'manage_team_access',
    title: 'Review Team Permissions & Roles',
    description: 'Verify employee privilege assignments and security audit trail.',
    targetTab: 'employees',
    chapterId: 'team',
    adminOnly: true,
  },
];
