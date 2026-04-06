// Site Configuration Types
export interface SiteConfig {
  title: string;
  logo: string;
  favicon: string;
  description: string;
  keywords: string;
  icp: string;
  analytics: string;
  contact: ContactInfo;
  seo: SEOConfig;
}

export interface ContactInfo {
  address: string;
  phone: string;
  email: string;
  fax?: string;
  qq?: string;
  wechat?: string;
  workHours: string;
  mapLat?: number;
  mapLng?: number;
}

export interface SEOConfig {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
}

// Banner Types
export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  link?: string;
  buttonText: string;
  order: number;
  isActive: boolean;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  price?: string;
  specs: ProductSpec[];
  features: string[];
  isActive: boolean;
  order: number;
  createdAt: string;
}

export interface ProductSpec {
  name: string;
  value: string;
}

// News Types
export interface News {
  id: string;
  title: string;
  summary: string;
  content: string;
  image: string;
  category: string;
  author: string;
  views: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Partner Types
export interface Partner {
  id: string;
  name: string;
  logo: string;
  website?: string;
  description?: string;
  isActive: boolean;
  order: number;
}

// Page Module Types
export interface PageModule {
  id: string;
  name: string;
  type: ModuleType;
  title: string;
  subtitle?: string;
  content?: string;
  image?: string;
  isActive: boolean;
  order: number;
  settings: Record<string, any>;
}

export type ModuleType = 
  | 'hero'
  | 'about'
  | 'services'
  | 'whyus'
  | 'products'
  | 'rd'
  | 'partners'
  | 'news'
  | 'contact'
  | 'stats'
  | 'timeline'
  | 'team'
  | 'testimonials'
  | 'custom';

// Page Types
export interface Page {
  id: string;
  name: string;
  slug: string;
  title: string;
  description: string;
  modules: PageModule[];
  isActive: boolean;
  meta: PageMeta;
}

export interface PageMeta {
  title: string;
  description: string;
  keywords: string;
}

// Admin Types
export interface AdminUser {
  id: string;
  username: string;
  password: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'editor';
  lastLogin?: string;
  createdAt: string;
}

// Navigation Types
export interface NavItem {
  id: string;
  name: string;
  link: string;
  icon?: string;
  children?: NavItem[];
  isActive: boolean;
  order: number;
  isExternal?: boolean;
}

// Company Info Types
export interface CompanyInfo {
  name: string;
  fullName: string;
  slogan: string;
  description: string;
  history: HistoryItem[];
  honors: HonorItem[];
  culture: CultureItem[];
  team: TeamMember[];
}

export interface HistoryItem {
  year: string;
  title: string;
  description: string;
  image?: string;
}

export interface HonorItem {
  id: string;
  title: string;
  image: string;
  date: string;
  issuer: string;
}

export interface CultureItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface TeamMember {
  id: string;
  name: string;
  position: string;
  photo: string;
  bio: string;
  social?: {
    linkedin?: string;
    email?: string;
  };
}

// R&D Types
export interface RDInfo {
  description: string;
  technologies: Technology[];
  equipment: Equipment[];
  patents: Patent[];
  partners: RDPartner[];
}

export interface Technology {
  id: string;
  name: string;
  description: string;
  icon: string;
  image?: string;
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  image: string;
  specs: Record<string, string>;
}

export interface Patent {
  id: string;
  name: string;
  number: string;
  date: string;
  type: string;
  description: string;
}

export interface RDPartner {
  id: string;
  name: string;
  logo: string;
  type: string;
  description: string;
}

// Service Types
export interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
  image?: string;
  features: string[];
  isActive: boolean;
  order: number;
}

// Stats Types
export interface Stat {
  id: string;
  name: string;
  value: number;
  suffix: string;
  prefix?: string;
  description: string;
  icon: string;
}

// Form Types
export interface ContactForm {
  name: string;
  phone: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Theme Types
export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  darkMode: boolean;
  fontFamily: string;
}

// Animation Types
export interface AnimationConfig {
  enabled: boolean;
  duration: number;
  easing: string;
  stagger: number;
}
